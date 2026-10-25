// Animación de entrada de temporada (Halloween / Día de Muertos).
// NO es una pantalla aparte: ocupa el lugar del splash de /welcome (la pantalla
// del logo que ya sale al abrir la app nativa), con su misma duración, así que
// abrir la app no tarda más. Sale una vez al día; los demás días, el splash de
// siempre. En web no sale; para revisarla: /welcome?temporada=halloween&intro=1
import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { mexicoTodayStr } from '../lib/dates';
import { ESTUDIO } from '../config/estudio';
import { PapelPicado } from './Temporada';

/* ── Halloween ──────────────────────────────────────────────────────────── */

function TelaranaTejida({ quieto }) {
  // Desde la esquina de arriba a la derecha: radios y luego la espiral.
  const radios = [0, 15, 30, 45, 60, 75, 90];
  const anillos = [14, 26, 39, 53, 68, 84, 100];
  const p = (r, g) => [100 - r * Math.cos((g * Math.PI) / 180), r * Math.sin((g * Math.PI) / 180)];
  const dibujo = (delay, dur) => quieto ? {} : {
    initial: { pathLength: 0, opacity: 0 },
    animate: { pathLength: 1, opacity: 1 },
    transition: { delay, duration: dur, ease: [0.55, 0, 0.25, 1] },
  };
  return (
    <svg viewBox="0 0 100 100" style={{ position: 'absolute', top: 0, right: 0, width: 'min(58vw, 290px)', height: 'auto' }} aria-hidden="true">
      <g fill="none" stroke="rgba(255, 236, 220, 0.42)" strokeLinecap="round">
        {radios.map((g, i) => {
          const [x, y] = p(118, g);
          return <motion.line key={g} x1="100" y1="0" x2={x} y2={y} strokeWidth="0.3" {...dibujo(0.45 + i * 0.05, 0.55)} />;
        })}
        {anillos.map((r, k) => {
          let d = '';
          radios.forEach((g, i) => {
            const [x, y] = p(r, g);
            if (i === 0) d = `M${x},${y}`;
            else { const [cx, cy] = p(r * 0.9, (g + radios[i - 1]) / 2); d += ` Q${cx},${cy} ${x},${y}`; }
          });
          return <motion.path key={r} d={d} strokeWidth="0.26" {...dibujo(0.75 + k * 0.08, 0.45)} />;
        })}
      </g>
    </svg>
  );
}

function Arana({ quieto }) {
  const pata = (lado, i) => {
    const y = 5 + i * 2.1, s = lado;
    return <path key={`${lado}${i}`} d={`M${10 + s * 2},${y} q${s * 4},${-3 + i * 0.6} ${s * 7},${1 + i * 1.6}`} stroke="#FFD4BA" strokeWidth="0.9" fill="none" strokeLinecap="round" />;
  };
  return (
    <motion.div
      style={{ position: 'absolute', top: 0, right: 'min(21vw, 104px)', transformOrigin: 'top center' }}
      initial={quieto ? false : { y: -40 }}
      animate={quieto ? undefined : { y: 0, rotate: [0, 0, 5, -4, 3, 0] }}
      transition={{ y: { delay: 1.15, duration: 0.9, ease: [0.3, 1.4, 0.5, 1] }, rotate: { delay: 2.05, duration: 1.6, ease: 'easeInOut' } }}
    >
      <motion.div
        style={{ width: '1px', margin: '0 auto', background: 'linear-gradient(rgba(255,228,208,0.15), rgba(255,228,208,0.65))' }}
        initial={quieto ? false : { height: 0 }}
        animate={{ height: 'min(30vh, 230px)' }}
        transition={{ delay: 1.1, duration: 0.95, ease: [0.3, 1.2, 0.5, 1] }}
      />
      <svg viewBox="0 0 20 20" width="30" height="30" style={{ display: 'block', margin: '-2px auto 0', filter: 'drop-shadow(0 0 6px rgba(255,170,110,0.35))' }} aria-hidden="true">
        {[0, 1, 2, 3].map(i => pata(1, i))}
        {[0, 1, 2, 3].map(i => pata(-1, i))}
        <ellipse cx="10" cy="5.2" rx="2.4" ry="2.2" fill="#FFD4BA" />
        <ellipse cx="10" cy="11" rx="3.6" ry="4.4" fill="#FFB98C" />
        <path d="M8.6 9.6 10 12l1.4-2.4" stroke="#C8673A" strokeWidth="0.6" fill="none" />
      </svg>
    </motion.div>
  );
}

/** Bancos de niebla que se arrastran despacio por abajo. */
function Niebla({ quieto }) {
  const bancos = [
    { left: '-30%', bottom: '-6%', w: '120%', h: '34vh', o: 0.5, dx: 40, dur: 9 },
    { left: '10%', bottom: '-10%', w: '120%', h: '30vh', o: 0.38, dx: -50, dur: 11 },
  ];
  return bancos.map((b, i) => (
    <motion.div
      key={i}
      aria-hidden="true"
      initial={{ opacity: 0, x: 0 }}
      animate={quieto ? { opacity: b.o } : { opacity: b.o, x: b.dx }}
      transition={{ opacity: { delay: 0.3, duration: 1.4 }, x: { duration: b.dur, ease: 'linear' } }}
      style={{
        position: 'absolute', left: b.left, bottom: b.bottom, width: b.w, height: b.h,
        background: 'radial-gradient(ellipse 50% 50% at 50% 60%, rgba(255,236,222,0.55), transparent 70%)',
        filter: 'blur(28px)', pointerEvents: 'none',
      }}
    />
  ));
}

/** Brasitas que suben lento, como chispas de una vela. */
function Brasas() {
  const brasas = useMemo(() => Array.from({ length: 16 }, (_, i) => ({
    left: 6 + ((i * 61) % 88), size: 2 + (i % 3), delay: 0.6 + (i % 8) * 0.24,
    dur: 2.6 + (i % 4) * 0.5, dx: (i % 2 ? 1 : -1) * (8 + (i % 5) * 4),
  })), []);
  return brasas.map((b, i) => (
    <motion.span
      key={i}
      aria-hidden="true"
      initial={{ y: 0, opacity: 0 }}
      animate={{ y: '-62vh', x: b.dx, opacity: [0, 1, 0.9, 0] }}
      transition={{ delay: b.delay, duration: b.dur, ease: 'easeOut' }}
      style={{
        position: 'absolute', bottom: '6vh', left: `${b.left}%`, width: b.size, height: b.size, borderRadius: '50%',
        background: '#FFB070', boxShadow: '0 0 8px 2px rgba(255,140,60,0.75)',
      }}
    />
  ));
}

/* ── Día de Muertos ─────────────────────────────────────────────────────── */

function FlorQueSeAbre({ quieto }) {
  const capas = [
    { n: 14, r: 60, rx: 13, ry: 34, color: '#FF8C00', delay: 0.55 },
    { n: 12, r: 44, rx: 12, ry: 28, color: '#FFA500', delay: 0.7 },
    { n: 10, r: 30, rx: 10, ry: 20, color: '#FFB800', delay: 0.85 },
  ];
  return (
    <svg viewBox="-100 -100 200 200" style={{ position: 'absolute', left: '50%', top: '50%', width: 'min(58vw, 236px)', height: 'auto', transform: 'translate(-50%, -50%)', overflow: 'visible' }} aria-hidden="true">
      {capas.map((c, k) => Array.from({ length: c.n }, (_, i) => {
        const g = (360 / c.n) * i + k * 9;
        return (
          <g key={`${k}-${i}`} transform={`rotate(${g})`}>
            <motion.ellipse
              cx="0" cy={-c.r} rx={c.rx} ry={c.ry} fill={c.color}
              // Cada pétalo ya está en su ángulo; solo crece desde su base, como si se abriera.
              style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}
              initial={quieto ? false : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.92 }}
              transition={{ delay: c.delay + i * 0.018, duration: 0.7, ease: [0.2, 1.2, 0.4, 1] }}
            />
          </g>
        );
      }))}
    </svg>
  );
}

function PetalosCayendo() {
  const petalos = useMemo(() => Array.from({ length: 14 }, (_, i) => ({
    left: (i * 53) % 100, delay: 0.9 + (i % 7) * 0.22, dur: 2.4 + (i % 4) * 0.4, size: 8 + (i % 3) * 4,
    color: ['#FFB000', '#FF8C00', '#F59E0B'][i % 3], giro: (i % 2 ? 1 : -1) * (180 + i * 20),
  })), []);
  return petalos.map((p, i) => (
    <motion.svg
      key={i} viewBox="0 0 10 14" width={p.size} height={p.size * 1.4} aria-hidden="true"
      style={{ position: 'absolute', top: -20, left: `${p.left}%` }}
      initial={{ y: 0, opacity: 0, rotate: 0 }}
      animate={{ y: '105vh', opacity: [0, 1, 1, 0], rotate: p.giro, x: [0, 14, -10, 6] }}
      transition={{ delay: p.delay, duration: p.dur, ease: 'linear' }}
    >
      <path d="M5 0C8 3 9.5 7 7.5 11 6.6 12.8 3.4 12.8 2.5 11 .5 7 2 3 5 0Z" fill={p.color} />
    </motion.svg>
  ));
}

/* ── La escena (llena a su contenedor) ──────────────────────────────────── */
export default function IntroTemporada({ temporada }) {
  const quieto = useReducedMotion();
  const halloween = temporada === 'halloween';
  const esHoy31 = mexicoTodayStr().endsWith('-10-31');
  const aparece = (delay, y = 10) => quieto ? {} : {
    initial: { opacity: 0, y }, animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  };

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: halloween
      ? 'radial-gradient(ellipse 90% 70% at 50% 46%, #3E2314 0%, #1F120B 58%, #0F0906 100%)'
      : 'radial-gradient(ellipse 90% 70% at 50% 46%, #3D1F33 0%, #1E1019 58%, #0F080D 100%)' }}>
      {halloween ? (
        <>
          {/* Cae la noche: arranca claro como el splash de siempre y se oscurece */}
          <motion.div aria-hidden="true" initial={quieto ? false : { opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
            style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.75)' }} />
          <Niebla quieto={quieto} />
          {!quieto && <Brasas />}
          <TelaranaTejida quieto={quieto} />
          <Arana quieto={quieto} />
        </>
      ) : (
        <>
          <motion.div initial={quieto ? false : { y: -60 }} animate={{ y: 0 }} transition={{ delay: 0.1, type: 'spring', stiffness: 120, damping: 11 }}
            style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 18px)', left: 0, right: 0, height: '22px' }}>
            <PapelPicado />
          </motion.div>
          <motion.div initial={quieto ? false : { y: -60 }} animate={{ y: 0 }} transition={{ delay: 0.25, type: 'spring', stiffness: 110, damping: 10 }}
            style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 52px)', left: '-8%', right: '-8%', height: '22px', opacity: 0.8 }}>
            <PapelPicado />
          </motion.div>
          {!quieto && <PetalosCayendo />}
        </>
      )}

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ position: 'relative', width: '150px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: halloween ? '26px' : '58px' }}>
          {halloween ? (
            // Un halo cálido que respira detrás del durazno, como vela
            <motion.div
              initial={quieto ? false : { scale: 0.5, opacity: 0 }}
              animate={quieto ? { opacity: 1 } : { scale: [0.5, 1.08, 1], opacity: [0, 1, 0.85] }}
              transition={{ delay: 0.9, duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
              style={{ position: 'absolute', width: '240px', height: '240px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,145,77,0.42) 0%, rgba(255,145,77,0.12) 45%, transparent 70%)' }}
            />
          ) : (
            <FlorQueSeAbre quieto={quieto} />
          )}
          <motion.div
            initial={quieto ? false : { scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.15, duration: 0.8, ease: [0.2, 1.3, 0.4, 1] }}
            style={halloween ? {
              // Disco de vidrio cálido: brilla como farol sobre la noche.
              position: 'relative', width: '112px', height: '112px', borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 30%, rgba(255,248,240,0.95), rgba(255,236,222,0.82))',
              border: '1px solid rgba(255,255,255,0.55)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9), 0 0 0 8px rgba(255,212,186,0.08), 0 0 40px rgba(255,145,77,0.35), 0 20px 50px rgba(0,0,0,0.55)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            } : {
              position: 'relative', width: '108px', height: '108px', borderRadius: '50%', background: '#FFF8F2',
              display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 34px rgba(0,0,0,0.45)',
            }}
          >
            <img src={ESTUDIO.marca.icono} alt="" style={{ width: '78px', height: '78px', objectFit: 'contain' }} />
          </motion.div>
        </div>

        <motion.div {...aparece(halloween ? 1.6 : 1.55)}
          style={{ color: '#FFF3EA', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.42em', paddingLeft: '0.42em', textShadow: '0 2px 14px rgba(0,0,0,0.6)' }}>
          {ESTUDIO.nombreMayusculas}
        </motion.div>
        <motion.div {...aparece(halloween ? 1.85 : 1.8, 6)}
          style={{ marginTop: '10px', fontFamily: "'Caveat', cursive", fontSize: '2.3rem', lineHeight: 1, color: halloween ? '#FFB98C' : '#FFB800', textShadow: halloween ? '0 0 18px rgba(255,140,60,0.55)' : 'none' }}>
          {halloween ? (esHoy31 ? '¡Feliz Halloween!' : 'Feliz Halloween') : 'Día de Muertos'}
        </motion.div>
      </div>
    </div>
  );
}
