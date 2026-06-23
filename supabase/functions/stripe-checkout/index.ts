import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Resuelve el Stripe Price para un plan, leyendo el monto de la BD.
// Estrategia para que un CAMBIO de precio cobre correcto sin afectar a las
// suscripciones vivas (los Prices de Stripe son inmutables):
//   1. Si ya existe un Price con la lookup_key base y su monto COINCIDE → se
//      reutiliza (precio sin cambios → no duplica nada en Stripe LIVE).
//   2. Si existe uno con la key versionada por monto (`base_<centavos>`) → se reutiliza.
//   3. Si no, se crea un Price nuevo con la key versionada. Así un precio nuevo
//      genera un Price nuevo (cobro correcto a clientas NUEVAS); las que ya están
//      suscritas siguen en su Price anterior (no se migran).
async function resolvePrice(
  stripe: Stripe,
  lookupBase: string,
  amountCents: number,
  productName: string,
) {
  const versionedKey = `${lookupBase}_${amountCents}`;

  // (1) Price con la key base — reusar solo si el monto sigue igual.
  const baseList = await stripe.prices.list({ lookup_keys: [lookupBase], active: true, limit: 1 });
  if (baseList.data[0] && baseList.data[0].unit_amount === amountCents) {
    return baseList.data[0];
  }

  // (2) Price con la key versionada por monto.
  const versionedList = await stripe.prices.list({ lookup_keys: [versionedKey], active: true, limit: 1 });
  if (versionedList.data[0]) return versionedList.data[0];

  // (3) Crear uno nuevo con la key versionada (no transferimos la key base para
  //     que las suscripciones vivas conserven su Price).
  return await stripe.prices.create({
    currency: 'mxn',
    unit_amount: amountCents,
    recurring: { interval: 'month' },
    lookup_key: versionedKey,
    product_data: { name: productName },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { planTitle, userId, userEmail, returnUrl } = await req.json();

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

    const price = await resolvePrice(stripe, planRow.stripe_lookup_base, amountCents, productName);

    // Web manda returnUrl (window.location.origin) → redirige al MISMO dominio
    // (producción o localhost en dev). Nativo no lo manda → fallback a la web real.
    // Nunca usar req.headers.get('origin'): en nativo es capacitor://befitlab.app
    // y Stripe rechaza ese success_url (rompe el pago de membresía en la app).
    const appUrl = (typeof returnUrl === 'string' && /^https?:\/\//.test(returnUrl))
      ? returnUrl.replace(/\/$/, '')
      : 'https://be-fit-lab.pages.dev';

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
        class_count: classCount.toString(),
      },
      subscription_data: {
        metadata: {
          supabase_user_id: userId,
          plan_title: planTitle,
          class_count: classCount.toString(),
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
