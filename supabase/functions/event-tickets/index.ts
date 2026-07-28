import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14';
import { sendTicketEmail } from './_email.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Emite (o recupera) los boletos de una compra de evento y manda el correo.
// La llaman tres caminos, todos con el mismo resultado gracias a que
// `issue_event_tickets` es idempotente por PaymentIntent:
//   · la pantalla de gracias de la web pública  → { sessionId }
//   · el webhook de Stripe (respaldo)           → { paymentIntentId }
//   · la app nativa tras la hoja de pago        → { paymentIntentId }
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { sessionId, paymentIntentId, resendRegistrationId } = await req.json();

    // ── Reenviar el correo de un boleto (desde el panel de admin) ───────────
    // No emite nada: solo vuelve a mandar los boletos que ya existen. Requiere
    // sesión de staff (la función es pública porque la usan compradores sin cuenta).
    if (resendRegistrationId) {
      const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
      const token = (req.headers.get('Authorization') || '').replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      if (!user) return Response.json({ error: 'No autenticado' }, { status: 401, headers: corsHeaders });
      const { data: perfil } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle();
      if (!['ADMIN', 'RECEPCION'].includes(perfil?.role ?? '')) {
        return Response.json({ error: 'No autorizado' }, { status: 403, headers: corsHeaders });
      }

      const { data: reg } = await supabase.from('event_registrations')
        .select('id, event_id, guest_name, guest_email, payment_intent_id, ticket_code, user_id')
        .eq('id', resendRegistrationId).maybeSingle();
      if (!reg) return Response.json({ error: 'Boleto no encontrado' }, { status: 404, headers: corsHeaders });

      // Correo destino: el del invitado o el de la cuenta de la socia.
      let destino = reg.guest_email ?? '';
      if (!destino && reg.user_id) {
        const { data: dueña } = await supabase.from('users').select('email').eq('id', reg.user_id).maybeSingle();
        destino = dueña?.email ?? '';
      }
      if (!destino) return Response.json({ error: 'Ese boleto no tiene correo registrado' }, { status: 400, headers: corsHeaders });

      // Se mandan juntos los boletos de la misma compra (como el original).
      let hermanos = [{ ticket_code: reg.ticket_code as string, holder_name: reg.guest_name as string | null }];
      if (reg.payment_intent_id) {
        const { data: mismos } = await supabase.from('event_registrations')
          .select('ticket_code, guest_name')
          .eq('event_id', reg.event_id).eq('payment_intent_id', reg.payment_intent_id)
          .order('created_at');
        if (mismos?.length) hermanos = mismos.map((m: any) => ({ ticket_code: m.ticket_code, holder_name: m.guest_name }));
      }

      const { data: ev } = await supabase.from('events').select('title, event_date, location').eq('id', reg.event_id).single();
      const envio = await sendTicketEmail({
        to: destino,
        buyerName: reg.guest_name || 'Hola',
        eventTitle: ev?.title ?? 'Evento Be Fit Lab',
        eventDate: ev?.event_date ?? null,
        eventLocation: ev?.location ?? null,
        tickets: hermanos,
      });
      return Response.json({ ok: envio.sent, correo: destino, error: envio.error }, { headers: corsHeaders });
    }

    if (!sessionId && !paymentIntentId) {
      return Response.json({ error: 'Falta la referencia del pago' }, { status: 400, headers: corsHeaders });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });

    // 1. Confirmar con Stripe que el pago existe y está cobrado.
    let meta: Record<string, string> = {};
    let piId = '';
    if (sessionId) {
      const session = await stripe.checkout.sessions.retrieve(String(sessionId));
      if (session.payment_status !== 'paid') {
        return Response.json({ ok: false, pending: true, status: session.payment_status }, { headers: corsHeaders });
      }
      meta = (session.metadata ?? {}) as Record<string, string>;
      piId = String(session.payment_intent ?? '');
    } else {
      const pi = await stripe.paymentIntents.retrieve(String(paymentIntentId));
      if (pi.status !== 'succeeded') {
        return Response.json({ ok: false, pending: true, status: pi.status }, { headers: corsHeaders });
      }
      meta = (pi.metadata ?? {}) as Record<string, string>;
      piId = pi.id;
    }
    if (!piId) return Response.json({ error: 'Pago sin referencia' }, { status: 400, headers: corsHeaders });

    const eventId = meta.event_id;
    if (!eventId) return Response.json({ error: 'Pago sin evento' }, { status: 400, headers: corsHeaders });

    let guestNames: string[] = [];
    try { guestNames = JSON.parse(meta.guest_names || '[]'); } catch (_) { guestNames = []; }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // 2. Emitir los boletos (o recuperarlos si ya se emitieron).
    const { data: tickets, error } = await supabase.rpc('issue_event_tickets', {
      p_event_id: eventId,
      p_payment_intent: piId,
      p_buyer_name: meta.buyer_name || null,
      p_buyer_email: meta.buyer_email || null,
      p_buyer_phone: meta.buyer_phone || null,
      p_guests: guestNames,
      p_user_id: meta.supabase_user_id || null,
      p_invited_by: meta.supabase_user_id || null,
    });

    if (error) {
      // El cupo se llenó entre el pago y la emisión (carrera rarísima):
      // el cobro existe pero no hay lugar → hay que reembolsar a mano.
      if (String(error.message).includes('EVENT_FULL')) {
        console.error(`⚠️ EVENT_FULL tras cobrar. Reembolsar ${piId}`);
        return Response.json({ ok: false, error: 'EVENT_FULL_AFTER_PAY' }, { status: 409, headers: corsHeaders });
      }
      throw error;
    }

    const lista = (tickets ?? []) as { ticket_code: string; holder_name: string | null; is_new: boolean }[];
    const recienEmitidos = lista.some((t) => t.is_new);

    // 3. Correo con los boletos — solo la primera vez (no en cada recarga).
    let correo: { sent: boolean; error?: string } = { sent: false, error: 'ya_emitidos' };
    const destino = meta.buyer_email || '';
    if (recienEmitidos && destino) {
      const { data: ev } = await supabase.from('events')
        .select('title, event_date, location').eq('id', eventId).single();
      correo = await sendTicketEmail({
        to: destino,
        buyerName: meta.buyer_name || 'Hola',
        eventTitle: ev?.title ?? 'Evento Be Fit Lab',
        eventDate: ev?.event_date ?? null,
        eventLocation: ev?.location ?? null,
        tickets: lista.map((t) => ({ ticket_code: t.ticket_code, holder_name: t.holder_name })),
      });
    }

    return Response.json({
      ok: true,
      nuevos: recienEmitidos,
      correo: correo.sent,
      tickets: lista.map((t) => ({ code: t.ticket_code, name: t.holder_name })),
    }, { headers: corsHeaders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('event-tickets error:', message);
    return Response.json({ ok: false, error: message }, { status: 500, headers: corsHeaders });
  }
});
