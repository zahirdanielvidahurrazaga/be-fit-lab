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
      if (esLaDeLaApp) await supabase.from('users').update({ membership_renewal: 'canceling' }).eq('id', userId);
      return Response.json({ ok: true, resultado: 'Dejará de cobrarse al terminar el periodo pagado' }, { headers: corsHeaders });
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
      if (esLaDeLaApp) await supabase.from('users').update({ membership_renewal: 'paused' }).eq('id', userId);
      return Response.json({ ok: true, resultado: 'Cobro pausado. Puedes reactivarlo cuando quiera volver.' }, { headers: corsHeaders });
    }

    // resume
    await stripe.subscriptions.update(subscriptionId, { pause_collection: '', cancel_at_period_end: false });
    if (esLaDeLaApp) await supabase.from('users').update({ membership_renewal: 'active' }).eq('id', userId);
    return Response.json({ ok: true, resultado: 'Cobro reactivado' }, { headers: corsHeaders });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('admin-membership error:', message);
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
});
