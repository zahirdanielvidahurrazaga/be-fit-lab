import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14';

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

      // Pago de CAFETERÍA: no toca membresía; registra el resumen de compra
      // en notification_logs para que aparezca en el centro de notificaciones.
      if (session.metadata?.type === 'cafeteria') {
        if (supabase_user_id) {
          let titulo = 'Compra en cafetería ☕';
          let cuerpo = '¡Tu pedido está listo, pásalo a recoger!';
          try {
            const li = await stripe.checkout.sessions.listLineItems(session.id, { limit: 20 });
            const resumen = li.data.map(x => `${x.quantity}× ${x.description}`).join(', ');
            const total = Math.round((session.amount_total ?? 0) / 100);
            cuerpo = `${resumen} — Total $${total} MXN. ¡Pásala a recoger!`;
          } catch (e) { console.error('Error armando resumen cafetería:', e); }

          // 1) Registrar el log DIRECTO (garantiza la notificación in-app)
          await supabase.from('notification_logs').insert({
            user_id: supabase_user_id, type: 'payment', title: titulo, body: cuerpo, status: 'sent',
          });
          // 2) Mandar el PUSH (sin volver a registrar el log → skipLog)
          try {
            await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
              body: JSON.stringify({ userId: supabase_user_id, title: titulo, body: cuerpo, type: 'payment', skipLog: true }),
            });
          } catch (e) { console.error('Error enviando push cafetería:', e); }
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

    // ── Renovación mensual → resetear clases ────────────────────────────────
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice;
      // Solo procesar renovaciones, no el primer cobro (ya lo maneja checkout.session.completed)
      if (invoice.billing_reason !== 'subscription_cycle') return new Response('ok');

      const subscriptionId = invoice.subscription as string;
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const { plan_title, class_count } = subscription.metadata ?? {};
      if (!plan_title) return new Response('ok');

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
