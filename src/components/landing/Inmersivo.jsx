// Piezas "inmersivas" del sitio (solo web; la app nativa no muestra el landing).
// Regla de todas: si la persona tiene "reducir movimiento" activado, se ve la
// versión quieta; en celular, menos efectos y nada que secuestre el scroll.
import React, { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useMotionValue, useReducedMotion, animate, useInView, useScroll, useTransform } from 'framer-motion';
const EASE = [0.16, 1, 0.3, 1];

/** true si es pantalla de computadora con mouse (hover real). */
export function useEsEscritorio() {
  const q = '(min-width: 900px) and (pointer: fine)';
  const [ok, setOk] = useState(() => typeof window !== 'undefined' && window.matchMedia?.(q).matches);
  useEffect(() => {
    const m = window.matchMedia?.(q);
    if (!m) return undefined;
    const fn = () => setOk(m.matches);
    m.addEventListener?.('change', fn);
    return () => m.removeEventListener?.('change', fn);
  }, []);
  return ok;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Brillo naranja muy suave que sigue al cursor (solo computadora).
 * ───────────────────────────────────────────────────────────────────────── */
export function CursorGlow() {
  const reduce = useReducedMotion();
  const escritorio = useEsEscritorio();
  const x = useMotionValue(-600);
  const y = useMotionValue(-600);
  const sx = useSpring(x, { stiffness: 90, damping: 22, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 90, damping: 22, mass: 0.6 });
  useEffect(() => {
    if (reduce || !escritorio) return undefined;
    const fn = (e) => { x.set(e.clientX - 260); y.set(e.clientY - 260); };
    window.addEventListener('pointermove', fn, { passive: true });
    return () => window.removeEventListener('pointermove', fn);
  }, [reduce, escritorio, x, y]);
  if (reduce || !escritorio) return null;
  return (
    <motion.div aria-hidden="true" style={{
      position: 'fixed', top: 0, left: 0, width: 520, height: 520, borderRadius: '50%', x: sx, y: sy,
      background: 'radial-gradient(circle, rgba(255,145,77,0.16) 0%, rgba(255,145,77,0.06) 35%, transparent 65%)',
      pointerEvents: 'none', zIndex: 1, mixBlendMode: 'multiply',
    }} />
  );
}

/** Número que cuenta desde 0 cuando aparece. Antes de verse muestra el número
 *  real (así nunca queda en "0+" si la animación no corre). */
export function Contador({ to, suffix = '', prefix = '' }) {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const visto = useInView(ref, { once: true });
  const [n, setN] = useState(to);
  useEffect(() => {
    if (!visto || reduce) return undefined;
    const c = animate(0, to, { duration: 1.8, ease: EASE, onUpdate: (v) => setN(Math.round(v)) });
    return () => c.stop();
  }, [visto, reduce, to]);
  return <span ref={ref}>{prefix}{n.toLocaleString('es-MX')}{suffix}</span>;
}

/* ─────────────────────────────────────────────────────────────────────────
 * ESCENAS: cada sección puede entrar y salir distinto, para que el recorrido no
 * sea una tira ni repita siempre el mismo efecto (eso satura).
 *
 *  entrada:
 *   · 'normal'   — sin efecto (la mayoría: dejan respirar).
 *   · 'hoja'     — sube ENCIMA de la anterior con esquinas redondeadas y sombra.
 *   · 'expandir' — arranca como tarjeta (márgenes y esquinas) y se abre a todo el ancho.
 *  salida:
 *   · 'apilar'   — al taparla, se queda quieta una pantalla, se encoge y se oscurece
 *                  (va con una 'hoja' en la siguiente sección).
 * (Se probó una cinta de palabras con borde en curva: descartada por Zahir.)
 * ───────────────────────────────────────────────────────────────────────── */
export function Escena({ children, fondo = 'transparent', z = 1, entrada = 'normal', salida = 'normal' }) {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const [m, setM] = useState({ vh: typeof window !== 'undefined' ? window.innerHeight : 800, origen: '50% 50%' });
  useEffect(() => {
    const el = ref.current;
    if (!el || salida !== 'apilar') return undefined;
    const medir = () => {
      const h = el.offsetHeight;
      const vh = window.innerHeight;
      // top: para el modo celular (sticky), se pega cuando su borde de abajo llega abajo.
      setM({ vh, top: Math.min(0, vh - h), origen: `50% ${Math.max(vh / 2, h - vh / 2)}px` }); // encoge alrededor de lo que se ve
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    window.addEventListener('resize', medir);
    return () => { ro.disconnect(); window.removeEventListener('resize', medir); };
  }, [salida]);

  // Salida: 0 = su borde de abajo toca el fondo de la pantalla · 1 = avanzó una pantalla (ya tapada).
  // Se contrarresta el scroll (translateY) para que se quede quieta mientras la cubren;
  // con position:sticky se quedaban TODAS pegadas hasta el final de la página.
  const { scrollYProgress: pSalida } = useScroll({ target: ref, offset: ['end end', 'end start'] });
  // Entrada: 0 = su borde de arriba asoma por abajo · 1 = su borde de arriba llega arriba.
  const { scrollYProgress: pEntrada } = useScroll({ target: ref, offset: ['start end', 'start start'] });

  // En pantallas táctiles NO se apila: el ajuste por JS va detrás del scroll nativo del
  // celular y la sección "tiembla". Ahí solo queda la hoja con esquinas de la siguiente.
  const [tactil] = useState(() => typeof window !== 'undefined' && (window.matchMedia?.('(hover: none), (pointer: coarse)').matches || window.innerWidth <= 768));
  const apilar = !reduce && !tactil && salida === 'apilar';
  const y = useTransform(pSalida, [0, 1], [0, apilar ? m.vh : 0]);
  const escala = useTransform(pSalida, [0, 1], [1, apilar ? 0.9 : 1]);
  const sombra = useTransform(pSalida, [0, 1], [0, apilar ? 0.5 : 0]);
  // 'expandir': de tarjeta (6% de margen a los lados, esquinas de 44px) a todo el ancho.
  const recorte = useTransform(pEntrada, [0, 0.85], [0, 1], { clamp: true });
  const clipPath = useTransform(recorte, (v) => `inset(0 ${(1 - v) * 6}% 0 ${(1 - v) * 6}% round ${(1 - v) * 44}px)`);

  const estilo = { position: 'relative', zIndex: z, background: fondo };
  if (apilar) Object.assign(estilo, { y, scale: escala, transformOrigin: m.origen });
  // Celular: la versión NATIVA (position: sticky): la sección se queda quieta y la
  // siguiente sube encima sin JavaScript de por medio → no tiembla. Las secciones que
  // siguen son opacas y de z-index mayor, así que la tapan aunque se quede pegada.
  else if (!reduce && tactil && salida === 'apilar') Object.assign(estilo, { position: 'sticky', top: m.top ?? 0 });
  // En táctil no: con la portada pegada atrás, los costados del recorte dejaban ver
  // franjas oscuras en las orillas al hacer scroll.
  if (!reduce && !tactil && entrada === 'expandir') estilo.clipPath = clipPath;

  return (
    <motion.div ref={ref} data-escena="" className={`escena${entrada === 'hoja' ? ' escena-hoja' : ''}`} style={estilo}>
      {children}
      {apilar && <motion.div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: '#0D0B0A', opacity: sombra, pointerEvents: 'none', borderRadius: 'inherit', zIndex: 50 }} />}
    </motion.div>
  );
}

/** Salta a una sección (su Escena puede estar desplazada si ya la taparon:
 *  se calcula con su posición SIN el desplazamiento; offsetTop ignora transforms). */
export function irASeccion(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const escena = el.closest('[data-escena]');
  let top = el.getBoundingClientRect().top + window.scrollY;
  if (escena) {
    const r = escena.getBoundingClientRect();
    top = escena.offsetTop + (el.getBoundingClientRect().top - r.top) / (r.height / escena.offsetHeight || 1);
  }
  window.scrollTo({ top, behavior: 'smooth' });
}

/* Frase que se "enciende" palabra por palabra conforme bajas (ref. Dhun Wellness).
 * `acento`: palabras (en minúsculas, sin puntuación) que salen en itálica naranja. */
export function FraseEncendida({ texto, acento = [], style }) {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.45'] });
  const palabras = texto.split(' ');
  const [n, setN] = useState(reduce ? palabras.length : 0);
  useEffect(() => {
    if (reduce) return undefined;
    return scrollYProgress.on('change', (v) => setN(Math.round(v * palabras.length)));
  }, [scrollYProgress, palabras.length, reduce]);
  const limpia = (w) => w.toLowerCase().replace(/[.,;:¡!¿?]/g, '');
  return (
    <p ref={ref} style={style}>
      {palabras.map((w, i) => {
        const on = i < n;
        const esAcento = acento.includes(limpia(w));
        return (
          <React.Fragment key={i}>
            <span style={{
              color: on ? (esAcento ? 'var(--primary)' : 'var(--black)') : 'rgba(26,23,20,0.16)',
              transition: 'color .35s ease',
              ...(esAcento ? { fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontWeight: 500 } : null),
            }}>{w}</span>{i < palabras.length - 1 ? ' ' : ''}
          </React.Fragment>
        );
      })}
    </p>
  );
}
