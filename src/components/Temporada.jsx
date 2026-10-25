// Adornos de temporada de la app de la clienta (ver src/lib/temporada.js).
// Todo es adorno: pointer-events none, sin datos, y si la clienta pidió menos
// movimiento en su teléfono se queda quieto (reglas `tm-*` en index.css).
import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';

const NARANJA = '#FF914D';
const CALABAZA = '#F07A2E';
const CEMPASUCHIL = ['#FFB000', '#FF8C00', '#F59E0B'];

/* ── Piezas ───────────────────────────────────────────────────────────── */

export function Calabaza({ size = 16, style }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={style} aria-hidden="true">
      <path d="M12.6 3.2c.9-.6 2-.7 2.9-.3-.9.3-1.6 1-1.9 1.9l-1.3 2.4h-1.6l.8-2.6c.2-.6.6-1.1 1.1-1.4Z" fill="#6B7F3A" />
      <ellipse cx="7.6" cy="14" rx="5.4" ry="6.6" fill={CALABAZA} />
      <ellipse cx="16.4" cy="14" rx="5.4" ry="6.6" fill={CALABAZA} />
      <ellipse cx="12" cy="14" rx="4.6" ry="7.2" fill={NARANJA} />
      <path d="M12 7.2c-.8 2-1 4.4-1 6.8s.2 4.8 1 6.8M12 7.2c.8 2 1 4.4 1 6.8s-.2 4.8-1 6.8" stroke="rgba(150,60,10,0.35)" strokeWidth="0.7" fill="none" />
    </svg>
  );
}

export function Cempasuchil({ size = 16, style }) {
  const petalos = Array.from({ length: 10 }, (_, i) => i * 36);
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={style} aria-hidden="true">
      {petalos.map((g, i) => (
        <ellipse key={g} cx="12" cy="5.2" rx="3" ry="4.4" fill={CEMPASUCHIL[i % 2]} transform={`rotate(${g} 12 12)`} />
      ))}
      {petalos.map((g) => (
        <ellipse key={`i${g}`} cx="12" cy="8" rx="2.2" ry="3" fill="#FFC53D" transform={`rotate(${g + 18} 12 12)`} />
      ))}
      <circle cx="12" cy="12" r="2.4" fill="#E07B00" />
    </svg>
  );
}

function Petalo({ color, size = 9 }) {
  return (
    <svg viewBox="0 0 10 14" width={size} height={size * 1.4} aria-hidden="true">
      <path d="M5 0C8 3 9.5 7 7.5 11 6.6 12.8 3.4 12.8 2.5 11 .5 7 2 3 5 0Z" fill={color} />
    </svg>
  );
}

function Dulce({ color = '#E07A9C', size = 18 }) {
  return (
    <svg viewBox="0 0 30 14" width={size} height={size * 0.47} aria-hidden="true">
      <path d="M8 7 1 2.5v9L8 7Zm14 0 7-4.5v9L22 7Z" fill={color} opacity="0.85" />
      <ellipse cx="15" cy="7" rx="7.5" ry="5.6" fill={color} />
      <path d="M11 3.4c1.6 2.2 1.6 5 0 7.2M15 2c1.6 2.6 1.6 7.4 0 10M19 3.4c-1.6 2.2-1.6 5 0 7.2" stroke="rgba(255,255,255,0.55)" strokeWidth="0.9" fill="none" />
    </svg>
  );
}

/** Telaraña fina para una esquina (arriba-derecha). */
export function Telarana({ size = 92, color = 'rgba(255,255,255,0.55)', style }) {
  const radios = [0, 22, 45, 68, 90];
  const anillos = [26, 48, 70, 90];
  const p = (r, g) => [100 - r * Math.cos((g * Math.PI) / 180), r * Math.sin((g * Math.PI) / 180)];
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={style} aria-hidden="true">
      <g stroke={color} strokeWidth="0.9" fill="none" strokeLinecap="round">
        {radios.map(g => { const [x, y] = p(100, g); return <line key={g} x1="100" y1="0" x2={x} y2={y} />; })}
        {anillos.map(r => {
          let d = '';
          radios.forEach((g, i) => {
            const [x, y] = p(r, g);
            if (i === 0) d = `M${x},${y}`;
            else { const [cx, cy] = p(r * 0.86, (g + radios[i - 1]) / 2); d += ` Q${cx},${cy} ${x},${y}`; }
          });
          return <path key={r} d={d} />;
        })}
      </g>
      <line x1="62" y1="0" x2="62" y2="40" stroke={color} strokeWidth="0.6" />
      <circle cx="62" cy="42" r="2.6" fill={color} />
    </svg>
  );
}

/** Tira de papel picado colgando de un hilo (para el borde de arriba de una tarjeta).
 *  Las perforaciones son huecos reales (fill-rule evenodd): se ve la foto a través. */
export function PapelPicado({ style }) {
  // viewBox de 210×10 dibujado a ~470×22 px: escala casi igual en X y Y, sin deformar.
  const colores = ['#E4007C', '#FF8C00', '#7B2D8E', '#FFB000', '#00A86B', '#E4007C', '#FF8C00', '#7B2D8E', '#FFB000'];
  const paso = 210 / colores.length;
  return (
    <svg viewBox="0 0 210 10" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '22px', ...style }} aria-hidden="true">
      <path d="M0 0.6 Q105 2.2 210 0.6" stroke="rgba(255,255,255,0.75)" strokeWidth="0.3" fill="none" />
      {colores.map((c, i) => {
        const w = paso - 3, x = i * paso + 1.5, cx = x + w / 2;
        const y = 0.8 + Math.sin(((i + 0.5) / colores.length) * Math.PI) * 0.9;
        const bandera = `M${x},${y} h${w} v6.4 l${-w / 6},1.2 l${-w / 6},-1.2 l${-w / 6},1.2 l${-w / 6},-1.2 l${-w / 6},1.2 l${-w / 6},-1.2 Z`;
        const rombo = (rx, ry, t) => `M${rx},${ry - t} l${t},${t} l${-t},${t} l${-t},${-t} Z`;
        const punto = (px, py) => `M${px - 0.45},${py} a0.45,0.45 0 1,0 0.9,0 a0.45,0.45 0 1,0 -0.9,0 Z`;
        const huecos = [rombo(cx, y + 3.4, 1.5), rombo(cx - 5.4, y + 3.4, 0.9), rombo(cx + 5.4, y + 3.4, 0.9),
          punto(cx - 2.8, y + 1.3), punto(cx + 2.8, y + 1.3), punto(cx - 2.8, y + 5.6), punto(cx + 2.8, y + 5.6)].join(' ');
        return <path key={i} d={`${bandera} ${huecos}`} fillRule="evenodd" fill={c} opacity="0.9" />;
      })}
    </svg>
  );
}

/* ── Capas ────────────────────────────────────────────────────────────── */

/**
 * Capa de adorno para una tarjeta con foto (la membresía) o una tarjeta de
 * clase: telaraña en la esquina (Halloween) o papel picado y pétalos que caen (Muertos).
 * El contenedor debe ser position:relative + overflow:hidden.
 */
export function DecorTemporada({ temporada, cuantos = 3, oscuro = true }) {
  const items = useMemo(() => Array.from({ length: cuantos }, (_, i) => ({
    top: 12 + ((i * 37) % 60),
    delay: -(i * 3.1),
    dur: 9 + (i % 3) * 2.2,
    size: 30 + (i % 3) * 9,
    left: 8 + ((i * 29) % 84),
  })), [cuantos]);
  if (!temporada) return null;

  return (
    <div className="tm-capa" aria-hidden="true">
      {temporada === 'halloween' && (
        <Telarana
          size={oscuro ? 84 : 64}
          color={oscuro ? 'rgba(255,255,255,0.55)' : 'rgba(60,40,45,0.28)'}
          style={{ position: 'absolute', top: 0, right: 0, opacity: oscuro ? 0.7 : 1 }}
        />
      )}
      {temporada === 'muertos' && oscuro && <PapelPicado />}
      {temporada === 'muertos' && items.concat(items.map(it => ({ ...it, left: (it.left + 41) % 92, delay: it.delay - 4 }))).map((it, i) => (
        <span key={i} className="tm-petalo" style={{ left: `${it.left}%`, animationDuration: `${it.dur - 1}s`, animationDelay: `${it.delay}s` }}>
          <Petalo color={CEMPASUCHIL[i % 3]} size={9 + (i % 3) * 3} />
        </span>
      ))}
    </div>
  );
}

/** Icono chiquito para el saludo y el calendario. */
export function IconoTemporada({ temporada, size = 16, style }) {
  if (temporada === 'halloween') return <Calabaza size={size} style={style} />;
  if (temporada === 'muertos') return <Cempasuchil size={size} style={style} />;
  return null;
}

/**
 * Ráfaga al confirmar una reserva: dulces y calabacitas (Halloween) o pétalos
 * (Muertos) que salen hacia arriba desde el centro y se desvanecen. Se monta
 * una vez por reserva (cambiarle la `key` la repite).
 */
export function FiestaTemporada({ temporada }) {
  const quieto = useReducedMotion();
  const piezas = useMemo(() => Array.from({ length: 16 }, (_, i) => {
    const ang = (-160 + (i * 140) / 15) * (Math.PI / 180) + (i % 2 ? 0.08 : -0.08);
    const dist = 130 + (i % 4) * 45;
    return { x: Math.cos(ang) * dist, y: Math.sin(ang) * dist - 40, giro: (i % 2 ? 1 : -1) * (60 + i * 9), delay: (i % 5) * 0.04, tipo: i % 3 };
  }), []);
  if (!temporada || quieto) return null;

  const pieza = (p, i) => {
    if (temporada === 'muertos') return <Petalo color={CEMPASUCHIL[p.tipo]} size={12} />;
    if (p.tipo === 2) return <Calabaza size={20} />;
    return <Dulce color={['#E07A9C', '#8B5CF6', NARANJA][i % 3]} />;
  };

  // Al body: la hoja de reserva tiene transform y un `fixed` adentro quedaría
  // encerrado en ella en vez de cubrir la pantalla.
  return createPortal(
    <div aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {piezas.map((p, i) => (
        <motion.div
          key={i}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0.4, rotate: 0 }}
          animate={{ x: p.x, y: [0, p.y, p.y + 90], opacity: [0, 1, 0], scale: [0.4, 1, 0.9], rotate: p.giro }}
          transition={{ duration: 1.9, delay: p.delay, ease: [0.2, 0.8, 0.3, 1], times: [0, 0.45, 1] }}
          style={{ position: 'absolute' }}
        >
          {pieza(p, i)}
        </motion.div>
      ))}
    </div>,
    document.body
  );
}
