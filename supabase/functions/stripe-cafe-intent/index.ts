import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Crea el PaymentIntent (hoja nativa) Y el pedido (cafe_orders). El precio se
// calcula 100% en el servidor desde cafe_products + cafe_options (el cliente solo
// manda ids), incluyendo personalización. Guarda snapshot del carrito en el pedido.
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { items, userEmail, userId, gift, pickupTime, noStraw } = await req.json();
    const list = Array.isArray(items) ? items : [];
    if (list.length === 0) return Response.json({ error: 'Carrito vacío' }, { status: 400, headers: corsHeaders });

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const productIds = [...new Set(list.map((i: any) => i.product_id).filter(Boolean))];
    const optionIds = [...new Set(list.flatMap((i: any) => i.option_ids || []).filter(Boolean))];

    const [{ data: products, error: pErr }, { data: options, error: oErr }] = await Promise.all([
      supabase.from('cafe_products').select('id, name, price, available').in('id', productIds),
      optionIds.length ? supabase.from('cafe_options').select('id, name, price_delta, group_id, available').in('id', optionIds) : Promise.resolve({ data: [], error: null }),
    ]);
    if (pErr) throw pErr;
    if (oErr) throw oErr;
    const prodById = new Map((products ?? []).map((p) => [p.id, p]));
    const optById = new Map((options ?? []).map((o) => [o.id, o]));

    let total = 0;
    const snapshot: any[] = [];
    const descParts: string[] = [];

    for (const it of list) {
      const p = prodById.get(it.product_id);
      if (!p) throw new Error(`Producto no encontrado: ${it.product_id}`);
      if (!p.available) throw new Error(`No disponible: ${p.name}`);
      const qty = Math.max(1, parseInt(it.quantity ?? 1, 10) || 1);
      let unit = Number(p.price);
      const chosen: any[] = [];
      for (const oid of (it.option_ids || [])) {
        const o = optById.get(oid);
        if (!o || o.available === false) continue;
        unit += Number(o.price_delta || 0);
        chosen.push({ id: o.id, name: o.name, price_delta: o.price_delta || 0 });
      }
      const lineTotal = unit * qty;
      total += lineTotal;
      snapshot.push({ product_id: p.id, name: p.name, qty, base_price: p.price, options: chosen, notes: (it.notes || '').toString().slice(0, 200), line_total: lineTotal });
      descParts.push(`${qty}× ${p.name}`);
    }
    if (total <= 0) throw new Error('Total inválido');

    // Crear el pedido (pending_payment)
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
    const pi = await stripe.paymentIntents.create({
      amount: total * 100,
      currency: 'mxn',
      payment_method_types: ['card'],
      ...(userEmail ? { receipt_email: userEmail } : {}),
      metadata: {
        type: 'cafeteria',
        supabase_user_id: userId ?? '',
        order_id: order.id,
        summary: descParts.join(', ').slice(0, 480),
        total_mxn: String(total),
      },
    });

    // Guardar el PI en el pedido
    await supabase.from('cafe_orders').update({ payment_intent_id: pi.id }).eq('id', order.id);

    return Response.json({ clientSecret: pi.client_secret, paymentIntentId: pi.id, orderId: order.id, total }, { headers: corsHeaders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('stripe-cafe-intent error:', message);
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
});
