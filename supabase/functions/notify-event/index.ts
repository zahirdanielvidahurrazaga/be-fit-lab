import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendAPNs } from './_apns.ts';
import { sendFCM } from './_fcm.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Avisa a TODAS las clientas (in-app + push) de un evento. Solo ADMIN.
// El push se envía DIRECTO (APNs/FCM) — NO vía fetch a send-push, que como
// llamada función-a-función resultaba poco confiable.
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Verificar admin
    const token = (req.headers.get('Authorization') || '').replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return Response.json({ error: 'No autenticado' }, { status: 401, headers: corsHeaders });
    const { data: prof } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (prof?.role !== 'ADMIN') return Response.json({ error: 'Solo admin' }, { status: 403, headers: corsHeaders });

    const { title, body, type = 'general', data = {} } = await req.json();
    if (!title || !body) return Response.json({ error: 'title y body requeridos' }, { status: 400, headers: corsHeaders });

    // Destinatarias: todas las clientas
    const { data: clients } = await supabase.from('users').select('id').eq('role', 'CLIENT');
    const ids = (clients || []).map((c: any) => c.id);
    if (ids.length === 0) return Response.json({ sent: 0, pushed: 0 }, { headers: corsHeaders });

    // 1) Logs in-app en lote
    await supabase.from('notification_logs').insert(ids.map((id: string) => ({ user_id: id, type, title, body, status: 'sent' })));

    // 2) Push DIRECTO a cada token de las clientas
    const { data: tokens } = await supabase.from('device_tokens').select('token, platform').in('user_id', ids);
    const results = await Promise.allSettled((tokens || []).map(({ token, platform }: any) =>
      platform === 'ios' ? sendAPNs(token, title, body, data) : sendFCM(token, title, body, data),
    ));

    let pushed = 0;
    const dead: string[] = [];
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') pushed++;
      else {
        const msg = String((r as any).reason?.message ?? (r as any).reason);
        console.error(`Token[${i}] push falló:`, msg);
        if (/BadDeviceToken|Unregistered|410/.test(msg)) dead.push((tokens as any)[i].token);
      }
    });
    if (dead.length) await supabase.from('device_tokens').delete().in('token', dead);

    return Response.json({ sent: ids.length, pushed, tokens: (tokens || []).length }, { headers: corsHeaders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('notify-event error:', message);
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
});
