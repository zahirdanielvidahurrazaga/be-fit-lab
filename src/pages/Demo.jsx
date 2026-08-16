import { useEffect, useState, useMemo } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Smartphone, CalendarDays, TrendingUp, Utensils, X } from 'lucide-react';
import { estudioDemo } from '../demo/estudiosDemo';
import { activarEstudioDemo, restaurarEstudio } from '../config/estudio';
import DemoProvider from '../demo/DemoProvider';
import Portal from './Portal';
import Agenda from './Agenda';
import Evolucion from './Evolucion';
import Nutricion from './Nutricion';

// ─────────────────────────────────────────────────────────────────────────────
// MAQUETA DE VENTA
//
// /demo/<estudio> pinta la app entera con la marca de ese estudio y datos en
// memoria. Sirve para enseñarle a una dueña cómo se vería lo suyo, sin cuenta,
// sin Supabase y sin que pueda romper nada.
//
// 🔴 POR QUÉ SE INTERCEPTAN LOS CLICS:
// Portal y Agenda tienen una docena de <Link to="/..."> a rutas reales
// (/planes, /nutricion, /evolucion, /cafeteria…). Dentro de la demo, picarle a
// la barra de navegación sacaba a la prospecta de la maqueta y la dejaba en el
// sitio REAL de Be Fit Lab — o sea, en la marca de su competencia.
//
// Parchar enlace por enlace deja agujeros y el próximo cambio los reabre, y
// anidar un MemoryRouter no se puede (React Router 7 lo prohíbe expresamente).
// Así que se atrapan los clics en captura sobre el contenedor: cualquier enlace
// interno se traduce a un cambio de vista aquí adentro, y lo que no tenga vista
// simplemente no hace nada. Los enlaces externos (App Store, Google Play) sí
// pasan, porque no sacan de la demo: abren otra pestaña.
// ─────────────────────────────────────────────────────────────────────────────

const VISTAS = [
  { id: 'clienta', etiqueta: 'Inicio', Icon: Smartphone },
  { id: 'agenda', etiqueta: 'Reservar', Icon: CalendarDays },
  { id: 'metas', etiqueta: 'Progreso', Icon: TrendingUp },
  { id: 'comida', etiqueta: 'Comida', Icon: Utensils },
];

// Qué ruta interna abre cada vista. Se usa al atrapar los clics de la barra de
// navegación, para traducirlos en vez de dejar que saquen de la maqueta.
const RUTAS = {
  '/portal': 'clienta',
  '/agenda': 'agenda',
  '/evolucion': 'metas',
  '/nutricion': 'comida',
};

function Interruptor({ arriba, vista, alCambiar }) {
  return (
    <div
      role="group"
      aria-label="Cambiar de vista en la demostración"
      style={{
        position: 'fixed', top: arriba, left: '50%', transform: 'translateX(-50%)',
        transition: 'top .2s ease',
        display: 'flex', gap: '4px', padding: '5px', borderRadius: '999px',
        background: 'rgba(20,20,20,0.88)', backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)', boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
        zIndex: 9000,
      }}
    >
      {VISTAS.map((v) => {
        const activa = vista === v.id;
        return (
          <button
            key={v.id}
            type="button"
            onClick={() => alCambiar(v.id)}
            aria-pressed={activa}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '9px 15px', borderRadius: '999px', border: 'none',
              cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700,
              background: activa ? '#fff' : 'transparent',
              color: activa ? '#141414' : 'rgba(255,255,255,0.75)',
              transition: 'background .18s ease, color .18s ease',
            }}
          >
            <v.Icon size={15} strokeWidth={2.5} />
            {v.etiqueta}
          </button>
        );
      })}
    </div>
  );
}

export default function Demo() {
  const { estudio } = useParams();
  const cfg = useMemo(() => estudioDemo(estudio), [estudio]);
  const [selloAbierto, setSelloAbierto] = useState(true);
  const [vista, setVista] = useState('clienta');

  // Se reemplaza la identidad activa DURANTE el render, no en un efecto: los
  // efectos corren después de que los hijos ya se pintaron, y Portal alcanzaría
  // a dibujarse una vez con el nombre y los colores de Be Fit Lab.
  useMemo(() => { if (cfg) activarEstudioDemo(cfg); }, [cfg]);

  useEffect(() => {
    if (!cfg) return;

    // Se reactiva aquí además del useMemo de arriba: en desarrollo StrictMode
    // monta, limpia y vuelve a montar, y la limpieza restaura la marca de casa.
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
      restaurarEstudio();
    };
  }, [cfg]);

  // Atrapa en CAPTURA cualquier clic en un enlace interno antes de que React
  // Router lo procese, y lo traduce a un cambio de vista de la maqueta.
  const atraparNavegacion = (e) => {
    const enlace = e.target.closest?.('a[href]');
    if (!enlace) return;
    const destino = enlace.getAttribute('href') || '';
    // Los externos (App Store, Google Play, mapas) se dejan pasar: abren otra
    // pestaña y no sacan a nadie de la demo.
    if (!destino.startsWith('/')) return;
    e.preventDefault();
    e.stopPropagation();
    const vistaDestino = Object.entries(RUTAS)
      .find(([ruta]) => destino.startsWith(ruta))?.[1];
    // Lo que no tiene vista en la maqueta (planes, cafetería, términos…) se
    // ignora en vez de sacar a la prospecta al sitio real.
    if (vistaDestino) setVista(vistaDestino);
  };

  if (!cfg) return <Navigate to="/" replace />;

  return (
    <DemoProvider cfg={cfg}>
      {/* El sello y el interruptor son fijos: la app se baja lo que miden. */}
      <div
        onClickCapture={atraparNavegacion}
        style={{
          minHeight: '100vh', background: 'var(--app-bg)',
          paddingTop: selloAbierto ? '96px' : '62px',
        }}
      >
        {vista === 'clienta' && <Portal />}
        {vista === 'agenda' && <Agenda />}
        {vista === 'metas' && <Evolucion />}
        {vista === 'comida' && <Nutricion />}
      </div>

      <Interruptor arriba={selloAbierto ? '48px' : '14px'} vista={vista} alCambiar={setVista} />

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
