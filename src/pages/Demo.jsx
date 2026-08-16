import { useEffect, useState, useMemo, useRef, useLayoutEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Smartphone, ScanLine, Dumbbell, Coffee, LayoutDashboard, X } from 'lucide-react';
import { estudioDemo } from '../demo/estudiosDemo';
import { activarEstudioDemo, restaurarEstudio } from '../config/estudio';
import DemoProvider from '../demo/DemoProvider';
import Portal from './Portal';
import Agenda from './Agenda';
import Evolucion from './Evolucion';
import Nutricion from './Nutricion';
import Cafeteria from './Cafeteria';
import Eventos from './Eventos';
import Cumpleanos from './Cumpleanos';
import Coach from './Coach';
import Recepcion from './Recepcion';
import Barista from './Barista';
import Admin from './Admin';
import { supabaseDemo } from '../demo/supabaseDemo';
import { EVENTO_NAVEGAR } from '../demo/navegacionDemo';
import { activarSupabaseDemo, desactivarSupabaseDemo } from '../lib/supabase';

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

// La barra cambia de ROL, no de pantalla: antes repetía la navegación que la
// app ya tiene abajo. Así una dueña ve su panel, el mostrador, la vista de la
// coach y la de la barista sin salir de la maqueta ni necesitar cuentas.
const ROLES = [
  { id: 'clienta',   etiqueta: 'Tu clienta',  Icon: Smartphone },
  { id: 'recepcion', etiqueta: 'Mostrador',   Icon: ScanLine },
  { id: 'coach',     etiqueta: 'Coach',       Icon: Dumbbell },
  { id: 'barista',   etiqueta: 'Barra',       Icon: Coffee },
  { id: 'admin',     etiqueta: 'Dirección',   Icon: LayoutDashboard },
];

// Qué ruta interna abre cada vista. Se usa al atrapar los clics de la barra de
// navegación, para traducirlos en vez de dejar que saquen de la maqueta.
// Qué pantalla de la clienta abre cada ruta interna.
const RUTAS = {
  '/portal': 'portal',
  '/agenda': 'agenda',
  '/evolucion': 'evolucion',
  '/nutricion': 'nutricion',
  '/cafeteria': 'cafeteria',
  '/eventos': 'eventos',
  '/cumpleanos': 'cumpleanos',
};

function Interruptor({ rol, alCambiar }) {
  return (
    <div
      role="group"
      aria-label="Cambiar de vista en la demostración"
      style={{
        margin: '8px auto',
        display: 'flex', gap: '3px', padding: '5px', borderRadius: '999px',
        width: 'fit-content',
        background: 'rgba(20,20,20,0.9)', backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)', boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
        // Siete pestañas no caben en un teléfono: la tira se desplaza.
        maxWidth: 'calc(100vw - 24px)', overflowX: 'auto', scrollbarWidth: 'none',
      }}
    >
      {ROLES.map((v) => {
        const activa = rol === v.id;
        return (
          <button
            key={v.id}
            type="button"
            onClick={() => alCambiar(v.id)}
            aria-pressed={activa}
            title={v.etiqueta}
            style={{
              display: 'flex', alignItems: 'center', gap: activa ? '6px' : '0',
              padding: activa ? '8px 14px' : '8px 11px', borderRadius: '999px',
              border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700,
              background: activa ? '#fff' : 'transparent',
              color: activa ? '#141414' : 'rgba(255,255,255,0.72)',
              transition: 'background .18s ease, color .18s ease, padding .18s ease',
              flexShrink: 0, whiteSpace: 'nowrap',
            }}
          >
            <v.Icon size={16} strokeWidth={2.5} />
            {/* El texto solo en la activa: así las siete caben en un teléfono. */}
            {activa && v.etiqueta}
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
  const [rol, setRol] = useState('clienta');
  // Solo aplica dentro del rol de clienta: la barra de abajo de la app cambia
  // esto, y ya no se duplica arriba.
  const [vista, setVista] = useState('portal');
  // El sello se parte en 2 o 3 renglones en pantallas angostas, así que la
  // altura del encabezado NO se puede adivinar con un número fijo: se mide.
  const encabezadoRef = useRef(null);
  const [altoEncabezado, setAltoEncabezado] = useState(56);

  // Se reemplaza la identidad activa DURANTE el render, no en un efecto: los
  // efectos corren después de que los hijos ya se pintaron, y Portal alcanzaría
  // a dibujarse una vez con el nombre y los colores de Be Fit Lab.
  useMemo(() => {
    if (!cfg) return;
    activarEstudioDemo(cfg);
    // Antes del primer render: si Cafetería o Eventos alcanzan a consultar la
    // base real, le enseñan a la prospecta el menú y los precios de Be Fit Lab.
    activarSupabaseDemo(supabaseDemo);
  }, [cfg]);

  useEffect(() => {
    if (!cfg) return;

    // Se reactiva aquí además del useMemo de arriba: en desarrollo StrictMode
    // monta, limpia y vuelve a montar, y la limpieza restaura la marca de casa.
    activarEstudioDemo(cfg);
    activarSupabaseDemo(supabaseDemo);

    // La demo se ve siempre en claro: es como se enseña en una junta.
    document.documentElement.setAttribute('data-theme', 'light');
    document.title = `${cfg.nombre} — demostración`;

    // Una maqueta con el nombre de un negocio real no debe indexarse nunca.
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);

    // Las etiquetas de index.html son de Be Fit Lab. Si el link de la maqueta se
    // comparte por WhatsApp —que es justo como se va a mandar— la vista previa
    // saldría con el nombre, la descripción y la foto de la competencia.
    const previos = [];
    const ponerMeta = (selector, valor) => {
      const nodo = document.head.querySelector(selector);
      if (!nodo) return;
      previos.push([nodo, nodo.getAttribute('content')]);
      nodo.setAttribute('content', valor);
    };
    const resumen = `Demostración de la app de ${cfg.nombre}, preparada por Zahir Vidahurrázaga.`;
    ponerMeta('meta[name="description"]', resumen);
    ponerMeta('meta[property="og:title"]', `${cfg.nombre} — demostración`);
    ponerMeta('meta[property="og:description"]', resumen);
    ponerMeta('meta[property="og:image"]', cfg.marca?.logo || '');
    ponerMeta('meta[name="twitter:title"]', `${cfg.nombre} — demostración`);
    ponerMeta('meta[name="twitter:description"]', resumen);
    ponerMeta('meta[name="twitter:image"]', cfg.marca?.logo || '');
    ponerMeta('meta[name="keywords"]', '');
    ponerMeta('meta[property="og:site_name"]', cfg.nombre);

    // index.html trae datos estructurados que declaran a Be Fit Lab como
    // negocio local, con su dirección y teléfono. En una maqueta de otro
    // estudio eso no debe existir: se desactiva mientras está abierta.
    const datosNegocio = [...document.head.querySelectorAll('script[type="application/ld+json"]')];
    datosNegocio.forEach((n) => { n.type = 'application/ld+json-demo-desactivado'; });

    return () => {
      document.head.removeChild(meta);
      previos.forEach(([nodo, valor]) => nodo.setAttribute('content', valor ?? ''));
      datosNegocio.forEach((n) => { n.type = 'application/ld+json'; });
      restaurarEstudio();
      desactivarSupabaseDemo();
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

  // Las pantallas que navegan por código (cerrar la cafetería, volver desde
  // eventos) avisan por aquí en vez de salirse de la maqueta.
  useEffect(() => {
    const alNavegar = (e) => {
      const destino = String(e.detail ?? '');
      const vistaDestino = Object.entries(RUTAS)
        .find(([ruta]) => destino.startsWith(ruta))?.[1];
      // navigate(-1), /registro, /planes y demás: se regresa al inicio, que es
      // lo que espera quien le picó a "cerrar".
      setVista(vistaDestino || 'portal');
    };
    window.addEventListener(EVENTO_NAVEGAR, alNavegar);
    return () => window.removeEventListener(EVENTO_NAVEGAR, alNavegar);
  }, []);

  useLayoutEffect(() => {
    const medir = () => setAltoEncabezado(encabezadoRef.current?.offsetHeight ?? 56);
    medir();
    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, [selloAbierto, cfg]);

  if (!cfg) return <Navigate to="/" replace />;

  return (
    <DemoProvider cfg={cfg} rol={rol}>
      {/* Sello e interruptor viven juntos en un bloque fijo, y el contenido se
          baja exactamente lo que ese bloque mide. */}
      <div
        ref={encabezadoRef}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9500,
          background: '#141414',
        }}
      >
        {selloAbierto && (
          <div style={{
            position: 'relative', padding: '8px 40px 8px 14px', color: '#fff',
            fontSize: '0.74rem', fontWeight: 600, lineHeight: 1.35, textAlign: 'center',
          }}>
            Demostración con datos de ejemplo · preparada para <strong>{cfg.nombre}</strong> por Zahir Vidahurrázaga
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
        <Interruptor rol={rol} alCambiar={(r) => { setRol(r); setVista('portal'); }} />
      </div>

      <div
        onClickCapture={atraparNavegacion}
        style={{
          minHeight: '100vh', background: 'var(--app-bg)',
          paddingTop: `${altoEncabezado}px`,
        }}
      >
        {rol === 'clienta' && (
          <>
            {vista === 'portal' && <Portal />}
            {vista === 'agenda' && <Agenda />}
            {vista === 'evolucion' && <Evolucion />}
            {vista === 'nutricion' && <Nutricion />}
            {vista === 'cafeteria' && <Cafeteria />}
            {vista === 'eventos' && <Eventos />}
            {vista === 'cumpleanos' && <Cumpleanos />}
          </>
        )}
        {rol === 'recepcion' && <Recepcion />}
        {rol === 'coach' && <Coach />}
        {rol === 'barista' && <Barista />}
        {rol === 'admin' && <Admin />}
      </div>

    </DemoProvider>
  );
}
