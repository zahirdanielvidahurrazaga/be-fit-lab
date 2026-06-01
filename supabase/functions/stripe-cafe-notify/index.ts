import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Avisa por push + in-app a todas las baristas que entró un pedido nuevo.
async function notifyBaristas(supabase: any, summary: string, orderId: string) {
  const { data: baristas } = await supabase.from('users').select('id').eq('role', 'BARISTA');
  if (!baristas?.length) return;
  const title = 'Nuevo pedido ☕';
  const body = summary ? `${summary}` : 'Tienes un pedido nuevo por preparar.';
  await Promise.allSettled(baristas.map((b: any) =>
    fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
      body: JSON.stringify({ userId: b.id, title, body, type: 'general', data: { kind: 'new_order', order_id: orderId || '' } }),
    }),
  ));
}

// Tras completar la PaymentSheet: verifica que el PaymentIntent esté pagado,
// marca el pedido como 'paid' (idempotente) y registra las notificaciones in-app
// (comprador y, si es regalo, destinatario). Los PUSH los dispara el cliente.
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { paymentIntentId } = await req.json();
    if (!paymentIntentId) return Response.json({ ok: false }, { headers: corsHeaders });

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (pi.status !== 'succeeded') return Response.json({ ok: false, status: pi.status }, { headers: corsHeaders });

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const orderId = pi.metadata?.order_id;
    const buyerId = pi.metadata?.supabase_user_id;
    const summary = pi.metadata?.summary || 'Tu pedido';
    const total = pi.metadata?.total_mxn || Math.round((pi.amount ?? 0) / 100);

    // Marcar pagado SOLO si estaba pendiente → idempotencia (no duplica notifs)
    let order: any = null;
    if (orderId) {
      const { data } = await supabase.from('cafe_orders').update({ status: 'paid' })
        .eq('id', orderId).eq('status', 'pending_payment').select('*').maybeSingle();
      if (!data) return Response.json({ ok: true, dup: true }, { headers: corsHeaders });
      order = data;
    }

    // Notificación in-app del comprador
    if (buyerId) {
      await supabase.from('notification_logs').insert({
        user_id: buyerId, type: 'payment', title: 'Pedido confirmado',
        body: `${summary} — Total $${total} MXN. ¡Ya lo estamos preparando!`, status: 'sent',
      });
    }
    // Notificación in-app del destinatario (regalo)
    if (order?.is_gift && order.gift_recipient_user_id) {
      await supabase.from('notification_logs').insert({
        user_id: order.gift_recipient_user_id, type: 'payment', title: '🎁 ¡Te enviaron un regalo!',
        body: order.gift_message ? `"${order.gift_message}" — ${summary}` : `Te regalaron: ${summary}`, status: 'sent',
      });
    }

    // Avisar a las baristas del nuevo pedido (push + in-app)
    await notifyBaristas(supabase, String(summary), orderId || '');

    return Response.json({ ok: true }, { headers: corsHeaders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('stripe-cafe-notify error:', message);
    return Response.json({ ok: false, error: message }, { status: 500, headers: corsHeaders });
  }
});
