// ─────────────────────────────────────────────────────────────────────────────
// PAGO ÚNICO con tarjeta: INSCRIPCIÓN ANUAL o CLASE SUELTA (nov-2026).
//
// Una sola implementación para Portal, Agenda y Planes. Mismo patrón que el
// pago de eventos: hoja nativa en la app (Apple Pay en iOS, Google Pay en
// Android) y, si la hoja no se puede usar, el Checkout de Stripe en el
// navegador. En web va directo al Checkout.
//
// El monto lo pone el servidor (app_config), nunca el cliente. Aplicar el pago
// también lo hace el servidor (`stripe-pago-unico` accion 'confirmar', con el
// webhook de respaldo para la web). Si la app se cierra justo después de pagar,
// el PaymentIntent queda guardado y se confirma la próxima vez que abra.
// ─────────────────────────────────────────────────────────────────────────────
import { Capacitor } from '@capacitor/core';
import { Stripe } from '@capacitor-community/stripe';
import { Browser } from '@capacitor/browser';
import { supabase, errorDeFuncion } from './supabase';
import { ESTUDIO } from '../config/estudio';

const PENDIENTE = 'befit_pago_unico_pendiente';

const guardarPendiente = (pi) => { try { localStorage.setItem(PENDIENTE, pi); } catch { /* sin storage */ } };
const leerPendiente = () => { try { return localStorage.getItem(PENDIENTE); } catch { return null; } };
const borrarPendiente = () => { try { localStorage.removeItem(PENDIENTE); } catch { /* sin storage */ } };

async function confirmar(body) {
  const { data, error } = await supabase.functions.invoke('stripe-pago-unico', { body: { accion: 'confirmar', ...body } });
  if (error || data?.error) throw new Error(await errorDeFuncion(error, data, 'No se pudo confirmar el pago.'));
  return data;
}

async function porNavegador(tipo, volverA) {
  const esNativo = Capacitor.isNativePlatform();
  const returnUrl = esNativo ? ESTUDIO.enlaces.sitio : window.location.origin;
  const { data, error } = await supabase.functions.invoke('stripe-pago-unico', {
    body: { accion: 'checkout', tipo, volverA, returnUrl },
  });
  if (error || data?.error || !data?.url) throw new Error(await errorDeFuncion(error, data, 'No se pudo iniciar el pago.'));
  if (esNativo) {
    await Browser.open({ url: data.url });
    // El webhook lo aplica al pagar; quien llama refresca al volver.
    return { estado: 'navegador' };
  }
  // Igual que membresías/eventos/cafetería: avisa a AuthContext que es un regreso de
  // pago, para no cerrar la sesión de quien no marcó "mantener sesión" (Codex 4-nov).
  try { localStorage.setItem('befit_payment_return', String(Date.now())); } catch { /* sin storage */ }
  window.location.href = data.url;
  return { estado: 'redirigiendo' };
}

/**
 * @param {'inscripcion'|'clase_suelta'} tipo
 * @param {string} volverA  ruta a la que regresa el Checkout web ('/portal' | '/planes' | '/agenda')
 * @returns {Promise<{estado: 'pagado'|'cancelado'|'navegador'|'redirigiendo'}>}  lanza Error con texto legible si falla
 */
export async function pagarUnico(tipo, volverA = '/portal') {
  if (!Capacitor.isNativePlatform()) return porNavegador(tipo, volverA);

  const { data, error } = await supabase.functions.invoke('stripe-pago-unico', { body: { accion: 'intent', tipo } });
  if (error || data?.error || !data?.clientSecret) throw new Error(await errorDeFuncion(error, data, 'No se pudo iniciar el pago.'));

  const isIOS = Capacitor.getPlatform() === 'ios';
  const isAndroid = Capacitor.getPlatform() === 'android';
  let hojaLista = true;
  try {
    await Stripe.createPaymentSheet({
      paymentIntentClientSecret: data.clientSecret,
      merchantDisplayName: ESTUDIO.nombre,
      enableApplePay: isIOS,
      applePayMerchantId: isIOS ? ESTUDIO.tiendas.applePayMerchantId : undefined,
      enableGooglePay: isAndroid,
      GooglePayIsTesting: false,
      countryCode: 'MX',
    });
  } catch (e) {
    console.error('Hoja con Apple/Google Pay:', e);
    try {
      await Stripe.createPaymentSheet({ paymentIntentClientSecret: data.clientSecret, merchantDisplayName: ESTUDIO.nombre });
    } catch (e2) { console.error('Hoja simple:', e2); hojaLista = false; }
  }

  let res = null;
  if (hojaLista) {
    // Se guarda ANTES de presentar la hoja: si la app se cierra después del
    // cobro y antes de que la hoja responda, al reabrir se confirma. Si no
    // llegó a pagar, `confirmarPagoUnicoPendiente` lo descarta solo.
    guardarPendiente(data.paymentIntentId);
    try { res = await Stripe.presentPaymentSheet(); }
    catch (e) { console.error('presentPaymentSheet:', e); }
  }

  if (res?.paymentResult === 'paymentSheetCompleted') {
    await confirmar({ paymentIntentId: data.paymentIntentId });
    borrarPendiente();
    return { estado: 'pagado' };
  }
  if (res?.paymentResult === 'paymentSheetCanceled') { borrarPendiente(); return { estado: 'cancelado' }; }
  // La hoja falló sin cancelar: el pendiente se queda; al reabrir se verifica
  // en Stripe y se descarta solo si no se cobró.
  // La hoja falló (no canceló): mismo cobro por el navegador.
  return porNavegador(tipo, volverA);
}

/**
 * Llamar al abrir el Portal: (1) si la app se cerró tras pagar, aplica ese
 * pago; (2) si se vuelve del Checkout web con ?pago_unico=ok&session_id=…, lo
 * confirma (el webhook también lo hace; es idempotente).
 * @returns {Promise<'aplicado'|'cancelado'|null>}
 */
export async function confirmarPagoUnicoPendiente(search = '') {
  const params = new URLSearchParams(search);
  const estado = params.get('pago_unico');
  const sessionId = params.get('session_id');
  if (estado === 'cancel') return 'cancelado';
  if (estado === 'ok' && sessionId) {
    try { await confirmar({ sessionId }); return 'aplicado'; }
    catch (e) { console.warn('Confirmar pago web:', e?.message); return 'aplicado'; } // el webhook lo cubre
  }
  const pi = leerPendiente();
  if (!pi) return null;
  try {
    const r = await confirmar({ paymentIntentId: pi });
    if (r?.ok) { borrarPendiente(); return 'aplicado'; }
    // No pagado (cancelado o fallido en Stripe): ya no hay nada que aplicar.
    if (r?.status && r.status !== 'processing') borrarPendiente();
  } catch (e) { console.warn('Pago pendiente:', e?.message); }
  return null;
}
