import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// PaymentIntent para inscribirse a un evento de pago (hoja nativa). Valida precio,
// cupo y que no esté ya inscrita. El precio se lee de la BD (server-side).
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { eventId, userId, userEmail } = await req.json();
    if (!eventId || !userId) return Response.json({ error: 'Faltan datos' }, { status: 400, headers: corsHeaders });

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: ev } = await supabase.from('events').select('id, title, price, capacity, registration_open').eq('id', eventId).single();
    if (!ev) return Response.json({ error: 'Evento no encontrado' }, { status: 404, headers: corsHeaders });
    if (!ev.registration_open) return Response.json({ error: 'Inscripción cerrada' }, { status: 400, headers: corsHeaders });
    if (!ev.price || ev.price <= 0) return Response.json({ error: 'Evento sin costo' }, { status: 400, headers: corsHeaders });

    // ¿ya inscrita?
    const { data: existing } = await supabase.from('event_registrations').select('id').eq('event_id', eventId).eq('user_id', userId).maybeSingle();
    if (existing) return Response.json({ error: 'YA_INSCRITA' }, { status: 409, headers: corsHeaders });

    // cupo
    if (ev.capacity != null) {
      const { count } = await supabase.from('event_registrations').select('*', { count: 'exact', head: true }).eq('event_id', eventId);
      if ((count ?? 0) >= ev.capacity) return Response.json({ error: 'EVENT_FULL' }, { status: 409, headers: corsHeaders });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });
    const pi = await stripe.paymentIntents.create({
      amount: ev.price * 100,
      currency: 'mxn',
      payment_method_types: ['card'],
      ...(userEmail ? { receipt_email: userEmail } : {}),
      metadata: { type: 'event', event_id: eventId, supabase_user_id: userId, title: ev.title },
    });

    return Response.json({ clientSecret: pi.client_secret, paymentIntentId: pi.id, amount: ev.price }, { headers: corsHeaders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('stripe-event-intent error:', message);
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
});
