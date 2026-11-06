// Sección "Coaches" del sitio: lista editorial de nombres grandes; en computadora la
// foto aparece y sigue al cursor, en celular se abre dentro del renglón al tocar.
// Sale de la vista pública `coach_directory` (solo lectura, sin datos privados) y de
// las clases que ya carga el sitio: cada coach muestra la disciplina que más da.
// Si la dueña da de alta o cambia una coach, la sección se actualiza sola.
import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion, useMotionValue, useSpring, useTransform, useVelocity } from 'framer-motion';
import { supabase } from '../../lib/supabase';

const EASE = [0.16, 1, 0.3, 1];
const serif = { fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontWeight: 500, color: 'var(--primary)' };

// "ROXANA VALENCIA DIAZ" → "Roxana" · "Bren Flores💐" → "Bren" · "Pili " → "Pili".
const nombreCorto = (n = '') => {
  const p = n.trim().split(/\s+/)[0] || '';
  const limpio = p.replace(/[^\p{L}]/gu, '');
  return limpio ? limpio.charAt(0).toUpperCase() + limpio.slice(1).toLowerCase() : '';
};

export default function SeccionCoaches({ clases = [] }) {
  const reduce = useReducedMotion();
  const [coaches, setCoaches] = useState([]);
  useEffect(() => {
    let vivo = true;
    supabase.from('coach_directory').select('id, full_name, avatar_url, role')
      .then(({ data }) => { if (vivo && Array.isArray(data)) setCoaches(data); });
    return () => { vivo = false; };
  }, []);

  // Disciplina principal por coach, de sus clases reales (minimalista: solo una).
  const lista = useMemo(() => {
    const porCoach = {};
    clases.forEach((c) => {
      if (!c.coach_id || !c.title) return;
      const m = (porCoach[c.coach_id] ||= {});
      m[c.title] = (m[c.title] || 0) + 1;
    });
    return coaches
      .map((c) => {
        const m = porCoach[c.id] || {};
        const disc = Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 1).map(([t]) => t.replace(/\s+/g, ' ').trim());
        return { ...c, nombre: nombreCorto(c.full_name), disc, clases: Object.values(m).reduce((a, b) => a + b, 0) };
      })
      // Coaches con rol o con clases; las que tienen clases y foto van primero.
      .filter((c) => c.nombre && (c.role === 'COACH' || c.clases > 0))
      .sort((a, b) => (!!b.avatar_url - !!a.avatar_url) || (b.clases - a.clases));
  }, [coaches, clases]);

  // Foto flotante que sigue al cursor (solo computadora con mouse).
  const conMouse = typeof window !== 'undefined' && window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;
  const [activa, setActiva] = useState(null);   // coach bajo el cursor (computadora)
  const [abierta, setAbierta] = useState(null); // coach abierta con un toque (celular)
  const mx = useMotionValue(0), my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 260, damping: 26, mass: 0.5 });
  const y = useSpring(my, { stiffness: 260, damping: 26, mass: 0.5 });
  // Se inclina un poco según hacia dónde se mueve el mouse.
  const giro = useTransform(useVelocity(x), [-1500, 1500], [-10, 10], { clamp: true });
  const mover = (e) => { mx.set(e.clientX); my.set(e.clientY); };

  if (!lista.length) return null;

  return (
    <section id="coaches" style={{ padding: 'var(--esp-seccion) 5%', background: '#FFFFFF' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <motion.div initial={reduce ? false : { opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9, ease: EASE }} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem', marginBottom: 'clamp(2rem,4vw,3.2rem)' }}>
          <div>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--on-surface-variant)' }}>Coaches</span>
            <h2 style={{ fontSize: 'clamp(2.6rem,5.5vw,4.2rem)', margin: '1.2rem 0 0', color: 'var(--black)', letterSpacing: '-0.04em', lineHeight: 1.05 }}>
              Te conocen <span style={serif}>por tu nombre.</span>
            </h2>
          </div>
          <span style={{ fontSize: '0.9rem', color: 'var(--on-surface-variant)' }}>{conMouse ? 'Pasa el mouse para conocerlas' : 'Toca un nombre para conocerla'}</span>
        </motion.div>

        {/* Lista editorial: nombres grandes; la foto aparece al pasar el mouse. */}
        <div className="coaches-lista" onMouseMove={conMouse ? mover : undefined} onMouseLeave={() => setActiva(null)}>
          {lista.map((c, i) => {
            const on = (conMouse ? activa : abierta) === c.id;
            return (
              <motion.div key={c.id} className={`coach-fila${on ? ' on' : ''}`}
                initial={reduce ? false : { opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.7, ease: EASE, delay: Math.min(i, 8) * 0.04 }}
                onMouseEnter={conMouse ? () => setActiva(c.id) : undefined}
                onClick={conMouse ? undefined : () => setAbierta(abierta === c.id ? null : c.id)}>
                <span className="coach-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="coach-nombre">{c.nombre}</span>
                <span className="coach-disc">{c.disc[0] || ''}</span>
                {/* Celular: la foto se abre dentro del renglón. */}
                {!conMouse && (
                  <AnimatePresence initial={false}>
                    {on && (
                      <motion.div className="coach-abierta" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.45, ease: EASE }}>
                        <div className="coach-foto-movil">{c.avatar_url ? <img src={c.avatar_url} alt={c.nombre} /> : <span>{c.nombre.charAt(0)}</span>}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Computadora: foto flotante que sigue al cursor. */}
      {conMouse && !reduce && (
        <motion.div aria-hidden="true" className="coach-flotante"
          style={{ x, y, rotate: giro }}
          animate={{ opacity: activa ? 1 : 0, scale: activa ? 1 : 0.6 }}
          transition={{ opacity: { duration: 0.25 }, scale: { duration: 0.45, ease: EASE } }}>
          <AnimatePresence initial={false}>
            {lista.filter((c) => c.id === activa).map((c) => (
              <motion.div key={c.id} className="coach-flotante-img"
                initial={{ opacity: 0, scale: 1.15 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: EASE }}>
                {c.avatar_url ? <img src={c.avatar_url} alt="" /> : <span>{c.nombre.charAt(0)}</span>}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </section>
  );
}
