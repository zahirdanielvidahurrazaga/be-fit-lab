import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Checkout hospedado (WEB) para inscribirse a un evento de pago. El webhook
// inserta la inscripción al completarse. Precio y cupo validados server-side.
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { eventId, userId, userEmail, returnUrl } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // user_id autoritativo desde el JWT
    let ownerId: string | null = userId || null;
    try {
      const token = (req.headers.get('Authorization') || '').replace('Bearer ', '');
      if (token) { const { data: { user } } = await supabase.auth.getUser(token); if (user?.id) ownerId = user.id; }
    } catch (_) { /* */ }
    if (!ownerId) return Response.json({ error: 'No autenticado' }, { status: 401, headers: corsHeaders });

    const { data: ev } = await supabase.from('events').select('id, title, price, capacity, registration_open, image_url').eq('id', eventId).single();
    if (!ev) return Response.json({ error: 'Evento no encontrado' }, { status: 404, headers: corsHeaders });
    if (!ev.registration_open) return Response.json({ error: 'Inscripción cerrada' }, { status: 400, headers: corsHeaders });
    if (!ev.price || ev.price <= 0) return Response.json({ error: 'Evento sin costo' }, { status: 400, headers: corsHeaders });

    const { data: existing } = await supabase.from('event_registrations').select('id').eq('event_id', eventId).eq('user_id', ownerId).maybeSingle();
    if (existing) return Response.json({ error: 'YA_INSCRITA' }, { status: 409, headers: corsHeaders });
    if (ev.capacity != null) {
      const { count } = await supabase.from('event_registrations').select('*', { count: 'exact', head: true }).eq('event_id', eventId);
      if ((count ?? 0) >= ev.capacity) return Response.json({ error: 'EVENT_FULL' }, { status: 409, headers: corsHeaders });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });
    const appUrl = (typeof returnUrl === 'string' && /^https?:\/\//.test(returnUrl)) ? returnUrl.replace(/\/$/, '') : 'https://be-fit-lab.pages.dev';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        quantity: 1,
        price_data: { currency: 'mxn', unit_amount: ev.price * 100, product_data: { name: `Evento: ${ev.title}`, ...(ev.image_url ? { images: [ev.image_url] } : {}) } },
      }],
      ...(userEmail ? { customer_email: userEmail } : {}),
      success_url: `${appUrl}/eventos?payment=success`,
      cancel_url: `${appUrl}/eventos?payment=cancel`,
      metadata: { type: 'event', event_id: eventId, supabase_user_id: ownerId },
      payment_intent_data: { metadata: { type: 'event', event_id: eventId, supabase_user_id: ownerId } },
    });

    return Response.json({ url: session.url }, { headers: corsHeaders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('stripe-event-checkout error:', message);
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
});
