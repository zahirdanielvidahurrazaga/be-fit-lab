import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Anula las facturas que ya estaban ABIERTAS cuando la clienta pausa o cancela.
//
// 🔴 EL BUG QUE ARREGLA (Berenice Gómez, 31-ago → 6-sep 2026): ni
// `pause_collection` ni `cancel_at_period_end` detienen una factura que Stripe
// YA emitió — las dos cosas solo aplican a los ciclos que vienen. Si el cobro
// del mes se cayó por tarjeta rechazada, esa factura queda `open`, la
// suscripción en `past_due`, y Stripe la sigue reintentando durante días
// (Smart Retries). A Berenice se le cayó la renovación del 30-ago (fondos
// insuficientes), pausó el 31-ago y canceló el 2-sep desde la app... y el 4º
// reintento le cobró $1,050 el 6-sep a la 1:22 a.m. La app le había dicho
// "listo, no se te cobrará" y encima el webhook la volvió a poner "Activa".
//
// Anularlas es seguro y es lo justo: el saldo de clases SOLO se abona con
// `invoice.payment_succeeded`, así que una factura sin pagar no le dio nada a
// la clienta — anularla no le quita nada, solo cumple lo que la app prometió.
// Las `draft` NO se tocan a propósito: esas son el ciclo que acaba de empezar y
// si el cobro pasa, la clienta recibe su mes completo.
async function anularFacturasPendientes(stripe: Stripe, subId: string): Promise<number> {
  let montoAnulado = 0;
  try {
    const { data } = await stripe.invoices.list({ subscription: subId, status: 'open', limit: 20 });
    for (const inv of data) {
      const falta = inv.amount_remaining ?? 0;
      if (falta <= 0 || !inv.id) continue;
      try {
        await stripe.invoices.voidInvoice(inv.id);
        montoAnulado += falta;
        console.log(`🧾 Factura pendiente anulada: ${inv.id} ($${falta / 100}) de ${subId}`);
      } catch (e) {
        console.error(`No se pudo anular la factura ${inv.id}:`, e instanceof Error ? e.message : String(e));
      }
    }
  } catch (e) {
    console.error('No se pudieron listar las facturas pendientes:', e instanceof Error ? e.message : String(e));
  }
  return montoAnulado;
}

// Gestión de la membresía por la CLIENTA (desde "Mi Membresía"):
//   - pause:  pausa el cobro de la suscripción (vacaciones). Reactivable sin
//             volver a meter tarjeta. No se le cobra la próxima renovación.
//   - cancel: cancela al final del periodo (cancel_at_period_end). Conserva el
//             acceso hasta su vencimiento; luego la suscripción termina.
//   - resume: reactiva (quita pausa y/o la cancelación programada). Si el mes
//             ya venció, además reinicia el ciclo y COBRA HOY (ver abajo).
// `pause` y `cancel` ANULAN además la factura que hubiera quedado abierta por un
// cobro rechazado (ver `anularFacturasPendientes`): si no, Stripe la sigue
// reintentando y le cobra a quien ya se dio de baja.
// La clienta SOLO puede gestionar su propia membresía (userId sale del JWT).
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { action } = await req.json();
    if (!['pause', 'resume', 'cancel'].includes(action)) {
      return Response.json({ error: 'Acción inválida' }, { status: 400, headers: corsHeaders });
    }

    // Usuario desde el JWT (cada clienta solo gestiona SU propia membresía).
    const authHeader = req.headers.get('Authorization') ?? '';
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return Response.json({ error: 'No autenticado' }, { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: row } = await supabase
      .from('users')
      .select('stripe_subscription_id, plan_expires_at')
      .eq('id', user.id)
      .single();

    const subId = row?.stripe_subscription_id ?? null;

    // Sin suscripción de Stripe (efectivo / alta manual) → no hay cobro
    // automático que gestionar; el front muestra un aviso en vez de botones.
    if (!subId) {
      return Response.json({ ok: false, noSubscription: true }, { headers: corsHeaders });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });

    let renewal: 'active' | 'paused' | 'canceling';
    // Reactivar con el mes YA VENCIDO: se reinicia el ciclo de cobro HOY.
    //
    // 🔴 Antes solo se quitaba la pausa, y Stripe no cobra hasta la fecha del
    // siguiente ciclo (hasta un mes después). La clienta veía "¡Membresía
    // reactivada!" pero seguía con el plan vencido y la app no la dejaba
    // reservar (Alejandra P, 31-ago-2026: reanudó y quedó bloqueada hasta el
    // 13-sep). Con `billing_cycle_anchor:'now'` Stripe emite y cobra la factura
    // al momento; el webhook (invoice.payment_succeeded, subscription_update)
    // le pone sus clases y su mes nuevo. `proration_behavior:'none'` = sin
    // abonos raros: pagó un mes, recibe un mes.
    // Si el mes sigue vigente (pausó y se arrepintió), solo se quita la pausa y
    // el siguiente cobro cae en su fecha de siempre.
    let cobroHoy = false;
    let pagado: boolean | null = null;
    let pendienteAnulado = 0; // $ de facturas caídas que se frenaron al pausar/cancelar
    try {
      if (action === 'pause') {
        await stripe.subscriptions.update(subId, { pause_collection: { behavior: 'void' }, cancel_at_period_end: false });
        pendienteAnulado = await anularFacturasPendientes(stripe, subId);
        renewal = 'paused';
      } else if (action === 'cancel') {
        await stripe.subscriptions.update(subId, { cancel_at_period_end: true, pause_collection: '' });
        pendienteAnulado = await anularFacturasPendientes(stripe, subId);
        renewal = 'canceling';
      } else { // resume / reactivar
        const vencida = !!row?.plan_expires_at && new Date(row.plan_expires_at).getTime() < Date.now();
        if (vencida) {
          const sub = await stripe.subscriptions.update(subId, {
            pause_collection: '',
            cancel_at_period_end: false,
            billing_cycle_anchor: 'now',
            proration_behavior: 'none',
            payment_behavior: 'allow_incomplete',
          });
          cobroHoy = true;
          // ¿Pasó el cobro? (si el banco lo rechaza, la suscripción queda
          // past_due y Stripe reintenta solo; el front avisa a la clienta).
          const invId = typeof sub.latest_invoice === 'string'
            ? sub.latest_invoice
            : ((sub.latest_invoice as { id?: string } | null)?.id ?? null);
          if (invId) {
            try {
              const inv = await stripe.invoices.retrieve(invId);
              pagado = inv.status === 'paid';
            } catch (_) { pagado = null; }
          }
        } else {
          await stripe.subscriptions.update(subId, { pause_collection: '', cancel_at_period_end: false });
        }
        renewal = 'active';
      }
    } catch (e) {
      // Si la suscripción ya no existe en Stripe (se canceló antes), limpiamos
      // el id local y devolvemos "sin suscripción" en lugar de romper.
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('No such subscription') || msg.includes('resource_missing')) {
        await supabase.from('users').update({ stripe_subscription_id: null, membership_renewal: 'active' }).eq('id', user.id);
        return Response.json({ ok: false, noSubscription: true }, { headers: corsHeaders });
      }
      throw e;
    }

    await supabase.from('users').update({ membership_renewal: renewal }).eq('id', user.id);

    return Response.json({
      ok: true,
      renewal,
      chargedNow: cobroHoy,
      paid: pagado,
      // $ del cobro caído que se frenó (0 = no había nada pendiente). El front lo
      // dice en el mensaje: es justo lo que la clienta estaba reclamando.
      pendingVoided: pendienteAnulado / 100,
    }, { headers: corsHeaders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('manage-membership error:', message);
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
});
