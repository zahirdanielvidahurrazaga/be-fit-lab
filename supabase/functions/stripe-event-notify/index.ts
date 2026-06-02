import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tras completar la PaymentSheet de un evento: verifica que el PaymentIntent esté
// pagado e inscribe a la clienta (idempotente). El trigger de cupo re-valida.
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { paymentIntentId } = await req.json();
    if (!paymentIntentId) return Response.json({ ok: false }, { headers: corsHeaders });

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (pi.status !== 'succeeded') return Response.json({ ok: false, status: pi.status }, { headers: corsHeaders });

    const eventId = pi.metadata?.event_id;
    const userId = pi.metadata?.supabase_user_id;
    if (!eventId || !userId) return Response.json({ ok: false, error: 'metadata' }, { status: 400, headers: corsHeaders });

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { error } = await supabase.from('event_registrations').insert({ event_id: eventId, user_id: userId, payment_intent_id: paymentIntentId });
    // 23505 = duplicado (ya inscrita) → ok; EVENT_FULL → quedó sin lugar tras pagar (raro)
    if (error && error.code !== '23505') {
      if (String(error.message).includes('EVENT_FULL')) return Response.json({ ok: false, error: 'EVENT_FULL_AFTER_PAY' }, { headers: corsHeaders });
      throw error;
    }
    return Response.json({ ok: true }, { headers: corsHeaders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('stripe-event-notify error:', message);
    return Response.json({ ok: false, error: message }, { status: 500, headers: corsHeaders });
  }
});
