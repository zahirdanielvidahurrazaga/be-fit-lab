// Botón "deslizable" de la portada: cápsula con una bolita de VIDRIO LÍQUIDO que se
// arrastra de izquierda a derecha y pasa por DELANTE de las letras (se ven a través
// del vidrio). Al pasar del 70 % del recorrido, llega al final y ejecuta la acción.
// Tocar la cápsula también funciona (la bolita corre sola): nadie se queda atorada.
import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { mapaLupa } from '../../lib/lente';

const PERILLA = 42;   // diámetro de la bolita (cápsula de 52, el alto de "Descubre la App")
const MARGEN = 5;     // separación con la orilla de la cápsula
const AUMENTO = 1.16; // el mismo de la burbuja-lupa de la app

const soportaRefraccion = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /Chrome|Chromium|Edg\//.test(ua) && !/iPhone|iPad|iPod|CriOS/.test(ua);
};

export default function BotonDeslizable({ texto, onCompletar }) {
  const reduce = useReducedMotion();
  const capsulaRef = useRef(null);
  const perillaRef = useRef(null);
  const x = useMotionValue(0);
  const [max, setMax] = useState(0);
  const [ancho, setAncho] = useState(0);
  // LUPA: dentro de la bolita va una COPIA del texto, agrandada y alineada al píxel con
  // la original, que se mueve AL REVÉS que la bolita → las letras se ven quietas y más
  // grandes a través del vidrio (el desenfoque de fondo del navegador no puede agrandar).
  const xCopia = useTransform(x, (v) => -v);
  // La flecha se va en cuanto empiezas a deslizar (encima de la lupa se veía revuelta).
  const opFlecha = useTransform(x, [0, 22], [0.95, 0]);
  const [hecho, setHecho] = useState(false);
  // MISMA receta que la burbuja-lupa de la barra de la app (BarraGlass, idea de glisse):
  // mapaLupa (centro intacto, dobla suave hacia la orilla), aumento 1.16 y supermuestreo
  // a devicePixelRatio. En iPhone/Safari va la copia agrandada SIN filtro (se trababa).
  const [d] = useState(() => (soportaRefraccion() ? Math.min(3, Math.max(1, Math.round(window.devicePixelRatio || 1))) : 1));
  const [mapa] = useState(() => { try { return soportaRefraccion() ? mapaLupa(PERILLA * d, PERILLA * d) : null; } catch { return null; } });
  const arrastrando = useRef(false);

  // Recorrido = ancho de la cápsula menos la bolita y los márgenes.
  useEffect(() => {
    const el = capsulaRef.current;
    if (!el) return undefined;
    const medir = () => { setAncho(el.offsetWidth); setMax(Math.max(0, el.offsetWidth - PERILLA - MARGEN * 2)); };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Pista: un pequeño empujón cada pocos segundos mientras nadie la toca.
  useEffect(() => {
    if (reduce || hecho) return undefined;
    const t = setInterval(() => {
      if (arrastrando.current || x.get() > 2) return;
      animate(x, [0, 18, 0], { duration: 0.9, ease: [0.16, 1, 0.3, 1] });
    }, 3600);
    return () => clearInterval(t);
  }, [reduce, hecho, x]);

  const completar = () => {
    if (hecho) return;
    setHecho(true);
    animate(x, max, { type: 'spring', stiffness: 380, damping: 32 }).then(() => {
      // La transición de pantalla sale desde la bolita.
      onCompletar?.({ currentTarget: perillaRef.current });
      setTimeout(() => { setHecho(false); x.set(0); }, 1200);
    });
  };

  const soltar = () => {
    arrastrando.current = false;
    if (x.get() > max * 0.7) completar();
    else animate(x, 0, { type: 'spring', stiffness: 420, damping: 30 });
  };

  return (
    <div ref={capsulaRef} className="deslizable vidrio-naranja" role="button" tabIndex={0} aria-label={texto}
      onClick={() => { if (!arrastrando.current && x.get() < 4) completar(); }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); completar(); } }}>
      {/* Las letras van DETRÁS de la bolita (se ven a través del vidrio). */}
      <span className="deslizable-texto" style={{ paddingLeft: PERILLA + MARGEN + 12 }}>{texto}</span>

      {mapa && (
        <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
          <filter id="lg-perilla" x="0" y="0" width="1" height="1" filterUnits="objectBoundingBox" primitiveUnits="objectBoundingBox" colorInterpolationFilters="sRGB">
            <feImage href={mapa} x="0" y="0" width="1" height="1" preserveAspectRatio="none" result="mapa" />
            <feDisplacementMap in="SourceGraphic" in2="mapa" scale="0.22" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
      )}
      <motion.div ref={perillaRef} className="deslizable-perilla"
        drag={hecho ? false : 'x'} dragConstraints={{ left: 0, right: max }} dragElastic={0.04} dragMomentum={false}
        onDragStart={() => { arrastrando.current = true; }} onDragEnd={soltar}
        onClick={(e) => { e.stopPropagation(); if (!arrastrando.current && x.get() < 4) completar(); }}
        whileTap={{ scale: 0.94 }}
        style={{ x, width: PERILLA, height: PERILLA, top: MARGEN, left: MARGEN }}>
        {/* Lupa (receta de la burbuja de la app): todo se dibuja a ×d y se reduce a 1/d
            (nítido en Retina); dentro, la copia del texto agrandada 1.16 sobre el centro de la
            bolita, que se mueve AL REVÉS que ella (las letras se ven quietas). */}
        <span aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, width: PERILLA * d, height: PERILLA * d, transform: `scale(${1 / d})`, transformOrigin: '0 0' }}>
          <span style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: '50%', filter: mapa ? 'url(#lg-perilla)' : undefined }}>
            <span style={{ position: 'absolute', left: 0, top: 0, width: PERILLA, height: PERILLA, transformOrigin: '0 0',
              transform: `translate(${(PERILLA * d * (1 - AUMENTO)) / 2}px, ${(PERILLA * d * (1 - AUMENTO)) / 2}px) scale(${d * AUMENTO})` }}>
              <motion.div style={{ position: 'absolute', left: -MARGEN, top: -MARGEN, width: ancho, height: PERILLA + MARGEN * 2, x: xCopia, display: 'flex', alignItems: 'center' }}>
                <span className="deslizable-texto" style={{ paddingLeft: PERILLA + MARGEN + 12 }}>{texto}</span>
              </motion.div>
            </span>
          </span>
        </span>
        <span className="deslizable-reflejo" aria-hidden="true" />
        <motion.span className="deslizable-flecha" style={{ opacity: opFlecha }}><ArrowRight size={20} /></motion.span>
      </motion.div>
    </div>
  );
}
