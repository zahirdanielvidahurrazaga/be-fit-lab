import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Checkout hospedado de PAGO ÚNICO para la cafetería (WEB). Igual que la hoja
// nativa (stripe-cafe-intent): el front manda SOLO ids (producto + opciones);
// el precio se calcula 100% en el servidor desde cafe_products + cafe_options
// (incluye personalización). Crea el pedido (cafe_orders) con snapshot para que
// el barista lo vea y el cliente tenga tracking/historial. El webhook lo marca
// como pagado al completarse el checkout.
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { items, userEmail, userId, gift, pickupTime, noStraw } = await req.json();

    const raw = Array.isArray(items) ? items : (items ? [items] : []);
    // Acepta el formato nuevo {product_id, quantity, option_ids, notes} y el legacy {id}
    const list = raw.map((it: any) => ({
      product_id: it.product_id ?? it.id,
      quantity: it.quantity ?? it.qty ?? 1,
      option_ids: it.option_ids || [],
      notes: it.notes || '',
    })).filter((it: any) => it.product_id);
    if (list.length === 0) {
      return Response.json({ error: 'Se requiere al menos un producto' }, { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const productIds = [...new Set(list.map((i: any) => i.product_id))];
    const optionIds = [...new Set(list.flatMap((i: any) => i.option_ids).filter(Boolean))];

    const [{ data: products, error: pErr }, { data: options, error: oErr }] = await Promise.all([
      supabase.from('cafe_products').select('id, name, description, price, available').in('id', productIds),
      optionIds.length ? supabase.from('cafe_options').select('id, name, price_delta, available').in('id', optionIds) : Promise.resolve({ data: [], error: null }),
    ]);
    if (pErr) throw pErr;
    if (oErr) throw oErr;
    const prodById = new Map((products ?? []).map((p) => [p.id, p]));
    const optById = new Map((options ?? []).map((o) => [o.id, o]));

    let total = 0;
    const snapshot: any[] = [];
    const line_items: any[] = [];

    for (const it of list) {
      const p = prodById.get(it.product_id);
      if (!p) throw new Error(`Producto no encontrado: ${it.product_id}`);
      if (!p.available) throw new Error(`Producto no disponible: ${p.name}`);
      const qty = Math.max(1, parseInt(it.quantity ?? 1, 10) || 1);
      let unit = Number(p.price);
      const chosen: any[] = [];
      for (const oid of it.option_ids) {
        const o = optById.get(oid);
        if (!o || o.available === false) continue;
        unit += Number(o.price_delta || 0);
        chosen.push({ id: o.id, name: o.name, price_delta: o.price_delta || 0 });
      }
      const notes = (it.notes || '').toString().slice(0, 200);
      const lineTotal = unit * qty;
      total += lineTotal;
      snapshot.push({ product_id: p.id, name: p.name, qty, base_price: p.price, options: chosen, notes, line_total: lineTotal });

      // Descripción para Stripe: opciones elegidas + notas (se ve en el checkout)
      const descBits = [chosen.map((c) => c.name).join(' · '), notes ? `Nota: ${notes}` : ''].filter(Boolean);
      line_items.push({
        quantity: qty,
        price_data: {
          currency: 'mxn',
          unit_amount: Math.round(unit * 100),
          product_data: {
            name: p.name,
            ...(descBits.length ? { description: descBits.join(' — ') } : (p.description ? { description: p.description } : {})),
          },
        },
      });
    }
    if (total <= 0) throw new Error('Total inválido');

    // Crear el pedido (pending_payment); el webhook lo marca pagado
    const giftObj = gift && gift.is_gift ? gift : null;
    const { data: order, error: ordErr } = await supabase.from('cafe_orders').insert({
      user_id: userId || null,
      status: 'pending_payment',
      items: snapshot,
      subtotal: total,
      total,
      pickup_time: pickupTime || null,
      is_gift: !!giftObj,
      gift_recipient_name: giftObj?.recipient_name || null,
      gift_recipient_user_id: giftObj?.recipient_user_id || null,
      gift_message: giftObj?.message || null,
      no_straw: !!noStraw,
    }).select('id').single();
    if (ordErr) throw ordErr;

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });

    let customerId: string | undefined;
    if (userEmail) {
      const existing = await stripe.customers.list({ email: userEmail, limit: 1 });
      customerId = existing.data[0]?.id
        ?? (await stripe.customers.create({ email: userEmail, metadata: { supabase_user_id: userId ?? '' } })).id;
    }

    const appUrl = 'https://be-fit-lab.pages.dev';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      ...(customerId ? { customer: customerId } : { customer_email: userEmail || undefined }),
      success_url: `${appUrl}/cafeteria?payment=success`,
      cancel_url: `${appUrl}/cafeteria?payment=cancel`,
      metadata: {
        type: 'cafeteria',
        supabase_user_id: userId ?? '',
        order_id: order.id,
      },
    });

    return Response.json({ url: session.url, sessionId: session.id, orderId: order.id }, { headers: corsHeaders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('stripe-cafe-checkout error:', message);
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
});
