import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─────────────────────────────────────────────────────────────────────────────
// LA CLIENTA ELIMINA SU PROPIA CUENTA
//
// Por qué existe esta función y no un delete desde la app: `users` y
// `reservations` NO tienen ninguna política DELETE. Con RLS activo, el delete
// del navegador no da error — borra CERO filas y devuelve éxito. La app cerraba
// la sesión y la clienta se iba creyendo que su cuenta ya no existía, cuando
// seguía completa y podía volver a entrar con la misma contraseña.
//
// Abrir una política DELETE sobre `users` sería peor: `sales`, el libro mayor y
// los pedidos cuelgan de ahí, y una política mal escrita deja a cualquiera
// borrando filas ajenas. Por eso va por aquí, con service_role y un solo
// camino auditable.
//
// 🔴 LO MÁS IMPORTANTE: se CANCELA LA SUSCRIPCIÓN DE STRIPE ANTES de borrar.
// Si no, la tarjeta se sigue cobrando cada mes y ya no queda ni el usuario al
// que aplicarle el pago: el webhook no encuentra a quién acreditárselo y el
// dinero entra a ciegas. Es la misma familia de error que dejó $8,400 al mes
// en suscripciones huérfanas en agosto. Hoy hay 79 clientas con suscripción.
// ─────────────────────────────────────────────────────────────────────────────

// Cancelar no detiene una factura que Stripe YA emitió: si el último cobro se
// cayó por tarjeta rechazada, esa factura queda `open` y Stripe la reintenta
// durante días. Es exactamente lo que le pasó a una clienta el 6 de septiembre:
// canceló y cuatro días después le entró el cargo. Hay que anularlas a mano.
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

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // 1. Quién llama. El id sale del token, NUNCA del cuerpo de la petición:
    //    así nadie puede pedir que se borre a otra persona.
    const token = (req.headers.get('Authorization') || '').replace('Bearer ', '');
    if (!token) {
      return Response.json({ error: 'No autenticado' }, { status: 401, headers: corsHeaders });
    }
    const { data: { user: quien } } = await admin.auth.getUser(token);
    if (!quien) {
      return Response.json({ error: 'No autenticado' }, { status: 401, headers: corsHeaders });
    }

    const { data: fila } = await admin
      .from('users')
      .select('role, stripe_subscription_id, full_name')
      .eq('id', quien.id)
      .maybeSingle();

    // 2. El staff no se borra solo. `classes.coach_id` es SET NULL: una coach
    //    que se elimina deja sus clases sin dueña y el estudio se entera cuando
    //    ya no hay a quién preguntarle. Que lo haga la administradora, que sí
    //    puede reasignarlas antes.
    const rol = (fila?.role || 'CLIENT').toUpperCase();
    if (rol !== 'CLIENT') {
      return Response.json(
        { error: 'Tu cuenta es del equipo del estudio. Pídele a la administradora que la elimine, para que antes reasigne tus clases.' },
        { status: 403, headers: corsHeaders },
      );
    }

    // 3. Cortar el cobro ANTES de borrar. Si esto falla, se aborta: es preferible
    //    una cuenta que sigue existiendo a una tarjeta que se sigue cobrando sin
    //    que quede nadie a quien devolverle el dinero.
    let cobroDetenido = 0;
    const subId = fila?.stripe_subscription_id;
    if (subId) {
      const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });
      try {
        await stripe.subscriptions.cancel(subId);
      } catch (e: unknown) {
        // Si en Stripe ya no existe, no hay nada que cancelar y se sigue.
        const codigo = (e as { code?: string })?.code;
        if (codigo !== 'resource_missing') {
          const msg = e instanceof Error ? e.message : String(e);
          console.error('delete-my-account: no se pudo cancelar la suscripción:', msg);
          return Response.json(
            { error: 'No pudimos cancelar tu cobro automático, así que no eliminamos la cuenta para no dejarte pagando. Escríbenos y lo resolvemos.' },
            { status: 502, headers: corsHeaders },
          );
        }
      }
      cobroDetenido = await anularFacturasPendientes(stripe, subId);
    }

    // 4. Borrar el perfil. La cascada se lleva lo personal (reservas, fotos de
    //    progreso, medidas, notificaciones, tokens del celular, inscripciones a
    //    eventos) y deja en NULL lo que es historial del negocio (ventas,
    //    pedidos de cafetería, libro mayor), que conserva su copia del nombre.
    const { error: ePerfil } = await admin.from('users').delete().eq('id', quien.id);
    if (ePerfil) {
      console.error('delete-my-account: perfil:', ePerfil.message);
      return Response.json(
        { error: 'No se pudo eliminar tu cuenta. Vuelve a intentarlo o escríbenos.' },
        { status: 400, headers: corsHeaders },
      );
    }

    // 5. Borrar la cuenta de acceso (y su storage).
    const { error: eAuth } = await admin.auth.admin.deleteUser(quien.id);
    if (eAuth) {
      // El perfil ya no existe, así que la clienta ya no puede usar la app. Se
      // reporta como ok con aviso: obligarla a reintentar no arreglaría nada.
      console.error('delete-my-account: auth:', eAuth.message);
      return Response.json({ ok: true, cobroDetenido, avisoAuth: eAuth.message }, { headers: corsHeaders });
    }

    console.log(`🗑️ Cuenta eliminada por la propia usuaria: ${quien.id} (${fila?.full_name || 'sin nombre'})`);
    return Response.json({ ok: true, cobroDetenido }, { headers: corsHeaders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('delete-my-account error:', message);
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
});
