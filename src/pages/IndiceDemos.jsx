import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ESTUDIOS_DEMO } from '../demo/estudiosDemo';

// ─────────────────────────────────────────────────────────────────────────────
// PORTADA DEL DESPLIEGUE DE MAQUETAS
//
// Solo existe cuando VITE_DEMOS=true. Ocupa la raíz de ese dominio para que, si
// una prospecta borra el path del link que le mandaste, NO aterrice en el sitio
// de Be Fit Lab —la marca de su competencia— sino en algo tuyo.
//
// De paso sirve como página que le puedes mandar a quien pida "ver ejemplos".
// ─────────────────────────────────────────────────────────────────────────────

const AUTOR = 'Zahir Vidahurrazaga';

export default function IndiceDemos() {
  const maquetas = Object.entries(ESTUDIOS_DEMO);

  // index.html trae el título y las etiquetas de Be Fit Lab. Aquí se
  // reemplazan, o la pestaña y la vista previa al compartir el link saldrían
  // con el nombre y la foto de un estudio que no es el tuyo.
  useEffect(() => {
    document.title = `${AUTOR} — apps para estudios de pilates y gimnasios`;
    const resumen = 'Reservas, lista de espera automática, check-in con QR y '
      + 'cobros. Cada estudio tiene su app, con su marca.';
    const poner = (sel, valor) => document.head.querySelector(sel)?.setAttribute('content', valor);
    poner('meta[name="description"]', resumen);
    poner('meta[property="og:title"]', `${AUTOR} — apps para estudios`);
    poner('meta[property="og:description"]', resumen);
    poner('meta[property="og:image"]', '');
    poner('meta[name="twitter:title"]', `${AUTOR} — apps para estudios`);
    poner('meta[name="twitter:description"]', resumen);
    poner('meta[name="twitter:image"]', '');
    poner('meta[name="keywords"]', '');
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#12161A',
      color: '#E8ECF0',
      fontFamily: "'Avenir Next', 'Segoe UI', system-ui, sans-serif",
      padding: 'clamp(32px, 7vw, 88px) clamp(20px, 6vw, 56px)',
      display: 'flex',
      justifyContent: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: '760px', display: 'flex', flexDirection: 'column', gap: '44px' }}>

        <header style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <span style={{
            fontFamily: 'ui-monospace, Menlo, monospace', fontSize: '11px',
            letterSpacing: '0.16em', textTransform: 'uppercase', color: '#7FA394',
          }}>
            {AUTOR}
          </span>
          <h1 style={{
            margin: 0, fontSize: 'clamp(29px, 5.5vw, 44px)', fontWeight: 600,
            letterSpacing: '-0.022em', lineHeight: 1.08, textWrap: 'balance',
            // index.css le pone color oscuro a los h1 y aquí el fondo es oscuro:
            // sin esto el título queda prácticamente invisible.
            color: '#F2F5F8',
          }}>
            Apps para estudios de pilates y gimnasios
          </h1>
          <p style={{
            margin: 0, maxWidth: '54ch', fontSize: 'clamp(15px, 2.2vw, 17px)',
            lineHeight: 1.6, color: '#9AA6B2',
          }}>
            Reservas, lista de espera que llena las clases sola, check-in con QR y
            cobros. Cada estudio tiene su app, con su marca y en su propia cuenta
            de las tiendas. Abajo puedes recorrer una demostración completa.
          </p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {maquetas.map(([clave, cfg]) => (
            <Link
              key={clave}
              to={`/demo/${clave}`}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: '18px', padding: '20px 22px', borderRadius: '4px',
                background: '#1A2027', border: '1px solid #262F38',
                textDecoration: 'none', color: 'inherit',
              }}
            >
              <span style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.01em' }}>
                  {cfg.nombre}
                </span>
                <span style={{ fontSize: '14px', color: '#8E9BA8' }}>
                  {cfg.giro} · {cfg.ciudad}
                  {cfg.esReal ? '' : ' · estudio de ejemplo'}
                </span>
              </span>
              <span aria-hidden="true" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '34px', height: '34px', flexShrink: 0, borderRadius: '999px',
                background: cfg.colores?.primario || '#7FA394', color: '#12161A',
              }}>
                <ArrowRight size={17} strokeWidth={2.5} />
              </span>
            </Link>
          ))}
        </div>

        <p style={{
          margin: 0, paddingTop: '22px', borderTop: '1px solid #222A32',
          fontFamily: 'ui-monospace, Menlo, monospace', fontSize: '12px',
          lineHeight: 1.7, color: '#6E7A86',
        }}>
          Las demostraciones usan datos inventados y no se conectan a ningún
          estudio real. Se reinician al recargar la página.
        </p>

      </div>
    </div>
  );
}
