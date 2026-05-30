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
