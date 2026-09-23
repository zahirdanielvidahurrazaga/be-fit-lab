import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cancelar no detiene una factura que Stripe YA emitió (tarjeta rechazada → la
// factura queda `open` y se reintenta durante días). Hay que anularlas aparte.
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
      } catch (e) {
        console.error(`No se pudo anular la factura ${inv.id}:`, e instanceof Error ? e.message : String(e));
      }
    }
  } catch (e) {
    console.error('No se pudieron listar las facturas pendientes:', e instanceof Error ? e.message : String(e));
  }
  return montoAnulado;
}

// Elimina por completo a una clienta/usuaria desde el panel admin. Borra el
// perfil de public.users (cascada: reservas, fotos de progreso, métricas,
// inscripciones a eventos, notificaciones, device_tokens, plan alimenticio;
// y SET NULL en ventas/pedidos para conservar el historial financiero) y la
// cuenta de Auth (también limpia su storage). Solo lo puede llamar una ADMIN.
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // 1. Verificar que quien llama sea ADMIN
    const token = (req.headers.get('Authorization') || '').replace('Bearer ', '');
    if (!token) return Response.json({ error: 'No autenticado' }, { status: 401, headers: corsHeaders });
    const { data: { user: caller } } = await admin.auth.getUser(token);
    if (!caller) return Response.json({ error: 'No autenticado' }, { status: 401, headers: corsHeaders });
    const { data: callerRow } = await admin.from('users').select('role').eq('id', caller.id).single();
    if ((callerRow?.role || '').toUpperCase() !== 'ADMIN') {
      return Response.json({ error: 'Solo las administradoras pueden eliminar cuentas.' }, { status: 403, headers: corsHeaders });
    }

    // 2. Usuario a eliminar
    const { userId } = await req.json();
    if (!userId) return Response.json({ error: 'Falta el usuario a eliminar.' }, { status: 400, headers: corsHeaders });
    if (userId === caller.id) {
      return Response.json({ error: 'No puedes eliminar tu propia cuenta.' }, { status: 400, headers: corsHeaders });
    }

    // 3. 🔴 CORTAR EL COBRO ANTES DE BORRAR. Sin esto, la suscripción de Stripe
    //    se queda viva cobrándole la tarjeta cada mes a alguien que ya no existe
    //    en la base: el webhook no encuentra a quién acreditarle el pago y el
    //    dinero entra a ciegas. Es la misma familia de error que dejó $8,400 al
    //    mes en suscripciones huérfanas en agosto.
    //    Si falla, se ABORTA el borrado: mejor una cuenta de más que una tarjeta
    //    cobrándose sola.
    let cobroDetenido = 0;
    const { data: objetivo } = await admin
      .from('users').select('stripe_subscription_id').eq('id', userId).maybeSingle();
    const subId = objetivo?.stripe_subscription_id;
    if (subId) {
      const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });
      try {
        await stripe.subscriptions.cancel(subId);
      } catch (e: unknown) {
        const codigo = (e as { code?: string })?.code;
        if (codigo !== 'resource_missing') {
          const msg = e instanceof Error ? e.message : String(e);
          console.error('admin-delete-client: no se pudo cancelar la suscripción:', msg);
          return Response.json(
            { error: 'No se pudo cancelar su cobro automático en Stripe, así que no se eliminó la cuenta (si no, le seguirían cobrando). Revisa la suscripción y vuelve a intentarlo.' },
            { status: 502, headers: corsHeaders },
          );
        }
      }
      cobroDetenido = await anularFacturasPendientes(stripe, subId);
    }

    // 4. Borrar el perfil (cascada a tablas dependientes; SET NULL en ventas/pedidos)
    const { error: pErr } = await admin.from('users').delete().eq('id', userId);
    if (pErr) {
      return Response.json({ error: 'No se pudo borrar el perfil: ' + pErr.message }, { status: 400, headers: corsHeaders });
    }

    // 5. Borrar la cuenta de Auth (también limpia el storage de la usuaria)
    const { error: aErr } = await admin.auth.admin.deleteUser(userId);
    if (aErr) {
      // El perfil ya se borró; reportar pero no es fatal (la cuenta de Auth queda
      // huérfana y sin perfil → ya no puede usar la app, pero conviene saberlo).
      console.error('admin-delete-client auth error:', aErr.message);
      return Response.json({ ok: true, cobroDetenido, warning: 'Perfil eliminado, pero la cuenta de acceso no se pudo borrar del todo: ' + aErr.message }, { headers: corsHeaders });
    }

    return Response.json({ ok: true, cobroDetenido }, { headers: corsHeaders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('admin-delete-client error:', message);
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
});
