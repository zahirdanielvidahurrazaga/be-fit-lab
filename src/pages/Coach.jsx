import React, { useState } from 'react';
import { CheckCircle2, ChevronRight, Users, Activity, QrCode, Calendar, User, ClipboardList } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollDetect } from '../hooks/useScrollDetect';
import { QRCodeCanvas } from 'qrcode.react';

function Coach() {
  const { user, logout, globalClasses, fetchClassReservations, avatarUrl } = useAuth();
  const navigate = useNavigate();
  const scrolled = useScrollDetect(30);

  const todayStr = new Date().toISOString().split('T')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  // ── Calendar state (compartido entre tabs) ──────────────────────────
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const currentMonth = currentMonthDate.getMonth();
  const currentYear = currentMonthDate.getFullYear();
  const [calendarView, setCalendarView] = useState('month'); // 'month' | 'day'
  const [selectedDateStr, setSelectedDateStr] = useState(todayStr);

  // ── Class detail state ──────────────────────────────────────────────
  const [selectedClass, setSelectedClass] = useState(null);
  const [classAlumnas, setClassAlumnas] = useState([]);
  const [loadingAlumnas, setLoadingAlumnas] = useState(false);

  // ── Nav state ───────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('agenda');
  const [showQR, setShowQR] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  // ── Calendar helpers ────────────────────────────────────────────────
  const nextMonth = () => setCurrentMonthDate(new Date(currentYear, currentMonth + 1, 1));
  const prevMonth = () => setCurrentMonthDate(new Date(currentYear, currentMonth - 1, 1));
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const getWeekDays = (dateStr) => {
    const d = new Date(dateStr + 'T12:00:00');
    const dayOfWeek = d.getDay() === 0 ? 6 : d.getDay() - 1;
    const monday = new Date(d);
    monday.setDate(d.getDate() - dayOfWeek);
    return Array.from({ length: 7 }, (_, i) => {
      const cur = new Date(monday);
      cur.setDate(monday.getDate() + i);
      return {
        dateStr: cur.toISOString().split('T')[0],
        dayNum: cur.getDate(),
        dayName: ['L', 'M', 'M', 'J', 'V', 'S', 'D'][i]
      };
    });
  };

  const getDayOfWeek = (dateStr) => new Date(dateStr + 'T12:00:00').getDay();

  const getMyClassesForDate = (dateStr) => {
    if (!dateStr) return [];
    const dow = getDayOfWeek(dateStr);
    const coachName = (user?.user_metadata?.full_name || user?.email?.split('@')[0] || '').toLowerCase();
    return globalClasses.filter(c => {
      const isMe = coachName && c.instructor.toLowerCase().includes(coachName);
      return isMe && (c.date === dateStr || (c.date === null && c.day === dow));
    });
  };

  const getTodasClasesForDate = (dateStr) => {
    if (!dateStr) return [];
    const dow = getDayOfWeek(dateStr);
    return globalClasses.filter(c => c.date === dateStr || (c.date === null && c.day === dow));
  };

  const myClasses = getMyClassesForDate(selectedDateStr);
  const todasClases = getTodasClasesForDate(selectedDateStr);
  const totalAlumnasHoy = myClasses.reduce((acc, c) => acc + ((c.max_spots || 10) - c.spots), 0);

  const coachName = (user?.user_metadata?.full_name || user?.email?.split('@')[0] || '').toLowerCase();
  const isMyClass = (c) => coachName && c.instructor.toLowerCase().includes(coachName);

  const openClassDetail = async (c) => {
    setSelectedClass(c);
    setLoadingAlumnas(true);
    const reservations = await fetchClassReservations(c.id);
    setClassAlumnas(reservations);
    setLoadingAlumnas(false);
  };

  const handleManualCheckIn = (reservationId) => {
    setClassAlumnas(prev =>
      prev.map(a => a.reservationId === reservationId ? { ...a, checkedIn: !a.checkedIn } : a)
    );
  };

  // ── Shared calendar renderer ────────────────────────────────────────
  // getDotsForDate(dateStr) => { mine: number, others: number }
  const renderCalendar = (getDotsForDate, onDaySelect) => {
    const handleDaySelect = (dateStr) => {
      setSelectedDateStr(dateStr);
      setCalendarView('day');
      if (onDaySelect) onDaySelect(dateStr);
    };

    if (calendarView === 'month') {
      return (
        <motion.div key="month-view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px', marginBottom: '10px', textAlign: 'center' }}>
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                <div key={i} style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--on-surface-variant)' }}>{d}</div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' }}>
              {Array.from({ length: startDay }).map((_, i) => (
                <div key={`empty-${i}`} style={{ aspectRatio: '1' }} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const isToday = dateStr === todayStr;
                const { mine, others } = getDotsForDate(dateStr);
                const hasAny = mine > 0 || others > 0;

                return (
                  <motion.button
                    key={dayNum}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDaySelect(dateStr)}
                    style={{
                      aspectRatio: '1', borderRadius: '12px', border: 'none', cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative',
                      background: isToday ? 'var(--primary)' : (hasAny ? 'rgba(0,0,0,0.03)' : 'transparent'),
                      color: isToday ? 'white' : 'var(--black)',
                      fontWeight: isToday ? 800 : (hasAny ? 700 : 500)
                    }}
                  >
                    <span style={{ fontSize: '1rem' }}>{dayNum}</span>
                    {hasAny && (
                      <div style={{ display: 'flex', gap: '2px', position: 'absolute', bottom: '6px' }}>
                        {mine > 0 && Array.from({ length: Math.min(mine, 2) }).map((_, idx) => (
                          <div key={`m${idx}`} style={{ width: '4px', height: '4px', borderRadius: '50%', background: isToday ? 'white' : 'var(--primary)' }} />
                        ))}
                        {others > 0 && Array.from({ length: Math.min(others, 2) }).map((_, idx) => (
                          <div key={`o${idx}`} style={{ width: '4px', height: '4px', borderRadius: '50%', background: isToday ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.2)' }} />
                        ))}
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>
      );
    }

    // Day view — week strip + back button
    return (
      <motion.div key="day-view" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
          <button
            onClick={() => setCalendarView('month')}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', padding: 0 }}
          >
            <ChevronRight size={22} style={{ transform: 'rotate(180deg)' }} />
            {monthNames[new Date(selectedDateStr + 'T12:00:00').getMonth()]}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px', marginBottom: '25px', background: 'white', padding: '15px 10px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
          {getWeekDays(selectedDateStr).map((d, i) => {
            const isSelected = d.dateStr === selectedDateStr;
            const { mine, others } = getDotsForDate(d.dateStr);
            const hasAny = mine > 0 || others > 0;
            return (
              <div key={i} onClick={() => setSelectedDateStr(d.dateStr)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--on-surface-variant)' }}>{d.dayName}</span>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isSelected ? 'var(--primary)' : 'transparent',
                  color: isSelected ? 'white' : 'var(--black)',
                  fontWeight: isSelected ? 800 : 600, fontSize: '1.1rem'
                }}>
                  {d.dayNum}
                </div>
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: hasAny ? (isSelected ? 'white' : (mine > 0 ? 'var(--primary)' : 'rgba(0,0,0,0.2)')) : 'transparent', marginTop: '-2px' }} />
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  };

  // ── Tab: Agenda (mis clases) ────────────────────────────────────────
  const renderAgenda = () => {
    const getDotsForDate = (dateStr) => ({ mine: getMyClassesForDate(dateStr).length, others: 0 });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Métricas */}
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div style={{ padding: '20px', background: 'linear-gradient(135deg, #1A1C1E, #2C302E)', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
            <div style={{ color: 'var(--accent)', marginBottom: '12px', background: 'rgba(255,145,77,0.15)', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={20} /></div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'white', fontFamily: 'var(--font-display)', lineHeight: 1 }}>{totalAlumnasHoy}</div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: 700, marginTop: '5px' }}>Alumnas Hoy</div>
          </div>
          <div style={{ padding: '20px', background: 'white', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.02)' }}>
            <div style={{ color: 'var(--primary)', marginBottom: '12px', background: 'rgba(255,145,77,0.1)', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Activity size={20} /></div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--black)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>{myClasses.length}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 700, marginTop: '5px' }}>Clases de Hoy</div>
          </div>
        </section>

        {/* Calendario */}
        <section>{renderCalendar(getDotsForDate)}</section>

        {/* Lista de mis clases (solo en vista día) */}
        {calendarView === 'day' && (
          <section>
            <h4 style={{ fontSize: '1.1rem', margin: '0 0 15px 0', color: 'var(--black)', fontFamily: 'var(--font-display)', textTransform: 'capitalize' }}>
              {new Date(selectedDateStr + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {myClasses.length > 0 ? myClasses.map(c => {
                const ocupacion = (c.max_spots || 10) - c.spots;
                const porcentaje = Math.round((ocupacion / (c.max_spots || 10)) * 100);
                return (
                  <div key={c.id} onClick={() => openClassDetail(c)} className="ios-glass-card" style={{ padding: '20px', background: 'white', display: 'flex', alignItems: 'center', cursor: 'pointer', border: '1px solid rgba(0,0,0,0.02)' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: 'var(--surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginRight: '15px' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 900, fontFamily: 'var(--font-display)' }}>{c.time.split(' ')[0]}</span>
                      <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--on-surface-variant)' }}>{c.time.split(' ')[1] || 'AM'}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '1.1rem', margin: '0 0 4px 0', fontFamily: 'var(--font-display)' }}>{c.title}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ flex: 1, height: '4px', background: 'rgba(0,0,0,0.05)', borderRadius: '2px' }}>
                          <div style={{ width: `${porcentaje}%`, height: '100%', background: 'var(--primary)', borderRadius: '2px' }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--on-surface-variant)' }}>{ocupacion}/{c.max_spots || 10}</span>
                      </div>
                    </div>
                    <ChevronRight size={20} color="var(--on-surface-variant)" style={{ opacity: 0.5, marginLeft: '10px' }} />
                  </div>
                );
              }) : (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: '0.9rem', fontStyle: 'italic', background: 'rgba(55,61,59,0.03)', borderRadius: '16px' }}>
                  No tienes clases programadas para este día.
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    );
  };

  // ── Tab: Todas las clases (con highlight de las mías) ───────────────
  const renderTodasClases = () => {
    const getDotsForDate = (dateStr) => {
      const mine = getMyClassesForDate(dateStr).length;
      const total = getTodasClasesForDate(dateStr).length;
      return { mine, others: total - mine };
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', margin: 0, color: 'var(--black)' }}>Todas las Clases</h2>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', margin: '4px 0 0' }}>
            Ocupación de todas las coaches.{' '}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }} /> Tuya
            </span>
          </p>
        </div>

        {/* Calendario compartido — dots naranja para las mías, gris para el resto */}
        <section>{renderCalendar(getDotsForDate)}</section>

        {/* Lista de todas las clases (solo en vista día) */}
        {calendarView === 'day' && (
          <section>
            <h4 style={{ fontSize: '1.1rem', margin: '0 0 15px 0', color: 'var(--black)', fontFamily: 'var(--font-display)', textTransform: 'capitalize' }}>
              {new Date(selectedDateStr + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {todasClases.length > 0 ? todasClases.map(c => {
                const esMia = isMyClass(c);
                const ocupacion = (c.max_spots || 10) - c.spots;
                const porcentaje = Math.round((ocupacion / (c.max_spots || 10)) * 100);
                return (
                  <div
                    key={c.id}
                    className="ios-glass-card"
                    style={{
                      padding: '16px 20px',
                      background: esMia ? 'white' : 'rgba(255,255,255,0.6)',
                      display: 'flex', alignItems: 'center',
                      border: esMia ? '1.5px solid var(--primary)' : '1px solid rgba(0,0,0,0.04)',
                      borderLeft: esMia ? '4px solid var(--primary)' : '1px solid rgba(0,0,0,0.04)',
                      opacity: esMia ? 1 : 0.75,
                      transition: 'all 0.2s'
                    }}
                  >
                    {/* Hora */}
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: esMia ? 'rgba(255,139,66,0.08)' : 'var(--surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginRight: '14px', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 900, fontFamily: 'var(--font-display)', color: esMia ? 'var(--primary)' : 'var(--black)' }}>{c.time.split(' ')[0]}</span>
                      <span style={{ fontSize: '0.55rem', fontWeight: 800, color: 'var(--on-surface-variant)' }}>{c.time.split(' ')[1] || 'AM'}</span>
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <h3 style={{ fontSize: '1rem', margin: 0, fontFamily: 'var(--font-display)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</h3>
                        {esMia && (
                          <span style={{ flexShrink: 0, fontSize: '0.6rem', fontWeight: 800, color: 'var(--primary)', background: 'rgba(255,139,66,0.1)', padding: '2px 7px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Mía
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: esMia ? 'var(--primary)' : 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {c.instructor}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                        <div style={{ flex: 1, height: '3px', background: 'rgba(0,0,0,0.06)', borderRadius: '2px' }}>
                          <div style={{ width: `${porcentaje}%`, height: '100%', background: esMia ? 'var(--primary)' : 'rgba(0,0,0,0.2)', borderRadius: '2px', transition: 'width 0.3s' }} />
                        </div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--on-surface-variant)', flexShrink: 0 }}>{ocupacion}/{c.max_spots || 10}</span>
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: '0.9rem', fontStyle: 'italic', background: 'rgba(55,61,59,0.03)', borderRadius: '16px' }}>
                  No hay clases programadas para este día.
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className="mobile-app-container" style={{ background: 'var(--app-bg)' }}>
      <header className="ios-header" style={{ paddingBottom: '5px', background: 'transparent' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: '0 0 2px', fontWeight: 600 }}>{greeting}</p>
            <h1 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', margin: 0, lineHeight: 1.1, color: 'var(--black)' }}>{user?.user_metadata?.full_name || 'Coach'}</h1>
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
              }}
            >
              {avatarUrl
                ? <img src={avatarUrl} alt="Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <User size={20} color="var(--primary)" />
              }
            </div>
            {showProfileMenu && (
              <div className="profile-dropdown">
                <div style={{ padding: '10px 15px', borderBottom: '1px solid rgba(55,61,59,0.05)', marginBottom: '5px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{user?.user_metadata?.full_name || 'Coach'}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)' }}>Coach Activo</div>
                </div>
                <div className="profile-dropdown-item" onClick={() => { navigate('/mi-cuenta'); setShowProfileMenu(false); }}>Mi Cuenta</div>
                <div className="profile-dropdown-item" onClick={() => { navigate('/ajustes'); setShowProfileMenu(false); }}>Ajustes</div>
                <div className="profile-dropdown-item danger" onClick={handleLogout}>Cerrar Sesión</div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="dashboard-main" style={{ display: 'block', maxWidth: '600px', margin: '0 auto', width: '100%', paddingBottom: '100px' }}>
        <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', animation: 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          {activeTab === 'agenda' && renderAgenda()}
          {activeTab === 'todas_clases' && renderTodasClases()}
        </div>
      </main>

      {/* Nav */}
      <nav className={`ios-bottom-nav ${scrolled ? 'scrolled' : ''}`}>
        <div onClick={() => setActiveTab('agenda')} className={`nav-item ${activeTab === 'agenda' ? 'active' : ''}`}>
          <Calendar size={22} strokeWidth={2.5} />
          <span>Agenda</span>
        </div>
        <button className="nav-qr-button" onClick={() => setShowQR(true)}>
          <QrCode size={24} strokeWidth={2.5} />
        </button>
        <div onClick={() => setActiveTab('todas_clases')} className={`nav-item ${activeTab === 'todas_clases' ? 'active' : ''}`}>
          <ClipboardList size={22} strokeWidth={2.5} />
          <span>Clases</span>
        </div>
      </nav>

      {/* Bottom sheet — detalle de clase + lista de alumnas */}
      <AnimatePresence>
        {selectedClass && (
          <div className="modal-overlay" onClick={() => setSelectedClass(null)}>
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => { if (info.offset.y > 100 || info.velocity.y > 500) setSelectedClass(null); }}
              onClick={(e) => e.stopPropagation()}
              className="modal-drawer"
              style={{ background: 'var(--surface-lowest)', padding: '20px 20px 40px' }}
            >
              <div className="modal-close-pill" onClick={() => setSelectedClass(null)} />
              <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                <div style={{ display: 'inline-block', padding: '6px 12px', background: 'rgba(255,145,77,0.1)', color: 'var(--primary)', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', marginBottom: '10px' }}>{selectedClass.time}</div>
                <h2 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', margin: 0 }}>{selectedClass.title}</h2>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', margin: '5px 0 0' }}>Lista de Asistencia</p>
              </div>
              <div style={{ background: 'white', borderRadius: '24px', padding: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
                {loadingAlumnas ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>Cargando lista de asistencia...</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {classAlumnas.length > 0 ? classAlumnas.map((a, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 10px', borderBottom: i < classAlumnas.length - 1 ? '1px solid rgba(0,0,0,0.03)' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--primary)' }}>
                            {(a.name || 'AL').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{a.name}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>{a.plan || 'Plan Normal'}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleManualCheckIn(a.reservationId)}
                          style={{
                            width: '36px', height: '36px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                            background: a.checkedIn ? 'rgba(34,197,94,0.1)' : 'var(--surface)',
                            color: a.checkedIn ? '#22C55E' : 'var(--on-surface-variant)'
                          }}
                        >
                          <CheckCircle2 size={20} />
                        </button>
                      </div>
                    )) : (
                      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: '0.85rem' }}>
                        Aún no hay alumnas inscritas en esta clase.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR Bottom Sheet */}
      <AnimatePresence>
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
              onDragEnd={(_, info) => { if (info.offset.y > 100 || info.velocity.y > 500) setShowQR(false); }}
              className="qr-bottom-sheet"
              style={{ padding: '12px 24px 20px', background: 'var(--surface)' }}
            >
              <div className="sheet-handle" />
              <button onClick={() => setShowQR(false)} aria-label="Cerrar" style={{ position: 'absolute', top: '14px', right: '16px', width: '34px', height: '34px', borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.06)', color: 'var(--on-surface)', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 5 }}>✕</button>
              <div className="wallet-card" style={{ background: 'var(--surface-low)', boxShadow: 'var(--card-shadow)', border: '1px solid var(--border-subtle)', position: 'relative', overflow: 'hidden', margin: '0 auto 10px', width: '100%', borderRadius: '30px' }}>
                <div style={{ position: 'absolute', top: 0, left: '-100%', width: '50%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)', transform: 'skewX(-20deg)' }} />
                <div className="wallet-header" style={{ borderBottom: 'none', paddingBottom: 0, paddingTop: '20px', paddingLeft: '20px', paddingRight: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 4px 10px rgba(255,139,66,0.3)', flexShrink: 0 }}><img src="/logo2.png" alt="Be Fit Lab" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--black)', letterSpacing: '2px' }}>BE FIT LAB</span>
                  </div>
                  <QrCode size={20} color="var(--primary)" opacity={0.8} />
                </div>
                <div className="wallet-body" style={{ padding: '25px 20px', textAlign: 'center' }}>
                  <div style={{ background: 'white', padding: '12px', borderRadius: '20px', display: 'inline-block', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                    <QRCodeCanvas value={user?.id || 'befit-coach-id'} size={160} level="H" includeMargin={false} fgColor="#000000" />
                  </div>
                </div>
                <div className="wallet-footer" style={{ borderTop: '1px dashed rgba(0,0,0,0.05)', paddingTop: '20px', paddingBottom: '20px', justifyContent: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>ESTADO</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--black)', fontFamily: 'var(--font-display)' }}>COACH <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--primary)' }}>activo</span></div>
                  </div>
                </div>
              </div>
              <div className="sheet-user-info" style={{ marginTop: '10px' }}>
                <div className="user-name">{user?.user_metadata?.full_name || 'Coach Be Fit'}</div>
                <div>{user?.email}</div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Coach;
