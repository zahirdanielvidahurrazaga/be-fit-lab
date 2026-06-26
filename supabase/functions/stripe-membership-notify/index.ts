import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tras pagar la membresía en la hoja NATIVA, el cliente llama aquí para activar el
// plan de inmediato (sin esperar al webhook). Verifica con Stripe que el pago/sub
// esté OK antes de tocar la BD. Idempotente: volver a llamarlo no rompe nada.
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { paymentIntentId, subscriptionId } = await req.json();

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Resolver la suscripción a partir del PaymentIntent si no vino directa
    let subId: string | null = subscriptionId || null;
    let piSucceeded = false;
    if (paymentIntentId) {
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
      piSucceeded = pi.status === 'succeeded';
      if (!subId && pi.invoice) {
        const inv = await stripe.invoices.retrieve(pi.invoice as string);
        subId = (inv.subscription as string) ?? null;
      }
    }
    if (!subId) return Response.json({ error: 'No se pudo identificar la suscripción' }, { status: 400, headers: corsHeaders });

    const sub = await stripe.subscriptions.retrieve(subId);
    const active = sub.status === 'active' || sub.status === 'trialing' || piSucceeded;
    if (!active) {
      return Response.json({ activated: false, status: sub.status }, { headers: corsHeaders });
    }

    const { supabase_user_id, plan_title, class_count } = sub.metadata ?? {};
    if (!supabase_user_id || !plan_title) {
      return Response.json({ error: 'Metadata de suscripción incompleta' }, { status: 400, headers: corsHeaders });
    }

    // Fechas: pago = ahora, vence = +1 mes (regla del negocio, para el bloqueo).
    const _started = new Date();
    const _expires = new Date(_started);
    _expires.setMonth(_expires.getMonth() + 1);

    const { error } = await supabase.from('users').update({
      membership_plan: plan_title,
      membership_status: 'ACTIVE',
      classes_remaining: parseInt(class_count ?? '0'),
      stripe_subscription_id: subId,
      membership_renewal: 'active',
      plan_started_at: _started.toISOString(),
      plan_expires_at: _expires.toISOString(),
    }).eq('id', supabase_user_id);
    if (error) throw error;

    return Response.json({ activated: true }, { headers: corsHeaders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('stripe-membership-notify error:', message);
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
});
