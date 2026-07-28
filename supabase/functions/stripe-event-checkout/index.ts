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
    const { eventId, userId, userEmail, guests, returnUrl } = await req.json();
    const invitados: string[] = Array.isArray(guests)
      ? guests.map((g: unknown) => String(g ?? '').trim().slice(0, 60)).filter(Boolean)
      : [];
    if (invitados.length > 3) return Response.json({ error: 'Máximo 3 invitados' }, { status: 400, headers: corsHeaders });
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

    // Si ya está inscrita solo se cobran los invitados que traiga.
    const { data: existing } = await supabase.from('event_registrations').select('id').eq('event_id', eventId).eq('user_id', ownerId).maybeSingle();
    const cobrarSuLugar = !existing;
    const qty = (cobrarSuLugar ? 1 : 0) + invitados.length;
    if (qty === 0) return Response.json({ error: 'YA_INSCRITA' }, { status: 409, headers: corsHeaders });

    if (ev.capacity != null) {
      const { count } = await supabase.from('event_registrations').select('*', { count: 'exact', head: true }).eq('event_id', eventId);
      const libres = ev.capacity - (count ?? 0);
      if (libres <= 0) return Response.json({ error: 'EVENT_FULL' }, { status: 409, headers: corsHeaders });
      if (qty > libres) return Response.json({ error: `Solo quedan ${libres} lugares`, libres }, { status: 409, headers: corsHeaders });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });
    const appUrl = (typeof returnUrl === 'string' && /^https?:\/\//.test(returnUrl)) ? returnUrl.replace(/\/$/, '') : 'https://be-fit-lab.pages.dev';

    // Con invitados el pago se marca `event_guest`: así el webhook lo manda a
    // `event-tickets`, que emite un boleto por persona y manda el correo. Sin
    // invitados se conserva el camino simple de siempre.
    const meta: Record<string, string> = invitados.length
      ? {
          type: 'event_guest',
          event_id: String(eventId),
          supabase_user_id: ownerId,
          guest_names: JSON.stringify(invitados),
          ...(userEmail ? { buyer_email: String(userEmail) } : {}),
        }
      : { type: 'event', event_id: String(eventId), supabase_user_id: ownerId };

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        quantity: qty,
        price_data: { currency: 'mxn', unit_amount: ev.price * 100, product_data: { name: `Evento: ${ev.title}`, ...(ev.image_url ? { images: [ev.image_url] } : {}) } },
      }],
      ...(userEmail ? { customer_email: userEmail } : {}),
      success_url: `${appUrl}/eventos?payment=success`,
      cancel_url: `${appUrl}/eventos?payment=cancel`,
      metadata: meta,
      payment_intent_data: { metadata: meta },
    });

    return Response.json({ url: session.url }, { headers: corsHeaders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('stripe-event-checkout error:', message);
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
});
