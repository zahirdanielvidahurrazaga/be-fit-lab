import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Checkout de PAGO ÚNICO para la cafetería. El front manda SOLO ids de producto
// (+ cantidad); el precio y el nombre se leen de la tabla public.cafe_products
// con la service role → el cliente NO puede manipular el precio.
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { items, userEmail, userId } = await req.json();

    const list = Array.isArray(items) ? items : (items ? [items] : []);
    const ids = [...new Set(list.map((it: any) => it.id).filter(Boolean))];
    if (ids.length === 0) {
      return Response.json({ error: 'Se requiere al menos un producto (items con id)' }, { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Precios autoritativos desde la BD
    const { data: products, error: dbErr } = await supabase
      .from('cafe_products')
      .select('id, name, description, price, available')
      .in('id', ids);

    if (dbErr) throw dbErr;

    const byId = new Map((products ?? []).map((p) => [p.id, p]));

    const line_items = list.map((it: any) => {
      const p = byId.get(it.id);
      if (!p) throw new Error(`Producto no encontrado: ${it.id}`);
      if (!p.available) throw new Error(`Producto no disponible: ${p.name}`);
      const qty = Math.max(1, parseInt(it.quantity ?? 1, 10) || 1);
      return {
        quantity: qty,
        price_data: {
          currency: 'mxn',
          unit_amount: Math.round(Number(p.price) * 100),
          product_data: {
            name: p.name,
            ...(p.description ? { description: p.description } : {}),
          },
        },
      };
    });

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });

    let customerId: string | undefined;
    if (userEmail) {
      const existing = await stripe.customers.list({ email: userEmail, limit: 1 });
      customerId = existing.data[0]?.id
        ?? (await stripe.customers.create({ email: userEmail, metadata: { supabase_user_id: userId ?? '' } })).id;
    }

    // Página de retorno: la web real (renderiza correctamente; las Edge Functions
    // sirven text/plain en GET y se verían como código). El "¡Gracias!" se muestra
    // en la app al cerrar el navegador (verificación de la sesión).
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
      },
    });

    return Response.json({ url: session.url, sessionId: session.id }, { headers: corsHeaders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('stripe-cafe-checkout error:', message);
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
});
