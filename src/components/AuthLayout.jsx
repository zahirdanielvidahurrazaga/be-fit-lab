// Marco de las pantallas de cuenta (Iniciar sesión, Registro, Recuperar contraseña).
// Estilo de siempre (foto del estudio difuminada de fondo + tarjeta encima), con la
// tarjeta y el botón de volver en el MISMO vidrio líquido de la barra del sitio
// (desenfoque, filo de luz, brillo y, en Chromium, refracción en las orillas).
// Solo es la "cáscara": la lógica de cada pantalla no cambia.
import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { mapaRefraccion } from '../lib/lente';

const EASE = [0.16, 1, 0.3, 1];

// Refracción solo en Chromium de escritorio/Android (Safari no la soporta en backdrop-filter).
const soportaRefraccion = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /Chrome|Chromium|Edg\//.test(ua) && !/iPhone|iPad|iPod|CriOS/.test(ua);
};

export default function AuthLayout({ children, onVolver, textoVolver = 'Volver al sitio' }) {
  const reduce = useReducedMotion();
  const tarjetaRef = useRef(null);
  const [mapa, setMapa] = useState(null);

  // El mapa se rehace cuando la tarjeta cambia de tamaño (errores, pasos del formulario…).
  useEffect(() => {
    const el = tarjetaRef.current;
    if (!el || !soportaRefraccion()) return undefined;
    let ultimo = '';
    const medir = () => {
      const w = Math.round(el.offsetWidth), h = Math.round(el.offsetHeight);
      if (w < 50 || h < 50 || `${w}x${h}` === ultimo) return;
      ultimo = `${w}x${h}`;
      try { setMapa({ url: mapaRefraccion(w, h, 28, 22), w, h }); } catch { setMapa(null); }
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="auth">
      <div className="auth-fondo" aria-hidden="true" />

      {mapa && (
        <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
          <filter id="lg-refraccion-auth" x="0" y="0" width="100%" height="100%" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feImage href={mapa.url} x="0" y="0" width={mapa.w} height={mapa.h} result="mapa" preserveAspectRatio="none" />
            <feDisplacementMap in="SourceGraphic" in2="mapa" scale="30" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
      )}

      {onVolver && (
        <button className="auth-volver" onClick={onVolver}>
          <span className="lg-brillo" aria-hidden="true" />
          <ChevronLeft size={18} /> {textoVolver}
        </button>
      )}

      <motion.div className="auth-centro"
        initial={reduce ? false : { opacity: 0, scale: 0.96, filter: 'blur(10px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.9, ease: EASE }}>
        <div ref={tarjetaRef} className="auth-tarjeta"
          style={mapa ? { backdropFilter: 'url(#lg-refraccion-auth) blur(20px) saturate(210%) brightness(1.18)' } : undefined}>
          <span className="lg-brillo" aria-hidden="true" />
          <div className="auth-contenido">{children}</div>
        </div>
      </motion.div>
    </div>
  );
}
