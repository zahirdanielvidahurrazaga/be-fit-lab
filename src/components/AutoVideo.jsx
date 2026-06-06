import { useRef, useEffect, useState } from 'react';

// Videos de marca hospedados en Supabase Storage (bucket público `Video`).
// Se sirven por URL solo en la web → no engordan el binario nativo.
export const VIDEO_BASE = 'https://fifaowaiokauhuqklzwe.supabase.co/storage/v1/object/public/Video/';

// Video de fondo con autoplay ROBUSTO + carga perezosa:
// - Solo descarga el video cuando el tile está cerca del viewport (perf).
// - Fuerza muted (React no setea bien el atributo → autoplay bloqueado).
// - Reproduce al estar visible, pausa al salir (ahorra CPU).
// - Botón de play de respaldo si el navegador bloquea el autoplay.
// Debe ir dentro de un contenedor `position:relative; overflow:hidden`.
export default function AutoVideo({ src, poster, label }) {
  const wrapRef = useRef(null);
  const ref = useRef(null);
  const [load, setLoad] = useState(false);
  const [needTap, setNeedTap] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver((es) => {
      if (es.some(e => e.isIntersecting)) { setLoad(true); io.disconnect(); }
    }, { rootMargin: '300px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const v = ref.current;
    if (!v || !load) return;
    v.muted = true; v.defaultMuted = true;
    const tryPlay = () => { const p = v.play?.(); if (p && p.then) p.then(() => setNeedTap(false)).catch(() => setNeedTap(true)); };
    const onPlaying = () => setNeedTap(false);
    const io = new IntersectionObserver(
      (es) => es.forEach(e => (e.isIntersecting ? tryPlay() : v.pause())),
      { threshold: 0.2 }
    );
    io.observe(v);
    v.addEventListener('canplay', tryPlay);
    v.addEventListener('loadeddata', tryPlay);
    v.addEventListener('playing', onPlaying);
    tryPlay();
    return () => { io.disconnect(); v.removeEventListener('canplay', tryPlay); v.removeEventListener('loadeddata', tryPlay); v.removeEventListener('playing', onPlaying); };
  }, [load]);

  const onTap = () => {
    setLoad(true);
    const v = ref.current; if (!v) return;
    v.muted = true;
    const p = v.play?.();
    if (p && p.then) p.then(() => setNeedTap(false)).catch(() => {});
  };

  return (
    <div ref={wrapRef} style={{ position: 'absolute', inset: 0 }}>
      <video ref={ref} src={load ? src : undefined} poster={poster} muted loop playsInline autoPlay preload="metadata" onClick={onTap}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 62%, rgba(0,0,0,0.45) 100%)', pointerEvents: 'none' }} />
      {needTap && (
        <button onClick={onTap} aria-label="Reproducir" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '66px', height: '66px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 8px 28px rgba(0,0,0,0.35)' }}>
          <span style={{ width: 0, height: 0, borderTop: '12px solid transparent', borderBottom: '12px solid transparent', borderLeft: '19px solid #1a1a1a', marginLeft: '5px' }} />
        </button>
      )}
      {label && <span style={{ position: 'absolute', left: '20px', bottom: '20px', padding: '8px 16px', borderRadius: '999px', background: 'rgba(255,255,255,0.16)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.28)', color: '#fff', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.04em', pointerEvents: 'none' }}>{label}</span>}
    </div>
  );
}
