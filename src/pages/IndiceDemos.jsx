import { useEffect, useState } from 'react';
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
// El estilo es el MISMO del portafolio (github.com/zahirdanielvidahurrazaga/
// Portafolio): negro Apple, azul #0A84FF, SF Pro y el tile con la Z. Una
// prospecta que llegue aquí desde el portafolio, o al revés, tiene que sentir
// que es la misma persona. Los valores están copiados de su src/index.css.
// ─────────────────────────────────────────────────────────────────────────────

const AUTOR = 'Zahir Vidahurrázaga';

// Las dos paletas del portafolio, copiadas de su src/index.css.
const PALETAS = {
  dark: {
    fondo: '#000000', tarjeta: '#1d1d1f',
    borde: 'rgba(255,255,255,0.1)', bordeSuave: 'rgba(255,255,255,0.05)',
    texto: '#f5f5f7', fuerte: '#ffffff', tenue: '#86868b',
    azul: '#0a84ff', azulHover: '#409cff',
    degradadoTitulo: 'linear-gradient(135deg, #ffffff 0%, #a5a5ac 100%)',
    sombraTarjeta: 'none',
  },
  light: {
    fondo: '#ffffff', tarjeta: '#ffffff',
    borde: 'rgba(0,0,0,0.12)', bordeSuave: 'rgba(0,0,0,0.06)',
    texto: '#1d1d1f', fuerte: '#000000', tenue: '#6e6e73',
    azul: '#0071e3', azulHover: '#0056b3',
    degradadoTitulo: 'linear-gradient(135deg, #1d1d1f 0%, #6e6e73 100%)',
    sombraTarjeta: '0 4px 14px rgba(0,0,0,0.06)',
  },
};

// Misma regla que el portafolio (su index.html): manda lo guardado en
// localStorage.tema y, si no hay nada, la preferencia del sistema. Así una
// prospecta ve las dos páginas igual, en el tema que ella usa.
function temaInicial() {
  try {
    const t = localStorage.getItem('tema');
    if (t === 'light' || t === 'dark') return t;
  } catch { /* almacenamiento bloqueado */ }
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

const FUENTE = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', "
  + "Roboto, Helvetica, Arial, sans-serif";

// La marca, tal cual el favicon.svg del portafolio: la Z es un trazo, no texto,
// para que se vea igual aunque el sistema no tenga SF Pro.
function MarcaZ({ size = 30 }) {
  return (
    <svg viewBox="0 0 512 512" width={size} height={size} aria-hidden="true" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="zg-demos" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0A84FF" />
          <stop offset="1" stopColor="#0052CC" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="115" fill="url(#zg-demos)" />
      <path fill="#fff" d="M171.85 365V335.24L282.74 185.52V184.62H174.42V147H337.05V176.69L226.62 326.48V327.38H340.15V365Z" />
    </svg>
  );
}

export default function IndiceDemos() {
  const maquetas = Object.entries(ESTUDIOS_DEMO);
  const [tema, setTema] = useState(temaInicial);
  const C = PALETAS[tema];

  // Si la persona cambia el tema del sistema con la página abierta, seguirla.
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: light)');
    if (!mq) return;
    const alCambiar = () => { try { if (localStorage.getItem('tema')) return; } catch { /* vacío */ }
      setTema(mq.matches ? 'light' : 'dark'); };
    mq.addEventListener('change', alCambiar);
    return () => mq.removeEventListener('change', alCambiar);
  }, []);

  // El <body> conserva el fondo de Be Fit Lab (un beige cálido) y se asomaba
  // por fuera del contenedor. Se pinta con el tema activo y se restaura al salir.
  useEffect(() => {
    const previo = document.body.style.background;
    document.body.style.background = PALETAS[tema].fondo;
    return () => { document.body.style.background = previo; };
  }, [tema]);

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
    <div style={{ minHeight: '100vh', background: C.fondo, fontFamily: FUENTE }}>
      {/* Los :hover y el degradado sobre texto no se pueden en estilos en línea. */}
      <style>{`
        .demos-titulo {
          background: ${C.degradadoTitulo};
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .demos-tarjeta { transition: border-color .25s ease, transform .25s ease, box-shadow .25s ease; }
        .demos-tarjeta:hover {
          border-color: ${C.azul};
          transform: translateY(-2px);
        }
        .demos-tarjeta:focus-visible { outline: 2px solid ${C.azul}; outline-offset: 3px; }
        .demos-flecha { transition: transform .25s ease, background .25s ease; }
        .demos-tarjeta:hover .demos-flecha { transform: translateX(3px); background: ${C.azulHover}; }
        @media (prefers-reduced-motion: reduce) {
          .demos-tarjeta, .demos-flecha { transition: none; }
          .demos-tarjeta:hover { transform: none; }
        }
      `}</style>

      <div style={{
        maxWidth: '820px', margin: '0 auto',
        padding: 'clamp(28px, 6vw, 76px) clamp(20px, 6vw, 40px) clamp(56px, 9vw, 100px)',
        display: 'flex', flexDirection: 'column', gap: 'clamp(38px, 6vw, 56px)',
      }}>

        {/* Marca */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
          <MarcaZ />
          <span style={{ fontSize: '15px', fontWeight: 600, color: C.texto, letterSpacing: '-0.01em' }}>
            {AUTOR}
          </span>
        </div>

        {/* Encabezado */}
        <header style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <h1 className="demos-titulo" style={{
            margin: 0, fontSize: 'clamp(32px, 6vw, 54px)', fontWeight: 700,
            letterSpacing: '-0.03em', lineHeight: 1.06, textWrap: 'balance',
          }}>
            Apps para estudios de pilates y gimnasios
          </h1>
          <p style={{
            margin: 0, maxWidth: '56ch', fontSize: 'clamp(16px, 2.2vw, 19px)',
            lineHeight: 1.55, color: C.tenue, fontWeight: 400,
          }}>
            Reservas, lista de espera que llena las clases sola, check-in con QR y
            cobros. Cada estudio tiene su propia app, con su marca y en su propia
            cuenta de las tiendas. Aquí puedes recorrer una demostración completa.
          </p>
        </header>

        {/* Maquetas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {maquetas.map(([clave, cfg]) => (
            <Link
              key={clave}
              to={`/demo/${clave}`}
              className="demos-tarjeta"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: '18px', padding: 'clamp(18px, 3vw, 24px)', borderRadius: '18px',
                background: C.tarjeta, border: `1px solid ${C.borde}`, boxShadow: C.sombraTarjeta,
                textDecoration: 'none', color: 'inherit',
              }}
            >
              <span style={{ display: 'flex', flexDirection: 'column', gap: '5px', minWidth: 0 }}>
                <span style={{
                  fontSize: 'clamp(17px, 2.4vw, 20px)', fontWeight: 600,
                  color: C.fuerte, letterSpacing: '-0.015em',
                }}>
                  {cfg.nombre}
                </span>
                <span style={{ fontSize: '14.5px', color: C.tenue, lineHeight: 1.45 }}>
                  {cfg.giro} · {cfg.ciudad}
                  {cfg.esReal ? '' : ' · estudio de ejemplo'}
                </span>
              </span>
              <span className="demos-flecha" aria-hidden="true" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '36px', height: '36px', flexShrink: 0, borderRadius: '999px',
                background: C.azul, color: '#fff',
              }}>
                <ArrowRight size={18} strokeWidth={2.5} />
              </span>
            </Link>
          ))}
        </div>

        <p style={{
          margin: 0, paddingTop: '26px', borderTop: `1px solid ${C.bordeSuave}`,
          fontSize: '13px', lineHeight: 1.65, color: C.tenue,
        }}>
          Las demostraciones usan datos inventados y no se conectan a ningún
          estudio real. Se reinician al recargar la página.
        </p>

      </div>
    </div>
  );
}
