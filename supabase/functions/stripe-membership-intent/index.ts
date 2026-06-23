import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Resuelve el Stripe Price leyendo el monto de la BD (misma lógica que
// stripe-checkout). Los Prices de Stripe son inmutables, así que:
//   1. key base con monto igual → reusar (sin cambios, no duplica en LIVE).
//   2. key versionada `base_<centavos>` existente → reusar.
//   3. si no, crear Price nuevo con la key versionada → un precio nuevo cobra
//      correcto a clientas nuevas; las ya suscritas conservan su Price.
async function resolvePrice(
  stripe: Stripe,
  lookupBase: string,
  amountCents: number,
  productName: string,
) {
  const versionedKey = `${lookupBase}_${amountCents}`;

  const baseList = await stripe.prices.list({ lookup_keys: [lookupBase], active: true, limit: 1 });
  if (baseList.data[0] && baseList.data[0].unit_amount === amountCents) {
    return baseList.data[0];
  }

  const versionedList = await stripe.prices.list({ lookup_keys: [versionedKey], active: true, limit: 1 });
  if (versionedList.data[0]) return versionedList.data[0];

  return await stripe.prices.create({
    currency: 'mxn',
    unit_amount: amountCents,
    recurring: { interval: 'month' },
    lookup_key: versionedKey,
    product_data: { name: productName },
  });
}

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

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Plan desde la BD (fuente de verdad, editable desde admin).
    const { data: planRow, error: planErr } = await supabase
      .from('membership_plans')
      .select('name, title, price_mxn, classes, stripe_lookup_base')
      .eq('name', planTitle)
      .maybeSingle();
    if (planErr || !planRow) {
      return Response.json({ error: `Plan desconocido: ${planTitle}` }, { status: 400, headers: corsHeaders });
    }
    const amountCents = Math.round(Number(planRow.price_mxn) * 100);
    const classCount = Number(planRow.classes) || 0;
    const productName = `${planRow.name} – Be Fit Lab`;

    // Buscar o crear cliente en Stripe
    const existingCustomers = await stripe.customers.list({ email: userEmail, limit: 1 });
    let customer = existingCustomers.data[0];
    if (!customer) {
      customer = await stripe.customers.create({ email: userEmail, metadata: { supabase_user_id: userId } });
    } else if (!customer.metadata?.supabase_user_id) {
      customer = await stripe.customers.update(customer.id, { metadata: { supabase_user_id: userId } });
    }
    await supabase.from('users').update({ stripe_customer_id: customer.id }).eq('id', userId);

    const price = await resolvePrice(stripe, planRow.stripe_lookup_base, amountCents, productName);

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
        class_count: classCount.toString(),
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
