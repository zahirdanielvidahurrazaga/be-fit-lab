import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Coffee, ShoppingBag, X } from 'lucide-react'; // eslint-disable-line no-unused-vars
import { supabase } from '../lib/supabase';
import CafeVaso from './CafeVaso';

const STEPS = [
  { key: 'paid', label: 'Recibido', titulo: 'Recibimos tu pedido', desc: 'Ya está en la barra. En un momento empezamos a prepararlo.', Icon: Check, vaso: 'recibido' },
  { key: 'preparing', label: 'Preparando', titulo: 'Lo estamos preparando', desc: 'Tu bebida se está haciendo en este momento.', Icon: Coffee, vaso: 'preparando' },
  { key: 'ready', label: 'Listo', titulo: '¡Está listo!', desc: 'Pásalo a recoger en el mostrador.', Icon: ShoppingBag, vaso: 'listo' },
];
const idxOf = (s) => (s === 'preparing' ? 1 : (s === 'ready' || s === 'completed') ? 2 : 0);
const CONFETTI = ['#FF914D', '#C98A55', '#E9C79E', '#8A5232', '#FFB37A']; // colores de la marca del café

function Confetti() {
  const pieces = useMemo(() => Array.from({ length: 22 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 22 + Math.random() * 0.4, d = 110 + Math.random() * 130;
    return { id: i, x: Math.cos(a) * d, y: Math.sin(a) * d, c: CONFETTI[i % CONFETTI.length], s: 7 + Math.random() * 6, delay: Math.random() * 0.1, round: Math.random() > 0.5 };
  }), []);
  return (
    <div style={{ position: 'absolute', top: '50%', left: '50%', pointerEvents: 'none' }}>
      {pieces.map(p => (
        <motion.div key={p.id} initial={{ x: 0, y: 0, opacity: 1, scale: 1 }} animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.5, rotate: Math.random() * 360 }}
          transition={{ duration: 1.1, delay: p.delay, ease: 'easeOut' }}
          style={{ position: 'absolute', width: p.s, height: p.s, background: p.c, borderRadius: p.round ? '50%' : '2px' }} />
      ))}
    </div>
  );
}

export default function CafeOrderTracking({ orderId, onClose }) {
  const [order, setOrder] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => { const { data } = await supabase.from('cafe_orders').select('*').eq('id', orderId).single(); if (active) setOrder(data); })();
    const ch = supabase.channel(`order:${orderId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'cafe_orders', filter: `id=eq.${orderId}` }, (p) => setOrder(p.new))
      .subscribe();
    return () => { active = false; supabase.removeChannel(ch); };
  }, [orderId]);

  // Solo en desarrollo: ?estado_demo=paid|preparing|ready para ver un estado, o
  // ?estado_demo=ciclo para ver las transiciones en vivo (cambia cada 6 s).
  const demo = import.meta.env.DEV ? new URLSearchParams(window.location.search).get('estado_demo') : null;
  const [paso, setPaso] = useState(0);
  useEffect(() => {
    if (demo !== 'ciclo') return;
    const t = setInterval(() => setPaso(p => (p + 1) % 3), 6000);
    return () => clearInterval(t);
  }, [demo]);
  const estadoDemo = demo === 'ciclo' ? ['paid', 'preparing', 'ready'][paso] : demo;
  const idx = idxOf(estadoDemo || order?.status);
  const current = STEPS[idx];
  const ready = idx === 2;

  // Al quedar listo: vibración corta (si el teléfono la permite).
  const yaVibro = React.useRef(false);
  useEffect(() => {
    if (ready && !yaVibro.current) { yaVibro.current = true; try { navigator.vibrate?.([30, 60, 30]); } catch { /* sin vibración */ } }
  }, [ready]);

  const folio = order?.id ? String(order.id).slice(0, 4).toUpperCase() : (demo ? 'A1B2' : '');
  const ancha = { fontFamily: 'var(--c-font)', fontWeight: 800, letterSpacing: '-0.025em' };

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'radial-gradient(120% 70% at 50% 30%, var(--c-cream) 0%, var(--c-bg) 70%)', display: 'flex', flexDirection: 'column', overflowY: 'auto', fontFamily: 'var(--font-body)' }}>

      {/* Barra superior: marca + en vivo + cerrar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'calc(env(safe-area-inset-top,0px) + 16px) 18px 0' }}>
        <span style={{ ...ancha, fontSize: '0.95rem', color: 'var(--c-ink)' }}>Coffee Lab</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {!ready && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--c-muted)' }}>
              <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }} style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#16A34A' }} />
              En vivo
            </span>
          )}
          <button onClick={onClose} aria-label="Cerrar" style={{ width: '38px', height: '38px', borderRadius: '50%', border: '1px solid var(--c-line)', background: 'var(--c-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={18} color="var(--c-ink)" />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '18px 24px calc(env(safe-area-inset-bottom,0px) + 32px)', textAlign: 'center', maxWidth: '440px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--c-muted)', margin: '6px 0 8px' }}>
          Pedido{folio ? ` #${folio}` : ''}
        </p>
        <AnimatePresence mode="wait">
          <motion.h1 key={current.key} initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ ...ancha, fontSize: '1.8rem', lineHeight: 1.04, color: 'var(--c-ink)', margin: '0 0 6px' }}>{current.titulo}</motion.h1>
        </AnimatePresence>
        <AnimatePresence mode="wait">
          <motion.p key={current.key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
            style={{ fontSize: '0.95rem', color: 'var(--c-muted)', margin: 0, maxWidth: '290px', lineHeight: 1.45 }}>{current.desc}</motion.p>
        </AnimatePresence>

        {/* El vaso cuenta la historia del pedido */}
        <div style={{ position: 'relative', margin: '14px 0 6px' }}>
          {ready && <Confetti key={`c-${paso}`} />}
          <CafeVaso estado={current.vaso} tam={180} />
        </div>

        {/* Progreso: 3 tramos que se llenan; el activo brilla */}
        <div style={{ width: '100%', maxWidth: '320px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            {STEPS.map((s, i) => (
              <div key={s.key} style={{ height: '6px', borderRadius: '6px', background: 'var(--c-line)', overflow: 'hidden', position: 'relative' }}>
                <motion.div initial={false} animate={{ width: i <= idx ? '100%' : '0%' }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: i === idx ? 0.15 : 0 }}
                  style={{ height: '100%', background: ready ? '#16A34A' : 'var(--c-ink)', borderRadius: '6px' }} />
                {i === idx && !ready && (
                  <motion.div animate={{ x: ['-100%', '220%'] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ position: 'absolute', top: 0, bottom: 0, width: '45%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)' }} />
                )}
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', marginTop: '8px' }}>
            {STEPS.map((s, i) => (
              <span key={s.key} style={{ fontSize: '0.74rem', fontWeight: i === idx ? 800 : 600, color: i <= idx ? 'var(--c-ink)' : 'var(--c-muted)' }}>{s.label}</span>
            ))}
          </div>
        </div>

        {/* Listo: número grande para enseñar en el mostrador */}
        <AnimatePresence>
          {ready && folio && (
            <motion.div initial={{ opacity: 0, y: 14, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} transition={{ delay: 0.5, type: 'spring', stiffness: 260, damping: 22 }}
              style={{ marginTop: '22px', width: '100%', maxWidth: '320px', background: 'var(--c-ink)', color: 'var(--c-bg)', borderRadius: '22px', padding: '16px 20px', boxSizing: 'border-box' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.7 }}>Enséñalo en el mostrador</div>
              <div style={{ ...ancha, fontSize: '2.4rem', lineHeight: 1.1, marginTop: '4px' }}>#{folio}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hora programada */}
        {order?.pickup_time && (
          <div style={{ marginTop: '18px', background: 'var(--c-card)', border: '1px solid var(--c-line)', color: 'var(--c-ink)', borderRadius: '999px', padding: '9px 16px', fontWeight: 700, fontSize: '0.86rem' }}>
            Para recoger: {new Date(order.pickup_time).toLocaleString('es-MX', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}
          </div>
        )}

        {/* Lo que pediste */}
        {Array.isArray(order?.items) && order.items.length > 0 && (
          <div style={{ marginTop: '22px', width: '100%', maxWidth: '320px', background: 'var(--c-card)', border: '1px solid var(--c-line)', borderRadius: '20px', padding: '14px 16px', textAlign: 'left', boxSizing: 'border-box' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--c-muted)', marginBottom: '6px' }}>Tu pedido</div>
            {order.items.map((it, i) => (
              <div key={i} style={{ padding: '7px 0', borderTop: i ? '1px solid var(--c-line)' : 'none' }}>
                <div style={{ display: 'flex', gap: '8px', fontSize: '0.92rem', color: 'var(--c-ink)' }}>
                  <span style={{ fontWeight: 800, color: 'var(--c-muted)' }}>{it.qty || 1}×</span>
                  <span style={{ fontWeight: 700 }}>{it.name}</span>
                </div>
                {Array.isArray(it.options) && it.options.length > 0 && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--c-muted)', marginTop: '2px', paddingLeft: '24px' }}>{it.options.map(o => o.name).join(' · ')}</div>
                )}
                {it.notes && <div style={{ fontSize: '0.78rem', color: 'var(--c-muted)', fontStyle: 'italic', marginTop: '2px', paddingLeft: '24px' }}>“{it.notes}”</div>}
              </div>
            ))}
          </div>
        )}

        {ready ? (
          <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} onClick={onClose}
            style={{ marginTop: '22px', background: 'var(--c-ink)', color: 'var(--c-bg)', border: 'none', padding: '15px 44px', borderRadius: '999px', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 12px 28px rgba(20,14,10,0.22)' }}>
            ¡Voy por él!
          </motion.button>
        ) : (
          <p style={{ marginTop: '22px', fontSize: '0.8rem', color: 'var(--c-muted)' }}>Te avisamos cuando esté listo. Puedes cerrar esta pantalla.</p>
        )}
      </div>
    </motion.div>
  );
}
