import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendAPNs } from './_apns.ts';
import { sendFCM }  from './_fcm.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { userId, title, body, data = {}, type = 'general', skipLog = false } = await req.json();

    if (!userId || !title || !body) {
      return Response.json({ error: 'userId, title y body son requeridos' }, { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Obtener todos los tokens del usuario
    const { data: tokens, error } = await supabase
      .from('device_tokens')
      .select('token, platform')
      .eq('user_id', userId);

    if (error) throw error;

    // Sin tokens: igual registramos el log para que aparezca en el centro de
    // notificaciones in-app (el push nativo simplemente no se entrega).
    if (!tokens?.length) {
      if (!skipLog) {
        await supabase.from('notification_logs').insert({
          user_id: userId, type, title, body, status: 'sent',
        });
      }
      return Response.json({ sent: 0, message: 'Sin tokens registrados' }, { headers: corsHeaders });
    }

    const results = await Promise.allSettled(
      tokens.map(({ token, platform }) =>
        platform === 'ios'
          ? sendAPNs(token, title, body, data)
          : sendFCM(token, title, body, data)
      ),
    );

    const sent   = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    const dead: string[] = [];
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        const msg = String(r.reason?.message ?? r.reason);
        console.error(`Token[${i}] failed:`, msg);
        // Tokens definitivamente inválidos → borrarlos para no acumular basura
        if (/BadDeviceToken|Unregistered|410/.test(msg)) dead.push(tokens[i].token);
      }
    });
    if (dead.length) {
      await supabase.from('device_tokens').delete().in('token', dead);
    }

    // Registrar en el log (salvo que el llamador ya lo haya insertado, p.ej. el webhook)
    if (!skipLog) {
      await supabase.from('notification_logs').insert({
        user_id: userId,
        type,
        title,
        body,
        status: failed === tokens.length ? 'failed' : 'sent',
      });
    }

    return Response.json({ sent, failed, total: tokens.length }, { headers: corsHeaders });

  } catch (err) {
    console.error('send-push error:', err);
    return Response.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
});
