import React, { useState, useEffect } from 'react';
import { Calendar, Utensils, TrendingUp, User, QrCode, ChevronRight, Activity, Flame, Sparkles, Clock, MapPin, X, Lock, Wallet, Coffee, Cake } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useHealth } from '../hooks/useHealth';
import { getNextClassOccurrence, classDateTime } from '../hooks/useLocalNotifications';
import { addToAppleWallet, addToGoogleWallet, getWalletPlatform } from '../hooks/useWallet';
import { QRCodeCanvas } from 'qrcode.react';
import { motion } from 'framer-motion';
import { useScrollDetect } from '../hooks/useScrollDetect';
import { Capacitor } from '@capacitor/core';
import ProfileMenu from '../components/ProfileMenu';
import { hasNutritionAccess } from '../lib/plans';

function Portal() {
  const isNative = Capacitor.isNativePlatform();
  const navigate = useNavigate();
  const { user, plan, logout, classesRemaining, myReservations, cancelClass, profileName, globalClasses, avatarUrl, setShowTour, coaches, badgeConfigs } = useAuth();
  
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

  // Fecha+hora real de la clase de una reserva (clase de fecha fija o recurrente).
  const reservationClassDate = (res) => {
    const c = globalClasses?.find(cl => cl.id === res.classId);
    if (!c || !c.time) return null;
    if (c.date) return classDateTime(c.date, c.time);
    if (c.day !== undefined) return getNextClassOccurrence(c.day, c.time);
    return null;
  };

  // Se puede cancelar si faltan MÁS de 5 h para la clase. Usa la FECHA REAL de la
  // clase (reservationClassDate); antes calculaba por día de semana y bloqueaba
  // por error las clases de semanas futuras. De la LISTA DE ESPERA se puede salir
  // en cualquier momento (no hay lugar que proteger ni clase cobrada).
  const canCancelReservation = (res) => {
    if (res?.status === 'waitlist') return true;
    const classStart = reservationClassDate(res);
    if (!classStart) return true;
    const fiveHoursBefore = new Date(classStart.getTime() - 5 * 60 * 60 * 1000);
    return new Date() < fiveHoursBefore;
  };

  // ¿La reserva abierta en el modal es de lista de espera? (mensajería distinta).
  const cancellingWaitlist = selectedReservation?.status === 'waitlist';

  // "en 22 min" / "en 5 h" / "en 3 días"
  const formatCountdown = (date) => {
    if (!date) return null;
    const ms = date.getTime() - Date.now();
    if (ms <= 0) return 'Ahora';
    const mins = Math.round(ms / 60000);
    if (mins < 60) return `en ${mins} min`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `en ${hrs} h`;
    const days = Math.round(hrs / 24);
    return `en ${days} ${days === 1 ? 'día' : 'días'}`;
  };

  // Próximas clases: ocultar las que ya pasaron + ordenar por más cercana.
  const upcomingReservations = (myReservations || [])
    .map(res => ({ res, classObj: globalClasses?.find(c => c.id === res.classId), classDate: reservationClassDate(res) }))
    .filter(({ classDate }) => !classDate || classDate.getTime() >= Date.now())
    .sort((a, b) => (a.classDate?.getTime() || Infinity) - (b.classDate?.getTime() || Infinity));

  const rawName = profileName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Cliente';
  const userName = rawName.split(' ')[0]; // Solo el primer nombre para el saludo

  // ── Resumen "Tu semana" (datos reales) ──────────────────────────────────
  const { healthData, fetchTodayData } = useHealth();
  const [history, setHistory] = useState(null); // reservas con check-in (asistidas)
  useEffect(() => {
    if (!user) return;
    supabase.from('reservations').select('created_at').eq('user_id', user.id).eq('checked_in', true)
      .then(({ data }) => setHistory(data || []));
    fetchTodayData(); // salud de hoy si ya está conectada (no pide permiso)
  }, [user]);

  const weekStats = (() => {
    const now = new Date();
    const dow = (now.getDay() + 6) % 7; // 0 = lunes
    const monday = new Date(now); monday.setHours(0, 0, 0, 0); monday.setDate(now.getDate() - dow);
    const perDay = [0, 0, 0, 0, 0, 0, 0];
    (history || []).forEach(h => { const d = new Date(h.created_at); if (d >= monday) perDay[(d.getDay() + 6) % 7]++; });
    const weekCount = perDay.reduce((a, b) => a + b, 0);
    const total = (history || []).length;
    return { perDay, weekCount, total, points: total * 10, todayIdx: dow, maxDay: Math.max(1, ...perDay) };
  })();
  const greeting = new Date().getHours() < 12 ? 'Buenos días' : new Date().getHours() < 18 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="mobile-app-container" style={{ background: 'var(--app-bg)' }}>
      {/* HEADER UNIFICADO */}
      <header className="ios-header" style={{ paddingBottom: '5px', background: 'transparent' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: '0 0 2px', fontWeight: 600 }}>{greeting}</p>
            <h1 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', margin: 0, lineHeight: 1.1, color: 'var(--black)' }}>{userName}</h1>
          </motion.div>
          <ProfileMenu />
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

          {/* MEMBERSHIP CARD - Premium App Aesthetic (Full Image Background) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ 
              padding: '24px', borderRadius: '32px', 
              backgroundImage: `linear-gradient(145deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%), url('/fotos-hero/_DSC0444.jpg')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              border: 'none',
              boxShadow: '0 20px 40px rgba(230, 114, 43, 0.25)',
              position: 'relative', overflow: 'hidden',
              minHeight: '175px',
              display: 'flex', alignItems: 'center'
            }}
          >
            {/* Brillo suave superior tipo Glass */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 100%)', pointerEvents: 'none' }}></div>
            
            <div style={{ position: 'relative', zIndex: 1, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Mi Membresía</span>
              </div>
              <h2 style={{ fontSize: '1.9rem', color: '#ffffff', margin: '0 0 6px', fontFamily: 'var(--font-display)', lineHeight: 1.05, textShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                {plan ? plan.replace('Plan ', '') : 'Sin Plan'}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: plan ? '#4ADE80' : '#F87171', boxShadow: '0 0 10px rgba(0,0,0,0.15)' }}></div>
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.95)', fontWeight: 700 }}>{plan ? 'Suscripción Activa' : 'Inactiva'}</span>
              </div>
              
              {/* Pill oscura estilo Premium Glass */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '14px', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', padding: '10px 16px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff', lineHeight: 1, fontFamily: 'var(--font-display)', textAlign: 'center' }}>
                    {classesRemaining >= 9000 ? '∞' : classesRemaining}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.7)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '3px', textAlign: 'center' }}>
                    {classesRemaining >= 9000 ? 'Ilimitadas' : 'Clases'}
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/planes')}
                  style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', transition: 'background 0.2s' }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </motion.div>

          {/* STORIES-STYLE HORIZONTAL SCROLL */}
          <motion.section 
            initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{duration:0.5, delay:0.15}}
            style={{ marginTop: '25px' }}
          >
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '15px', fontFamily: 'var(--font-display)', color: 'var(--black)' }}>Explora</h2>
            <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '6px', marginLeft: '-5px', paddingLeft: '5px', paddingRight: '5px' }}>
              {[
                { to: '/cafeteria', img: '/fotos-hero/IMG_5410.JPG', Icon: Coffee, title: 'Coffee Lab', sub: 'Café & smoothies', overlay: 'linear-gradient(160deg, rgba(60,30,15,0.18) 0%, rgba(35,18,8,0.74) 100%)' },
                { to: '/cumpleanos', img: '/fotos-hero/cumple.png', Icon: Cake, title: 'Cumpleaños', sub: 'Tu cuenta regresiva', overlay: 'linear-gradient(160deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%)' },
                { to: '/eventos', img: '/fotos-hero/_DSC0470.jpg', Icon: Sparkles, title: 'Eventos', sub: 'Próximas experiencias', overlay: 'linear-gradient(160deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%)' },
              ].map(c => (
                <motion.div key={c.to} data-tour={`explora-${c.to.slice(1)}`} onClick={() => navigate(c.to)} whileTap={{ scale: 0.97 }}
                  style={{ flex: '0 0 auto', width: '210px', height: '250px', borderRadius: '26px', cursor: 'pointer', position: 'relative', overflow: 'hidden', backgroundImage: `${c.overlay}, url('${c.img}')`, backgroundSize: 'cover', backgroundPosition: 'center', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 14px 34px rgba(0,0,0,0.18)' }}>
                  <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: 'rgba(255,255,255,0.20)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <c.Icon size={24} color="#fff" strokeWidth={2} />
                  </div>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.18rem', fontFamily: 'var(--font-display)', lineHeight: 1.15, textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>{c.title}</div>
                    <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.78rem', fontWeight: 600, marginTop: '4px', textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}>{c.sub}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        </div>

        <div className="dashboard-content" style={{ zIndex: 1, position: 'relative' }}>

          {/* PRÓXIMA CLASE - TICKET STYLE */}
          <motion.section id="tour-proximas-clases" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{duration:0.5, delay:0.25}}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, fontFamily: 'var(--font-display)', color: 'var(--black)' }}>Próximas clases</h2>
              <Link className="tour-agendar-btn" to="/agenda" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textDecoration: 'none' }}>Ver todo →</Link>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {upcomingReservations.length > 0 ? (
                upcomingReservations.map(({ res, classObj, classDate }, index) => (
                  <TicketCard
                    key={res.id || index}
                    title={res.title}
                    time={res.time}
                    instructor={res.instructor}
                    coachId={classObj?.coach_id}
                    coaches={coaches}
                    badgeConfigs={badgeConfigs}
                    countdown={formatCountdown(classDate)}
                    isWaitlisted={res.status === 'waitlist'}
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
                  <Link className="tour-agendar-btn" to="/agenda" style={{ 
                    display: 'inline-block', marginTop: '15px', color: 'white', fontWeight: 700, 
                    textDecoration: 'none', background: 'var(--primary)', padding: '10px 24px', 
                    borderRadius: '14px', fontSize: '0.85rem',
                    boxShadow: '0 8px 20px rgba(255,139,66,0.3)'
                  }}>Agendar ahora</Link>
                </div>
              )}
            </div>
          </motion.section>

          {/* TU SEMANA — resumen interactivo (clases, salud, puntos) */}
          <motion.section id="tour-tu-semana" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{duration:0.5, delay:0.35}} style={{ marginTop: '25px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, fontFamily: 'var(--font-display)', color: 'var(--black)' }}>Tu semana</h2>
              <span style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)', fontWeight: 700 }}>{weekStats.weekCount} {weekStats.weekCount === 1 ? 'clase' : 'clases'}</span>
            </div>

            {/* Gráfica de barras: clases por día de la semana */}
            <motion.div onClick={() => navigate('/evolucion')} whileTap={{ scale: 0.99 }} style={{ background: 'var(--app-surface-solid)', borderRadius: '22px', padding: '18px 16px 14px', boxShadow: 'var(--card-shadow)', border: '1px solid var(--border-subtle)', cursor: 'pointer', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '7px' }}>
                {weekStats.perDay.map((c, i) => {
                  const isToday = i === weekStats.todayIdx;
                  const h = c > 0 ? Math.max(20, (c / weekStats.maxDay) * 100) : 7;
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px' }}>
                      <div style={{ width: '100%', height: '72px', display: 'flex', alignItems: 'flex-end' }}>
                        <motion.div initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: 0.1 + i * 0.05, type: 'spring', stiffness: 120, damping: 16 }}
                          style={{ width: '100%', maxWidth: '26px', margin: '0 auto', borderRadius: '8px',
                            background: isToday ? 'linear-gradient(to top, var(--primary), var(--accent))' : (c > 0 ? '#EEBA89' : 'var(--border-subtle)'),
                            boxShadow: isToday ? '0 4px 12px rgba(255,139,66,0.3)' : 'none', opacity: c === 0 && !isToday ? 0.45 : 1 }} />
                      </div>
                      <span style={{ fontSize: '0.64rem', fontWeight: 800, color: isToday ? 'var(--primary)' : 'var(--on-surface-variant)' }}>{['L', 'M', 'M', 'J', 'V', 'S', 'D'][i]}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* 3 cards tappables con número animado */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <StatCard icon={<Activity size={16} />} value={weekStats.weekCount} label="clases" color="var(--primary)" onClick={() => navigate('/agenda')} />
              <StatCard icon={<Flame size={16} />} value={healthData.calories} label="kcal hoy" color="#FF6B6B" onClick={() => navigate('/evolucion')} />
              <StatCard icon={<Sparkles size={16} />} value={weekStats.points} label="puntos" color="var(--accent)" onClick={() => navigate('/evolucion')} />
            </div>
            <p style={{ fontSize: '0.66rem', color: 'var(--on-surface-variant)', textAlign: 'center', margin: '9px 0 0', fontWeight: 600 }}>Ganas 10 puntos por cada clase ✦</p>
          </motion.section>
        </div>

      </main>

      {/* MODAL INTEGRADO PARA CANCELAR */}
      {showCancelModal && (
        <div className="modal-overlay" onClick={() => { setShowCancelModal(false); setCancelError(false); }}>
          <div className="glass-modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-display)', marginBottom: '15px' }}>Detalle de Reserva</h2>
            <div style={{ background: 'var(--fill-subtle)', padding: '15px', borderRadius: '16px', marginBottom: '16px', textAlign: 'left' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--on-surface)' }}>{selectedReservation?.title}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, marginTop: '5px' }}>{selectedReservation?.time}</div>
              {cancellingWaitlist && (
                <div style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', fontWeight: 800, color: '#6b7280', background: 'var(--fill-subtle)', padding: '4px 9px', borderRadius: '8px' }}>
                  <Clock size={12} /> En lista de espera
                </div>
              )}
            </div>

            {cancelError ? (
              <div style={{ background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.2)', borderRadius: '16px', padding: '14px', marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <Lock size={16} color="#FF4D4D" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#FF4D4D', fontWeight: 600, lineHeight: 1.5 }}>
                  Ya no es posible cancelar esta clase — faltan menos de 5 horas para que inicie.
                </p>
              </div>
            ) : cancellingWaitlist ? (
              <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.85rem', marginBottom: '16px', lineHeight: 1.5 }}>
                ¿Salir de la lista de espera de esta clase? <strong>No se te cobró ninguna clase</strong>, así que no se descuenta ni se devuelve nada de tu paquete.
              </p>
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
                  {cancellingWaitlist ? 'Salir de lista de espera' : 'Cancelar Clase'}
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
            <button onClick={() => setShowQR(false)} aria-label="Cerrar" style={{ position: 'absolute', top: '14px', right: '16px', width: '34px', height: '34px', borderRadius: '50%', border: 'none', background: 'var(--fill-subtle)', color: 'var(--on-surface)', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 5 }}>✕</button>
            
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
                  <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', boxShadow: '0 4px 12px rgba(255,139,66,0.18)' }}><img src="/logo2.png" alt="Be Fit Lab" style={{ height: '24px', width: 'auto', objectFit: 'contain', display: 'block' }} /></div>
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
              
              <div className="wallet-footer" style={{ borderTop: '1px dashed var(--divider)', paddingTop: '20px', paddingBottom: '20px', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Clases Disponibles</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--black)', fontFamily: 'var(--font-display)' }}>{classesRemaining >= 9000 ? '∞' : classesRemaining} <span style={{fontSize: '0.9rem', fontWeight: 500, color: 'var(--primary)'}}>{classesRemaining >= 9000 ? 'ilimitadas' : 'sesiones'}</span></div>
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
        {hasNutritionAccess(plan) && (
          <Link to="/nutricion" className="nav-item">
            <Utensils size={22} strokeWidth={2.5} />
            <span>Comida</span>
          </Link>
        )}
        <Link to="/agenda" className="nav-item">
          <Calendar size={22} strokeWidth={2.5} />
          <span>Clases</span>
        </Link>
      </nav>
    </div>
  );
}

/* TICKET-STYLE CLASS CARD */
function TicketCard({ title, time, instructor, coachId, coaches, badgeConfigs, countdown, canCancel, isWaitlisted, onClick }) {
  // Foto real del coach (mismo patrón que ScheduleCalendar): coach_id → nombre →
  // email → coach único → perfil público (badge COACH_PROFILE). Fallback: inicial.
  const publicCoachProfile = badgeConfigs?.find(b => b.rule_type === 'COACH_PROFILE');
  const coachInfo = (coaches || []).find(c => (coachId && c.id === coachId) || c.full_name === instructor || c.email === instructor)
                  || (coaches?.length === 1 ? coaches[0] : null)
                  || (publicCoachProfile ? { full_name: publicCoachProfile.label, avatar_url: publicCoachProfile.icon } : null);
  const photoUrl = coachInfo?.avatar_url;
  const coachName = coachInfo?.full_name || instructor;
  const initial = (coachName || 'C').charAt(0).toUpperCase();
  const STUB = 96; // ancho del talón

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative', display: 'flex', background: 'var(--app-surface-solid)',
        borderRadius: '22px', overflow: 'hidden', boxShadow: 'var(--card-shadow)',
        border: '1px solid var(--border-subtle)', cursor: 'pointer', opacity: canCancel ? 1 : 0.85,
      }}
    >
      {/* Muescas del boleto (cortes del color del fondo sobre la perforación) */}
      <div style={{ position: 'absolute', top: -9, right: STUB - 9, width: 18, height: 18, borderRadius: '50%', background: 'var(--app-bg)' }} />
      <div style={{ position: 'absolute', bottom: -9, right: STUB - 9, width: 18, height: 18, borderRadius: '50%', background: 'var(--app-bg)' }} />

      {/* Sección principal */}
      <div style={{ flex: 1, minWidth: 0, padding: '16px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ width: '58px', height: '58px', borderRadius: '50%', overflow: 'hidden', background: 'var(--surface-low)', flexShrink: 0, border: '2.5px solid var(--app-surface-solid)', boxShadow: '0 5px 14px rgba(0,0,0,0.1)' }}>
            {photoUrl
              ? <img src={photoUrl} alt={coachName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 800, fontSize: '1.35rem', fontFamily: 'var(--font-display)' }}>{initial}</div>}
          </div>
          <div style={{ minWidth: 0 }}>
            <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--on-surface)', fontFamily: 'var(--font-display)', lineHeight: 1.12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</h4>
            <div style={{ fontSize: '0.82rem', color: 'var(--on-surface-variant)', marginTop: '4px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{coachName}</div>
            {isWaitlisted && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '0.6rem', fontWeight: 800, color: '#6b7280', background: 'var(--fill-subtle)', padding: '3px 8px', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <Clock size={10} /> En lista de espera
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0 }}>
            <MapPin size={13} color="var(--on-surface-variant)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>BE FIT LAB</span>
          </div>
          {canCancel ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem', fontWeight: 800, color: 'var(--primary)', whiteSpace: 'nowrap' }}>
              Gestionar <ChevronRight size={13} />
            </span>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.64rem', fontWeight: 700, color: 'var(--on-surface-variant)', background: 'var(--fill-subtle)', padding: '4px 9px', borderRadius: '8px', whiteSpace: 'nowrap' }}>
              <Lock size={11} /> Sin cancelación
            </span>
          )}
        </div>
      </div>

      {/* Talón perforado */}
      <div style={{ width: `${STUB}px`, flexShrink: 0, background: 'var(--surface-low)', borderLeft: '2px dashed var(--divider)', padding: '14px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '2px' }}>
        <span style={{ fontSize: '0.55rem', fontWeight: 800, color: 'var(--on-surface-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Hora</span>
        <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--on-surface)', fontFamily: 'var(--font-display)', lineHeight: 1.05 }}>{time}</span>
        {countdown && (
          <span style={{ marginTop: '4px', fontSize: '0.62rem', fontWeight: 800, color: 'var(--primary)', background: 'rgba(255,145,77,0.12)', padding: '3px 8px', borderRadius: '99px', whiteSpace: 'nowrap' }}>{countdown}</span>
        )}
        <span style={{ marginTop: '4px', fontSize: '0.5rem', fontWeight: 800, color: 'var(--on-surface-muted)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Clase</span>
      </div>
    </div>
  );
}

/* STAT PILL */
// Número que cuenta hacia arriba (ease-out) al montar / cambiar de valor.
function AnimatedNumber({ value }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const to = Number(value) || 0;
    let raf; const start = performance.now(); const dur = 700;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / dur);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{n.toLocaleString('es-MX')}</>;
}

// Tarjeta de stat tappable con número animado (o "—" si no hay dato).
function StatCard({ icon, value, label, color, onClick }) {
  const hasValue = value !== null && value !== undefined;
  return (
    <motion.button onClick={onClick} whileTap={{ scale: 0.95 }} style={{
      flex: 1, background: 'var(--app-surface-solid)', borderRadius: '20px', padding: '15px 8px',
      textAlign: 'center', border: '1px solid var(--border-subtle)', boxShadow: 'var(--card-shadow)', cursor: 'pointer'
    }}>
      <div style={{ color, marginBottom: '7px', display: 'flex', justifyContent: 'center' }}>{icon}</div>
      <div style={{ fontSize: '1.3rem', fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--black)', lineHeight: 1 }}>
        {hasValue ? <AnimatedNumber value={value} /> : '—'}
      </div>
      <div style={{ fontSize: '0.62rem', color: 'var(--on-surface-variant)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '4px' }}>{label}</div>
    </motion.button>
  );
}

export default Portal;
