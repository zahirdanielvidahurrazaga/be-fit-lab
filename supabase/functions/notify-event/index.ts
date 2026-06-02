import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Avisa a TODAS las clientas de un evento. Solo ADMIN. Inserta las notificaciones
// in-app en lote; el PUSH lo manda automáticamente el trigger de notification_logs.
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const token = (req.headers.get('Authorization') || '').replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return Response.json({ error: 'No autenticado' }, { status: 401, headers: corsHeaders });
    const { data: prof } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (prof?.role !== 'ADMIN') return Response.json({ error: 'Solo admin' }, { status: 403, headers: corsHeaders });

    const { title, body, type = 'general' } = await req.json();
    if (!title || !body) return Response.json({ error: 'title y body requeridos' }, { status: 400, headers: corsHeaders });

    const { data: clients } = await supabase.from('users').select('id').eq('role', 'CLIENT');
    const ids = (clients || []).map((c: any) => c.id);
    if (ids.length === 0) return Response.json({ sent: 0, pushed: 0 }, { headers: corsHeaders });

    // Logs in-app en lote → el trigger envía el push de cada uno automáticamente
    await supabase.from('notification_logs').insert(ids.map((id: string) => ({ user_id: id, type, title, body, status: 'sent' })));

    // Estimado de dispositivos que recibirán push (tokens de las clientas)
    const { count } = await supabase.from('device_tokens').select('*', { count: 'exact', head: true }).in('user_id', ids);

    return Response.json({ sent: ids.length, pushed: count ?? 0 }, { headers: corsHeaders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('notify-event error:', message);
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
});
