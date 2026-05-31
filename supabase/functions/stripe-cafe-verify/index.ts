import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'npm:stripe@14';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Verifica si una sesión de checkout de cafetería se pagó. Se usa para mostrar
// el "¡Gracias!" en la app al cerrar el navegador in-app de Stripe.
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { sessionId } = await req.json();
    if (!sessionId) return Response.json({ paid: false }, { headers: corsHeaders });

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return Response.json({
      paid: session.payment_status === 'paid',
      amount: session.amount_total,
    }, { headers: corsHeaders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('stripe-cafe-verify error:', message);
    return Response.json({ paid: false, error: message }, { status: 500, headers: corsHeaders });
  }
});
