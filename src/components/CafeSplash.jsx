import React, { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ESTUDIO } from '../config/estudio';

// Pantalla de entrada de Coffee Lab (la cafetería es "otra app" dentro del estudio).
// Secuencia que se entiende como una historia, sin cosas que aparezcan de la nada:
//   1. se dibuja el vaso · 2. entra una jarra (eco del logo real) y vierte un chorro
//   que se ve líquido (fluye) · 3. el vaso se llena con onda y caen hielos ·
//   4. el chorro se corta y la jarra se va · 5. el popote ENTRA deslizándose al vaso
//   (mismo color de línea que todo) · 6. la marca letra por letra · 7. la pantalla
//   sube como telón y deja ver la app.
// Antes el chorro era una línea vertical que parecía popote y luego aparecía otro
// popote negro, en diagonal, de golpe.
// Primera vez en la sesión completa; las siguientes, rápida. Un toque la salta.

const VASO = 'M33 62 L40 130 Q41 137 48 137 L72 137 Q79 137 80 130 L87 62';
// Jarra ya inclinada para verter, con el pico en (60,20) (coordenadas calculadas).
const JARRA_CUERPO = 'M65.2 17.3 L98.2 34.4 Q102 36 104 33 L111.4 13.2 L81.6 -8.9 Z';
const JARRA_PICO = 'M60 20 L65.2 17.3';
const JARRA_ASA = 'M88.4 -4.7 Q97 -17 105.6 -5.8 Q108.5 2 103.1 5.7';
const POPOTE = 'M66 92 L80 30 L92 30';
const MARCA = ESTUDIO.nombreCafeteria || 'Coffee Lab';

export default function CafeSplash({ rapido = false, onDone }) {
  const reducir = useReducedMotion();
  const k = reducir ? 0 : (rapido ? 0.45 : 1);              // factor de tiempo
  const total = reducir ? 700 : Math.round(2900 * k + 150); // ms antes de levantar el telón
  const t = (s) => s * k;
  const tinta = 'currentColor';
  const cafe = '#C98A55';

  // El temporizador arranca UNA vez: onDone llega como función nueva en cada render
  // de la página (carga de menú, portadas, tiempo real) y antes reiniciaba la cuenta,
  // así que la pantalla de entrada se quedaba pegada.
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);
  useEffect(() => {
    const id = setTimeout(() => onDoneRef.current?.(), total);
    return () => clearTimeout(id);
  }, [total]);

  const linea = { fill: 'none', stroke: tinta, strokeWidth: 2.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const muelle = { type: 'spring', stiffness: 260, damping: 18, delay: t(2.15) };

  return (
    <motion.div
      role="status" aria-label={`Abriendo ${ESTUDIO.nombreCafeteria}`}
      onClick={onDone}
      initial={{ y: 0 }}
      exit={reducir ? { opacity: 0 } : { y: '-100%', borderBottomLeftRadius: '40px', borderBottomRightRadius: '40px' }}
      transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
      style={{
        position: 'fixed', inset: 0, zIndex: 6000, cursor: 'pointer', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(120% 80% at 50% 38%, var(--c-cream) 0%, var(--c-bg) 72%)',
        color: 'var(--c-ink)', userSelect: 'none', WebkitUserSelect: 'none',
        boxShadow: '0 30px 60px rgba(0,0,0,0.18)',
      }}>
      <svg viewBox="-10 -24 140 170" width="150" height="182" aria-hidden="true" style={{ overflow: 'visible' }}>
        <defs>
          <clipPath id="cs-vaso"><path d={`${VASO} Z`} /></clipPath>
          <linearGradient id="cs-cafe" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#EED3B0" />
            <stop offset="40%" stopColor="#C98A55" />
            <stop offset="100%" stopColor="#7E4A2C" />
          </linearGradient>
        </defs>

        {/* 1 · Vaso que se dibuja */}
        <motion.path d={VASO} {...linea}
          initial={{ pathLength: reducir ? 1 : 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: t(0.5), ease: 'easeInOut' }} />

        {/* 3 · Líquido que sube con onda + hielos */}
        <g clipPath="url(#cs-vaso)">
          <motion.rect x="20" width="80" height="90" fill="url(#cs-cafe)"
            initial={{ y: reducir ? 76 : 140 }} animate={{ y: 76 }}
            transition={{ delay: t(0.8), duration: t(1.1), ease: [0.33, 1, 0.68, 1] }} />
          {!reducir && (
            <motion.path d="M0 0 Q12 -4 24 0 T48 0 T72 0 T96 0 T120 0 V7 H0 Z" fill="#EED3B0"
              initial={{ y: 140, x: 0 }} animate={{ y: 76, x: [0, -24] }}
              transition={{ y: { delay: t(0.8), duration: t(1.1), ease: [0.33, 1, 0.68, 1] }, x: { duration: 1.2, repeat: Infinity, ease: 'linear' } }} />
          )}
          {!reducir && [{ x: 45, d: 1.25, r: 18 }, { x: 62, d: 1.5, r: -14 }].map((h, i) => (
            <motion.rect key={i} x={h.x} y="0" width="12" height="12" rx="3"
              fill="rgba(255,255,255,0.5)" stroke="rgba(255,255,255,0.95)" strokeWidth="1.2"
              initial={{ y: 30, opacity: 0, rotate: 0 }}
              animate={{ y: [30, 92, 84, 88], opacity: [0, 1, 1, 1], rotate: [0, h.r, h.r * 1.4, h.r * 1.2] }}
              transition={{ delay: t(h.d), duration: t(0.9), times: [0, 0.5, 0.75, 1], ease: 'easeOut' }}
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
          ))}
        </g>

        {/* 2 y 4 · Chorro: se ve líquido (un brillo corre por dentro) y se corta de arriba hacia abajo */}
        {!reducir && (
          <>
            <motion.path d="M60 21 L60 128" fill="none" stroke={cafe} strokeWidth="4.2" strokeLinecap="round"
              initial={{ pathLength: 0, pathOffset: 0, opacity: 1 }}
              animate={{ pathLength: [0, 1, 1, 0], pathOffset: [0, 0, 0, 1], opacity: [1, 1, 1, 0] }}
              transition={{ delay: t(0.62), duration: t(1.45), times: [0, 0.14, 0.82, 1], ease: 'easeInOut' }} />
            <motion.path d="M60 21 L60 128" fill="none" stroke="#F3DCC0" strokeWidth="1.3" strokeLinecap="round" strokeDasharray="5 9"
              initial={{ opacity: 0, strokeDashoffset: 0 }}
              animate={{ opacity: [0, 0.9, 0.9, 0], strokeDashoffset: -60 }}
              transition={{ opacity: { delay: t(0.7), duration: t(1.3), times: [0, 0.1, 0.85, 1] }, strokeDashoffset: { duration: 0.6, repeat: Infinity, ease: 'linear' } }} />
          </>
        )}

        {/* 2 y 4 · Jarra: entra desde arriba a la derecha, vierte y se va */}
        {!reducir && (
          <motion.g
            initial={{ x: 34, y: -34, opacity: 0 }}
            animate={{ x: [34, 0, 0, 30], y: [-34, 0, 0, -30], opacity: [0, 1, 1, 0] }}
            transition={{ delay: t(0.18), duration: t(2.1), times: [0, 0.2, 0.8, 1], ease: 'easeInOut' }}>
            <path d={JARRA_CUERPO} {...linea} fill="var(--c-bg)" />
            <path d={JARRA_PICO} {...linea} />
            <path d={JARRA_ASA} {...linea} />
          </motion.g>
        )}

        {/* 5 · Popote: entra deslizándose por su propio eje (no aparece de golpe) */}
        <motion.path d={POPOTE} {...linea}
          initial={reducir ? { opacity: 1 } : { x: 9, y: -40, opacity: 0 }}
          animate={{ x: 0, y: 0, opacity: 1 }}
          transition={{ x: muelle, y: muelle, opacity: { duration: 0.15, delay: t(2.15) } }} />

        {/* Borde del vaso dibujado AL FINAL, encima del popote y del chorro */}
        <motion.path d="M28 62 L92 62" {...linea}
          initial={{ pathLength: reducir ? 1 : 0 }} animate={{ pathLength: 1 }}
          transition={{ delay: t(0.2), duration: t(0.3) }} />
      </svg>

      {/* 6 · Marca letra por letra */}
      <div aria-hidden="true" style={{ marginTop: '22px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', fontFamily: 'var(--c-font)', fontWeight: 800, fontSize: '2.5rem', letterSpacing: '-0.035em', lineHeight: 1 }}>
          {MARCA.split('').map((ch, i) => (
            <motion.span key={i}
              initial={reducir ? { opacity: 1 } : { opacity: 0, y: 18, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ delay: t(1.35) + i * 0.045 * Math.max(k, 0.5), duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: 'inline-block', whiteSpace: 'pre' }}>{ch}</motion.span>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, letterSpacing: '0.6em' }} animate={{ opacity: 1, letterSpacing: '0.32em' }}
          transition={{ delay: t(1.9), duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--c-muted)', marginTop: '10px' }}>
          &amp; smoothies
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: t(2.1), duration: 0.5 }}
        style={{ position: 'absolute', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 34px)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.74rem', fontWeight: 600, color: 'var(--c-muted)', letterSpacing: '0.04em' }}>
        <img src="/favicon_peach.png" alt="" width="16" height="16" style={{ opacity: 0.85 }} />
        dentro de {ESTUDIO.nombre}
      </motion.div>
    </motion.div>
  );
}
