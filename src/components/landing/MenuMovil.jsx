// Menú del sitio en celular.
//  · BotonMenu: las 3 rayas se convierten en ✕ con resorte (la de en medio se encoge
//    y se va; las otras giran y se cruzan) + rebote al tocar.
//  · MenuMovil: un círculo crema se expande DESDE el botón hasta cubrir la pantalla
//    (misma familia que las transiciones del sitio); al cerrar regresa al botón.
//    Adentro, lista editorial (01, 02…) con los nombres subiendo desde una ranura.
import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowUpRight, LogOut, MessageCircle } from 'lucide-react';

const EASE = [0.16, 1, 0.3, 1];
const RESORTE = { type: 'spring', stiffness: 420, damping: 26 };

export function BotonMenu({ abierto, onClick }) {
  const raya = { position: 'absolute', left: 0, width: 24, height: 2, borderRadius: 2, background: 'var(--black)' };
  return (
    <motion.button className="mobile-toggle" onClick={onClick} aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={abierto}
      whileTap={{ scale: 0.82 }} transition={RESORTE}
      style={{ width: 44, height: 44, position: 'relative' }}>
      <span style={{ position: 'relative', width: 24, height: 18, display: 'block' }}>
        <motion.span style={{ ...raya, top: 0 }} animate={abierto ? { top: 8, rotate: 45 } : { top: 0, rotate: 0 }} transition={RESORTE} />
        <motion.span style={{ ...raya, top: 8 }} animate={abierto ? { scaleX: 0, opacity: 0 } : { scaleX: 1, opacity: 1 }} transition={{ duration: 0.18 }} />
        <motion.span style={{ ...raya, top: 16 }} animate={abierto ? { top: 8, rotate: -45 } : { top: 16, rotate: 0 }} transition={RESORTE} />
      </span>
    </motion.button>
  );
}

export function MenuMovil({ abierto, origen, items, onIr, onCerrar, user, destinoCuenta, onLogout, whatsapp, instagram }) {
  const reduce = useReducedMotion();
  const x = origen?.x ?? (typeof window !== 'undefined' ? window.innerWidth - 40 : 0);
  const y = origen?.y ?? 40;
  const cerrado = `circle(0px at ${x}px ${y}px)`;
  const lleno = `circle(160vmax at ${x}px ${y}px)`;

  return (
    <AnimatePresence>
      {abierto && (
        <motion.div key="menu-movil" className="menu-movil"
          initial={reduce ? { opacity: 0 } : { clipPath: cerrado }}
          animate={reduce ? { opacity: 1 } : { clipPath: lleno }}
          exit={reduce ? { opacity: 0 } : { clipPath: cerrado, transition: { duration: 0.55, ease: [0.76, 0, 0.24, 1], delay: 0.12 } }}
          transition={{ duration: 0.75, ease: [0.76, 0, 0.24, 1] }}>
          {/* Luz cálida de fondo */}
          <div aria-hidden="true" style={{ position: 'absolute', top: '-20%', right: '-30%', width: '90vw', height: '90vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,145,77,0.18), transparent 65%)', pointerEvents: 'none' }} />

          <nav className="menu-movil-lista" aria-label="Menú">
            {items.map(([label, id], i) => (
              <motion.button key={id} className="menu-movil-item" onClick={() => onIr(id)}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.15 } }}
                transition={{ duration: 0.3, delay: 0.25 + i * 0.05 }}>
                <span className="menu-movil-num">{String(i + 1).padStart(2, '0')}</span>
                <span style={{ display: 'block', overflow: 'hidden', flex: 1, textAlign: 'left' }}>
                  <motion.span style={{ display: 'block' }}
                    initial={reduce ? false : { y: '110%' }} animate={{ y: '0%' }} exit={{ y: '-110%', transition: { duration: 0.25, ease: EASE, delay: i * 0.02 } }}
                    transition={{ duration: 0.8, ease: EASE, delay: 0.28 + i * 0.055 }}>
                    {label}
                  </motion.span>
                </span>
                <ArrowUpRight size={22} className="menu-movil-flecha" />
              </motion.button>
            ))}
          </nav>

          <motion.div className="menu-movil-pie"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.15 } }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.7 }}>
            <Link to={destinoCuenta} className="menu-movil-cta" onClick={() => onCerrar?.()}>{user ? 'Mi portal' : 'Iniciar sesión'}</Link>
            {/* Íconos del mismo tamaño que el botón, centrados con él. */}
            <div className="menu-movil-redes">
              {whatsapp && <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><MessageCircle size={21} /></a>}
              {instagram && (
                <a href={instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
                  </svg>
                </a>
              )}
              {user && <button onClick={onLogout} aria-label="Cerrar sesión"><LogOut size={20} /></button>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
