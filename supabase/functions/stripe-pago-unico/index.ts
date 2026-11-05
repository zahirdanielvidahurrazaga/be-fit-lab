import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// PAGOS ÚNICOS de la clienta: INSCRIPCIÓN ANUAL y CLASE SUELTA (pedido de
// Brenda, nov-2026). No son suscripción: un solo cobro.
//
//   accion 'intent'    → PaymentIntent para la hoja NATIVA (iOS/Android)
//   accion 'checkout'  → Checkout de Stripe para la WEB (o respaldo nativo)
//   accion 'confirmar' → verifica en Stripe que el pago entró y lo aplica
//                        (idempotente: el webhook hace lo mismo de respaldo)
//
// El MONTO sale siempre de app_config (nunca del cliente) y la clienta es SIEMPRE
// la de la sesión. Aplicar el pago lo hace la BD (`aplicar_pago_extra_stripe`),
// que es la misma lógica que el cobro en recepción.
const TIPOS = ['inscripcion', 'clase_suelta'] as const;
type Tipo = typeof TIPOS[number];
const NOMBRE: Record<Tipo, string> = { inscripcion: 'Inscripción anual', clase_suelta: 'Clase suelta' };
const RUTAS_RETORNO = ['/portal', '/planes', '/agenda'];

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: corsHeaders });

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const accion = String(body.accion || '');

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return json({ error: 'No autenticado' }, 401);

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });

    // ── CONFIRMAR ─────────────────────────────────────────────────────────
    if (accion === 'confirmar') {
      let piId: string | null = typeof body.paymentIntentId === 'string' ? body.paymentIntentId : null;
      if (!piId && typeof body.sessionId === 'string') {
        const ses = await stripe.checkout.sessions.retrieve(body.sessionId);
        piId = typeof ses.payment_intent === 'string' ? ses.payment_intent : ses.payment_intent?.id ?? null;
      }
      if (!piId) return json({ error: 'Falta el pago' }, 400);
      const pi = await stripe.paymentIntents.retrieve(piId);
      const tipo = pi.metadata?.type as Tipo;
      if (!TIPOS.includes(tipo)) return json({ error: 'El pago no es de inscripción ni clase suelta' }, 400);
      // Un pago ajeno no sirve para activar nada en esta cuenta.
      if (pi.metadata?.supabase_user_id !== user.id) return json({ error: 'No autorizado' }, 403);
      if (pi.status !== 'succeeded') return json({ ok: false, status: pi.status });

      const { data, error } = await supabase.rpc('aplicar_pago_extra_stripe', {
        p_user: user.id, p_tipo: tipo, p_monto: pi.amount_received / 100, p_ref: pi.id,
      });
      if (error) throw new Error(error.message);
      return json({ ok: true, tipo, ...(data || {}) });
    }

    // ── INTENT / CHECKOUT ─────────────────────────────────────────────────
    const tipo = body.tipo as Tipo;
    if (!TIPOS.includes(tipo)) return json({ error: 'Tipo de pago inválido' }, 400);

    const { data: cfg } = await supabase.from('app_config')
      .select('inscripcion_activa, inscripcion_monto, clase_suelta_monto').eq('id', 1).single();
    if (!cfg) throw new Error('Sin configuración');
    if (tipo === 'inscripcion' && !cfg.inscripcion_activa) return json({ error: 'La inscripción no está activa' }, 400);
    const monto = Number(tipo === 'inscripcion' ? cfg.inscripcion_monto : cfg.clase_suelta_monto);
    if (!(monto > 0)) return json({ error: 'Monto no configurado' }, 400);

    const { data: perfil } = await supabase.from('users')
      .select('role, classes_remaining, full_name').eq('id', user.id).single();
    if (!perfil) return json({ error: 'Cuenta no encontrada' }, 404);
    if (tipo === 'clase_suelta' && (perfil.classes_remaining ?? 0) >= 9000) {
      return json({ error: 'Tu plan es de clases ilimitadas, no necesitas clase suelta.' }, 400);
    }
    if (tipo === 'inscripcion') {
      // Pagar por adelantado vale (extiende el año), pero no más de 1 mes antes.
      const { data: vence } = await supabase.rpc('inscripcion_vence', { p_user: user.id });
      if (vence && new Date(vence).getTime() - Date.now() > 31 * 86400000) {
        return json({ error: 'Tu inscripción ya está pagada.' }, 409);
      }
    }

    const metadata = { type: tipo, supabase_user_id: user.id, ...(user.email ? { buyer_email: user.email } : {}) };
    const centavos = Math.round(monto * 100);

    if (accion === 'intent') {
      const pi = await stripe.paymentIntents.create({
        amount: centavos, currency: 'mxn', payment_method_types: ['card'],
        description: `${NOMBRE[tipo]} – Be Fit Lab`,
        ...(user.email ? { receipt_email: user.email } : {}),
        metadata,
      });
      return json({ clientSecret: pi.client_secret, paymentIntentId: pi.id, amount: monto });
    }

    if (accion === 'checkout') {
      const appUrl = (typeof body.returnUrl === 'string' && /^https?:\/\//.test(body.returnUrl))
        ? body.returnUrl.replace(/\/$/, '') : 'https://be-fit-lab.pages.dev';
      const ruta = RUTAS_RETORNO.includes(body.volverA) ? body.volverA : '/portal';
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        ...(user.email ? { customer_email: user.email } : {}),
        line_items: [{
          quantity: 1,
          price_data: { currency: 'mxn', unit_amount: centavos, product_data: { name: `${NOMBRE[tipo]} – Be Fit Lab` } },
        }],
        metadata,
        payment_intent_data: { metadata, description: `${NOMBRE[tipo]} – Be Fit Lab` },
        success_url: `${appUrl}${ruta}?pago_unico=ok&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}${ruta}?pago_unico=cancel`,
      });
      return json({ url: session.url, sessionId: session.id });
    }

    return json({ error: 'Acción inválida' }, 400);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('stripe-pago-unico error:', message);
    return json({ error: message }, 500);
  }
});
