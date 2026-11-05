import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import { Wallet, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ESTUDIO } from '../config/estudio';
import { addToAppleWallet, addToGoogleWallet, getWalletPlatform } from '../hooks/useWallet';
import { isPlanExpired, formatPlanDate } from '../lib/membership';

// ─────────────────────────────────────────────────────────────────────────────
// PASE QR de la clienta (una sola hoja para Portal, Agenda, Progreso y Comida).
//
// Forma de boleto (muescas + perforación) pero SIN pretender ser un pase: poco
// texto. Flota sobre el fondo difuminado, sin hoja detrás.
// Animación: al abrir, la parte de arriba baja y el talón sube y se UNEN en la
// perforación; al cerrar se separan (como cortar el talón) y se van.
// El QR codifica el id de la clienta, igual que siempre: el check-in no cambia.
// ─────────────────────────────────────────────────────────────────────────────

const DURAZNO = '/favicon_peach.png';
const resorte = { type: 'spring', damping: 22, stiffness: 240 };

// modo 'coach': mismo QR (su id, para checar entrada del staff), parte de arriba
// en verde salvia, sin plan/vigencia ni Wallet.
export default function PaseQR({ open, onClose, modo = 'socia' }) {
  const esCoach = modo === 'coach';
  const { user, profileName, plan, classesRemaining, planExpiresAt, membershipStatus } = useAuth();
  const walletPlatform = getWalletPlatform();
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletAdded, setWalletAdded] = useState(() => { try { return !!localStorage.getItem('befit_wallet_added'); } catch { return false; } });
  const [walletError, setWalletError] = useState(null);

  // Cerrar con Esc (computadora de recepción) y bloquear el scroll de atrás.
  useEffect(() => {
    if (!open) return;
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', esc); document.body.style.overflow = prev; };
  }, [open, onClose]);

  const agregarWallet = async () => {
    if (!user?.id || walletLoading) return;
    setWalletLoading(true); setWalletError(null);
    const r = walletPlatform === 'google' ? await addToGoogleWallet(user.id) : await addToAppleWallet(user.id);
    setWalletLoading(false);
    if (r.success) { setWalletAdded(true); try { localStorage.setItem('befit_wallet_added', '1'); } catch { /* sin storage */ } }
    else setWalletError(r.reason || 'No se pudo agregar.');
  };

  const nombre = profileName || user?.user_metadata?.full_name || `Socia ${ESTUDIO.nombre}`;
  const ilimitada = (classesRemaining ?? 0) >= 9000;
  const vencida = membershipStatus !== 'ACTIVE' || isPlanExpired(planExpiresAt);
  const plan2 = (plan || '').replace(/^Plan\s+/i, '');
  const saldo = ilimitada ? 'Ilimitadas' : `${classesRemaining ?? 0} ${classesRemaining === 1 ? 'clase' : 'clases'}`;
  const vigencia = planExpiresAt
    ? `${vencida ? 'Venció' : 'Hasta'} ${formatPlanDate(planExpiresAt, true)}`
    : (vencida ? 'Sin plan vigente' : null);

  return (
    <AnimatePresence>
      {open && (
        <motion.div key="pase" className="pq-fondo" onClick={onClose}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.28, delay: 0.08 } }}
          role="dialog" aria-modal="true" aria-label="Tu pase QR">
          <motion.button className="pq-cerrar" onClick={onClose} aria-label="Cerrar"
            initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1, transition: { delay: 0.25 } }} exit={{ opacity: 0, scale: 0.6 }}>
            <X size={20} />
          </motion.button>

          {/* El boleto: deslizar hacia abajo también lo cierra */}
          <motion.div className={`pq${esCoach ? ' pq-coach' : ''}`} onClick={(e) => e.stopPropagation()}
            drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0.08, bottom: 0.5 }}
            onDragEnd={(e, info) => { if (info.offset.y > 110 || info.velocity.y > 600) onClose(); }}>

            {/* Parte de arriba: baja y se une; al cerrar sube y se va */}
            <motion.div className="pq-arriba"
              initial={{ y: -140, opacity: 0, rotate: -4 }}
              animate={{ y: 0, opacity: 1, rotate: 0, transition: resorte }}
              exit={{ y: -160, opacity: 0, rotate: -6, transition: { duration: 0.32, ease: [0.4, 0, 1, 1] } }}>
              <img src={DURAZNO} alt="" className="pq-marca-agua" aria-hidden="true" />
              <div className="pq-durazno"><img src={DURAZNO} alt={ESTUDIO.nombre} /></div>
              <div className="pq-nombre">{nombre}</div>
              {esCoach ? (
                <>
                  <div className="pq-plan">Coach · {ESTUDIO.nombre}</div>
                  <div className="pq-chips"><span className="pq-chip">Checa tu entrada al llegar</span></div>
                </>
              ) : (
                <>
                  {plan2 && <div className="pq-plan">{plan2}</div>}
                  <div className="pq-chips">
                    <span className="pq-chip">{saldo}</span>
                    {vigencia && <span className={`pq-chip${vencida ? ' pq-chip-vencida' : ''}`}>{vigencia}</span>}
                  </div>
                </>
              )}
            </motion.div>

            {/* Talón: sube y se une; al cerrar baja y se va (como cortarlo) */}
            <motion.div className="pq-talon"
              initial={{ y: 160, opacity: 0, rotate: 4 }}
              animate={{ y: 0, opacity: 1, rotate: 0, transition: { ...resorte, delay: 0.06 } }}
              exit={{ y: 180, opacity: 0, rotate: 7, transition: { duration: 0.32, ease: [0.4, 0, 1, 1] } }}>
              <div className="pq-corte" aria-hidden="true"><span /></div>
              <div className="pq-qr">
                <QRCodeCanvas value={user?.id || 'befit-client-id'} size={210} level="H" includeMargin={false} fgColor="#2E211A" bgColor="#FBF5EE" />
              </div>
            </motion.div>
          </motion.div>

          {!esCoach && (walletPlatform === 'apple' || walletPlatform === 'google') && (
            <motion.div className="pq-pie" onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }} exit={{ opacity: 0, y: 16 }}>
              <button onClick={agregarWallet} disabled={walletLoading} className="pq-wallet"
                style={{ background: walletPlatform === 'google' ? '#1a73e8' : '#000', opacity: walletLoading ? 0.7 : 1 }}>
                <Wallet size={18} color="#fff" />
                {walletLoading ? 'Generando…'
                  : walletPlatform === 'google' ? 'Agregar a Google Wallet'
                  : walletAdded ? 'Actualizar en Apple Wallet' : 'Agregar a Apple Wallet'}
              </button>
              {walletError && <p className="pq-error">{walletError}</p>}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
