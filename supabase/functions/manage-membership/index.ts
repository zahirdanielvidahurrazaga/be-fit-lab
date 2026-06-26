import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Gestión de la membresía por la CLIENTA (desde "Mi Membresía"):
//   - pause:  pausa el cobro de la suscripción (vacaciones). Reactivable sin
//             volver a meter tarjeta. No se le cobra la próxima renovación.
//   - cancel: cancela al final del periodo (cancel_at_period_end). Conserva el
//             acceso hasta su vencimiento; luego la suscripción termina.
//   - resume: reactiva (quita pausa y/o la cancelación programada).
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
      .select('stripe_subscription_id')
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
    try {
      if (action === 'pause') {
        await stripe.subscriptions.update(subId, { pause_collection: { behavior: 'void' }, cancel_at_period_end: false });
        renewal = 'paused';
      } else if (action === 'cancel') {
        await stripe.subscriptions.update(subId, { cancel_at_period_end: true, pause_collection: '' });
        renewal = 'canceling';
      } else { // resume / reactivar
        await stripe.subscriptions.update(subId, { pause_collection: '', cancel_at_period_end: false });
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

    return Response.json({ ok: true, renewal }, { headers: corsHeaders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('manage-membership error:', message);
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
});
