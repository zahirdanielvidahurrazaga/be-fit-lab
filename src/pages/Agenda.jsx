import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, ChevronRight, User, TrendingUp, Play, Utensils, CheckCircle2, QrCode, CalendarPlus, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { QRCodeCanvas } from 'qrcode.react';
import { useScrollDetect } from '../hooks/useScrollDetect';
import { motion, AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { addToAppleWallet, addToGoogleWallet, getWalletPlatform } from '../hooks/useWallet';
import { addClassToCalendar } from '../hooks/useCalendar';
import { supabase } from '../lib/supabase';

function Agenda() {
  const isNative = Capacitor.isNativePlatform();
  const navigate = useNavigate();
  const { user, plan, classesRemaining, bookClass, globalClasses, updateReservationCalendarId, avatarUrl, coaches } = useAuth();
  
  // Calendar states
  const todayStr = new Date().toISOString().split('T')[0];
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const currentMonth = currentMonthDate.getMonth();
  const currentYear = currentMonthDate.getFullYear();
  const [calendarView, setCalendarView] = useState('month'); // 'month' | 'day'
  const [selectedDateStr, setSelectedDateStr] = useState(todayStr);

  const nextMonth = () => setCurrentMonthDate(new Date(currentYear, currentMonth + 1, 1));
  const prevMonth = () => setCurrentMonthDate(new Date(currentYear, currentMonth - 1, 1));
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Lunes = 0

  const getWeekDays = (dateStr) => {
    const d = new Date(dateStr + "T12:00:00");
    const dayOfWeek = d.getDay() === 0 ? 6 : d.getDay() - 1;
    const monday = new Date(d);
    monday.setDate(d.getDate() - dayOfWeek);
    
    return Array.from({length: 7}, (_, i) => {
      const current = new Date(monday);
      current.setDate(monday.getDate() + i);
      return {
        dateStr: current.toISOString().split('T')[0],
        dayNum: current.getDate(),
        dayName: ['L', 'M', 'M', 'J', 'V', 'S', 'D'][i]
      };
    });
  };

  const getDayOfWeekFromDateStr = (dateStr) => {
    return new Date(dateStr + "T12:00:00").getDay();
  };

  const getClassesForDate = (dateStr) => {
    if (!dateStr) return [];
    const dayOfWeek = getDayOfWeekFromDateStr(dateStr);
    return globalClasses.filter(c => c.date === dateStr || (c.date === null && c.day === dayOfWeek));
  };
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [addedToCalendar, setAddedToCalendar] = useState(false);
  const [calendarError, setCalendarError] = useState(null);
  const [showCoachDetail, setShowCoachDetail] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const walletPlatform = getWalletPlatform();
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletAdded, setWalletAdded] = useState(() => !!localStorage.getItem('befit_wallet_added'));
  const [walletError, setWalletError] = useState(null);
  const isScrolled = useScrollDetect(30);

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

  const handleReserveClick = (classObj) => {
    if (!user) {
      navigate(isNative ? '/login' : '/planes');
      return;
    }
    if (classesRemaining <= 0) {
      alert("No te quedan clases disponibles. Renueva tu paquete.");
      return;
    }
    setModalData(classObj);
    setShowModal(true);
    setIsSuccess(false);
    setCalendarError(null);
    setShowCoachDetail(false);
  };

  const confirmReservation = async () => {
    const success = await bookClass(modalData);
    if (success) {
      setIsSuccess(true);
      setAddedToCalendar(false);
    }
  };

  const handleAddToCalendar = async () => {
    if (!modalData) return;

    const d = new Date(selectedDateStr + "T12:00:00");
    const eventId = await addClassToCalendar(modalData, d);

    if (!eventId) {
      setCalendarError('No se pudo agregar. Otorga el permiso de calendario en Configuración.');
      return;
    }

    if (user?.id) {
      await supabase
        .from('reservations')
        .update({ calendar_event_id: eventId })
        .eq('user_id', user.id)
        .eq('class_id', modalData.id);
      updateReservationCalendarId(modalData.id, eventId);
    }

    setAddedToCalendar(true);
    setTimeout(() => {
      setShowModal(false);
      setIsSuccess(false);
      setAddedToCalendar(false);
    }, 1500);
  };

  // days array removed

  return (
    <div className="mobile-app-container" style={{ background: 'var(--app-bg)' }}>
      {/* HEADER UNIFICADO */}
      <header className="ios-header" style={{ paddingBottom: '5px', background: 'transparent' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: '0 0 2px', fontWeight: 600 }}>Tus clases</p>
            <h1 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', margin: 0, lineHeight: 1.1, color: 'var(--black)' }}>Reservas</h1>
          </div>
          <div style={{ 
            width: '42px', height: '42px', borderRadius: '50%', 
            background: 'rgba(255,139,66,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <CalendarIcon size={20} color="var(--primary)" />
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        
        <div className="dashboard-sidebar">
          {/* Tarjeta de Membresía Premium - Rediseño Luxury */}
          {user ? (
            <motion.section 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ marginBottom: '25px' }}
            >
              <div style={{ 
                padding: '28px', borderRadius: '32px', 
                background: 'linear-gradient(135deg, #1C1C1A 0%, #3D3D3D 100%)',
                color: 'white', position: 'relative', overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                {/* Decorative element */}
                <div style={{ 
                  position: 'absolute', top: '-20px', right: '-20px', 
                  width: '120px', height: '120px', 
                  background: 'rgba(255,139,66,0.15)', borderRadius: '50%', 
                  filter: 'blur(40px)' 
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <div>
                      <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '4px' }}>Membresía Actual</p>
                      <h2 style={{ fontSize: '2rem', color: 'white', margin: 0, fontFamily: 'var(--font-display)', fontWeight: 500 }}>{plan || 'Premium'}</h2>
                    </div>
                    <div style={{ background: 'rgba(255,139,66,0.1)', padding: '6px 12px', borderRadius: '12px', border: '1px solid rgba(255,139,66,0.2)' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--primary)' }}>ACTIVA</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '5px' }}>Disponibles</p>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                        <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'white' }}>{classesRemaining}</span>
                        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>clases</span>
                      </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '5px' }}>Próxima Clase</p>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white', marginTop: '10px' }}>
                        Hoy, 18:00
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          ) : (
            <section style={{ marginBottom: '25px' }}>
              <div style={{ 
                borderRadius: '32px', overflow: 'hidden', position: 'relative', 
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)', height: '200px' 
              }}>
                <img src="/assets/agenda_lifestyle.png" alt="Be Fit Lab" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }} />
                <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px' }}>
                   {isNative ? (
                     <>
                       <h3 style={{ color: 'white', fontSize: '1.4rem', marginBottom: '10px' }}>Exclusivo para Socias</h3>
                       <button onClick={() => navigate('/login')} className="btn-primary" style={{ width: '100%', padding: '12px' }}>Inicia Sesión</button>
                     </>
                   ) : (
                     <>
                       <h3 style={{ color: 'white', fontSize: '1.4rem', marginBottom: '10px' }}>Inicia tu transformación</h3>
                       <button onClick={() => navigate('/planes')} className="btn-primary" style={{ width: '100%', padding: '12px' }}>Ver Planes</button>
                     </>
                   )}
                </div>
              </div>
            </section>
          )}

          {/* Calendario Estilo Apple */}
          <section style={{ marginBottom: '10px' }}>
            {calendarView === 'month' ? (
              <motion.div key="month-view" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} transition={{duration:0.2}}>
                <div className="ios-glass-card" style={{ padding: '20px', background: 'white', margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <button onClick={prevMonth} style={{ background: 'rgba(0,0,0,0.04)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <ChevronRight size={20} color="var(--black)" style={{ transform: 'rotate(180deg)' }} />
                    </button>
                    <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-display)', margin: 0, textTransform: 'capitalize' }}>
                      {monthNames[currentMonth]} {currentYear}
                    </h3>
                    <button onClick={nextMonth} style={{ background: 'rgba(0,0,0,0.04)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <ChevronRight size={20} color="var(--black)" />
                    </button>
                  </div>

                  {/* Días de la semana */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px', marginBottom: '10px', textAlign: 'center' }}>
                    {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                      <div key={i} style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--on-surface-variant)' }}>{d}</div>
                    ))}
                  </div>

                  {/* Cuadrícula de Días */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' }}>
                    {Array.from({ length: startDay }).map((_, i) => (
                      <div key={`empty-${i}`} style={{ aspectRatio: '1', borderRadius: '12px' }} />
                    ))}
                    
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const dayNum = i + 1;
                      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                      const isToday = dateStr === todayStr;
                      const classesOnDay = getClassesForDate(dateStr);
                      const hasClasses = classesOnDay.length > 0;
                      
                      return (
                        <motion.button
                          key={dayNum}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            setSelectedDateStr(dateStr);
                            setCalendarView('day');
                          }}
                          style={{ 
                            aspectRatio: '1', borderRadius: '12px', border: 'none', cursor: 'pointer',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative',
                            background: isToday ? 'var(--primary)' : (hasClasses ? 'rgba(0,0,0,0.03)' : 'transparent'),
                            color: isToday ? 'white' : 'var(--black)',
                            fontWeight: isToday ? 800 : (hasClasses ? 700 : 500)
                          }}
                        >
                          <span style={{ fontSize: '1rem' }}>{dayNum}</span>
                          {hasClasses && (
                            <div style={{ display: 'flex', gap: '2px', position: 'absolute', bottom: '6px' }}>
                              {classesOnDay.slice(0, 3).map((_, idx) => (
                                <div key={idx} style={{ width: '4px', height: '4px', borderRadius: '50%', background: isToday ? 'white' : 'var(--primary)' }} />
                              ))}
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="day-view" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} transition={{duration:0.2}}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                  <button onClick={() => setCalendarView('month')} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', padding: 0 }}>
                    <ChevronRight size={22} style={{ transform: 'rotate(180deg)' }} /> 
                    {monthNames[new Date(selectedDateStr + "T12:00:00").getMonth()]}
                  </button>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px', marginBottom: '25px', background: 'white', padding: '15px 10px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                  {getWeekDays(selectedDateStr).map((d, i) => {
                    const isSelected = d.dateStr === selectedDateStr;
                    const classesOnDay = getClassesForDate(d.dateStr);
                    const hasClasses = classesOnDay.length > 0;
                    
                    return (
                      <div 
                        key={i} 
                        onClick={() => setSelectedDateStr(d.dateStr)}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                      >
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--on-surface-variant)' }}>{d.dayName}</span>
                        <div style={{ 
                          width: '36px', height: '36px', borderRadius: '50%', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: isSelected ? 'var(--primary)' : 'transparent',
                          color: isSelected ? 'white' : 'var(--black)',
                          fontWeight: isSelected ? 800 : 600,
                          fontSize: '1.1rem'
                        }}>
                          {d.dayNum}
                        </div>
                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: hasClasses ? (isSelected ? 'white' : 'var(--primary)') : 'transparent', marginTop: '-2px' }} />
                      </div>
                    );
                  })}
                </div>

                {/* Lista de Clases del Día */}
                <h4 style={{ fontSize: '1.1rem', margin: '0 0 15px 0', color: 'var(--black)', fontFamily: 'var(--font-display)', textTransform: 'capitalize' }}>
                  {new Date(selectedDateStr + "T12:00:00").toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {(() => {
                    const classesToday = getClassesForDate(selectedDateStr);
                    return classesToday.length > 0 ? (
                      classesToday.map(c => (
                        <ClassItem 
                          key={c.id}
                          classData={c}
                          full={c.spots === 0} 
                          onReserve={() => handleReserveClick(c)}
                          coaches={coaches}
                        />
                      ))
                    ) : (
                      <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: '0.9rem', fontStyle: 'italic', background: 'var(--surface-low)', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
                        No hay clases programadas para este día.
                      </div>
                    );
                  })()}
                </div>
              </motion.div>
            )}
          </section>
        </div>

      </main>

      {/* BOTTOM SHEET — DETALLE DE CLASE + RESERVA */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="qr-sheet-overlay"
              onClick={() => { if (!isSuccess) { setShowModal(false); setCalendarError(null); } }}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              drag={isSuccess ? false : 'y'}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.y > 80 || info.velocity.y > 500) {
                  setShowModal(false);
                  setCalendarError(null);
                }
              }}
              className="qr-bottom-sheet"
              style={{ padding: '12px 24px 36px', background: 'var(--surface)' }}
            >
              <div className="sheet-handle" />

              {isSuccess ? (
                <div style={{ textAlign: 'center', paddingTop: '10px' }}>
                  <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 15 }}
                    style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,139,66,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}
                  >
                    {addedToCalendar ? <CalendarPlus size={32} color="var(--primary)" /> : <CheckCircle2 size={35} color="var(--primary)" />}
                  </motion.div>
                  <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', marginBottom: '6px' }}>
                    {addedToCalendar ? '¡Agregada al calendario!' : '¡Reserva Exitosa!'}
                  </h2>
                  <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', marginBottom: addedToCalendar ? '0' : '24px' }}>
                    {addedToCalendar ? 'Recibirás un recordatorio antes de tu clase.' : 'Se ha descontado 1 clase de tu membresía.'}
                  </p>
                  {!addedToCalendar && isNative && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <button
                        onClick={handleAddToCalendar}
                        style={{
                          width: '100%', padding: '14px', borderRadius: '9999px', border: 'none',
                          background: 'var(--primary)', color: 'white',
                          fontSize: '0.95rem', fontWeight: 700, fontFamily: 'var(--font-body)',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                          boxShadow: '0 8px 20px rgba(255,139,66,0.3)'
                        }}
                      >
                        <CalendarPlus size={18} /> Agregar a mi calendario
                      </button>
                      <button
                        onClick={() => { setShowModal(false); setIsSuccess(false); setCalendarError(null); }}
                        style={{
                          width: '100%', padding: '12px', borderRadius: '9999px',
                          background: 'transparent', color: 'var(--on-surface-variant)',
                          border: '1px solid var(--border-subtle)',
                          fontSize: '0.9rem', fontWeight: 600, fontFamily: 'var(--font-body)',
                          cursor: 'pointer'
                        }}
                      >
                        Ahora no
                      </button>
                    </div>
                  )}
                  {calendarError && (
                    <p style={{ color: '#EF4444', fontSize: '0.85rem', marginTop: '15px' }}>{calendarError}</p>
                  )}
                </div>
              ) : (
                <div>
                  {/* Hora + Título */}
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{ display: 'inline-block', padding: '5px 12px', background: 'rgba(255,145,77,0.1)', color: 'var(--primary)', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', marginBottom: '8px' }}>
                      {modalData?.time}
                    </div>
                    <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', margin: '0 0 4px' }}>{modalData?.title}</h2>
                    {modalData?.level && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 700 }}>{modalData.level}</span>
                    )}
                  </div>

                  {/* Descripción de la clase */}
                  {modalData?.description && (
                    <div style={{ marginBottom: '16px', padding: '14px 16px', background: 'rgba(0,0,0,0.02)', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.03)' }}>
                      <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>{modalData.description}</p>
                    </div>
                  )}

                  {/* Mini-perfil del coach — expandible */}
                  {(() => {
                    const coachInfo = coaches?.find(c => c.full_name === modalData?.instructor || c.email === modalData?.instructor);
                    if (!coachInfo) return null;
                    const hasBio = coachInfo.bio || coachInfo.experience;
                    return (
                      <div style={{ marginBottom: '20px', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                        {/* Fila siempre visible — avatar + nombre + botón */}
                        <button
                          onClick={() => hasBio && setShowCoachDetail(v => !v)}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '13px 14px', background: 'rgba(0,0,0,0.02)',
                            border: 'none', cursor: hasBio ? 'pointer' : 'default', textAlign: 'left'
                          }}
                        >
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface)', overflow: 'hidden', flexShrink: 0, border: '2px solid white', boxShadow: '0 3px 8px rgba(0,0,0,0.08)' }}>
                            {coachInfo.avatar_url
                              ? <img src={coachInfo.avatar_url} alt="Coach" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 'bold', fontSize: '1rem' }}>{(coachInfo.full_name || 'C').charAt(0).toUpperCase()}</div>
                            }
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--on-surface-variant)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Imparte</p>
                            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>{coachInfo.full_name || 'Coach'}</p>
                          </div>
                          {hasBio && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--primary)', fontSize: '0.72rem', fontWeight: 800, flexShrink: 0 }}>
                              {showCoachDetail ? 'Ocultar' : 'Conoce a tu coach'}
                              <ChevronRight size={14} style={{ transform: showCoachDetail ? 'rotate(-90deg)' : 'rotate(90deg)', transition: 'transform 0.25s' }} />
                            </div>
                          )}
                        </button>

                        {/* Detalle expandible */}
                        <AnimatePresence initial={false}>
                          {showCoachDetail && hasBio && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: 'easeInOut' }}
                              style={{ overflow: 'hidden' }}
                            >
                              <div style={{ padding: '0 14px 14px' }}>
                                {coachInfo.bio && (
                                  <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: 'var(--on-surface-variant)', fontStyle: 'italic', lineHeight: 1.5 }}>"{coachInfo.bio}"</p>
                                )}
                                {coachInfo.experience && (
                                  <div style={{ display: 'inline-block', padding: '4px 10px', background: 'rgba(255,139,66,0.1)', color: 'var(--primary)', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800 }}>
                                    {coachInfo.experience}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })()}

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => { setShowModal(false); setCalendarError(null); }} className="btn-outline" style={{ flex: 1, padding: '13px' }}>Cancelar</button>
                    <button onClick={confirmReservation} className="btn-primary" style={{ flex: 1, padding: '13px', justifyContent: 'center' }}>Reservar</button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* QR BOTTOM SHEET CON DISEÑO BLACK CARD */}
      <AnimatePresence>
        {showQR && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="qr-sheet-overlay" 
              onClick={() => setShowQR(false)} 
            />
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
                    <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, var(--primary), var(--accent))', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white', fontFamily: 'var(--font-display)', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(255,139,66,0.3)' }}>B</div>
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
      </AnimatePresence>

      {/* FLOATING BOTTOM NAV — INSTAGRAM STYLE */}
      {user && (
        <nav className={`ios-bottom-nav ${isScrolled ? 'scrolled' : ''}`}>
          <Link to="/portal" className="nav-item">
            {avatarUrl ? (
              <div style={{ width: 26, height: 26, borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--on-surface-variant)', flexShrink: 0 }}>
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
          <Link to="/agenda" className="nav-item active">
            <CalendarIcon size={22} strokeWidth={2.5} />
            <span>Clases</span>
          </Link>
        </nav>
      )}
    </div>
  );
}

function ClassItem({ classData, full, onReserve, coaches }) {
  const { time, title, instructor, spots, category } = classData;

  const getBackgroundColor = (cat) => {
    switch(cat) {
      case 'Fuerza': return '#FFE4E1';
      case 'Resistencia': return '#E0FFFF';
      case 'Relajacion': return '#F0FFF0';
      case 'Gym libre': return '#FFFACD';
      default: return 'var(--app-surface-solid)';
    }
  };

  const bgColor = getBackgroundColor(category);

  return (
    <motion.div 
      whileTap={{ scale: 0.98 }}
      onClick={() => { if(!full && onReserve) onReserve(); }}
      style={{ 
        marginBottom: '16px', cursor: full ? 'default' : 'pointer'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', paddingLeft: '5px' }}>
        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--black)', fontFamily: 'var(--font-display)' }}>{time}</span>
        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(0,0,0,0.1)' }}></div>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>50 min</span>
      </div>

      <div style={{ 
        padding: '20px', display: 'flex', alignItems: 'center', gap: '20px',
        background: bgColor, borderRadius: '28px', boxShadow: 'var(--card-shadow)', 
        border: '1px solid var(--border-subtle)', position: 'relative', overflow: 'hidden',
        opacity: full ? 0.6 : 1, transition: 'all 0.3s ease'
      }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', background: '#FCF9F5', flexShrink: 0, border: '2px solid white', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}>
           {(() => {
             const coachInfo = (coaches || []).find(c => c.full_name === instructor || c.email === instructor);
             const photoUrl = coachInfo?.avatar_url;
             return photoUrl 
               ? <img src={photoUrl} alt={instructor} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
               : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 800, fontSize: '1.2rem', fontFamily: 'var(--font-display)' }}>{(instructor || 'C').charAt(0).toUpperCase()}</div>;
           })()}
        </div>
        
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1.15rem', color: 'var(--black)', margin: '0 0 2px 0', fontFamily: 'var(--font-display)', fontWeight: 800, lineHeight: 1.2 }}>{title}</h3>
          {category && (
            <p style={{ margin: '0 0 4px 0', fontSize: '0.65rem', color: 'var(--on-surface-variant)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Entrenamiento de {category === 'Relajacion' ? 'Relajación' : category}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
             <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{instructor}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
             <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: full ? '#FF4D4D' : '#22C55E' }}></div>
             <span style={{ fontSize: '0.75rem', color: '#8a7266', fontWeight: 700 }}>
                {full ? 'Clase llena' : `${spots} lugares disponibles`}
             </span>
          </div>
        </div>

        <div style={{ 
          width: '40px', height: '40px', borderRadius: '15px', 
          background: full ? 'rgba(0,0,0,0.03)' : 'rgba(255,139,66,0.1)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: full ? '#8a7266' : 'var(--primary)'
        }}>
          <ChevronRight size={20} />
        </div>
      </div>
    </motion.div>
  );
}

export default Agenda;
