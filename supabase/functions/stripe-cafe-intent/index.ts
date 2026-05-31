import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Crea un PaymentIntent para la hoja de pago NATIVA (Stripe PaymentSheet).
// El precio se calcula en el servidor desde public.cafe_products (no del cliente).
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
    const { data: products, error } = await supabase
      .from('cafe_products')
      .select('id, name, price, available')
      .in('id', ids);
    if (error) throw error;

    const byId = new Map((products ?? []).map((p) => [p.id, p]));
    let total = 0;
    const parts: string[] = [];
    for (const it of list) {
      const p = byId.get(it.id);
      if (!p) throw new Error(`Producto no encontrado: ${it.id}`);
      if (!p.available) throw new Error(`Producto no disponible: ${p.name}`);
      const qty = Math.max(1, parseInt(it.quantity ?? 1, 10) || 1);
      total += Math.round(Number(p.price) * 100) * qty;
      parts.push(`${qty}× ${p.name}`);
    }
    if (total <= 0) throw new Error('Total inválido');

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });
    const pi = await stripe.paymentIntents.create({
      amount: total,
      currency: 'mxn',
      payment_method_types: ['card'],
      ...(userEmail ? { receipt_email: userEmail } : {}),
      metadata: {
        type: 'cafeteria',
        supabase_user_id: userId ?? '',
        summary: parts.join(', '),
        total_mxn: String(Math.round(total / 100)),
      },
    });

    return Response.json({ clientSecret: pi.client_secret, paymentIntentId: pi.id }, { headers: corsHeaders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('stripe-cafe-intent error:', message);
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
});
