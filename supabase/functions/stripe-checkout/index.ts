import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLANS: Record<string, { amount: number; classes: number; name: string; lookupKey: string }> = {
  'Plan Inicial': { amount: 85000,  classes: 12,   name: 'Plan Inicial – Be Fit Lab',  lookupKey: 'befit_plan_inicial_monthly' },
  'Plan Básico':  { amount: 105000, classes: 15,   name: 'Plan Básico – Be Fit Lab',   lookupKey: 'befit_plan_basico_monthly'  },
  'Plan Fit':     { amount: 130000, classes: 20,   name: 'Plan Fit – Be Fit Lab',      lookupKey: 'befit_plan_fit_monthly'     },
  'Plan Premium': { amount: 185000, classes: 9999, name: 'Plan Premium – Be Fit Lab',  lookupKey: 'befit_plan_premium_monthly' },
};

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
      customer = await stripe.customers.create({
        email: userEmail,
        metadata: { supabase_user_id: userId },
      });
    } else if (!customer.metadata?.supabase_user_id) {
      customer = await stripe.customers.update(customer.id, {
        metadata: { supabase_user_id: userId },
      });
    }

    // Guardar stripe_customer_id en Supabase
    await supabase.from('users').update({ stripe_customer_id: customer.id }).eq('id', userId);

    // Buscar o crear el Price (lookup_key para idempotencia — no crea duplicados)
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

    const appUrl = req.headers.get('origin') || 'https://be-fit-lab.pages.dev';

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: price.id, quantity: 1 }],
      success_url: `${appUrl}/planes?payment=success`,
      cancel_url:  `${appUrl}/planes?payment=cancel`,
      metadata: {
        supabase_user_id: userId,
        plan_title: planTitle,
        class_count: plan.classes.toString(),
      },
      subscription_data: {
        metadata: {
          supabase_user_id: userId,
          plan_title: planTitle,
          class_count: plan.classes.toString(),
        },
      },
    });

    return Response.json({ url: session.url, sessionId: session.id }, { headers: corsHeaders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('stripe-checkout error:', message);
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
});
