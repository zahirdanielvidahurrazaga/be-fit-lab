import React, { useId, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

// El vaso de Coffee Lab como progreso del pedido. Cuenta la MISMA historia que la
// pantalla de entrada (CafeSplash), con las mismas piezas:
//   recibido   → el ticket del pedido se imprime y espera sobre el vaso vacío
//   preparando → entra la jarra y vierte sin parar; el vaso se llena POCO A POCO,
//                caen hielos y suben burbujas
//   listo      → la jarra se va, el vaso queda lleno, el popote entra deslizándose,
//                el vaso da un saltito y salen destellos
// Cada pieza entra y sale con animación (AnimatePresence), así el cambio de estado
// se ve en vivo y nada aparece de golpe.

const VASO = 'M33 62 L40 130 Q41 137 48 137 L72 137 Q79 137 80 130 L87 62';
const JARRA_CUERPO = 'M65.2 17.3 L98.2 34.4 Q102 36 104 33 L111.4 13.2 L81.6 -8.9 Z';
const JARRA_PICO = 'M60 20 L65.2 17.3';
const JARRA_ASA = 'M88.4 -4.7 Q97 -17 105.6 -5.8 Q108.5 2 103.1 5.7';
const POPOTE = 'M66 92 L80 30 L92 30';
const CAFE = '#C98A55';

export default function CafeVaso({ estado = 'recibido', tam = 190 }) {
  const reducir = useReducedMotion();
  const id = useId().replace(/:/g, '');
  const preparando = estado === 'preparando';
  const listo = estado === 'listo';
  const linea = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.6, strokeLinecap: 'round', strokeLinejoin: 'round' };

  // Nivel del líquido (y de la superficie: menos = más lleno). Al preparar sube
  // despacio durante ~25 s para que se sienta que "va avanzando".
  const nivel = listo ? 74 : preparando ? 86 : 130;
  const durNivel = listo ? 0.9 : preparando ? 25 : 0.6;
  const burbujas = useMemo(() => Array.from({ length: 6 }, (_, i) => ({ x: 46 + (i * 5.5) % 28, d: i * 0.55, r: 1.2 + (i % 3) * 0.5 })), []);

  return (
    <motion.svg viewBox="-10 -24 140 170" width={tam} height={tam * 1.21} aria-hidden="true"
      style={{ overflow: 'visible', color: 'var(--c-ink)' }}
      animate={listo && !reducir ? { scale: [1, 1.06, 0.98, 1] } : { scale: 1 }}
      transition={{ duration: 0.7, delay: 0.55, ease: 'easeOut' }}>
      <defs>
        <clipPath id={`v-${id}`}><path d={`${VASO} Z`} /></clipPath>
        <linearGradient id={`c-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EED3B0" />
          <stop offset="40%" stopColor="#C98A55" />
          <stop offset="100%" stopColor="#7E4A2C" />
        </linearGradient>
        <radialGradient id={`g-${id}`} cx="50%" cy="60%" r="55%">
          <stop offset="0%" stopColor={listo ? 'rgba(255,145,77,0.38)' : 'rgba(201,138,85,0.22)'} />
          <stop offset="100%" stopColor="rgba(201,138,85,0)" />
        </radialGradient>
      </defs>

      {/* Resplandor que respira */}
      <motion.circle cx="60" cy="100" r="64" fill={`url(#g-${id})`}
        animate={reducir ? {} : { scale: listo ? [1, 1.1, 1] : [1, 1.04, 1] }}
        transition={{ duration: listo ? 1.8 : 3.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />

      {/* Líquido + onda + hielos + burbujas */}
      <g clipPath={`url(#v-${id})`}>
        <motion.rect x="20" width="80" height="90" fill={`url(#c-${id})`}
          initial={false} animate={{ y: nivel }} transition={{ duration: durNivel, ease: preparando ? 'easeOut' : [0.33, 1, 0.68, 1] }} />
        {!reducir && (
          <motion.path d="M0 0 Q12 -4 24 0 T48 0 T72 0 T96 0 T120 0 V7 H0 Z" fill="#EED3B0"
            initial={false} animate={{ y: nivel, x: [0, -24] }}
            transition={{ y: { duration: durNivel, ease: preparando ? 'easeOut' : [0.33, 1, 0.68, 1] }, x: { duration: preparando ? 0.9 : 2.2, repeat: Infinity, ease: 'linear' } }} />
        )}
        {preparando && !reducir && [0, 1].map(i => (
          <motion.rect key={`h${i}`} x={i ? 62 : 45} y="0" width="12" height="12" rx="3"
            fill="rgba(255,255,255,0.5)" stroke="rgba(255,255,255,0.95)" strokeWidth="1.2"
            animate={{ y: [24, 104, 98, 102], opacity: [0, 1, 1, 0], rotate: [0, 20, 30, 26] }}
            transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 2.4, delay: 0.6 + i * 1.3, times: [0, 0.45, 0.7, 1], ease: 'easeOut' }}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
        ))}
        {(preparando || listo) && !reducir && burbujas.map((b, i) => (
          <motion.circle key={`b${i}`} cx={b.x} cy="134" r={b.r} fill="rgba(255,255,255,0.55)"
            animate={{ y: [0, -46], opacity: [0, 0.9, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: b.d, ease: 'easeOut' }} />
        ))}
      </g>

      {/* Chorro (solo preparando): con brillo que corre, se lee como líquido */}
      <AnimatePresence>
        {preparando && !reducir && (
          <motion.g key="chorro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.25 } }}>
            <motion.path d="M60 21 L60 132" fill="none" stroke={CAFE} strokeWidth="4.2" strokeLinecap="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.45, duration: 0.35, ease: 'easeIn' }} />
            <motion.path d="M60 21 L60 132" fill="none" stroke="#F3DCC0" strokeWidth="1.3" strokeLinecap="round" strokeDasharray="5 9"
              initial={{ strokeDashoffset: 0, opacity: 0 }} animate={{ strokeDashoffset: -56, opacity: 0.9 }}
              transition={{ strokeDashoffset: { duration: 0.6, repeat: Infinity, ease: 'linear' }, opacity: { delay: 0.7, duration: 0.3 } }} />
          </motion.g>
        )}
      </AnimatePresence>

      {/* Jarra (solo preparando): entra, vierte con un leve vaivén y se va al terminar */}
      <AnimatePresence>
        {preparando && !reducir && (
          <motion.g key="jarra"
            initial={{ x: 34, y: -34, opacity: 0 }}
            animate={{ x: 0, y: [0, -1.5, 0], opacity: 1 }}
            exit={{ x: 30, y: -30, opacity: 0, transition: { duration: 0.5, ease: 'easeIn' } }}
            transition={{ x: { duration: 0.5, ease: 'easeOut' }, opacity: { duration: 0.3 }, y: { duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 } }}>
            <path d={JARRA_CUERPO} {...linea} fill="var(--c-bg)" />
            <path d={JARRA_PICO} {...linea} />
            <path d={JARRA_ASA} {...linea} />
          </motion.g>
        )}
      </AnimatePresence>

      {/* Ticket (solo recibido): se "imprime" y flota sobre el vaso */}
      <AnimatePresence>
        {estado === 'recibido' && (
          <motion.g key="ticket"
            initial={{ y: -16, opacity: 0 }}
            animate={reducir ? { y: 0, opacity: 1 } : { y: [0, -4, 0], opacity: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.6, transition: { duration: 0.45, ease: 'easeIn' } }}
            transition={{ opacity: { duration: 0.4 }, y: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } }}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
            <path d="M47 4 H73 V46 L69.5 43 L66 46 L62.5 43 L59 46 L55.5 43 L52 46 L48.5 43 L47 44.2 Z" fill="var(--c-card)" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            {[14, 21, 28].map((yy, i) => (
              <motion.path key={yy} d={`M52 ${yy} H${i === 2 ? 62 : 68}`} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.3 + i * 0.18, duration: 0.3 }} />
            ))}
            <motion.circle cx="66" cy="35" r="2.6" fill={CAFE} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.9, type: 'spring', stiffness: 400 }} />
          </motion.g>
        )}
      </AnimatePresence>

      {/* Vaso a línea */}
      <path d={VASO} {...linea} />

      {/* Popote (solo listo): entra deslizándose por su eje, como en la entrada */}
      <AnimatePresence>
        {listo && (
          <motion.path key="popote" d={POPOTE} {...linea}
            initial={reducir ? { opacity: 1 } : { x: 9, y: -40, opacity: 0 }}
            animate={{ x: 0, y: 0, opacity: 1 }}
            transition={{ x: { type: 'spring', stiffness: 260, damping: 18, delay: 0.35 }, y: { type: 'spring', stiffness: 260, damping: 18, delay: 0.35 }, opacity: { duration: 0.15, delay: 0.35 } }} />
        )}
      </AnimatePresence>

      {/* Borde del vaso encima de todo */}
      <path d="M28 62 L92 62" {...linea} />

      {/* Destellos (solo listo) */}
      {listo && !reducir && [[16, 40], [104, 64], [24, 98], [98, 112]].map(([cx, cy], i) => (
        <motion.path key={i} d={`M${cx} ${cy - 6} L${cx + 1.6} ${cy - 1.6} L${cx + 6} ${cy} L${cx + 1.6} ${cy + 1.6} L${cx} ${cy + 6} L${cx - 1.6} ${cy + 1.6} L${cx - 6} ${cy} L${cx - 1.6} ${cy - 1.6} Z`}
          fill="#FF914D" animate={{ scale: [0, 1, 0], opacity: [0, 1, 0], rotate: [0, 45] }}
          transition={{ duration: 1.7, repeat: Infinity, delay: 0.8 + i * 0.4 }}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
      ))}
    </motion.svg>
  );
}
