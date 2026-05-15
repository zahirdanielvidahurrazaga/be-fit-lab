import React, { useState, useEffect } from 'react';
import { LogOut, CheckCircle2, ChevronRight, Users, Activity, QrCode, Calendar, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

function Coach() {
  const { user, logout, globalClasses, fetchClassReservations } = useAuth();
  const navigate = useNavigate();
  
  // Gestión de días
  const currentDay = new Date().getDay();
  const [selectedDay, setSelectedDay] = useState(currentDay);
  
  const [selectedClass, setSelectedClass] = useState(null);
  const [classAlumnas, setClassAlumnas] = useState([]);
  const [loadingAlumnas, setLoadingAlumnas] = useState(false);
  const [activeTab, setActiveTab] = useState('clases'); // 'clases', 'asistencia'

  const handleLogout = () => { logout(); navigate('/'); };

  const daysOfWeek = [
    { num: 1, label: 'LUN' },
    { num: 2, label: 'MAR' },
    { num: 3, label: 'MIE' },
    { num: 4, label: 'JUE' },
    { num: 5, label: 'VIE' },
    { num: 6, label: 'SAB' },
    { num: 0, label: 'DOM' }
  ];

  // Filtrar clases del instructor logueado Y del día seleccionado
  const myClasses = globalClasses.filter(c => {
    // Buscar por nombre o por el inicio del correo si no hay nombre completo
    const coachName = (user?.user_metadata?.full_name || user?.email?.split('@')[0] || '').toLowerCase();
    const isInstructor = coachName && c.instructor.toLowerCase().includes(coachName);
    
    return isInstructor && c.day === selectedDay;
  });

  const totalAlumnasHoy = myClasses.reduce((acc, c) => acc + ((c.max_spots || 10) - c.spots), 0);

  const openClassDetail = async (c) => {
    setSelectedClass(c);
    setLoadingAlumnas(true);
    // Fetch real reservations
    const reservations = await fetchClassReservations(c.id);
    setClassAlumnas(reservations);
    setLoadingAlumnas(false);
  };

  const handleManualCheckIn = (reservationId) => {
    setClassAlumnas(prev => prev.map(a => 
      a.reservationId === reservationId ? { ...a, checkedIn: !a.checkedIn } : a
    ));
    // Here we should also update DB: supabase.from('reservations').update({ checked_in: !currentStatus }).eq('id', reservationId)
    // Se puede agregar una función en AuthContext para esto
  };

  return (
    <div className="mobile-app-container" style={{ background: 'var(--surface-lowest)' }}>
      {/* HEADER COACH */}
      <header className="ios-header" style={{ background: 'var(--surface-lowest)', paddingBottom: '10px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', margin: 0, lineHeight: 1.1, color: 'var(--black)' }}>Coach</h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--primary)', margin: '4px 0 0', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>INSTRUCTOR PORTAL</p>
          </div>
          <div onClick={handleLogout} style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', cursor: 'pointer', border: '1px solid rgba(0,0,0,0.03)' }}>
            <LogOut size={18} color="var(--primary)" />
          </div>
        </div>
      </header>

      <main className="dashboard-main" style={{ paddingBottom: '100px' }}>
        
        {/* TOP METRICS */}
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
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

        {/* SELECTOR DE DÍAS */}
        <section style={{ marginBottom: '20px' }}>
          <div className="day-selector">
            {daysOfWeek.map((day) => (
              <button 
                key={day.num}
                className={`day-pill ${selectedDay === day.num ? 'active' : ''}`}
                onClick={() => setSelectedDay(day.num)}
              >
                <span style={{ fontSize: '0.6rem' }}>{day.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* LISTA DE CLASES */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
             <h2 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-display)', margin: 0 }}>Mis Clases</h2>
             <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}>{daysOfWeek.find(d=>d.num===selectedDay)?.label}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {myClasses.length > 0 ? myClasses.map(c => {
               const ocupacion = (c.max_spots || 10) - c.spots;
               const porcentaje = Math.round((ocupacion / (c.max_spots || 10)) * 100);
               return (
              <div key={c.id} onClick={() => openClassDetail(c)} className="ios-glass-card" style={{ padding: '20px', background: 'white', display: 'flex', alignItems: 'center', cursor: 'pointer', transition: 'transform 0.2s', border: '1px solid rgba(0,0,0,0.02)' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: 'var(--surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginRight: '15px' }}>
                   <span style={{ fontSize: '1rem', fontWeight: 900, fontFamily: 'var(--font-display)' }}>{c.time.split(' ')[0]}</span>
                   <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--on-surface-variant)' }}>{c.time.split(' ')[1] || 'AM'}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.1rem', margin: '0 0 4px 0', fontFamily: 'var(--font-display)' }}>{c.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                     <div style={{ flex: 1, height: '4px', background: 'rgba(0,0,0,0.05)', borderRadius: '2px' }}>
                        <div style={{ width: `${porcentaje}%`, height: '100%', background: 'var(--primary)', borderRadius: '2px' }}></div>
                     </div>
                     <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--on-surface-variant)' }}>{ocupacion}/10</span>
                  </div>
                </div>
                <ChevronRight size={20} color="var(--on-surface-variant)" style={{ opacity: 0.5, marginLeft: '10px' }} />
              </div>
            )}) : (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: '0.9rem', fontStyle: 'italic', background: 'rgba(55,61,59,0.03)', borderRadius: '16px' }}>
                 No tienes clases programadas para este día.
              </div>
            )}
          </div>
        </section>
      </main>

      {/* BOTTOM NAV */}
      <nav className="ios-bottom-nav" style={{ padding: '0 30px', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="nav-item active">
          <Calendar size={24} />
        </div>
        <div className="nav-item" style={{ opacity: 0.4 }}>
          <Activity size={24} />
        </div>
        <div className="nav-item" style={{ opacity: 0.4 }}>
          <Search size={24} />
        </div>
      </nav>

      {/* MODAL DETALLE DE CLASE CON LISTA REAL DE ALUMNAS */}
      <AnimatePresence>
        {selectedClass && (
          <div className="modal-overlay">
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="modal-drawer"
              style={{ background: 'var(--surface-lowest)', padding: '20px 20px 40px' }}
            >
              <div className="modal-close-pill" onClick={() => setSelectedClass(null)}></div>
              
              <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                 <div style={{ display: 'inline-block', padding: '6px 12px', background: 'rgba(255,145,77,0.1)', color: 'var(--primary)', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', marginBottom: '10px' }}>{selectedClass.time}</div>
                 <h2 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', margin: 0 }}>{selectedClass.title}</h2>
                 <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', margin: '5px 0 0' }}>Lista de Asistencia</p>
              </div>

              <div style={{ background: 'white', borderRadius: '24px', padding: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
                 {loadingAlumnas ? (
                   <div style={{ padding: '30px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                     Cargando lista de asistencia...
                   </div>
                 ) : (
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {classAlumnas.length > 0 ? classAlumnas.map((a, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 10px', borderBottom: i < classAlumnas.length -1 ? '1px solid rgba(0,0,0,0.03)' : 'none' }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--primary)' }}>
                                 {a.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                 <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{a.name}</div>
                                 <div style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>{a.plan}</div>
                              </div>
                           </div>
                           <button 
                              onClick={() => handleManualCheckIn(a.reservationId)}
                              style={{ 
                                width: '36px', height: '36px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                                background: a.checkedIn ? 'rgba(34,197,94,0.1)' : 'var(--surface)',
                                color: a.checkedIn ? '#22C55E' : 'var(--on-surface-variant)'
                              }}>
                              <CheckCircle2 size={20} />
                           </button>
                        </div>
                      )) : (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: '0.85rem' }}>
                          Aún no hay alumnas inscritas.
                        </div>
                      )}
                   </div>
                 )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Coach;
