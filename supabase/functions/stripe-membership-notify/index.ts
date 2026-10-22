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
    let piInvoiceId: string | null = null;
    if (paymentIntentId) {
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
      piSucceeded = pi.status === 'succeeded';
      piInvoiceId = (pi.invoice as string) ?? null;
      if (piInvoiceId) {
        const inv = await stripe.invoices.retrieve(piInvoiceId);
        // Igual que en el webhook: en la API nueva el id vive en `parent`.
        const piSubId = ((inv as any).subscription as string)
          ?? (inv as any).parent?.subscription_details?.subscription
          ?? null;
        // El pago tiene que ser de ESTA suscripción: si no, un pago viejo
        // cualquiera serviría para activar un plan sin pagarlo.
        if (subId && piSubId && piSubId !== subId) {
          return Response.json({ error: 'El pago no corresponde a la suscripción' }, { status: 400, headers: corsHeaders });
        }
        subId = subId ?? piSubId;
      }
    }
    if (!subId) return Response.json({ error: 'No se pudo identificar la suscripción' }, { status: 400, headers: corsHeaders });

    const sub = await stripe.subscriptions.retrieve(subId);
    // El atajo del pago recién hecho solo vale mientras la suscripción sigue
    // `incomplete` (Stripe aún no la actualiza) y si ese pago es de su primera
    // factura. Una suscripción cancelada no se revive con su pago de hace meses.
    const latestInvoiceId = typeof sub.latest_invoice === 'string' ? sub.latest_invoice : sub.latest_invoice?.id;
    const pagoRecien = piSucceeded && sub.status === 'incomplete' && !!piInvoiceId && piInvoiceId === latestInvoiceId;
    const active = sub.status === 'active' || sub.status === 'trialing' || pagoRecien;
    if (!active) {
      return Response.json({ activated: false, status: sub.status }, { headers: corsHeaders });
    }

    const { supabase_user_id, plan_title, class_count } = sub.metadata ?? {};
    if (!supabase_user_id || !plan_title) {
      return Response.json({ error: 'Metadata de suscripción incompleta' }, { status: 400, headers: corsHeaders });
    }

    // Solo la dueña de la suscripción la activa desde aquí (el webhook es el
    // respaldo y no pasa por esta función).
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return Response.json({ error: 'No autenticado' }, { status: 401, headers: corsHeaders });
    if (user.id !== supabase_user_id) return Response.json({ error: 'No autorizado' }, { status: 403, headers: corsHeaders });

    // Idempotente de verdad: si esta suscripción ya es la suya (la activó el
    // webhook o una llamada anterior), no se vuelve a escribir. Antes cada
    // llamada repetida le reponía las clases completas y le corría el
    // vencimiento un mes más, sin cobrar.
    const { data: actual } = await supabase
      .from('users').select('stripe_subscription_id').eq('id', supabase_user_id).maybeSingle();
    if (actual?.stripe_subscription_id === subId) {
      return Response.json({ activated: true, already: true }, { headers: corsHeaders });
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
