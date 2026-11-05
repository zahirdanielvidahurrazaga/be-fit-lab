import React, { useId, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { mapaRefraccion } from '../lib/lente';

// ─────────────────────────────────────────────────────────────────────────────
// LENTE DE VIDRIO LÍQUIDO propio (sin librerías; idea tomada de cómo lo resuelve
// "glisse"). Safari/iOS NO deforma el fondo en vivo (filtros SVG en
// backdrop-filter = solo Chromium), pero SÍ deforma un ELEMENTO normal. Así que
// dentro del botón ponemos una COPIA de la foto que hay detrás, alineada al
// píxel con la original, y a esa copia le aplicamos el lente: en los bordes el
// fondo se dobla hacia adentro, con un leve desenfoque y más color. Resultado:
// refracción real en iPhone, Android y web.
//
// Uso: <LenteVidrio fuenteRef={refDeLaFoto} src={url} animImg={{...}} radio={999}>
//        …contenido del botón…
//      </LenteVidrio>
// `animImg` = las mismas props de animación que la foto original (para que la
// copia haga el mismo zoom lento y no se desfase).
// ─────────────────────────────────────────────────────────────────────────────

export default function LenteVidrio({ fuenteRef, src, animImg = {}, capaEncima = null, children, style, className, ...resto }) {
  const id = `lente-${useId().replace(/:/g, '')}`;
  const ref = useRef(null);
  const [geo, setGeo] = useState(null); // { w, h, dx, dy, fw, fh, mapa }
  const medirRef = useRef(null);

  // Mide el botón y la foto de atrás; se recalcula si cambia el tamaño de alguno.
  useLayoutEffect(() => {
    if (!src) return;
    let ultimo = '', ro = null, raf = 0, vivo = true;
    // La foto (fuente) suele ser un ANCESTRO del botón: React le pone la ref después
    // de correr este efecto, así que si aún no está, se reintenta al siguiente cuadro.
    const arrancar = () => {
      if (!vivo) return;
      const el = ref.current, fuente = fuenteRef?.current;
      if (!el || !fuente) { raf = requestAnimationFrame(arrancar); return; }
      iniciar(el, fuente);
    };
    const iniciar = (el, fuente) => {
    const medir = () => {
      const a = el.getBoundingClientRect(), b = fuente.getBoundingClientRect();
      const w = Math.round(a.width), h = Math.round(a.height);
      if (w < 20 || h < 20) return;
      const clave = `${w}x${h}`;
      setGeo(g => {
        const mapa = clave === ultimo && g?.mapa ? g.mapa : (() => { try { return mapaRefraccion(w, h, h / 2, Math.max(10, h * 0.42)); } catch { return null; } })();
        ultimo = clave;
        return { w, h, dx: b.left - a.left, dy: b.top - a.top, fw: b.width, fh: b.height, mapa };
      });
    };
    medirRef.current = medir;
      medir();
      ro = new ResizeObserver(medir);
      ro.observe(el); ro.observe(fuente);
      window.addEventListener('resize', medir);
    };
    arrancar();
    return () => { vivo = false; cancelAnimationFrame(raf); ro?.disconnect(); window.removeEventListener('resize', medirRef.current); };
  }, [fuenteRef, src]);

  return (
    <span ref={ref} className={className} style={{ position: 'relative', overflow: 'hidden', isolation: 'isolate', ...style }} {...resto}>
      {geo?.mapa && (
        <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
          {/* Unidades de caja: WebKit no aplica bien el lente con unidades de usuario */}
          <filter id={id} x="0" y="0" width="1" height="1" filterUnits="objectBoundingBox" primitiveUnits="objectBoundingBox" colorInterpolationFilters="sRGB">
            <feImage href={geo.mapa} x="0" y="0" width="1" height="1" preserveAspectRatio="none" result="mapa" />
            <feDisplacementMap in="SourceGraphic" in2="mapa" scale="0.22" xChannelSelector="R" yChannelSelector="G" result="doblado" />
            <feGaussianBlur in="doblado" stdDeviation="0.012" result="suave" />
            <feColorMatrix in="suave" type="saturate" values="1.5" />
          </filter>
        </svg>
      )}
      {geo && (
        <span aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 'inherit', filter: geo.mapa ? `url(#${id})` : 'blur(6px) saturate(1.5)', zIndex: 0 }}>
          <motion.img key={src} src={src} alt="" {...animImg}
            style={{ position: 'absolute', left: geo.dx, top: geo.dy, width: geo.fw, height: geo.fh, objectFit: 'cover', maxWidth: 'none', ...(animImg.style || {}) }} />
          {capaEncima && <span style={{ position: 'absolute', left: geo.dx, top: geo.dy, width: geo.fw, height: geo.fh, background: capaEncima }} />}
        </span>
      )}
      {/* Tinte claro + filo de luz (encima del lente, debajo del contenido) */}
      <span aria-hidden="true" style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', background: 'linear-gradient(180deg, rgba(255,255,255,0.28), rgba(255,255,255,0.08))', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.65), inset 0 -1px 0 rgba(255,255,255,0.18)', zIndex: 1, pointerEvents: 'none' }} />
      <span style={{ position: 'relative', zIndex: 2, display: 'inherit', alignItems: 'inherit', gap: 'inherit', width: '100%', justifyContent: 'inherit' }}>{children}</span>
    </span>
  );
}
