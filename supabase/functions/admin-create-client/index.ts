import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Alta de una clienta desde recepción (panel admin). Crea la cuenta de Auth con
// el service_role (sin tocar la sesión de la admin) + el perfil en public.users,
// y opcionalmente le activa un plan. Lo pueden llamar ADMIN o RECEPCION.
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // 1. Verificar que quien llama sea ADMIN o RECEPCION (mostrador)
    const token = (req.headers.get('Authorization') || '').replace('Bearer ', '');
    if (!token) return Response.json({ error: 'No autenticado' }, { status: 401, headers: corsHeaders });
    const { data: { user: caller } } = await admin.auth.getUser(token);
    if (!caller) return Response.json({ error: 'No autenticado' }, { status: 401, headers: corsHeaders });
    const { data: callerRow } = await admin.from('users').select('role').eq('id', caller.id).single();
    if (!['ADMIN', 'RECEPCION'].includes((callerRow?.role || '').toUpperCase())) {
      return Response.json({ error: 'Solo el personal del mostrador puede inscribir clientas.' }, { status: 403, headers: corsHeaders });
    }

    // 2. Datos de la nueva clienta
    const { name, email, password, phone, birthDate, planName, classCount, amount, method } = await req.json();
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!name?.trim() || !cleanEmail || !password) {
      return Response.json({ error: 'Faltan datos (nombre, correo o contraseña).' }, { status: 400, headers: corsHeaders });
    }
    if (String(password).length < 6) {
      return Response.json({ error: 'La contraseña debe tener al menos 6 caracteres.' }, { status: 400, headers: corsHeaders });
    }

    // 3. Crear la cuenta de Auth (confirmada, lista para iniciar sesión)
    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: name.trim() },
    });
    if (cErr) {
      const dup = /already|registered|exists|duplicate/i.test(cErr.message);
      return Response.json({ error: dup ? 'Ya existe una cuenta con ese correo.' : cErr.message }, { status: 400, headers: corsHeaders });
    }
    const uid = created.user.id;

    // 4. Perfil en public.users (el trigger pudo crear la fila base → upsert)
    const patch: Record<string, unknown> = {
      id: uid,
      email: cleanEmail,
      full_name: name.trim(),
      phone: phone?.trim() || null,
      role: 'CLIENT',
      membership_plan: planName || null,
      membership_status: planName ? 'ACTIVE' : 'INACTIVE',
      classes_remaining: planName ? (Number.isFinite(classCount) ? classCount : 0) : 0,
    };
    if (birthDate) patch.birth_date = birthDate;
    // Si se inscribe con plan: sella fechas (pago = ahora, vence = +1 mes).
    if (planName) {
      const _started = new Date();
      const _expires = new Date(_started); _expires.setMonth(_expires.getMonth() + 1);
      patch.plan_started_at = _started.toISOString();
      patch.plan_expires_at = _expires.toISOString();
    }

    const { error: uErr } = await admin.from('users').upsert(patch, { onConflict: 'id' });
    if (uErr) {
      // La cuenta de Auth ya quedó creada; reportar pero no es fatal para el login
      console.error('admin-create-client perfil error:', uErr.message);
      return Response.json({ ok: true, userId: uid, warning: 'Cuenta creada, pero hubo un detalle al guardar el perfil: ' + uErr.message }, { headers: corsHeaders });
    }

    // 5. Registrar la venta de mostrador (para el dashboard financiero)
    if (planName && Number(amount) > 0) {
      await admin.from('sales').insert({
        user_id: uid, sold_by: caller.id, plan_name: planName,
        amount: Math.round(Number(amount)), method: method || null,
      });
    }

    return Response.json({ ok: true, userId: uid }, { headers: corsHeaders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('admin-create-client error:', message);
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
});
