// ─────────────────────────────────────────────────────────────────────────────
// CAPA DECORATIVA DE TEMPORADA
//
// Lo que la clienta ve cuando corre una temporada: una tira de papel picado y
// una tarjeta de saludo. Los dos leen `decor` y `saludo` de la fila activa de
// `app_seasons`, así que el contenido lo cambia la dueña sin recompilar nada.
//
// Decisión de diseño: la temporada mueve el ADORNO, no la paleta funcional.
// La marca es durazno (#FF914D) y el verde bandera pelea con cada superficie
// de la app; además el modo oscuro tiene un acento propio (#2B231D, café) que
// un cambio de paleta completo rompería sin lanzar ningún error. Por eso la
// tarjeta se pinta con los tokens de superficie de la app y los colores de
// temporada entran solo en el papel picado: se ve patria y no se rompe nada.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useId, useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useTemporada } from '../lib/temporada';

// Paleta de respaldo por si una fila viene sin `decor` (o incompleta).
const RESPALDO = ['#4A7C59', '#C75B3E', '#E8A33D', '#FF914D'];

function coloresDe(decor) {
  const c = [decor?.a, decor?.b, decor?.c, decor?.d];
  return c.map((v, i) => (typeof v === 'string' && v.trim() ? v : RESPALDO[i]));
}

// Un banderín: trapecio con tres perforaciones. Las perforaciones son huecos de
// verdad (fill-rule evenodd) y no círculos del color del fondo, para que la tira
// funcione sobre cualquier superficie y en los dos temas.
const BANDERIN = [
  'M2,0 H28 V20 L15,30 L2,20 Z',
  'M11.5,10 a3.5,3.5 0 1,0 7,0 a3.5,3.5 0 1,0 -7,0 Z',
  'M6.2,16 a1.8,1.8 0 1,0 3.6,0 a1.8,1.8 0 1,0 -3.6,0 Z',
  'M20.2,16 a1.8,1.8 0 1,0 3.6,0 a1.8,1.8 0 1,0 -3.6,0 Z',
].join(' ');

const ALTO = 32;

export function TiraPapelPicado({ decor, alto = ALTO, opacidad = 1 }) {
  const id = useId().replace(/:/g, '');
  const colores = coloresDe(decor);

  return (
    <svg
      width="100%"
      height={alto}
      aria-hidden="true"
      style={{ display: 'block', opacity: opacidad, pointerEvents: 'none' }}
    >
      <defs>
        {/* Un tramo de cuatro banderines que se repite: así la tira cubre
            cualquier ancho de pantalla sin estirar el dibujo. */}
        <pattern id={`pp-${id}`} width="120" height={alto} patternUnits="userSpaceOnUse">
          <line x1="0" y1="0.5" x2="120" y2="0.5" stroke={colores[0]} strokeWidth="1" opacity="0.45" />
          {[0, 30, 60, 90].map((x, i) => (
            <path key={x} transform={`translate(${x},0)`} d={BANDERIN} fill={colores[i]} fillRule="evenodd" />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height={alto} fill={`url(#pp-${id})`} />
    </svg>
  );
}

export default function SaludoTemporada() {
  const temporada = useTemporada();
  const slug = temporada?.slug;

  // Se recuerda cerrada por temporada: si la cierra en septiembre, Halloween
  // vuelve a aparecer. Envuelto porque en modo privado leer localStorage lanza.
  const [cerrada, setCerrada] = useState(() => {
    try {
      return slug ? localStorage.getItem(`befit_saludo_${slug}`) === '1' : false;
    } catch {
      return false;
    }
  });

  const saludo = temporada?.saludo;
  if (!temporada || !saludo?.titulo || cerrada) return null;

  const cerrar = () => {
    setCerrada(true);
    try {
      localStorage.setItem(`befit_saludo_${slug}`, '1');
    } catch {
      /* no se pudo recordar; volverá a aparecer y no pasa nada */
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      style={{
        background: 'var(--app-surface-solid)',
        // Ojo: --border-subtle y --card-shadow SOLO están definidos en el tema
        // oscuro de index.css. Sin respaldo, en claro la tarjeta sale sin borde
        // ni sombra. Son los mismos respaldos que usa el resto de la app.
        border: '1px solid var(--border-subtle, rgba(55, 61, 59, 0.1))',
        borderRadius: '24px',
        boxShadow: 'var(--card-shadow, 0 8px 32px rgba(55, 61, 59, 0.04))',
        overflow: 'hidden',
        marginBottom: '20px',
        position: 'relative',
      }}
    >
      <TiraPapelPicado decor={temporada.decor} />

      <button
        type="button"
        onClick={cerrar}
        aria-label="Ocultar el saludo"
        style={{
          position: 'absolute', top: '40px', right: '14px',
          background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: '50%',
          padding: '5px', cursor: 'pointer', lineHeight: 0, color: 'var(--on-surface-variant)',
        }}
      >
        <X size={14} />
      </button>

      <div style={{ padding: '14px 20px 20px' }}>
        <h3
          style={{
            margin: 0,
            paddingRight: '34px',
            fontSize: '1.25rem',
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            letterSpacing: '0.01em',
            color: 'var(--black)',
          }}
        >
          {saludo.titulo}
        </h3>

        {saludo.texto && (
          <p style={{ margin: '6px 0 0', fontSize: '0.92rem', color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>
            {saludo.texto}
          </p>
        )}

        {/* La nota solo se pinta si el estudio la escribió. Vacía por defecto a
            propósito: el horario de un día feriado lo decide la dueña, y una
            fecha inventada en la app es peor que no decir nada. */}
        {saludo.nota && (
          <div
            style={{
              marginTop: '12px',
              padding: '10px 14px',
              borderRadius: '14px',
              background: 'var(--surface-low)',
              border: '1px solid var(--border-subtle, rgba(55, 61, 59, 0.1))',
              fontSize: '0.88rem',
              fontWeight: 600,
              color: 'var(--black)',
            }}
          >
            {saludo.nota}
          </div>
        )}
      </div>
    </motion.div>
  );
}
