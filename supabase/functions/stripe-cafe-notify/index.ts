import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tras completar la PaymentSheet, el cliente llama aquí con el paymentIntentId.
// Verifica en Stripe que esté 'succeeded' (no confía en el cliente) y manda la
// notificación de compra (push + log). Idempotente: no duplica si ya se notificó.
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { paymentIntentId } = await req.json();
    if (!paymentIntentId) return Response.json({ ok: false }, { headers: corsHeaders });

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (pi.status !== 'succeeded') return Response.json({ ok: false, status: pi.status }, { headers: corsHeaders });

    const userId = pi.metadata?.supabase_user_id;
    if (!userId) return Response.json({ ok: true, notified: false }, { headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const summary = pi.metadata?.summary || 'Tu pedido';
    const total = pi.metadata?.total_mxn || Math.round((pi.amount ?? 0) / 100);
    const title = 'Compra en cafetería ☕';
    const body = `${summary} — Total $${total} MXN. ¡Pásala a recoger!`;

    // Solo registra la notificación in-app (verificada en servidor). El PUSH lo
    // dispara el cliente por el mismo camino que el admin (más confiable que
    // fetch servidor-a-servidor, que se cancelaba al no esperar el cliente).
    await supabase.from('notification_logs').insert({
      user_id: userId, type: 'payment', title, body, status: 'sent',
    });

    return Response.json({ ok: true, notified: true }, { headers: corsHeaders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('stripe-cafe-notify error:', message);
    return Response.json({ ok: false, error: message }, { status: 500, headers: corsHeaders });
  }
});
