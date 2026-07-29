import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendAPNs } from './_apns.ts';
import { sendFCM } from './_fcm.ts';
import { sendNotificationEmail } from './_email.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Avisos donde PERDERSE la notificación tiene costo real → si el push no puede
// llegar, se manda correo. El resto (novedades, recordatorios) no se duplica por
// correo para no volverse spam.
const CRITICOS = new Set([
  'waitlist_offer',
  'waitlist_promoted',
  'waitlist_confirmed',
  'waitlist_expired',
  'waitlist_dropped',
]);

// Entrega PUSH a todos los dispositivos de un usuario (APNs/FCM), con RESPALDO
// POR CORREO si no hay a dónde mandarlo. La llama el trigger de
// notification_logs → así toda noti in-app se vuelve push.
//
// Marca el resultado en `notification_logs.status` ('sent' | 'email' |
// 'undelivered'): antes no había forma de saber que un aviso nunca llegó, y por
// eso el fallo de la lista de espera del 29-jul pasó desapercibido durante días.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { userId, title, body, type, data = {}, logId } = await req.json();
    if (!userId || !title || !body) return Response.json({ error: 'datos requeridos' }, { status: 400, headers: corsHeaders });

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: tokens } = await supabase.from('device_tokens').select('token, platform').eq('user_id', userId);

    // El error se REPORTA, no se traga: un CHECK sobre `status` hizo que el
    // marcado fallara en silencio durante la primera prueba y todo parecía bien.
    const marcar = async (estado: string) => {
      if (!logId) return;
      const { error } = await supabase.from('notification_logs').update({ status: estado }).eq('id', logId);
      if (error) console.error(`push-deliver: no se pudo marcar el log ${logId} como '${estado}':`, error.message);
    };

    const porCorreo = async (motivo: string) => {
      if (!CRITICOS.has(String(type))) { await marcar('undelivered'); return 0; }
      const { data: u } = await supabase.from('users').select('email, full_name').eq('id', userId).maybeSingle();
      if (!u?.email) { await marcar('undelivered'); return 0; }
      const ok = await sendNotificationEmail({ to: u.email, nombre: u.full_name, title, body });
      console.log(`push-deliver: ${motivo} (${userId}) → correo ${ok ? 'enviado' : 'FALLÓ'}`);
      await marcar(ok ? 'email' : 'undelivered');
      return ok ? 1 : 0;
    };

    if (!tokens?.length) {
      const mailed = await porCorreo('sin dispositivos registrados');
      return Response.json({ sent: 0, mailed }, { headers: corsHeaders });
    }

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

    // Ningún dispositivo aceptó el push → tratarlo igual que no tener ninguno.
    if (sent === 0) {
      const mailed = await porCorreo('todos los dispositivos rechazaron el push');
      return Response.json({ sent: 0, failed: results.length, mailed }, { headers: corsHeaders });
    }

    await marcar('sent');
    return Response.json({ sent, failed: results.length - sent }, { headers: corsHeaders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('push-deliver error:', message);
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
});
