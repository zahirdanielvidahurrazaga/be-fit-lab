import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14';

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

serve(async (req) => {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') ?? '';

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Webhook signature error:', msg);
    return new Response(`Webhook Error: ${msg}`, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    // ── Pago exitoso en checkout (primera compra o cambio de plan) ──────────
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status !== 'paid') return new Response('ok');

      const { supabase_user_id, plan_title, class_count } = session.metadata ?? {};

      // Pago de INSCRIPCIÓN A EVENTO → inscribir a la clienta
      if (session.metadata?.type === 'event') {
        const eventId = session.metadata.event_id;
        if (eventId && supabase_user_id) {
          const { error } = await supabase.from('event_registrations').insert({ event_id: eventId, user_id: supabase_user_id, payment_intent_id: (session.payment_intent as string) ?? null });
          if (error && error.code !== '23505') console.error('Error inscribiendo a evento:', error.message);
        }
        return new Response('ok');
      }

      // Pago de CAFETERÍA: no toca membresía. Marca el pedido como pagado (para
      // que el barista lo vea y el cliente tenga tracking) y avisa por push + in-app.
      if (session.metadata?.type === 'cafeteria') {
        const orderId = session.metadata?.order_id;
        let order: any = null;

        // Marcar pagado de forma IDEMPOTENTE: solo procede si seguía pendiente
        // (evita doble notificación si Stripe reintenta el webhook).
        if (orderId) {
          const patch: Record<string, unknown> = { status: 'paid', payment_intent_id: (session.payment_intent as string) ?? null };
          // Defensa: si el pedido quedó sin dueño, fijarlo desde la metadata
          if (supabase_user_id) patch.user_id = supabase_user_id;
          const { data: updated } = await supabase.from('cafe_orders')
            .update(patch)
            .eq('id', orderId).eq('status', 'pending_payment')
            .select('*').maybeSingle();
          if (!updated) return new Response('ok'); // ya procesado o no encontrado
          order = updated;
        }

        // Resumen de la compra (preferir el snapshot del pedido)
        let resumen = '';
        if (order?.items?.length) {
          resumen = order.items.map((i: any) => `${i.qty}× ${i.name}`).join(', ');
        } else {
          try {
            const li = await stripe.checkout.sessions.listLineItems(session.id, { limit: 20 });
            resumen = li.data.map(x => `${x.quantity}× ${x.description}`).join(', ');
          } catch (e) { console.error('Error armando resumen cafetería:', e); }
        }

        const titulo = 'Pedido confirmado';
        const cuerpo = `${resumen ? resumen + '. ' : ''}¡Ya lo estamos preparando!`;

        // Avisar al comprador (in-app + push)
        if (supabase_user_id) {
          await supabase.from('notification_logs').insert({
            user_id: supabase_user_id, type: 'payment', title: titulo, body: cuerpo, status: 'sent',
          });
          try {
            await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
              body: JSON.stringify({ userId: supabase_user_id, title: titulo, body: cuerpo, type: 'payment', skipLog: true }),
            });
          } catch (e) { console.error('Error enviando push cafetería:', e); }
        }

        // Avisar a las baristas del nuevo pedido (push + in-app)
        await notifyBaristas(supabase, resumen, orderId || '');

        // Si es regalo con cuenta destinataria, avisarle también
        const recipientId = order?.gift_recipient_user_id;
        if (recipientId && recipientId !== supabase_user_id) {
          const gtitulo = '¡Te enviaron un regalo! 🎁';
          const gcuerpo = order?.gift_message || `Te regalaron: ${resumen || 'un pedido de la cafetería'}`;
          try {
            await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
              body: JSON.stringify({ userId: recipientId, title: gtitulo, body: gcuerpo, type: 'payment' }),
            });
          } catch (e) { console.error('Error enviando push regalo cafetería:', e); }
        }
        return new Response('ok');
      }

      // Membresía: requiere plan_title; si no, ignorar.
      if (!plan_title) return new Response('ok');
      if (!supabase_user_id) return new Response('ok');

      const { error } = await supabase.from('users').update({
        membership_plan: plan_title,
        membership_status: 'ACTIVE',
        classes_remaining: parseInt(class_count ?? '0'),
        stripe_subscription_id: session.subscription as string,
      }).eq('id', supabase_user_id);

      if (error) console.error('Error activando plan:', error);
      else console.log(`✅ Plan activado: ${plan_title} para ${supabase_user_id}`);
    }

    // ── Cobros de suscripción (primer cobro nativo + renovaciones) ──────────
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice;
      const reason = invoice.billing_reason;
      // El primer cobro del checkout WEB ya lo maneja checkout.session.completed.
      // Aquí cubrimos: (a) subscription_create del flujo NATIVO (PaymentSheet, que no
      // genera checkout.session) como respaldo del stripe-membership-notify, y
      // (b) subscription_cycle (renovación mensual → resetear clases).
      if (reason !== 'subscription_create' && reason !== 'subscription_cycle') return new Response('ok');

      const subscriptionId = invoice.subscription as string;
      if (!subscriptionId) return new Response('ok');
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const { supabase_user_id, plan_title, class_count } = subscription.metadata ?? {};
      if (!plan_title) return new Response('ok');

      if (reason === 'subscription_create') {
        // Primer cobro de una suscripción creada con la hoja nativa → activar plan
        if (supabase_user_id) {
          await supabase.from('users').update({
            membership_plan: plan_title,
            membership_status: 'ACTIVE',
            classes_remaining: parseInt(class_count ?? '0'),
            stripe_subscription_id: subscriptionId,
          }).eq('id', supabase_user_id);
          console.log(`✅ Plan activado (nativo): ${plan_title} para ${supabase_user_id}`);
        }
      } else {
        // Renovación mensual → resetear clases
        const { data: users } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_subscription_id', subscriptionId)
          .limit(1);
        if (users?.length) {
          await supabase.from('users').update({
            membership_status: 'ACTIVE',
            classes_remaining: parseInt(class_count ?? '0'),
          }).eq('id', users[0].id);
          console.log(`🔄 Clases renovadas: ${class_count} para usuario ${users[0].id}`);
        }
      }
    }

    // ── Suscripción cancelada ────────────────────────────────────────────────
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;

      const { data: users } = await supabase
        .from('users')
        .select('id')
        .eq('stripe_subscription_id', subscription.id)
        .limit(1);

      if (users?.length) {
        await supabase.from('users').update({
          membership_status: 'INACTIVE',
          classes_remaining: 0,
          stripe_subscription_id: null,
        }).eq('id', users[0].id);

        console.log(`❌ Suscripción cancelada para usuario ${users[0].id}`);
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Webhook handler error:', msg);
    return new Response(`Handler Error: ${msg}`, { status: 500 });
  }

  return new Response('ok');
});
