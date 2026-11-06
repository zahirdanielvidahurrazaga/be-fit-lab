// Portada del sitio (computadora y celular; el CSS .hero-portada* ajusta cada tamaño).
// Referencia: A24 (foto a pantalla completa con marco y título gigante). Versión
// limpia por pedido de Zahir: sin barra propia (se usa la del sitio), sin antetítulo
// ni dato; solo foto, título y botones.
// La foto es el recorte de la ORIGINAL (IMG_5383, 2164×1600): nítida a todo lo ancho.
import React from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { ArrowRight, Smartphone } from 'lucide-react';
import BotonDeslizable from './BotonDeslizable';

const EASE = [0.16, 1, 0.3, 1];
const serif = { fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontWeight: 400, letterSpacing: '-0.035em' };

/** Línea que sube desde una "ranura" al entrar. */
function Ranura({ children, retraso = 0, style }) {
  const reduce = useReducedMotion();
  return (
    <span style={{ display: 'block', overflow: 'hidden', paddingBottom: '0.06em', marginBottom: '-0.06em' }}>
      <motion.span style={{ display: 'block', ...style }}
        initial={reduce ? false : { y: '105%' }} animate={{ y: '0%' }}
        transition={{ duration: 1.1, ease: EASE, delay: 0.35 + retraso }}>
        {children}
      </motion.span>
    </span>
  );
}

export default function HeroEscritorio({ user, destinoPortal, precioClase, onPrimeraClase, onApp, onEntrar }) {
  const reduce = useReducedMotion();
  const ref = React.useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  // En celular el título no se mueve con el scroll (el ajuste por JS hacía temblar la portada).
  const [tactil] = React.useState(() => typeof window !== 'undefined' && (window.matchMedia?.('(hover: none), (pointer: coarse)').matches || window.innerWidth <= 768));
  const quieto = reduce || tactil;
  const yTexto = useTransform(scrollYProgress, [0, 1], [0, quieto ? 0 : -140]);
  const opTexto = useTransform(scrollYProgress, [0, 0.65], [1, quieto ? 1 : 0]);
  const aparece = (retraso) => ({ initial: reduce ? false : { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 1, ease: EASE, delay: retraso } });

  return (
    // Alto y foto por tamaño de pantalla en index.css (.hero-portada*): en computadora,
    // la pantalla pero nunca más "aplastada" que 1.75:1 (si no, la foto se recortaba de
    // más); en celular, el alto visible de la pantalla con la foto vertical.
    <section ref={ref} className="hero-portada">
      {/* Foto enmarcada: entra a sangre y se acomoda con marco crema y esquinas. */}
      <motion.div
        initial={reduce ? false : { top: 0, left: 0, right: 0, bottom: 0, borderRadius: 0 }}
        animate={{ top: 14, left: 14, right: 14, bottom: 14, borderRadius: 22 }}
        transition={{ duration: 1.4, ease: EASE }}
        style={{ position: 'absolute', top: 14, left: 14, right: 14, bottom: 14, borderRadius: 22, overflow: 'hidden' }}>
        <motion.div
          initial={reduce ? false : { scale: 1.16 }} animate={{ scale: 1 }} transition={{ duration: 2.4, ease: EASE }}
          className="hero-portada-foto" style={{ position: 'absolute', inset: 0 }} />
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(to top, rgba(14,10,8,.82) 0%, rgba(14,10,8,.42) 34%, transparent 68%), linear-gradient(to bottom, rgba(255,250,245,.45), transparent 18%)' }} />
      </motion.div>

      {/* Título + botones: pegados abajo a la izquierda de la foto (pedido de Zahir). */}
      <div className="hero-portada-texto">
      <motion.div style={{ color: '#fff', y: yTexto, opacity: opTexto }}>
        <h1 className="hero-portada-h1">
          <Ranura>{user ? 'Bienvenida a' : 'Mujer, tu salud es'}</Ranura>
          <Ranura retraso={0.12} style={{ ...serif, color: 'var(--primary)' }}>{user ? 'tu espacio VIP.' : 'tu mejor inversión.'}</Ranura>
        </h1>
        <motion.div {...aparece(1.05)} className="hero-portada-botones">
          {user ? (
            <button className="glass-button" style={{ background: 'var(--primary)', color: '#fff', border: 'none' }} onClick={() => onEntrar(destinoPortal)}>Ir a mi Portal <ArrowRight size={20} /></button>
          ) : (
            <>
              {/* Cápsula deslizable con bolita de vidrio líquido. Texto corto para que mida lo mismo que "Descubre la App". */}
              <BotonDeslizable texto="Agenda tu clase" onCompletar={onPrimeraClase} />
              {/* En celular queda como círculo de vidrio con el ícono (una sola píldora protagonista). */}
              <button className="glass-button boton-app" style={{ color: '#fff' }} onClick={onApp} aria-label="Descubre la App"><Smartphone size={20} /> <span className="boton-texto">Descubre la App</span></button>
            </>
          )}
        </motion.div>
      </motion.div>
      </div>

    </section>
  );
}
