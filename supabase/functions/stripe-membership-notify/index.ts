import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Estados en los que una suscripción de Stripe TODAVÍA puede generar cobros.
const SUB_COBRABLES = ['active', 'past_due', 'unpaid', 'trialing', 'paused'];

// Gemela de la del webhook (las edge functions aquí no comparten módulos).
// Al activar una membresía nueva, cancela las ANTERIORES de la misma clienta:
// cada recompra creaba otra suscripción y la vieja quedaba huérfana cobrando,
// invisible para la app (en `users` solo cabe un `stripe_subscription_id`).
// ⚠️ Llamarla DESPUÉS de guardar la nueva: la baja dispara
// `customer.subscription.deleted`, y ese handler borra la membresía si la
// columna todavía apunta a la vieja. `superseded_by` es lo que se lo impide.
async function cancelarSuscripcionesAnteriores(
  stripe: Stripe,
  customerId: string | null,
  conservarSubId: string | null,
): Promise<void> {
  if (!customerId || !conservarSubId) return;
  try {
    const { data } = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 100 });
    for (const sub of data) {
      if (sub.id === conservarSubId) continue;
      if (!SUB_COBRABLES.includes(sub.status)) continue;
      try {
        await stripe.subscriptions.update(sub.id, {
          metadata: { ...(sub.metadata ?? {}), superseded_by: conservarSubId },
        });
        await stripe.subscriptions.cancel(sub.id);
        console.log(`🧹 Suscripción anterior cancelada: ${sub.id} (reemplazada por ${conservarSubId})`);
      } catch (e) {
        console.error(`No se pudo cancelar la suscripción anterior ${sub.id}:`, e instanceof Error ? e.message : String(e));
      }
    }
  } catch (e) {
    console.error('No se pudieron listar las suscripciones anteriores:', e instanceof Error ? e.message : String(e));
  }
}

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
        // Igual que en el webhook: en la API nueva el id vive en `parent`.
        subId = ((inv as any).subscription as string)
          ?? (inv as any).parent?.subscription_details?.subscription
          ?? null;
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

    // Ya quedó guardada la nueva → dar de baja las anteriores (ver el helper).
    await cancelarSuscripcionesAnteriores(stripe, (sub.customer as string) ?? null, subId);

    return Response.json({ activated: true }, { headers: corsHeaders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('stripe-membership-notify error:', message);
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
});
