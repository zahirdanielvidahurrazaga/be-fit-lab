import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendAPNs } from './_apns.ts';
import { sendFCM } from './_fcm.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Entrega PUSH a todos los dispositivos de un usuario (APNs/FCM). NO escribe log.
// La llama el trigger de notification_logs → así toda noti in-app se vuelve push.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { userId, title, body, data = {} } = await req.json();
    if (!userId || !title || !body) return Response.json({ error: 'datos requeridos' }, { status: 400, headers: corsHeaders });

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: tokens } = await supabase.from('device_tokens').select('token, platform').eq('user_id', userId);
    if (!tokens?.length) return Response.json({ sent: 0 }, { headers: corsHeaders });

    const results = await Promise.allSettled(tokens.map(({ token, platform }: any) =>
      platform === 'ios' ? sendAPNs(token, title, body, data) : sendFCM(token, title, body, data),
    ));
    const sent = results.filter(r => r.status === 'fulfilled').length;

    const dead: string[] = [];
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        const m = String((r as any).reason?.message ?? (r as any).reason);
        if (/BadDeviceToken|Unregistered|410/.test(m)) dead.push((tokens as any)[i].token);
      }
    });
    if (dead.length) await supabase.from('device_tokens').delete().in('token', dead);

    return Response.json({ sent, failed: results.length - sent }, { headers: corsHeaders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('push-deliver error:', message);
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
});
