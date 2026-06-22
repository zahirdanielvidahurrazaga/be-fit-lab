import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // 3. Borrar el perfil (cascada a tablas dependientes; SET NULL en ventas/pedidos)
    const { error: pErr } = await admin.from('users').delete().eq('id', userId);
    if (pErr) {
      return Response.json({ error: 'No se pudo borrar el perfil: ' + pErr.message }, { status: 400, headers: corsHeaders });
    }

    // 4. Borrar la cuenta de Auth (también limpia el storage de la usuaria)
    const { error: aErr } = await admin.auth.admin.deleteUser(userId);
    if (aErr) {
      // El perfil ya se borró; reportar pero no es fatal (la cuenta de Auth queda
      // huérfana y sin perfil → ya no puede usar la app, pero conviene saberlo).
      console.error('admin-delete-client auth error:', aErr.message);
      return Response.json({ ok: true, warning: 'Perfil eliminado, pero la cuenta de acceso no se pudo borrar del todo: ' + aErr.message }, { headers: corsHeaders });
    }

    return Response.json({ ok: true }, { headers: corsHeaders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('admin-delete-client error:', message);
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
});
