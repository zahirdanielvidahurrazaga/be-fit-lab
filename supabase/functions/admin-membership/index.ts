import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Gestión del COBRO AUTOMÁTICO de una clienta, hecha por la DUEÑA desde ADMIN.
//
// Existe porque `manage-membership` solo deja que cada clienta gestione la suya
// (saca el usuario del JWT), y las dueñas necesitaban poder detener un cobro sin
// pedirle a la clienta que entrara a la app. Pedido textual: "si hay manera de
// que yo les pueda cancelar el cobro".
//
// Además muestra TODAS las suscripciones que tiene la clienta en Stripe, no solo
// la que la app conoce. Durante julio y agosto varias quedaron con dos vivas a la
// vez y la segunda cobraba sin que nadie la viera; aquí se ven y se pueden cerrar.
//
//   list   → todas sus suscripciones, marcando cuál usa la app y cuál sobra
//   cancel → deja de renovarse al terminar el periodo pagado (conserva el acceso)
//   cancel_now → corta de inmediato (para las duplicadas que no debieron existir)
//   pause  → pausa el cobro sin perder la tarjeta (vacaciones)
//   resume → reactiva

const SUB_COBRABLES = ['active', 'past_due', 'unpaid', 'trialing', 'paused'];

// Anula las facturas que ya estaban ABIERTAS al detener el cobro.
//
// Mismo hueco que en `manage-membership` (ahí está el caso completo): ni
// `pause_collection` ni `cancel_at_period_end` frenan una factura que Stripe ya
// emitió. Si el cobro del mes se cayó por tarjeta rechazada, la factura queda
// `open` y Stripe la reintenta durante días — así que la dueña "cancelaba el
// cobro" y la clienta igual terminaba con el cargo. Se anulan aquí también,
// porque una factura sin pagar no le abonó clases a nadie (el saldo solo se
// mueve con `invoice.payment_succeeded`).
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


// Reactivar con el mes YA VENCIDO: quita la pausa, reinicia el ciclo HOY y
// cobra el mes (el webhook, con `subscription_update` y monto, le pone sus
// clases y su mes nuevo). Devuelve si el cobro pasó (null = no se supo).
// Gemela en manage-membership/admin-membership (aquí no se comparten módulos).
//
// Nunca dos cobros por la misma reactivación: si la última factura ya es un
// cobro de reactivación de las últimas 24 h pagado o en curso (doble toque, la
// dueña y la clienta a la vez, reintento antes de que llegue el webhook), solo
// se quita la pausa. Si en medio hubo una pausa, esa factura quedó anulada y sí
// se cobra de nuevo. La llave de idempotencia sale de la factura anterior: dos
// peticiones simultáneas ven la misma y Stripe emite una sola.
async function reanudarCobrandoHoy(stripe: Stripe, subId: string): Promise<boolean | null> {
  const actual = await stripe.subscriptions.retrieve(subId, { expand: ['latest_invoice'] });
  const previa = actual.latest_invoice as Stripe.Invoice | null;
  const yaCobrando = !!previa
    && previa.billing_reason === 'subscription_update'
    && (previa.amount_due ?? 0) > 0
    && (previa.status === 'paid' || previa.status === 'open')
    && Date.now() / 1000 - previa.created < 86400;
  if (yaCobrando) {
    await stripe.subscriptions.update(subId, { pause_collection: '', cancel_at_period_end: false });
    return previa!.status === 'paid';
  }
  const sub = await stripe.subscriptions.update(subId, {
    pause_collection: '',
    cancel_at_period_end: false,
    billing_cycle_anchor: 'now',
    proration_behavior: 'none',
    payment_behavior: 'allow_incomplete',
  }, { idempotencyKey: `reanudar-cobro-${subId}-${previa?.id ?? 'sin-factura'}` });
  const invId = typeof sub.latest_invoice === 'string'
    ? sub.latest_invoice
    : ((sub.latest_invoice as { id?: string } | null)?.id ?? null);
  if (!invId) return null;
  try {
    const inv = await stripe.invoices.retrieve(invId);
    return inv.status === 'paid';
  } catch (_) { return null; }
}

// Si la reactivación tronó, regresa la pausa como estaba (reanudar_vigencia ya
// había devuelto los días y borrado `paused_at`; sin esto esos días se pierden).
// Pero un error no prueba que Stripe no la haya hecho (p. ej. se cortó la
// respuesta): si la suscripción ya no está pausada ni por cancelarse, no se
// toca nada. Y solo se deshace si la fila sigue con lo que escribió ESTA
// operación: si el webhook ya le puso su mes nuevo, no se le pisa.
async function deshacerReanudacion(
  stripe: Stripe,
  // deno-lint-ignore no-explicit-any
  supabase: any,
  subId: string,
  userId: string,
  escrito: string | null,
  antes: { plan_expires_at: string | null; paused_at: string | null },
): Promise<void> {
  try {
    const s = await stripe.subscriptions.retrieve(subId);
    if (!s.pause_collection && !s.cancel_at_period_end) return;
  } catch (_) { /* sin respuesta de Stripe: decide la condición de abajo */ }
  if (!escrito) return;
  const { error } = await supabase.from('users')
    .update({ plan_expires_at: antes.plan_expires_at, paused_at: antes.paused_at })
    .eq('id', userId)
    .eq('plan_expires_at', escrito)
    .is('paused_at', null);
  if (error) console.error('No se pudo regresar la pausa:', error.message);
}
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { action, userId, subscriptionId } = await req.json();
    if (!['list', 'cancel', 'cancel_now', 'pause', 'resume'].includes(action)) {
      return Response.json({ error: 'Acción inválida' }, { status: 400, headers: corsHeaders });
    }
    if (!userId) return Response.json({ error: 'Falta userId' }, { status: 400, headers: corsHeaders });

    // ── Quién llama: tiene que ser ADMIN ─────────────────────────────────────
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

    const { data: quien } = await supabase
      .from('users').select('role').eq('id', user.id).maybeSingle();
    if (quien?.role !== 'ADMIN') {
      return Response.json({ error: 'Solo una administradora puede gestionar cobros' }, { status: 403, headers: corsHeaders });
    }

    // ── La clienta ───────────────────────────────────────────────────────────
    const { data: clienta } = await supabase
      .from('users')
      .select('id, full_name, email, stripe_customer_id, stripe_subscription_id, membership_renewal, membership_plan')
      .eq('id', userId).maybeSingle();
    if (!clienta) {
      return Response.json({ error: 'No se encontró a la clienta' }, { status: 404, headers: corsHeaders });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });

    // El customer puede no estar guardado (altas viejas) → buscarlo por correo.
    let customerId = clienta.stripe_customer_id as string | null;
    if (!customerId && clienta.email) {
      const encontrados = await stripe.customers.list({ email: clienta.email, limit: 1 });
      customerId = encontrados.data[0]?.id ?? null;
      if (customerId) {
        await supabase.from('users').update({ stripe_customer_id: customerId }).eq('id', userId);
      }
    }
    if (!customerId) {
      // Pagó en efectivo o la dieron de alta a mano: no hay nada que cobrar.
      return Response.json({ ok: true, sinCobroAutomatico: true, suscripciones: [] }, { headers: corsHeaders });
    }

    // ── list ─────────────────────────────────────────────────────────────────
    if (action === 'list') {
      const { data } = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 100 });

      // Cobros CAÍDOS que Stripe sigue reintentando. Una factura rechazada queda
      // `open` durante días y no se ve por ningún lado: la dueña "cancelaba el
      // cobro" y días después entraba igual. Aquí se muestran para que sepa que
      // hay algo pendiente antes de decirle nada a la clienta.
      const pendientePorSub = new Map<string, { monto: number; proximoIntento: number | null }>();
      try {
        const abiertas = await stripe.invoices.list({ customer: customerId, status: 'open', limit: 30 });
        for (const inv of abiertas.data) {
          const anyInv = inv as any;
          const sid: string | null = (typeof anyInv.subscription === 'string' ? anyInv.subscription : null)
            ?? anyInv.parent?.subscription_details?.subscription ?? null;
          if (!sid || (inv.amount_remaining ?? 0) <= 0) continue;
          const previo = pendientePorSub.get(sid);
          pendientePorSub.set(sid, {
            monto: (previo?.monto ?? 0) + (inv.amount_remaining ?? 0) / 100,
            proximoIntento: previo?.proximoIntento ?? inv.next_payment_attempt ?? null,
          });
        }
      } catch (e) {
        console.error('No se pudieron leer las facturas abiertas:', e instanceof Error ? e.message : String(e));
      }

      const suscripciones = data
        .filter(s => SUB_COBRABLES.includes(s.status))
        .map(s => {
          // Stripe movió `current_period_end` de la suscripción al item en su API
          // de 2025, y la cuenta ya está en la nueva → leer las dos rutas.
          const item = s.items.data[0] as any;
          return {
            id: s.id,
            estado: s.status,
            monto: (item?.price?.unit_amount ?? 0) / 100,
            proximoCobro: item?.current_period_end ?? (s as any).current_period_end ?? null,
            terminaAlVencer: s.cancel_at_period_end,
            pausada: !!s.pause_collection,
            plan: s.metadata?.plan_title ?? null,
            creada: s.created,
            // La que la app tiene guardada es la "buena"; cualquier otra sobra y
            // es la que ha estado cobrando a escondidas.
            esLaDeLaApp: s.id === clienta.stripe_subscription_id,
            // Cobro caído que Stripe sigue reintentando (null = nada pendiente).
            pendiente: pendientePorSub.get(s.id)?.monto ?? null,
            pendienteProximoIntento: pendientePorSub.get(s.id)?.proximoIntento ?? null,
          };
        })
        .sort((a, b) => Number(b.esLaDeLaApp) - Number(a.esLaDeLaApp) || b.creada - a.creada);

      return Response.json({
        ok: true,
        clienta: { nombre: clienta.full_name, plan: clienta.membership_plan, renovacion: clienta.membership_renewal },
        sinCobroAutomatico: suscripciones.length === 0,
        duplicadas: Math.max(0, suscripciones.length - 1),
        suscripciones,
      }, { headers: corsHeaders });
    }

    // ── Acciones sobre una suscripción ───────────────────────────────────────
    if (!subscriptionId) {
      return Response.json({ error: 'Falta subscriptionId' }, { status: 400, headers: corsHeaders });
    }

    // No dejar tocar suscripciones de otra persona.
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    if (sub.customer !== customerId) {
      return Response.json({ error: 'Esa suscripción no es de esta clienta' }, { status: 400, headers: corsHeaders });
    }

    const esLaDeLaApp = subscriptionId === clienta.stripe_subscription_id;

    if (action === 'cancel') {
      await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true, pause_collection: '' });
      const frenado = await anularFacturasPendientes(stripe, subscriptionId);
      if (esLaDeLaApp) await supabase.from('users').update({ membership_renewal: 'canceling', paused_at: null }).eq('id', userId);
      return Response.json({
        ok: true,
        resultado: 'Dejará de cobrarse al terminar el periodo pagado'
          + (frenado ? `. También se detuvo un cobro caído de $${frenado / 100} que Stripe seguía reintentando.` : ''),
      }, { headers: corsHeaders });
    }

    if (action === 'cancel_now') {
      // Corte inmediato. Si NO es la de la app (o sea, es una duplicada),
      // marcarla para que el webhook `customer.subscription.deleted` la ignore:
      // si no, daría de baja la membresía buena de la clienta.
      if (!esLaDeLaApp) {
        await stripe.subscriptions.update(subscriptionId, {
          metadata: {
            ...(sub.metadata ?? {}),
            superseded_by: clienta.stripe_subscription_id ?? 'cancelada_desde_admin',
            cancelada_por: 'admin',
          },
        });
      }
      await stripe.subscriptions.cancel(subscriptionId);
      await anularFacturasPendientes(stripe, subscriptionId);
      if (esLaDeLaApp) {
        await supabase.from('users')
          .update({ stripe_subscription_id: null, membership_renewal: 'active' })
          .eq('id', userId);
      }
      return Response.json({
        ok: true,
        resultado: esLaDeLaApp
          ? 'Cobro cancelado. La clienta conserva las clases que ya tiene.'
          : 'Cobro duplicado eliminado. Su membresía no se toca.',
      }, { headers: corsHeaders });
    }

    if (action === 'pause') {
      await stripe.subscriptions.update(subscriptionId, { pause_collection: { behavior: 'void' }, cancel_at_period_end: false });
      const frenado = await anularFacturasPendientes(stripe, subscriptionId);
      // Se marca CUÁNDO empezó la pausa: al reactivar se le devuelven esos días
      // de vigencia. Pausar congela el reloj, no lo deja corriendo.
      if (esLaDeLaApp) {
        await supabase.from('users')
          .update({ membership_renewal: 'paused', paused_at: new Date().toISOString() })
          .eq('id', userId);
      }
      return Response.json({
        ok: true,
        resultado: 'Cobro pausado. Puedes reactivarlo cuando quiera volver.'
          + (frenado ? ` También se detuvo un cobro caído de $${frenado / 100} que Stripe seguía reintentando.` : ''),
      }, { headers: corsHeaders });
    }

    // resume
    // Mismo orden que en la app de la clienta (manage-membership): primero se le
    // devuelven los días que estuvo pausada y, con el vencimiento ya corregido,
    // se decide si hay que cobrar. Antes desde aquí solo se quitaba la pausa:
    // si el mes ya había vencido, Stripe no cobraba hasta el siguiente ciclo
    // y la clienta quedaba reactivada sin pagar (o bloqueada sin clases).
    let devueltos = 0;
    let vencida = false;
    let antes: { plan_expires_at: string | null; paused_at: string | null } | null = null;
    let escrito: string | null = null;
    if (esLaDeLaApp) {
      // Mismo cálculo que usa la app de la clienta: vive en la BD para que los
      // dos caminos no se desincronicen.
      ({ data: antes } = await supabase
        .from('users').select('plan_expires_at, paused_at').eq('id', userId).maybeSingle());
      const { data: despues, error: eReanudar } = await supabase
        .rpc('reanudar_vigencia', { p_user: userId });
      // Sin los días devueltos no se sabe si de verdad venció: mejor no tocar
      // nada que cobrarle con la fecha vieja.
      if (eReanudar) {
        console.error('reanudar_vigencia:', eReanudar.message);
        return Response.json({ error: 'No se pudo calcular su vigencia. No se cobró nada; intenta de nuevo.' }, { status: 500, headers: corsHeaders });
      }
      if (antes?.plan_expires_at && despues) {
        devueltos = Math.round(
          (new Date(despues).getTime() - new Date(antes.plan_expires_at).getTime()) / 86400000,
        );
      }
      escrito = despues ?? null;
      const venceEn = despues ?? antes?.plan_expires_at ?? null;
      vencida = !!venceEn && new Date(venceEn).getTime() < Date.now();
    }

    let pagado: boolean | null = null;
    try {
      if (vencida) pagado = await reanudarCobrandoHoy(stripe, subscriptionId);
      else await stripe.subscriptions.update(subscriptionId, { pause_collection: '', cancel_at_period_end: false });
    } catch (e) {
      if (esLaDeLaApp && antes) {
        await deshacerReanudacion(stripe, supabase, subscriptionId, userId, escrito, antes);
      }
      throw e;
    }
    if (esLaDeLaApp) {
      await supabase.from('users').update({ membership_renewal: 'active' }).eq('id', userId);
    }

    let resultado = 'Cobro reactivado';
    if (devueltos > 0) resultado += `. Se le devolvieron ${devueltos} día${devueltos === 1 ? '' : 's'} de vigencia por el tiempo que estuvo pausada.`;
    if (vencida) {
      resultado += pagado === true
        ? '. Su mes ya había vencido: se cobró hoy y empieza su mes nuevo.'
        : pagado === false
          ? '. Su mes ya había vencido y se intentó cobrar hoy, pero el banco lo rechazó: no tendrá clases nuevas hasta que pase el cobro.'
          : '. Su mes ya había vencido: se intentó cobrar hoy; revisa en Stripe si pasó.';
    }
    return Response.json({ ok: true, resultado }, { headers: corsHeaders });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('admin-membership error:', message);
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
});
