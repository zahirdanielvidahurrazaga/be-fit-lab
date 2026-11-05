import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BadgeCheck, CreditCard, Store, X, Loader2 } from 'lucide-react';
import { pagarUnico } from '../lib/pagoUnico';

// ─────────────────────────────────────────────────────────────────────────────
// INSCRIPCIÓN ANUAL — el recordatorio que pidió Brenda ("que se les esté
// recordando hasta que paguen; si no, no podrán reservar").
//
// `inscripcion` viene de AuthContext (RPC mi_inscripcion). La regla de verdad
// vive en la BD (trigger guard_inscripcion); aquí solo se avisa y se cobra.
// ─────────────────────────────────────────────────────────────────────────────

const PRIMARY = '#FF914D';
const money = (n) => `$${Number(n || 0).toLocaleString('es-MX')}`;
const fechaCorta = (ymd) => ymd
  ? new Date(`${ymd}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })
  : null;

/** ¿Hay que mostrarle el aviso? */
export function debeInscripcion(inscripcion) {
  return !!inscripcion?.activa && !inscripcion.al_dia && !inscripcion.exenta;
}

function textoPlazo(inscripcion) {
  if (inscripcion?.bloqueada) return 'Sin ella no puedes reservar tus clases.';
  if (inscripcion?.bloqueo_desde) return `A partir del ${fechaCorta(inscripcion.bloqueo_desde)} la necesitarás para reservar.`;
  return 'Págala para seguir reservando sin contratiempos.';
}

function BotonPagar({ onPagado, volverA, compacto }) {
  const [pagando, setPagando] = useState(false);
  const [error, setError] = useState(null);
  const pagar = async () => {
    if (pagando) return;
    setPagando(true); setError(null);
    try {
      const r = await pagarUnico('inscripcion', volverA);
      if (r.estado === 'pagado' || r.estado === 'navegador') onPagado?.(r.estado);
    } catch (e) {
      setError(e?.message || 'No se pudo procesar el pago.');
    } finally {
      setPagando(false);
    }
  };
  return (
    <>
      <button onClick={pagar} disabled={pagando}
        style={{ width: '100%', border: 'none', borderRadius: '14px', padding: compacto ? '11px' : '13px', marginTop: '12px',
                 background: pagando ? 'rgba(0,0,0,0.08)' : PRIMARY, color: pagando ? 'var(--on-surface-variant)' : '#fff',
                 fontWeight: 800, fontSize: '0.92rem', cursor: pagando ? 'wait' : 'pointer',
                 display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        {pagando ? <><Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> Abriendo pago…</> : <><CreditCard size={17} /> Pagar con tarjeta</>}
      </button>
      {error && <p style={{ margin: '8px 0 0', fontSize: '0.78rem', color: '#DC2626', fontWeight: 600 }}>{error}</p>}
    </>
  );
}

/** Tarjeta para el Portal. No se puede cerrar: se quita sola al pagar. */
export function TarjetaInscripcion({ inscripcion, onPagado }) {
  if (!debeInscripcion(inscripcion)) return null;
  const urgente = !!inscripcion.bloqueada;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      style={{ margin: '0 0 18px', padding: '18px', borderRadius: '22px',
               background: 'var(--surface, #fff)',
               border: `1.5px solid ${urgente ? 'rgba(220,38,38,0.45)' : 'rgba(255,145,77,0.45)'}`,
               boxShadow: '0 6px 22px rgba(255,145,77,0.12)' }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
                      background: urgente ? 'rgba(220,38,38,0.1)' : 'rgba(255,145,77,0.14)',
                      color: urgente ? '#DC2626' : PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BadgeCheck size={21} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--black)', marginBottom: '3px' }}>
            Tu inscripción anual está pendiente
          </div>
          <div style={{ fontSize: '0.84rem', lineHeight: 1.45, color: 'var(--on-surface-variant)' }}>
            Cuesta <b style={{ color: 'var(--black)' }}>{money(inscripcion.monto)}</b> y te dura un año. {textoPlazo(inscripcion)}
          </div>
        </div>
      </div>
      <BotonPagar onPagado={onPagado} volverA="/portal" />
      <p style={{ margin: '9px 0 0', fontSize: '0.74rem', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
        <Store size={13} /> También puedes pagarla en recepción.
      </p>
    </motion.div>
  );
}

/** Ventana que sale en la Agenda cuando la reserva se frena por la inscripción. */
export function VentanaInscripcion({ abierta, inscripcion, onCerrar, onPagado }) {
  return (
    <AnimatePresence>
      {abierta && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCerrar}
          style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <motion.div initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '480px', background: 'var(--surface, #fff)', borderRadius: '26px 26px 0 0',
                     padding: '22px 20px calc(22px + env(safe-area-inset-bottom))', position: 'relative' }}>
            <button onClick={onCerrar} aria-label="Cerrar"
              style={{ position: 'absolute', top: '14px', right: '14px', border: 'none', background: 'rgba(0,0,0,0.05)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--black)' }}>
              <X size={17} />
            </button>
            <div style={{ width: '48px', height: '48px', borderRadius: '15px', background: 'rgba(255,145,77,0.14)', color: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
              <BadgeCheck size={25} />
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: '1.2rem', fontFamily: 'var(--font-display)', color: 'var(--black)' }}>Falta tu inscripción anual</h3>
            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--on-surface-variant)' }}>
              Para reservar necesitas tener al corriente tu inscripción de <b style={{ color: 'var(--black)' }}>{money(inscripcion?.monto ?? 500)}</b>.
              Te dura un año desde que la pagas. Tu clase no se reservó.
            </p>
            <BotonPagar onPagado={onPagado} volverA="/agenda" />
            <p style={{ margin: '10px 0 0', fontSize: '0.76rem', color: 'var(--on-surface-variant)', textAlign: 'center' }}>
              También puedes pagarla en recepción.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
