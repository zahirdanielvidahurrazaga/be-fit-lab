import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal } from 'lucide-react';

// Menú "⋯" para acciones secundarias o peligrosas de una fila (Eliminar,
// Archivar…). Antes cada fila del panel tenía un bote de basura ROJO al lado de
// "editar": con decenas de filas, el rojo era lo que más gritaba en pantalla y
// quedaba a un dedazo de distancia. Aquí queda escondido a un toque más.
//
// El menú se pinta en un PORTAL sobre <body> con posición fija: dentro de la
// tarjeta quedaba DEBAJO de la tarjeta siguiente (cada tarjeta de vidrio crea
// su propia capa y ningún z-index la saca). Si no cabe abajo, abre hacia arriba.
//
// acciones: [{ label, icon: <Icon/>, onClick, peligro?: bool, disabled?: bool }]
export default function MenuAcciones({ acciones = [], titulo = 'Más acciones', size = 34 }) {
  const [abierto, setAbierto] = useState(false);
  const [pos, setPos] = useState(null);
  const botonRef = useRef(null);
  const menuRef = useRef(null);

  const colocar = () => {
    const b = botonRef.current?.getBoundingClientRect();
    if (!b) return;
    const alto = menuRef.current?.offsetHeight || (acciones.length * 42 + 12);
    const ancho = Math.max(180, menuRef.current?.offsetWidth || 180);
    // La barra flotante de abajo ocupa ~110 px: no abrir el menú detrás de ella.
    const cabeAbajo = b.bottom + 6 + alto < window.innerHeight - 110;
    const left = Math.min(Math.max(8, b.right - ancho), window.innerWidth - ancho - 8);
    setPos(cabeAbajo ? { top: b.bottom + 6, left } : { top: Math.max(8, b.top - 6 - alto), left });
  };

  useLayoutEffect(() => { if (abierto) colocar(); }, [abierto]); // eslint-disable-line

  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e) => {
      if (menuRef.current?.contains(e.target) || botonRef.current?.contains(e.target)) return;
      setAbierto(false);
    };
    const esc = (e) => { if (e.key === 'Escape') setAbierto(false); };
    const alMover = () => setAbierto(false); // al hacer scroll se cierra (no se queda flotando suelto)
    document.addEventListener('mousedown', cerrar);
    document.addEventListener('touchstart', cerrar);
    document.addEventListener('keydown', esc);
    window.addEventListener('scroll', alMover, true);
    window.addEventListener('resize', alMover);
    return () => {
      document.removeEventListener('mousedown', cerrar);
      document.removeEventListener('touchstart', cerrar);
      document.removeEventListener('keydown', esc);
      window.removeEventListener('scroll', alMover, true);
      window.removeEventListener('resize', alMover);
    };
  }, [abierto]);

  return (
    <>
      <button ref={botonRef} type="button" aria-label={titulo} title={titulo} aria-haspopup="menu" aria-expanded={abierto}
        onClick={(e) => { e.stopPropagation(); setAbierto(a => !a); }}
        style={{ width: size, height: size, borderRadius: '10px', border: 'none', cursor: 'pointer', flexShrink: 0,
                 background: abierto ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.04)', color: 'var(--on-surface-variant)',
                 display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <MoreHorizontal size={17} />
      </button>
      {abierto && createPortal(
        <div ref={menuRef} role="menu" onClick={(e) => e.stopPropagation()}
          style={{ position: 'fixed', top: pos?.top ?? -9999, left: pos?.left ?? -9999, zIndex: 5000, minWidth: '180px', padding: '6px',
                   background: '#fff', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.07)',
                   boxShadow: '0 14px 34px rgba(0,0,0,0.18)', visibility: pos ? 'visible' : 'hidden' }}>
          {acciones.map((a, i) => (
            <button key={i} type="button" role="menuitem" disabled={a.disabled}
              onClick={() => { setAbierto(false); a.onClick?.(); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '9px', padding: '11px 12px', border: 'none',
                       borderRadius: '10px', background: 'transparent', cursor: a.disabled ? 'not-allowed' : 'pointer',
                       opacity: a.disabled ? 0.45 : 1, textAlign: 'left', fontFamily: 'inherit', fontSize: '0.88rem', fontWeight: 700,
                       color: a.peligro ? '#B91C1C' : '#1A1C1E' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = a.peligro ? 'rgba(185,28,28,0.07)' : 'rgba(0,0,0,0.04)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
              {a.icon}{a.label}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}
