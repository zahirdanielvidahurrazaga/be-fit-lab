import { useEffect, useState, useMemo } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Smartphone, LayoutDashboard, X } from 'lucide-react';
import { estudioDemo } from '../demo/estudiosDemo';
import { activarEstudioDemo, restaurarEstudio } from '../config/estudio';
import DemoProvider from '../demo/DemoProvider';
import Portal from './Portal';
import Agenda from './Agenda';

// ─────────────────────────────────────────────────────────────────────────────
// MAQUETA DE VENTA
//
// /demo/<estudio> pinta la app entera con la marca de ese estudio y datos en
// memoria. Sirve para enseñarle a una dueña cómo se vería lo suyo, sin cuenta,
// sin Supabase y sin que pueda romper nada.
// ─────────────────────────────────────────────────────────────────────────────

const VISTAS = [
  { id: 'clienta', etiqueta: 'Como tu clienta', Icon: Smartphone },
  { id: 'agenda', etiqueta: 'Reservar clase', Icon: LayoutDashboard },
];

export default function Demo() {
  const { estudio } = useParams();
  const cfg = useMemo(() => estudioDemo(estudio), [estudio]);
  const [vista, setVista] = useState('clienta');
  const [selloAbierto, setSelloAbierto] = useState(true);

  // Se reemplaza la identidad activa DURANTE el render, no en un efecto: los
  // efectos corren después de que los hijos ya se pintaron, y Portal alcanzaría
  // a dibujarse una vez con el nombre y los colores de Be Fit Lab.
  useMemo(() => { if (cfg) activarEstudioDemo(cfg); }, [cfg]);

  useEffect(() => {
    if (!cfg) return;

    // Se reactiva aquí además del useMemo de arriba: en desarrollo StrictMode
    // monta, limpia y vuelve a montar, y la limpieza restaura la marca de casa.
    // Sin esta línea la demo se abre con los colores y el nombre de Be Fit Lab.
    activarEstudioDemo(cfg);

    // La demo se ve siempre en claro: es como se enseña en una junta.
    document.documentElement.setAttribute('data-theme', 'light');
    document.title = `${cfg.nombre} — demostración`;

    // Una maqueta con el nombre de un negocio real no debe indexarse nunca.
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);

    return () => {
      document.head.removeChild(meta);
      restaurarEstudio();   // devolver la identidad de casa al salir
    };
  }, [cfg]);

  if (!cfg) return <Navigate to="/" replace />;

  return (
    <DemoProvider cfg={cfg}>
      {/* El sello y el interruptor son fijos y tapaban el saludo de arriba, así
          que la app se baja lo que miden. */}
      <div style={{ minHeight: '100vh', background: 'var(--app-bg)', paddingTop: selloAbierto ? '96px' : '62px' }}>
        {vista === 'clienta' ? <Portal /> : <Agenda />}
      </div>

      {/* ── Interruptor de vista ─────────────────────────────────────────── */}
      <div
        role="group"
        aria-label="Cambiar de vista en la demostración"
        style={{
          // Arriba y no abajo: la barra de navegación de la clienta vive en el
          // borde inferior y el interruptor le quedaba encima.
          position: 'fixed', top: selloAbierto ? '48px' : '14px', left: '50%',
          transform: 'translateX(-50%)', transition: 'top .2s ease',
          display: 'flex', gap: '4px', padding: '5px', borderRadius: '999px',
          background: 'rgba(20,20,20,0.88)', backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)', boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
          zIndex: 9000,
        }}
      >
        {VISTAS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setVista(v.id)}
            aria-pressed={vista === v.id}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '9px 15px', borderRadius: '999px', border: 'none',
              cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700,
              background: vista === v.id ? '#fff' : 'transparent',
              color: vista === v.id ? '#141414' : 'rgba(255,255,255,0.75)',
              transition: 'background .18s ease, color .18s ease',
            }}
          >
            <v.Icon size={15} strokeWidth={2.5} />
            {v.etiqueta}
          </button>
        ))}
      </div>

      {/* ── Sello: esto es una maqueta, no el producto del estudio ────────── */}
      {selloAbierto && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            padding: '8px 44px 8px 16px', background: '#141414', color: '#fff',
            fontSize: '0.74rem', fontWeight: 600, letterSpacing: '0.01em',
            zIndex: 9500, textAlign: 'center',
          }}
        >
          <span>
            Demostración con datos de ejemplo · preparada para <strong>{cfg.nombre}</strong> por Zahir Vidahurrazaga
          </span>
          <button
            type="button"
            onClick={() => setSelloAbierto(false)}
            aria-label="Ocultar el aviso de demostración"
            style={{
              position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
              background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer', padding: '4px', display: 'flex',
            }}
          >
            <X size={15} />
          </button>
        </div>
      )}
    </DemoProvider>
  );
}
