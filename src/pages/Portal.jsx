import React, { useState } from 'react';
import { Calendar, Utensils, TrendingUp, User, QrCode, ChevronRight, Activity, Flame, Sparkles, Clock, MapPin, X, Lock, Wallet } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getNextClassOccurrence } from '../hooks/useLocalNotifications';
import { addToAppleWallet, addToGoogleWallet, getWalletPlatform } from '../hooks/useWallet';
import { QRCodeCanvas } from 'qrcode.react';
import { motion } from 'framer-motion';
import { useScrollDetect } from '../hooks/useScrollDetect';
import { Capacitor } from '@capacitor/core';
import BadgeUnlockOverlay from '../components/BadgeUnlockOverlay';

function Portal() {
  const isNative = Capacitor.isNativePlatform();
  const navigate = useNavigate();
  const { user, plan, logout, classesRemaining, myReservations, cancelClass, profileName, globalClasses, avatarUrl, newUnlockedBadge, setNewUnlockedBadge } = useAuth();
  
  const walletPlatform = getWalletPlatform();
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletAdded, setWalletAdded] = useState(() => !!localStorage.getItem('befit_wallet_added'));
  const [walletError, setWalletError] = useState(null);

  const handleAddToWallet = async () => {
    if (!user?.id || walletLoading) return;
    setWalletLoading(true);
    setWalletError(null);
    const result = walletPlatform === 'google'
      ? await addToGoogleWallet(user.id)
      : await addToAppleWallet(user.id);
    setWalletLoading(false);
    if (result.success) {
      setWalletAdded(true);
      localStorage.setItem('befit_wallet_added', '1');
    } else {
      setWalletError(result.reason || 'Error desconocido');
    }
  };

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [cancelError, setCancelError] = useState(false);
  const [showAppBanner, setShowAppBanner] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const isScrolled = useScrollDetect(30);

  const handleCancelClick = (res) => {
    setSelectedReservation(res);
    setShowCancelModal(true);
  };

  const confirmCancellation = async () => {
    if (!selectedReservation) return;
    const result = await cancelClass(selectedReservation.classId);
    if (result?.reason === 'too_late') {
      setCancelError(true);
      return; // Mantener el modal abierto con el error
    }
    setCancelError(false);
    setShowCancelModal(false);
  };

  const canCancelReservation = (res) => {
    const classObj = globalClasses?.find(c => c.id === res.classId);
    if (!classObj || classObj.day === undefined || !classObj.time) return true;
    const nextOccurrence = getNextClassOccurrence(classObj.day, classObj.time);
    const fiveHoursBefore = new Date(nextOccurrence.getTime() - 5 * 60 * 60 * 1000);
    return new Date() < fiveHoursBefore;
  };

  const rawName = profileName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Cliente';
  const userName = rawName.split(' ')[0]; // Solo el primer nombre para el saludo
  const greeting = new Date().getHours() < 12 ? 'Buenos días' : new Date().getHours() < 18 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="mobile-app-container" style={{ background: 'var(--app-bg)' }}>
      <BadgeUnlockOverlay badge={newUnlockedBadge} onClose={() => setNewUnlockedBadge(null)} />

      {/* HEADER UNIFICADO */}
      <header className="ios-header" style={{ paddingBottom: '5px', background: 'transparent' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: '0 0 2px', fontWeight: 600 }}>{greeting}</p>
            <h1 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', margin: 0, lineHeight: 1.1, color: 'var(--black)' }}>{userName}</h1>
          </motion.div>
          <div style={{ position: 'relative' }}>
            <div
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              style={{
                width: '42px', height: '42px', borderRadius: '50%',
                background: avatarUrl ? 'transparent' : 'rgba(255,139,66,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', overflow: 'hidden',
                border: avatarUrl ? '2px solid #FF8B42' : 'none',
                boxShadow: avatarUrl ? '0 4px 12px rgba(255,139,66,0.3)' : 'none'
              }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={20} color="var(--primary)" />
              )}
            </div>

            {/* DROPDOWN PERFIL */}
            {showProfileMenu && (
              <div className="profile-dropdown">
                <div style={{ padding: '10px 15px', borderBottom: '1px solid rgba(55,61,59,0.05)', marginBottom: '5px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{userName}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)' }}>Socia Activa</div>
                </div>
                <div className="profile-dropdown-item" onClick={() => { navigate('/mi-cuenta'); setShowProfileMenu(false); }}>
                   Mi Cuenta
                </div>
                <div className="profile-dropdown-item" onClick={() => { navigate('/ajustes'); setShowProfileMenu(false); }}>
                   Ajustes
                </div>
                <div className="profile-dropdown-item danger" onClick={logout}>
                   Cerrar Sesión
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="dashboard-main" style={{ paddingTop: '10px' }}>
        
        {/* APP DOWNLOAD BANNER */}
        {!isNative && showAppBanner && (
          <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))', borderRadius: '24px', padding: '20px', marginBottom: '20px', color: 'var(--black)', position: 'relative', boxShadow: '0 10px 25px rgba(238,186,137,0.3)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div onClick={() => setShowAppBanner(false)} style={{ position: 'absolute', top: '15px', right: '15px', cursor: 'pointer', background: 'rgba(0,0,0,0.1)', borderRadius: '50%', padding: '4px' }}>
              <X size={16} />
            </div>
            <div>
              <h3 style={{ margin: '0 0 5px', fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}>La verdadera experiencia Be Fit Lab</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 500, opacity: 0.9 }}>Descarga nuestra aplicación móvil exclusiva para socias. Reserva más rápido, usa tu código QR y sigue tu nutrición.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '5px' }}>
              <a
                href="https://apps.apple.com/mx/app/be-fit-lab/id6772008660"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Descargar Be Fit Lab en App Store"
              >
                <img
                  src="/assets/appstore.svg"
                  alt="Download on the App Store"
                  style={{ height: '42px', cursor: 'pointer', transition: 'transform 0.2s ease', display: 'block' }}
                  onMouseOver={(e) => e.currentTarget.style.transform='scale(1.05)'}
                  onMouseOut={(e) => e.currentTarget.style.transform='scale(1)'}
                />
              </a>
              <img
                src="/assets/googleplay.svg"
                alt="Próximamente en Google Play"
                title="Próximamente en Google Play"
                style={{ height: '42px', cursor: 'not-allowed', opacity: 0.45, filter: 'grayscale(1)', transition: 'opacity 0.2s ease' }}
              />
            </div>
          </div>
        )}

        <div className="dashboard-sidebar">

          {/* MEMBERSHIP CARD - Premium Glow Redesign */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ 
              padding: '28px 24px', borderRadius: '32px', 
              background: 'linear-gradient(135deg, #2D2928 0%, #4A4544 100%)',
              color: 'white',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              position: 'relative', overflow: 'hidden'
            }}
          >
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', background: 'rgba(255,139,66,0.15)', borderRadius: '50%', filter: 'blur(30px)' }}></div>
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Sparkles size={14} color="var(--primary)" />
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Membresía Actual</span>
              </div>
              
              <h2 style={{ fontSize: '1.8rem', color: 'white', marginBottom: '24px', fontFamily: 'var(--font-display)', lineHeight: 1.1 }}>Premium <span style={{ color: 'var(--primary)' }}>Pass</span></h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                 <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white', fontFamily: 'var(--font-display)' }}>{classesRemaining}</div>
                    <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.5)', fontWeight: 800, marginTop: '2px' }}>CLASES</div>
                 </div>
                 <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white', fontFamily: 'var(--font-display)' }}>4</div>
                    <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.5)', fontWeight: 800, marginTop: '2px' }}>RACHA</div>
                 </div>
                 <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--primary)', fontFamily: 'var(--font-display)' }}>ON</div>
                    <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.5)', fontWeight: 800, marginTop: '2px' }}>ESTATUS</div>
                 </div>
              </div>
            </div>
          </motion.div>

          {/* STORIES-STYLE HORIZONTAL SCROLL */}
          <motion.section 
            initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{duration:0.5, delay:0.15}}
            style={{ marginTop: '25px' }}
          >
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '15px', fontFamily: 'var(--font-display)', color: 'var(--black)' }}>Explora</h2>
            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '5px', marginLeft: '-5px', paddingLeft: '5px', paddingRight: '5px' }}>
              
              {/* Story Card - Nutrición */}
              <div 
                onClick={() => navigate('/nutricion')}
                style={{ 
                  flex: '0 0 auto', width: '140px', height: '180px', borderRadius: '24px', 
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                  padding: '20px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  cursor: 'pointer', position: 'relative', overflow: 'hidden',
                  boxShadow: '0 12px 30px rgba(255,139,66,0.2)'
                }}
              >
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', background: 'rgba(255,255,255,0.15)', borderRadius: '50%' }}></div>
                <Utensils size={28} color="white" strokeWidth={2} />
                <div>
                  <div style={{ color: 'white', fontWeight: 800, fontSize: '1rem', fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>Nutrición</div>
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.7rem', fontWeight: 600, marginTop: '3px' }}>Tu recetario</div>
                </div>
              </div>

              {/* Story Card - Evolución */}
              <div 
                onClick={() => navigate('/evolucion')}
                style={{ 
                  flex: '0 0 auto', width: '140px', height: '180px', borderRadius: '24px', 
                  background: 'var(--surface-low)',
                  padding: '20px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  cursor: 'pointer', position: 'relative', overflow: 'hidden',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--card-shadow)'
                }}
              >
                <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', width: '80px', height: '80px', background: 'rgba(255,139,66,0.08)', borderRadius: '50%' }}></div>
                <Activity size={28} color="var(--primary)" strokeWidth={2} />
                <div>
                  <div style={{ color: 'var(--on-surface)', fontWeight: 800, fontSize: '1rem', fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>Evolución</div>
                  <div style={{ color: 'var(--on-surface-variant)', fontSize: '0.7rem', fontWeight: 600, marginTop: '3px' }}>Tu progreso</div>
                </div>
              </div>

              {/* Story Card - Agenda */}
              <div 
                onClick={() => navigate('/agenda')}
                style={{ 
                  flex: '0 0 auto', width: '140px', height: '180px', borderRadius: '24px', 
                  background: 'var(--surface-low)',
                  padding: '20px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  cursor: 'pointer', position: 'relative', overflow: 'hidden',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--card-shadow)'
                }}
              >
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', background: 'rgba(255,139,66,0.06)', borderRadius: '50%' }}></div>
                <Calendar size={28} color="var(--primary)" strokeWidth={2} />
                <div>
                  <div style={{ color: 'var(--black)', fontWeight: 800, fontSize: '1rem', fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>Reservar</div>
                  <div style={{ color: 'var(--on-surface-variant)', fontSize: '0.7rem', fontWeight: 600, marginTop: '3px' }}>Agendar clase</div>
                </div>
              </div>
            </div>
          </motion.section>
        </div>

        <div className="dashboard-content" style={{ zIndex: 1, position: 'relative' }}>

          {/* PRÓXIMA CLASE - TICKET STYLE */}
          <motion.section initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{duration:0.5, delay:0.25}}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, fontFamily: 'var(--font-display)', color: 'var(--black)' }}>Próximas clases</h2>
              <Link to="/agenda" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textDecoration: 'none' }}>Ver todo →</Link>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {myReservations && myReservations.length > 0 ? (
                myReservations.map((res, index) => (
                  <TicketCard
                    key={index}
                    title={res.title}
                    time={res.time}
                    instructor={res.instructor}
                    color={res.color || 'var(--primary)'}
                    canCancel={canCancelReservation(res)}
                    onClick={() => handleCancelClick(res)}
                  />
                ))
              ) : (
                <div style={{ 
                  padding: '40px 20px', textAlign: 'center', color: 'var(--on-surface-variant)', 
                  background: 'var(--app-surface-solid)', borderRadius: '24px', border: '1px dashed var(--border-subtle)'
                }}>
                  <Calendar size={36} color="var(--on-surface-variant)" style={{ opacity: 0.2, margin: '0 auto 12px' }} />
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: 'var(--on-surface)' }}>Sin clases agendadas</p>
                  <p style={{ margin: '5px 0 0', fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>Reserva tu próxima sesión</p>
                  <Link to="/agenda" style={{ 
                    display: 'inline-block', marginTop: '15px', color: 'white', fontWeight: 700, 
                    textDecoration: 'none', background: 'var(--primary)', padding: '10px 24px', 
                    borderRadius: '14px', fontSize: '0.85rem',
                    boxShadow: '0 8px 20px rgba(255,139,66,0.3)'
                  }}>Agendar ahora</Link>
                </div>
              )}
            </div>
          </motion.section>

          {/* WEEKLY STATS MINI */}
          <motion.section initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{duration:0.5, delay:0.35}} style={{ marginTop: '25px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '15px', fontFamily: 'var(--font-display)', color: 'var(--black)' }}>Tu semana</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <StatPill icon={<Flame size={16} />} value="1.2k" label="kcal" color="var(--primary)" />
              <StatPill icon={<Activity size={16} />} value="3" label="clases" color="#2D2928" />
              <StatPill icon={<Sparkles size={16} />} value="85" label="pts" color="var(--accent)" />
            </div>
          </motion.section>
        </div>

      </main>

      {/* MODAL INTEGRADO PARA CANCELAR */}
      {showCancelModal && (
        <div className="modal-overlay" onClick={() => { setShowCancelModal(false); setCancelError(false); }}>
          <div className="glass-modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-display)', marginBottom: '15px' }}>Detalle de Reserva</h2>
            <div style={{ background: 'rgba(55,61,59,0.03)', padding: '15px', borderRadius: '16px', marginBottom: '16px', textAlign: 'left' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--on-surface)' }}>{selectedReservation?.title}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, marginTop: '5px' }}>{selectedReservation?.time}</div>
            </div>

            {cancelError ? (
              <div style={{ background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.2)', borderRadius: '16px', padding: '14px', marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <Lock size={16} color="#FF4D4D" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#FF4D4D', fontWeight: 600, lineHeight: 1.5 }}>
                  Ya no es posible cancelar esta clase — faltan menos de 5 horas para que inicie.
                </p>
              </div>
            ) : (
              <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.85rem', marginBottom: '16px', lineHeight: 1.5 }}>
                ¿Deseas cancelar esta asistencia? La clase se devolverá a tu paquete. Solo puedes cancelar con <strong>más de 5 horas de anticipación</strong>.
              </p>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => { setShowCancelModal(false); setCancelError(false); }}
                className="btn-outline"
                style={{ flex: 1, padding: '12px', fontSize: '0.9rem' }}
              >
                Volver
              </button>
              {!cancelError && (
                <button
                  onClick={confirmCancellation}
                  className="btn-primary"
                  style={{ flex: 1, padding: '12px', fontSize: '0.9rem', justifyContent: 'center', background: '#FF4D4D', boxShadow: '0 10px 25px rgba(255,77,77,0.3)' }}
                >
                  Cancelar Clase
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QR BOTTOM SHEET */}
      {showQR && (
        <>
          <div className="qr-sheet-overlay" onClick={() => setShowQR(false)} />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) {
                setShowQR(false);
              }
            }}
            className="qr-bottom-sheet" 
            style={{ padding: '12px 24px 20px', background: 'var(--surface)' }}
          >
            <div className="sheet-handle" />
            
            <div className="wallet-card" style={{ 
              background: 'var(--surface-low)', 
              boxShadow: 'var(--card-shadow)',
              border: '1px solid var(--border-subtle)',
              position: 'relative', overflow: 'hidden',
              margin: '0 auto 10px',
              width: '100%',
              borderRadius: '30px'
            }}>
              <div style={{ position: 'absolute', top: 0, left: '-100%', width: '50%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)', transform: 'skewX(-20deg)' }}></div>

              <div className="wallet-header" style={{ borderBottom: 'none', paddingBottom: 0, paddingTop: '20px', paddingLeft: '20px', paddingRight: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 4px 10px rgba(255,139,66,0.3)', flexShrink: 0 }}><img src="/logo.png" alt="Be Fit Lab" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
                  <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--black)', letterSpacing: '2px' }}>BE FIT LAB</span>
                </div>
                <QrCode size={20} color="var(--primary)" opacity={0.8} />
              </div>
              
              <div className="wallet-body" style={{ padding: '25px 20px', textAlign: 'center' }}>
                <div style={{ background: 'white', padding: '12px', borderRadius: '20px', display: 'inline-block', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', border: 'none' }}>
                  <QRCodeCanvas 
                    value={user?.id || 'befit-client-id'} 
                    size={160}
                    level={"H"}
                    includeMargin={false}
                    fgColor="#000000"
                  />
                </div>
              </div>
              
              <div className="wallet-footer" style={{ borderTop: '1px dashed rgba(0,0,0,0.05)', paddingTop: '20px', paddingBottom: '20px', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Clases Disponibles</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--black)', fontFamily: 'var(--font-display)' }}>{classesRemaining} <span style={{fontSize: '0.9rem', fontWeight: 500, color: 'var(--primary)'}}>sesiones</span></div>
                </div>
              </div>
            </div>

            <div className="sheet-user-info" style={{ marginTop: '10px' }}>
              <div className="user-name">{user?.user_metadata?.full_name || 'Miembro Be Fit'}</div>
              <div>{user?.email}</div>
            </div>

            {/* Botón Wallet */}
            {walletPlatform === 'apple' && (
              <>
                <button
                  onClick={handleAddToWallet}
                  disabled={walletLoading}
                  style={{
                    marginTop: '16px', width: '100%', padding: '14px',
                    borderRadius: '14px', border: 'none', cursor: walletLoading ? 'default' : 'pointer',
                    background: walletAdded ? '#1a1a1a' : '#000000',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    transition: 'opacity 0.2s', opacity: walletLoading ? 0.7 : 1,
                  }}
                >
                  <Wallet size={18} color="white" />
                  <span style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem', fontFamily: 'var(--font-body)' }}>
                    {walletLoading ? 'Generando…' : walletAdded ? 'Actualizar Wallet' : 'Agregar a Apple Wallet'}
                  </span>
                </button>
                {walletError && (
                  <p style={{ marginTop: '8px', fontSize: '0.78rem', color: '#EF4444', textAlign: 'center' }}>
                    {walletError}
                  </p>
                )}
              </>
            )}
            {walletPlatform === 'google' && (
              <>
                <button
                  onClick={handleAddToWallet}
                  disabled={walletLoading}
                  style={{
                    marginTop: '16px', width: '100%', padding: '14px',
                    borderRadius: '14px', border: 'none', cursor: walletLoading ? 'default' : 'pointer',
                    background: '#1a73e8',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    transition: 'opacity 0.2s', opacity: walletLoading ? 0.7 : 1,
                  }}
                >
                  <Wallet size={18} color="white" />
                  <span style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem', fontFamily: 'var(--font-body)' }}>
                    {walletLoading ? 'Generando…' : 'Agregar a Google Wallet'}
                  </span>
                </button>
                {walletError && (
                  <p style={{ marginTop: '8px', fontSize: '0.78rem', color: '#EF4444', textAlign: 'center' }}>
                    {walletError}
                  </p>
                )}
              </>
            )}
          </motion.div>
        </>
      )}

      {/* FLOATING BOTTOM NAV — INSTAGRAM STYLE */}
      <nav className={`ios-bottom-nav ${isScrolled ? 'scrolled' : ''}`}>
        <Link to="/portal" className="nav-item active">
          {avatarUrl ? (
            <div style={{ width: 26, height: 26, borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--primary)', flexShrink: 0 }}>
              <img src={avatarUrl} alt="Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ) : (
            <User size={22} strokeWidth={2.5} />
          )}
          <span>Yo</span>
        </Link>
        <Link to="/evolucion" className="nav-item">
          <TrendingUp size={22} strokeWidth={2.5} />
          <span>Metas</span>
        </Link>
        <button className="nav-qr-button" onClick={() => setShowQR(true)}>
          <QrCode size={24} strokeWidth={2.5} />
        </button>
        <Link to="/nutricion" className="nav-item">
          <Utensils size={22} strokeWidth={2.5} />
          <span>Comida</span>
        </Link>
        <Link to="/agenda" className="nav-item">
          <Calendar size={22} strokeWidth={2.5} />
          <span>Clases</span>
        </Link>
      </nav>
    </div>
  );
}

/* TICKET-STYLE CLASS CARD */
function TicketCard({ title, time, instructor, color, canCancel, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--app-surface-solid)', borderRadius: '24px', overflow: 'hidden',
        boxShadow: 'var(--card-shadow)', border: '1px solid var(--border-subtle)',
        cursor: 'pointer', transition: 'transform 0.2s ease',
        opacity: canCancel ? 1 : 0.85,
      }}
    >
      {/* Top Section */}
      <div style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '50%', overflow: 'hidden', background: 'var(--surface)', flexShrink: 0 }}>
            <img src={`https://i.pravatar.cc/150?u=${instructor}`} alt={instructor} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--black)', fontFamily: 'var(--font-display)' }}>{title}</h4>
            <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginTop: '3px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              {instructor}
            </div>
          </div>
        </div>
        {canCancel
          ? <ChevronRight size={18} color="var(--on-surface-variant)" opacity={0.3} />
          : <Lock size={15} color="var(--on-surface-variant)" opacity={0.4} />
        }
      </div>

      {/* Dashed Divider */}
      <div style={{ borderTop: '1px dashed rgba(0,0,0,0.08)', marginLeft: '20px', marginRight: '20px' }} />

      {/* Bottom Section */}
      <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={14} color="var(--primary)" />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>{time}</span>
        </div>
        {canCancel ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={14} color="var(--on-surface-variant)" />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)' }}>BEFIT LAB</span>
          </div>
        ) : (
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--on-surface-variant)', background: 'rgba(0,0,0,0.04)', padding: '4px 10px', borderRadius: '8px' }}>
            Sin cancelación
          </span>
        )}
      </div>
    </div>
  );
}

/* STAT PILL */
function StatPill({ icon, value, label, color }) {
  return (
    <div style={{ 
      flex: 1, background: 'var(--app-surface-solid)', borderRadius: '20px', padding: '16px 12px', 
      textAlign: 'center', border: '1px solid var(--border-subtle)',
      boxShadow: 'var(--card-shadow)'
    }}>
      <div style={{ color: color, marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>{icon}</div>
      <div style={{ fontSize: '1.3rem', fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--black)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.65rem', color: 'var(--on-surface-variant)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>{label}</div>
    </div>
  );
}

export default Portal;
