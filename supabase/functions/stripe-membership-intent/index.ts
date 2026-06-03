import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mismos planes que stripe-checkout (web). Mantener sincronizado.
const PLANS: Record<string, { amount: number; classes: number; name: string; lookupKey: string }> = {
  'Plan Inicial': { amount: 85000,  classes: 12,   name: 'Plan Inicial – Be Fit Lab',  lookupKey: 'befit_plan_inicial_monthly' },
  'Plan Básico':  { amount: 105000, classes: 15,   name: 'Plan Básico – Be Fit Lab',   lookupKey: 'befit_plan_basico_monthly'  },
  'Plan Fit':     { amount: 130000, classes: 20,   name: 'Plan Fit – Be Fit Lab',      lookupKey: 'befit_plan_fit_monthly'     },
  'Plan Premium': { amount: 185000, classes: 9999, name: 'Plan Premium – Be Fit Lab',  lookupKey: 'befit_plan_premium_monthly' },
};

// Hoja de pago NATIVA para MEMBRESÍAS (suscripción). Crea la suscripción en estado
// `default_incomplete` y devuelve el client_secret del PaymentIntent de la primera
// factura, que el cliente presenta con Stripe.presentPaymentSheet (dentro de la app).
// Al pagar, el cliente llama a stripe-membership-notify (activación inmediata) y el
// webhook (invoice.payment_succeeded / subscription_create) sirve de respaldo.
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { planTitle, userId, userEmail } = await req.json();
    if (!planTitle || !userId || !userEmail) {
      return Response.json({ error: 'planTitle, userId y userEmail son requeridos' }, { status: 400, headers: corsHeaders });
    }
    const plan = PLANS[planTitle];
    if (!plan) {
      return Response.json({ error: `Plan desconocido: ${planTitle}` }, { status: 400, headers: corsHeaders });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Buscar o crear cliente en Stripe
    const existingCustomers = await stripe.customers.list({ email: userEmail, limit: 1 });
    let customer = existingCustomers.data[0];
    if (!customer) {
      customer = await stripe.customers.create({ email: userEmail, metadata: { supabase_user_id: userId } });
    } else if (!customer.metadata?.supabase_user_id) {
      customer = await stripe.customers.update(customer.id, { metadata: { supabase_user_id: userId } });
    }
    await supabase.from('users').update({ stripe_customer_id: customer.id }).eq('id', userId);

    // Buscar o crear el Price (lookup_key para no duplicar)
    const existingPrices = await stripe.prices.list({ lookup_keys: [plan.lookupKey] });
    let price = existingPrices.data[0];
    if (!price) {
      price = await stripe.prices.create({
        currency: 'mxn',
        unit_amount: plan.amount,
        recurring: { interval: 'month' },
        lookup_key: plan.lookupKey,
        transfer_lookup_key: true,
        product_data: { name: plan.name },
      });
    }

    // Crear la suscripción incompleta → PaymentIntent de la primera factura
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: price.id }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription', payment_method_types: ['card'] },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        supabase_user_id: userId,
        plan_title: planTitle,
        class_count: plan.classes.toString(),
      },
    });

    // deno-lint-ignore no-explicit-any
    const invoice = subscription.latest_invoice as any;
    const pi = invoice?.payment_intent;
    if (!pi?.client_secret) throw new Error('No se obtuvo el client secret de la suscripción');

    return Response.json(
      { clientSecret: pi.client_secret, paymentIntentId: pi.id, subscriptionId: subscription.id },
      { headers: corsHeaders },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('stripe-membership-intent error:', message);
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
});
