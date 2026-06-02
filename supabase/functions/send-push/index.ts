import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Crear una notificación = insertar en notification_logs. Un TRIGGER en esa tabla
// dispara el PUSH automáticamente (vía push-deliver). Así TODA noti in-app se
// vuelve push, sin tener que mandar el push manualmente desde cada lugar.
// skipLog:true se mantiene por compatibilidad → no-op (el log/push ya existe).
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { userId, title, body, type = 'general', skipLog = false } = await req.json();
    if (!userId || !title || !body) {
      return Response.json({ error: 'userId, title y body son requeridos' }, { status: 400, headers: corsHeaders });
    }
    // Compat: antes skipLog evitaba duplicar el log al mandar el push aparte.
    // Ahora el push lo manda el trigger del log, así que un skipLog no hace nada.
    if (skipLog) return Response.json({ sent: 0, note: 'skipLog' }, { headers: corsHeaders });

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { error } = await supabase.from('notification_logs').insert({ user_id: userId, type, title, body, status: 'sent' });
    if (error) throw error;

    return Response.json({ ok: true }, { headers: corsHeaders });
  } catch (err) {
    console.error('send-push error:', err);
    return Response.json({ error: (err as Error).message }, { status: 500, headers: corsHeaders });
  }
});
