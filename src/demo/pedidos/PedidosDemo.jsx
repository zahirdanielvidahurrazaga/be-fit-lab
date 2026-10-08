import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { ArrowLeft, Bike, ChefHat, Compass, LayoutDashboard, Loader2, MessageCircle, RotateCcw, Smartphone, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { errorLegible } from './datos';
import { useAncho } from './ui';
import Cliente from './Cliente';
import Cocina from './Cocina';
import Reparto from './Reparto';
import Dueno from './Dueno';

// ─────────────────────────────────────────────────────────────────────────────
// MAQUETA DE PEDIDOS EN LÍNEA — /pedidos/<negocio>
//
// Corre contra la base de DEMOSTRACIONES con datos reales (10_pedidos.sql):
// cada rol de la barra es una cuenta de prueba y la sesión vive solo en esta
// pestaña (ver lib/supabase.js), así se puede tener al cliente en una pestaña
// y a la cocina en otra viendo entrar el pedido. La base se reinicia cada
// noche (pedidos_reset) y desde la guía.
// ─────────────────────────────────────────────────────────────────────────────

const CONTRASENA = 'StudioAlma-Demo-2026';
const WHATSAPP_AUTOR = '528138833422';

const ROLES = [
  { id: 'cliente', etiqueta: 'Cliente', Icon: Smartphone, correo: (n) => `ana@demo.${n}.mx` },
  { id: 'cocina', etiqueta: 'Cocina', Icon: ChefHat, correo: (n) => `cocina@demo.${n}.mx` },
  { id: 'repartidor', etiqueta: 'Reparto', Icon: Bike, correo: (n) => `reparto@demo.${n}.mx` },
  { id: 'dueno', etiqueta: 'Dueño', Icon: LayoutDashboard, correo: (n) => `dueno@demo.${n}.mx` },
];

const GUIA = {
  cliente: [
    'Elige "A domicilio", agrega un bowl y escoge su base y proteína extra.',
    'Paga con la tarjeta 4242 (o prueba la 4000…0002 para ver un rechazo).',
    'Abre otra pestaña en "Cocina": el pedido entra solo, en vivo.',
  ],
  cocina: [
    'Los pedidos nuevos llegan resaltados. "Empezar" y "Marcar listo" avisan al cliente al instante.',
    'Los de domicilio, al quedar listos, pasan al repartidor.',
  ],
  repartidor: [
    '"Salir a entregar" y "Marcar entregado" mueven el seguimiento del cliente.',
    'El botón Mapa abre la dirección en Google Maps.',
  ],
  dueno: [
    'Hoy: ventas, ticket promedio y lo más pedido, al día.',
    'Menú: marca algo como agotado y desaparece del menú del cliente.',
    'Mesas QR: cada código abre el menú ya en esa mesa.',
  ],
};

export default function PedidosDemo() {
  const { negocio: clave } = useParams();
  const [negocio, setNegocio] = useState(undefined);
  const [rol, setRol] = useState('cliente');
  const [sesion, setSesion] = useState(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [errorSesion, setErrorSesion] = useState('');
  const [guia, setGuia] = useState(false);
  const [reiniciando, setReiniciando] = useState(false);
  const [sello, setSello] = useState(true);
  const ancho = useAncho(760);
  const encabezado = useRef(null);
  const [alto, setAlto] = useState(100);
  const mesaQR = (() => {
    const n = Number(new URLSearchParams(window.location.search).get('mesa'));
    return Number.isInteger(n) && n > 0 ? n : null;
  })();

  const cargarNegocio = useCallback(async () => {
    const { data, error } = await supabase.from('pedidos_negocios').select('*').eq('id', clave).maybeSingle();
    if (error) return; // falla de red: se queda lo que había (no "negocio inexistente")
    setNegocio(data || null);
  }, [clave]);
  // Ajustes del dueño (abierto, envío, modalidades) en vivo en todas las pestañas.
  useEffect(() => {
    cargarNegocio();
    const canal = supabase.channel(`pedidos-negocio-${clave}-${Math.random().toString(36).slice(2, 7)}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos_negocios', filter: `id=eq.${clave}` }, cargarNegocio)
      .subscribe();
    return () => { supabase.removeChannel(canal); };
  }, [clave, cargarNegocio]);

  // Sesión
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSesion(data.session); setCargandoSesion(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSesion(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const correo = ROLES.find((r) => r.id === rol)?.correo(clave);
  const listo = sesion?.user?.email === correo;
  useEffect(() => {
    if (!negocio || cargandoSesion || listo) return;
    let vivo = true;
    setErrorSesion('');
    supabase.auth.signInWithPassword({ email: correo, password: CONTRASENA })
      .then(({ error }) => { if (vivo && error) setErrorSesion(error.message); });
    return () => { vivo = false; };
  }, [negocio, cargandoSesion, listo, correo]);

  // Marca, título y "no indexar" mientras la maqueta está abierta.
  useEffect(() => {
    if (!negocio) return;
    const previoTitulo = document.title;
    const previoFondo = document.body.style.background;
    document.title = `${negocio.nombre} — pedidos en línea (demostración)`;
    document.body.style.background = negocio.marca?.fondo || '#F5F0E6';
    const meta = document.createElement('meta');
    meta.name = 'robots'; meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => { document.title = previoTitulo; document.body.style.background = previoFondo; meta.remove(); };
  }, [negocio]);

  useLayoutEffect(() => {
    const medir = () => setAlto(encabezado.current?.offsetHeight ?? 100);
    medir();
    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, [sello, negocio]);

  if (negocio === null) return <Navigate to="/" replace />;
  if (negocio === undefined) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 size={26} style={{ animation: 'spin 1s linear infinite' }} /></div>;
  }

  const m = negocio.marca || {};
  const vars = {
    '--p-pri': m.primario, '--p-pri-osc': m.primarioOscuro, '--p-acento': m.acento, '--p-fondo': m.fondo,
    '--p-sup': m.superficie, '--p-texto': m.texto, '--p-suave': m.textoSuave, '--p-alto-encabezado': `${alto}px`,
  };

  const reiniciar = async () => {
    setReiniciando(true);
    const { error } = await supabase.rpc('pedidos_reset');
    if (error) { setReiniciando(false); setErrorSesion(errorLegible(error)); return; }
    try { localStorage.removeItem(`pedidos_carrito_${negocio.id}`); } catch { /* sin almacenamiento */ }
    window.location.href = `/pedidos/${negocio.id}`;
  };

  const mensaje = `Hola Zahir, vi la demo de pedidos en línea de ${negocio.nombre} y me interesa para mi negocio.`;

  return (
    <div style={{
      ...vars, minHeight: '100vh', background: 'var(--p-fondo)', color: 'var(--p-texto)',
      fontFamily: "'Avenir Next', 'Segoe UI', system-ui, sans-serif", WebkitFontSmoothing: 'antialiased',
    }}>
      <div ref={encabezado} style={{ position: 'sticky', top: 0, zIndex: 9300, background: 'var(--p-fondo)' }}>
        {sello && (
          <div style={{ position: 'relative', padding: '8px 40px 8px 14px', background: '#1E2A1B', color: '#fff', fontSize: '0.74rem', fontWeight: 600, textAlign: 'center', lineHeight: 1.35 }}>
            Demostración con datos de ejemplo · {negocio.nombre} es un negocio inventado · por Zahir Vidahurrázaga
            <button type="button" onClick={() => setSello(false)} aria-label="Ocultar aviso" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex' }}><X size={15} /></button>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'stretch', gap: 6, padding: '10px 12px', position: 'relative' }}>
          {/* De vuelta al índice con todas las demostraciones */}
          <Link to="/" aria-label="Todas las demos" title="Todas las demos" style={{
            position: ancho ? 'absolute' : 'static', left: 16, top: 10, bottom: 10,
            display: 'flex', alignItems: 'center', gap: 6, padding: ancho ? '0 14px' : '0 11px', borderRadius: 999,
            background: 'rgba(20,28,18,0.92)', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0,
          }}>
            <ArrowLeft size={16} /> {ancho && 'Todas las demos'}
          </Link>
          <div role="group" aria-label="Cambiar de vista en la demostración" style={{ display: 'flex', gap: 3, padding: 5, borderRadius: 999, background: 'rgba(20,28,18,0.92)', overflowX: 'auto', scrollbarWidth: 'none', minWidth: 0 }}>
            {ROLES.map((r) => {
              const activo = rol === r.id;
              return (
                <button key={r.id} type="button" onClick={() => setRol(r.id)} aria-pressed={activo} title={r.etiqueta} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: ancho || activo ? '8px 13px' : '8px 11px', borderRadius: 999, border: 'none', cursor: 'pointer',
                  background: activo ? '#fff' : 'transparent', color: activo ? '#1E2A1B' : 'rgba(255,255,255,0.75)',
                  fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  {/* En el celular solo el rol activo lleva texto, para que quepan todos. */}
                  <r.Icon size={16} strokeWidth={2.4} /> {(ancho || activo) && r.etiqueta}
                </button>
              );
            })}
          </div>
          <button type="button" onClick={() => setGuia((g) => !g)} aria-pressed={guia} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px', borderRadius: 999, border: 'none', cursor: 'pointer', flexShrink: 0,
            background: guia ? '#fff' : 'rgba(20,28,18,0.92)', color: guia ? '#1E2A1B' : '#fff', fontWeight: 700, fontSize: '0.8rem',
          }}><Compass size={16} /> Guía</button>
        </div>
      </div>

      {guia && (
        <aside style={{
          position: 'fixed', zIndex: 9350, right: 12, top: alto + 6, width: 'min(360px, calc(100vw - 24px))', boxSizing: 'border-box',
          background: '#fff', borderRadius: 20, padding: 18, boxShadow: '0 20px 50px rgba(0,0,0,0.25)', color: '#22301E',
          maxHeight: `calc(100vh - ${alto + 24}px)`, overflowY: 'auto',
        }}>
          <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: 4 }}>Qué probar como {ROLES.find((r) => r.id === rol).etiqueta.toLowerCase()}</div>
          <ul style={{ margin: '8px 0 14px', paddingLeft: 18, lineHeight: 1.5, fontSize: '0.9rem' }}>
            {GUIA[rol].map((p) => <li key={p} style={{ marginBottom: 6 }}>{p}</li>)}
          </ul>
          <p style={{ fontSize: '0.82rem', color: '#6B7564', margin: '0 0 14px' }}>
            Todo funciona de verdad: menú, pedidos y avisos viven en una base de datos real. El pago es de prueba: no se cobra nada.
          </p>
          <a href={`https://wa.me/${WHATSAPP_AUTOR}?text=${encodeURIComponent(mensaje)}`} target="_blank" rel="noreferrer" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 14, background: '#25D366', color: '#fff', fontWeight: 800, textDecoration: 'none', marginBottom: 8,
          }}><MessageCircle size={18} /> Quiero esto para mi negocio</a>
          <button type="button" onClick={() => { setGuia(false); reiniciar(); }} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 14,
            border: '1px solid rgba(0,0,0,0.12)', background: '#fff', color: '#22301E', fontWeight: 700, cursor: 'pointer',
          }}><RotateCcw size={16} /> Reiniciar la demostración</button>
        </aside>
      )}

      {listo && !reiniciando ? (
        <main>
          {rol === 'cliente' && <Cliente negocio={negocio} mesaQR={mesaQR} usuario={sesion.user.user_metadata?.full_name} />}
          {rol === 'cocina' && <Cocina negocio={negocio} />}
          {rol === 'repartidor' && <Reparto negocio={negocio} />}
          {rol === 'dueno' && <Dueno negocio={negocio} alCambiarNegocio={cargarNegocio} />}
        </main>
      ) : (
        <div style={{ minHeight: `calc(100vh - ${alto}px)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#6B7564', padding: 24, textAlign: 'center' }}>
          {errorSesion ? <span>No se pudo entrar a la demostración: {errorSesion}</span> : (
            <>
              <Loader2 size={26} style={{ animation: 'spin 1s linear infinite' }} />
              {reiniciando ? 'Reiniciando la demostración…' : `Entrando como ${ROLES.find((r) => r.id === rol).etiqueta.toLowerCase()}…`}
            </>
          )}
        </div>
      )}
    </div>
  );
}
