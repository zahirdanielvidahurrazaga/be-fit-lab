import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, LayoutGroup } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { mapaRefraccion } from '../lib/lente';

// ─────────────────────────────────────────────────────────────────────────────
// BARRA "LIQUID GLASS" genérica (iOS 26, como Instagram/WhatsApp). La usan la
// clienta (BarraClienta), admin, coach y la cafetería.
//
// Vidrio: desenfoque + saturación del fondo, filo de luz, sombra interna y
// brillo especular (CSS .lg-*). El activo lleva una "burbuja" que se desliza
// (framer layoutId). La REFRACCIÓN de bordes solo existe en Chromium: WebKit
// (Safari y TODA app de iOS, que por regla de Apple usa WebKit) no acepta
// filtros SVG en backdrop-filter, así que ahí no se intenta.
//
// items:  [{ id, label, Icono | avatarUrl, activo, to | onClick, badge }]
// centro: { label, Icono, onClick, activo } — el botón redondo del medio
// ─────────────────────────────────────────────────────────────────────────────

const soportaRefraccion = () => {
  if (typeof window === 'undefined') return false;
  if (Capacitor.getPlatform() === 'ios') return false;
  const ua = navigator.userAgent;
  return /Chrome|Chromium|CriOS|EdgA|Edg\//.test(ua) && !/iPhone|iPad|iPod/.test(ua);
};

// Mapa de LUPA para la burbuja: campo continuo (sin saltos) que toma la imagen de
// más cerca del centro → agranda, y dobla más hacia las orillas. El de orillas
// (mapaRefraccion) tiene un corte a la mitad que en una burbuja tan chica rasgaba
// los íconos.
function mapaLupa(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(w, h);
  const cx = w / 2, cy = h / 2;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = (x - cx) / cx, ny = (y - cy) / cy;           // -1..1
      const r = Math.min(1, Math.sqrt(nx * nx + ny * ny));
      // Centro intacto (el ícono activo se queda nítido); solo dobla hacia la orilla.
      const t = Math.max(0, (r - 0.55) / 0.45);
      const f = t * t * (3 - 2 * t);                           // suave (smoothstep)
      const i = (y * w + x) * 4;
      img.data[i] = 128 - nx * f * 127;                        // toma de más adentro (agranda)
      img.data[i + 1] = 128 - ny * f * 127;
      img.data[i + 2] = 128;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL();
}

export default function BarraGlass({ items = [], centro = null, grupo = 'barra', className = '' }) {
  const [compacta, setCompacta] = useState(false);
  useEffect(() => {
    const alScroll = () => setCompacta(window.scrollY > 40);
    window.addEventListener('scroll', alScroll, { passive: true });
    return () => window.removeEventListener('scroll', alScroll);
  }, []);

  const barraRef = useRef(null);
  const [mapa, setMapa] = useState(null);
  const refraccion = useMemo(soportaRefraccion, []);
  const filtroId = `lg-refraccion-${grupo}`;
  useLayoutEffect(() => {
    if (!refraccion || !barraRef.current) return;
    const { width, height } = barraRef.current.getBoundingClientRect();
    const w = Math.round(width), h = Math.round(height);
    if (w < 50 || h < 30) return;
    try { setMapa({ url: mapaRefraccion(w, h, h / 2, 18), w, h }); } catch { setMapa(null); }
  }, [refraccion]);

  // ── BURBUJA-LUPA (como la barra de Apple / glisse) ──────────────────────
  // Una sola burbuja que se desliza con resorte. Adentro lleva una COPIA de los
  // íconos que se mueve al revés con el MISMO resorte: los íconos parecen quietos
  // y la burbuja pasa encima como un vidrio que los agranda y dobla en las
  // orillas. Funciona también en iPhone porque el lente se aplica a la copia
  // (un elemento), no al fondo en vivo.
  const itemRefs = useRef({});
  const [pos, setPos] = useState({ items: {}, burbuja: null, w: 0, h: 0 });
  const activoId = items.find(it => it.activo)?.id;
  const firmaItems = items.map(it => `${it.id}:${it.badge || ''}`).join('|');
  useLayoutEffect(() => {
    const nav = barraRef.current;
    if (!nav) return;
    const medir = () => {
      const nuevos = {};
      Object.entries(itemRefs.current).forEach(([id, el]) => {
        if (el) nuevos[id] = { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight };
      });
      const a = activoId != null ? nuevos[activoId] : null;
      const burbuja = a ? { x: a.x + 6, y: a.y, w: Math.max(0, a.w - 12), h: a.h } : null;
      let mapaLupaUrl = null;
      if (burbuja && burbuja.w > 10) {
        // Mapa a la densidad de la pantalla (Retina = x2/x3): a 1x el lente pixelaba los íconos.
        const d = Math.min(3, Math.max(1, Math.round(window.devicePixelRatio || 1)));
        try { mapaLupaUrl = mapaLupa(Math.round(burbuja.w * d), Math.round(burbuja.h * d)); } catch { mapaLupaUrl = null; }
      }
      setPos({ items: nuevos, burbuja, w: nav.offsetWidth, h: nav.offsetHeight, mapaLupa: mapaLupaUrl, d: Math.min(3, Math.max(1, Math.round(window.devicePixelRatio || 1))) });
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(nav);
    return () => ro.disconnect();
  }, [activoId, firmaItems, compacta]);
  const resorte = { type: 'spring', stiffness: 420, damping: 32, mass: 0.9 };
  // El lente SOLO mientras la burbuja se desliza: el filtro SVG redibuja el ícono a
  // baja resolución (se veía borroso en reposo). Quieta = ícono nítido y agrandado.
  const [moviendo, setMoviendo] = useState(false);
  const primerActivo = useRef(true);
  useEffect(() => {
    if (primerActivo.current) { primerActivo.current = false; return; }
    setMoviendo(true);
    const t = setTimeout(() => setMoviendo(false), 650);
    return () => clearTimeout(t);
  }, [activoId]);
  const lupaId = `lg-lupa-${grupo}`;

  const iconoDe = (it, activo) => (
    <span className="lg-icono">
      {it.avatarUrl
        ? <img src={it.avatarUrl} alt="" className="lg-avatar" />
        : <it.Icono size={23} strokeWidth={activo ? 2.6 : 2.1} />}
      {it.badge ? <span key={it.badge} className="lg-badge">{it.badge}</span> : null}
    </span>
  );

  const mitad = Math.ceil(items.length / 2);
  const antes = centro ? items.slice(0, mitad) : items;
  const despues = centro ? items.slice(mitad) : [];

  const renderItem = (it) => {
    const contenido = (
      <>
        {/* Respaldo: mientras no se mida la barra, la burbuja de siempre */}
        {it.activo && !pos.burbuja && (
          <motion.span layoutId={`lg-burbuja-${grupo}`} className="lg-burbuja" transition={resorte} />
        )}
        {iconoDe(it, it.activo)}
      </>
    );
    const props = { ref: (el) => { itemRefs.current[it.id] = el; }, className: `lg-item${it.activo ? ' activo' : ''}`, 'aria-label': it.label, 'aria-current': it.activo ? 'page' : undefined };
    return it.to
      ? <Link key={it.id} to={it.to} {...props}>{contenido}</Link>
      : <button key={it.id} type="button" onClick={it.onClick} {...props}>{contenido}</button>;
  };

  return (
    <>
      {mapa && (
        <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
          <filter id={filtroId} x="0" y="0" width="100%" height="100%" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feImage href={mapa.url} x="0" y="0" width={mapa.w} height={mapa.h} result="mapa" preserveAspectRatio="none" />
            <feDisplacementMap in="SourceGraphic" in2="mapa" scale="38" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
      )}
      <nav ref={barraRef} aria-label="Navegación principal"
        className={`lg-barra${compacta ? ' lg-compacta' : ''}${mapa ? ' lg-refracta' : ''}${items.length + (centro ? 1 : 0) <= 3 ? ' lg-corta' : ''} ${className}`}
        style={mapa ? { backdropFilter: `url(#${filtroId}) blur(10px) saturate(190%) brightness(1.06)` } : undefined}>
        <span className="lg-brillo" aria-hidden="true" />
        {pos.burbuja && (
          <motion.span aria-hidden="true" className="lg-burbuja lg-lupa"
            initial={false}
            animate={{ x: pos.burbuja.x, y: pos.burbuja.y, width: pos.burbuja.w, height: pos.burbuja.h }}
            transition={resorte}
            style={{ inset: 'auto', left: 0, top: 0, zIndex: 3, overflow: 'hidden', pointerEvents: 'none' }}>
            {pos.mapaLupa && (
              <svg width="0" height="0" style={{ position: 'absolute' }}>
                <filter id={lupaId} x="0" y="0" width="1" height="1" filterUnits="objectBoundingBox" primitiveUnits="objectBoundingBox" colorInterpolationFilters="sRGB">
                  <feImage href={pos.mapaLupa} x="0" y="0" width="1" height="1" preserveAspectRatio="none" result="mapa" />
                  <feDisplacementMap in="SourceGraphic" in2="mapa" scale="0.22" xChannelSelector="R" yChannelSelector="G" />
                </filter>
              </svg>
            )}
            {/* Supermuestreo: el filtro SVG se procesa a resolución CSS (1x) y en
                pantallas Retina pixelaba los íconos. Se dibuja todo a ×d dentro del
                lente y el resultado se reduce a 1/d → nítido también al deslizarse. */}
            <span style={{ position: 'absolute', left: 0, top: 0, width: pos.burbuja.w * pos.d, height: pos.burbuja.h * pos.d, transform: `scale(${1 / pos.d})`, transformOrigin: '0 0' }}>
              <span style={{ position: 'absolute', inset: 0, overflow: 'hidden', filter: pos.mapaLupa && moviendo ? `url(#${lupaId})` : undefined }}>
                {/* Copia de los íconos: va al revés que la burbuja → se ven quietos, agrandados */}
                <motion.span initial={false}
                  animate={{ x: -pos.burbuja.x * pos.d, y: -pos.burbuja.y * pos.d }}
                  transition={resorte}
                  style={{ position: 'absolute', left: 0, top: 0, width: pos.w * pos.d, height: pos.h * pos.d }}>
                  {items.map(it => {
                    const r = pos.items[it.id];
                    if (!r) return null;
                    return (
                      <span key={it.id} className={`lg-item${it.activo ? ' activo' : ''}`}
                        style={{ position: 'absolute', left: (r.x + r.w / 2) * pos.d - r.w / 2, top: (r.y + r.h / 2) * pos.d - r.h / 2, width: r.w, height: r.h, transform: `scale(${pos.d * 1.16})`, transformOrigin: 'center', transition: 'none', opacity: 1 }}>
                        {iconoDe(it, it.activo)}
                      </span>
                    );
                  })}
                </motion.span>
              </span>
            </span>
          </motion.span>
        )}
        <LayoutGroup id={grupo}>
          {antes.map(renderItem)}
          {centro && (
            <button type="button" className={`lg-qr${centro.activo ? ' activo' : ''}`} aria-label={centro.label} onClick={centro.onClick}>
              <centro.Icono size={23} strokeWidth={2.4} />
            </button>
          )}
          {despues.map(renderItem)}
        </LayoutGroup>
      </nav>
    </>
  );
}
