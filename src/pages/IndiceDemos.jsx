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
    // Cristal y esferas: es lo que hace que el portafolio no se vea plano.
    cristal: 'rgba(45, 45, 45, 0.6)',
    cristalBorde: 'rgba(255, 255, 255, 0.1)',
    sheenTop: 'rgba(255, 255, 255, 0.16)',
    sheenBottom: 'rgba(255, 255, 255, 0.05)',
    sheenTopHover: 'rgba(255, 255, 255, 0.24)',
    sheenBottomHover: 'rgba(255, 255, 255, 0.09)',
    sombraTarjeta: '0 12px 34px rgba(0, 0, 0, 0.3)',
    sombraHover: '0 24px 60px rgba(0, 0, 0, 0.45)',
    glowAzul: 'rgba(10, 132, 255, 0.55)',
    glowMorado: 'rgba(191, 90, 242, 0.5)',
    glowIndigo: 'rgba(94, 92, 230, 0.2)',
    glowOpacidad: 0.75,
  },
  light: {
    fondo: '#ffffff', tarjeta: '#ffffff',
    borde: 'rgba(0,0,0,0.12)', bordeSuave: 'rgba(0,0,0,0.06)',
    texto: '#1d1d1f', fuerte: '#000000', tenue: '#6e6e73',
    azul: '#0071e3', azulHover: '#0056b3',
    degradadoTitulo: 'linear-gradient(135deg, #1d1d1f 0%, #6e6e73 100%)',
    cristal: 'rgba(255, 255, 255, 0.6)',
    cristalBorde: 'rgba(0, 0, 0, 0.08)',
    sheenTop: 'rgba(255, 255, 255, 0.85)',
    sheenBottom: 'rgba(255, 255, 255, 0.35)',
    sheenTopHover: 'rgba(255, 255, 255, 0.95)',
    sheenBottomHover: 'rgba(255, 255, 255, 0.5)',
    sombraTarjeta: '0 12px 34px rgba(0, 0, 0, 0.09)',
    sombraHover: '0 24px 60px rgba(0, 0, 0, 0.13)',
    glowAzul: 'rgba(10, 132, 255, 0.46)',
    glowMorado: 'rgba(191, 90, 242, 0.42)',
    glowIndigo: 'rgba(94, 92, 230, 0.2)',
    glowOpacidad: 0.85,
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
        /* Las dos esferas del hero del portafolio: radial-gradient enorme con
           blur(120px) paseándose lento. Es lo que le quita lo plano. */
        .demos-esfera {
          position: fixed; top: 0; left: 0; border-radius: 50%;
          filter: blur(120px); opacity: ${C.glowOpacidad};
          pointer-events: none; will-change: transform; z-index: 0;
        }
        .demos-esfera-a {
          width: 620px; height: 620px; margin: -310px;
          background: radial-gradient(circle, ${C.glowAzul} 0%, ${C.glowIndigo} 55%, transparent 72%);
          animation: demosRoamA 26s ease-in-out infinite;
        }
        .demos-esfera-b {
          width: 680px; height: 680px; margin: -340px;
          background: radial-gradient(circle, ${C.glowMorado} 0%, ${C.glowIndigo} 55%, transparent 72%);
          animation: demosRoamB 30s ease-in-out infinite;
        }
        @keyframes demosRoamA {
          0%   { transform: translate(18vw, 28vh); }
          25%  { transform: translate(72vw, 16vh); }
          50%  { transform: translate(86vw, 72vh); }
          75%  { transform: translate(34vw, 82vh); }
          100% { transform: translate(18vw, 28vh); }
        }
        @keyframes demosRoamB {
          0%   { transform: translate(82vw, 76vh); }
          25%  { transform: translate(28vw, 84vh); }
          50%  { transform: translate(16vw, 24vh); }
          75%  { transform: translate(76vw, 30vh); }
          100% { transform: translate(82vw, 76vh); }
        }
        .demos-titulo {
          background: ${C.degradadoTitulo};
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .demos-tarjeta {
          position: relative; overflow: hidden;
          background: ${C.cristal};
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid ${C.cristalBorde};
          box-shadow: ${C.sombraTarjeta};
          transition: border-color .3s ease, transform .3s ease, box-shadow .3s ease;
        }
        /* El brillo de arriba: lo que hace que el cristal parezca cristal. */
        .demos-tarjeta::before {
          content: ''; position: absolute; inset: 0; border-radius: inherit;
          background: linear-gradient(180deg, ${C.sheenTop} 0%, ${C.sheenBottom} 40%, transparent 70%);
          pointer-events: none; transition: background .3s ease;
        }
        .demos-tarjeta:hover {
          border-color: ${C.azul};
          transform: translateY(-3px);
          box-shadow: ${C.sombraHover};
        }
        .demos-tarjeta:hover::before {
          background: linear-gradient(180deg, ${C.sheenTopHover} 0%, ${C.sheenBottomHover} 40%, transparent 70%);
        }
        .demos-tarjeta > * { position: relative; z-index: 1; }
        .demos-tarjeta:focus-visible { outline: 2px solid ${C.azul}; outline-offset: 3px; }
        .demos-flecha { transition: transform .25s ease, background .25s ease; }
        .demos-tarjeta:hover .demos-flecha { transform: translateX(3px); background: ${C.azulHover}; }
        @media (prefers-reduced-motion: reduce) {
          .demos-tarjeta, .demos-flecha { transition: none; }
          .demos-tarjeta:hover { transform: none; }
          .demos-esfera-a { animation: none; transform: translate(25vw, 30vh); }
          .demos-esfera-b { animation: none; transform: translate(78vw, 70vh); }
        }
      `}</style>

      <div className="demos-esfera demos-esfera-a" aria-hidden="true" />
      <div className="demos-esfera demos-esfera-b" aria-hidden="true" />

      <div style={{
        position: 'relative', zIndex: 1,
        maxWidth: '820px', margin: '0 auto',
        padding: 'clamp(28px, 6vw, 76px) clamp(20px, 6vw, 40px) clamp(56px, 9vw, 100px)',
        display: 'flex', flexDirection: 'column', gap: 'clamp(38px, 6vw, 56px)',
      }}>

        {/* Marca. Sin el tile de la Z: al lado del nombre repetía lo mismo. */}
        <span style={{ fontSize: '15px', fontWeight: 600, color: C.texto, letterSpacing: '-0.01em' }}>
          {AUTOR}
        </span>

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
                boxShadow: `0 8px 26px ${C.azul}47`,
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
