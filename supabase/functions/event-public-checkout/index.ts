import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Compra de boletos de evento SIN cuenta (web pública, para gente que no es socia).
// No lleva JWT (ver config.toml). El precio y el cupo se leen de la BD; el
// navegador solo manda a QUIÉN inscribir, nunca cuánto cobrar.
const MAX_BOLETOS = 4; // el comprador + hasta 3 acompañantes

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { eventId, name, email, phone, guests, returnUrl } = await req.json();

    const buyerName = String(name ?? '').trim().slice(0, 60);
    const buyerEmail = String(email ?? '').trim().toLowerCase().slice(0, 120);
    const buyerPhone = String(phone ?? '').trim().slice(0, 20);
    const guestNames: string[] = Array.isArray(guests)
      ? guests.map((g: unknown) => String(g ?? '').trim().slice(0, 60)).filter(Boolean)
      : [];

    if (!eventId) return Response.json({ error: 'Falta el evento' }, { status: 400, headers: corsHeaders });
    if (buyerName.length < 3) return Response.json({ error: 'Escribe tu nombre completo' }, { status: 400, headers: corsHeaders });
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(buyerEmail)) return Response.json({ error: 'Escribe un correo válido' }, { status: 400, headers: corsHeaders });
    if (buyerPhone.replace(/\D/g, '').length < 10) return Response.json({ error: 'Escribe un teléfono de 10 dígitos' }, { status: 400, headers: corsHeaders });

    const qty = 1 + guestNames.length;
    if (qty > MAX_BOLETOS) return Response.json({ error: `Máximo ${MAX_BOLETOS} boletos por compra` }, { status: 400, headers: corsHeaders });

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: ev } = await supabase
      .from('events')
      .select('id, title, price, capacity, registration_open, image_url, event_date')
      .eq('id', eventId).single();
    if (!ev) return Response.json({ error: 'Evento no encontrado' }, { status: 404, headers: corsHeaders });
    if (!ev.registration_open) return Response.json({ error: 'CERRADO' }, { status: 400, headers: corsHeaders });
    if (!ev.price || ev.price <= 0) return Response.json({ error: 'Evento sin costo' }, { status: 400, headers: corsHeaders });
    if (ev.event_date && new Date(ev.event_date).getTime() < Date.now() - 3 * 3600000) {
      return Response.json({ error: 'CERRADO' }, { status: 400, headers: corsHeaders });
    }

    // Cupo: los lugares son compartidos entre socias e invitados.
    if (ev.capacity != null) {
      const { count } = await supabase.from('event_registrations')
        .select('*', { count: 'exact', head: true }).eq('event_id', eventId);
      const libres = ev.capacity - (count ?? 0);
      if (libres <= 0) return Response.json({ error: 'EVENT_FULL' }, { status: 409, headers: corsHeaders });
      if (qty > libres) return Response.json({ error: `Solo quedan ${libres} lugares`, libres }, { status: 409, headers: corsHeaders });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });
    const appUrl = (typeof returnUrl === 'string' && /^https?:\/\//.test(returnUrl))
      ? returnUrl.replace(/\/$/, '')
      : 'https://befitlab.app';

    // Los datos del comprador viajan en la metadata del PaymentIntent: así los
    // boletos se pueden emitir tanto desde el webhook como desde la pantalla de
    // gracias, sin guardar nada antes de que el pago exista.
    const meta: Record<string, string> = {
      type: 'event_guest',
      event_id: String(eventId),
      buyer_name: buyerName,
      buyer_email: buyerEmail,
      buyer_phone: buyerPhone,
      guest_names: JSON.stringify(guestNames),
    };

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        quantity: qty,
        price_data: {
          currency: 'mxn',
          unit_amount: ev.price * 100,
          product_data: { name: ev.title, ...(ev.image_url ? { images: [ev.image_url] } : {}) },
        },
      }],
      customer_email: buyerEmail,
      success_url: `${appUrl}/evento/${eventId}?compra=ok&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/evento/${eventId}?compra=cancel`,
      metadata: meta,
      payment_intent_data: { metadata: meta },
    });

    return Response.json({ url: session.url }, { headers: corsHeaders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('event-public-checkout error:', message);
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
});
