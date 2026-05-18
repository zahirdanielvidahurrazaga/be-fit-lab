import React, { useState, useEffect } from 'react';
import { LogOut, CheckCircle2, ChevronRight, Users, Activity, QrCode, Calendar, Search, Star, Award, TrendingUp, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollDetect } from '../hooks/useScrollDetect';

function Coach() {
  const { user, logout, globalClasses, fetchClassReservations, allUsers } = useAuth();
  const navigate = useNavigate();
  const scrolled = useScrollDetect(30);
  
  // Gestión de días
  const currentDay = new Date().getDay();
  const [selectedDay, setSelectedDay] = useState(currentDay);
  
  const [selectedClass, setSelectedClass] = useState(null);
  const [classAlumnas, setClassAlumnas] = useState([]);
  const [loadingAlumnas, setLoadingAlumnas] = useState(false);
  
  // Gestión de Pestañas Principales
  const [activeTab, setActiveTab] = useState('agenda'); // 'agenda', 'estatus', 'buscar'
  const [searchQuery, setSearchQuery] = useState('');

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
  };

  // ==================== RENDERS DE PESTAÑAS ====================

  // 1. Pestaña de Agenda (Clases e inscritas)
  const renderAgenda = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* TOP METRICS */}
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '10px' }}>
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
        <section style={{ marginBottom: '5px' }}>
          <div className="day-selector">
            {daysOfWeek.map((day) => (
              <button 
                key={day.num}
                className={`day-pill ${selectedDay === day.num ? 'active' : ''}`}
                onClick={() => setSelectedDay(day.num)}
              >
                <span style={{ fontSize: '0.65rem', fontWeight: 800 }}>{day.label}</span>
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
      </div>
    );
  };

  // 2. Pestaña de Estatus (Métricas del Coach)
  const renderEstatus = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', margin: 0, color: 'var(--black)' }}>Tu Rendimiento</h2>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', margin: '4px 0 0' }}>Métricas y estadísticas mensuales de tus clases.</p>
        </div>

        {/* METRICAS DE RENDIMIENTO */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          <div style={{ padding: '24px', background: 'white', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.02)' }}>
            <div style={{ color: '#FF8B42', marginBottom: '14px', background: 'rgba(255,139,66,0.1)', width: '45px', height: '45px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><TrendingUp size={22} /></div>
            <div style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--black)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>86%</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', fontWeight: 700, marginTop: '8px' }}>Ocupación Promedio</div>
            <div style={{ fontSize: '0.7rem', color: '#22C55E', fontWeight: 800, marginTop: '4px' }}>↑ 4% este mes</div>
          </div>
          
          <div style={{ padding: '24px', background: 'white', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.02)' }}>
            <div style={{ color: '#A855F7', marginBottom: '14px', background: 'rgba(168,85,247,0.1)', width: '45px', height: '45px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Award size={22} /></div>
            <div style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--black)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>38 hrs</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', fontWeight: 700, marginTop: '8px' }}>Horas Impartidas</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', fontWeight: 700, marginTop: '4px' }}>Meta mensual: 40 hrs</div>
          </div>

          <div style={{ padding: '24px', background: 'white', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.02)' }}>
            <div style={{ color: '#EAB308', marginBottom: '14px', background: 'rgba(234,179,8,0.1)', width: '45px', height: '45px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Star size={22} fill="#EAB308" /></div>
            <div style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--black)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>4.9</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', fontWeight: 700, marginTop: '8px' }}>Satisfacción General</div>
            <div style={{ fontSize: '0.7rem', color: '#EAB308', fontWeight: 800, marginTop: '4px' }}>★★★★★ (Excelente)</div>
          </div>
        </section>

        {/* FEEDBACK & RECOMENDACIONES */}
        <section className="ios-glass-card" style={{ padding: '28px', background: 'linear-gradient(135deg, #1A1C1E, #2C302E)', color: 'white', border: 'none' }}>
          <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-display)', margin: '0 0 15px 0', color: 'white' }}>Performance Insights</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'start' }}>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '12px' }}><Activity size={18} color="var(--accent)" /></div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 700 }}>¡Hora Pico con Casa Llena!</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>Tus clases de las 7:00 PM tienen el mayor índice de reservas de toda la semana. ¡Excelente energía!</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'start' }}>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '12px' }}><Users size={18} color="var(--accent)" /></div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 700 }}>Alumnas Nuevas</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>Has recibido a 8 nuevas alumnas esta semana. Recuerda preguntarles sobre lesiones previas al inicio de la sesión.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  };

  // 3. Pestaña de Búsqueda de Alumnas
  const renderBuscar = () => {
    // Filtro en tiempo real de alumnas
    const filteredAlumnas = (allUsers || []).filter(u => {
      const roleName = u.role || 'CLIENT';
      if (roleName !== 'CLIENT') return false; // Solo buscar alumnas en este directorio
      
      const q = searchQuery.toLowerCase();
      return (
        u.name?.toLowerCase().includes(q) || 
        u.email?.toLowerCase().includes(q) || 
        u.phone?.includes(q)
      );
    });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', margin: 0, color: 'var(--black)' }}>Buscar Alumnas</h2>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', margin: '4px 0 0' }}>Encuentra y contacta de forma directa a cualquier alumna inscrita en el estudio.</p>
        </div>

        {/* BARRA DE BÚSQUEDA */}
        <div style={{ position: 'relative', width: '100%' }}>
          <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)' }}>
            <Search size={18} />
          </span>
          <input 
            type="text" 
            placeholder="Buscar alumna por nombre o WhatsApp..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '16px 16px 16px 48px',
              borderRadius: '20px',
              border: '1px solid rgba(0,0,0,0.08)',
              background: 'white',
              fontSize: '0.95rem',
              outline: 'none',
              boxShadow: '0 8px 24px rgba(0,0,0,0.02)',
              transition: 'border-color 0.2s',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* LISTA DE ALUMNAS */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(295px, 1fr))', gap: '20px', marginTop: '10px' }}>
          {filteredAlumnas.length > 0 ? (
            filteredAlumnas.map(alumna => {
              const cleanPhone = alumna.phone ? alumna.phone.replace(/\D/g, '') : '';
              return (
                <div key={alumna.id} className="ios-glass-card" style={{ padding: '20px', background: 'white', display: 'flex', flexDirection: 'column', gap: '15px', border: '1px solid rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'var(--primary)', fontSize: '1.1rem', fontFamily: 'var(--font-display)' }}>
                      {(alumna.name || alumna.email || 'AL').substring(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{alumna.name || 'Alumna'}</h4>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--on-surface-variant)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{alumna.email}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--on-surface-variant)', fontWeight: 800, textTransform: 'uppercase' }}>WhatsApp</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{alumna.phone || 'No registrado'}</span>
                    </div>

                    {alumna.phone && (
                      <a 
                        href={`https://wa.me/${cleanPhone.startsWith('52') ? cleanPhone : '52' + cleanPhone}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 14px',
                          borderRadius: '12px',
                          background: 'rgba(34,197,94,0.1)',
                          color: '#22C55E',
                          textDecoration: 'none',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(34,197,94,0.18)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(34,197,94,0.1)'; }}
                      >
                        <Phone size={14} fill="#22C55E" />
                        <span>Chat</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ gridColumn: '1 / -1', padding: '60px 20px', textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: '0.9rem', fontStyle: 'italic', background: 'rgba(55,61,59,0.03)', borderRadius: '24px' }}>
              No se encontraron alumnas registradas.
            </div>
          )}
        </section>
      </div>
    );
  };

  return (
    <div className="coach-app-container">
      {/* ====== BARRA LATERAL (DESKTOP SIDEBAR) ====== */}
      <aside className="coach-desktop-sidebar">
        <div className="sidebar-brand">
          <h2 className="sidebar-title">Gestión Lab</h2>
          <p className="sidebar-subtitle">COACH CENTER</p>
        </div>
        
        <nav className="sidebar-nav">
          <div 
            onClick={() => setActiveTab('agenda')}
            className={`sidebar-nav-item ${activeTab === 'agenda' ? 'active' : ''}`}
          >
            <Calendar size={18} />
            <span>Mi Agenda</span>
          </div>

          <div 
            onClick={() => setActiveTab('estatus')}
            className={`sidebar-nav-item ${activeTab === 'estatus' ? 'active' : ''}`}
          >
            <Activity size={18} />
            <span>Mi Estatus</span>
          </div>

          <div 
            onClick={() => setActiveTab('buscar')}
            className={`sidebar-nav-item ${activeTab === 'buscar' ? 'active' : ''}`}
          >
            <Search size={18} />
            <span>Buscar Alumnas</span>
          </div>
        </nav>

        <div onClick={handleLogout} className="sidebar-footer">
          <LogOut size={18} />
          <span>Cerrar Sesión</span>
        </div>
      </aside>

      {/* ====== CABECERA MÓVIL (SÓLO MÓVIL) ====== */}
      <header className="ios-header mobile-only-header" style={{ background: 'var(--surface-lowest)', paddingBottom: '10px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
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

      {/* ====== CONTENIDO CENTRAL ====== */}
      <main className="coach-main-content">
        <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', animation: 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          {activeTab === 'agenda' && renderAgenda()}
          {activeTab === 'estatus' && renderEstatus()}
          {activeTab === 'buscar' && renderBuscar()}
        </div>
      </main>

      {/* ====== BARRA DE NAVEGACIÓN FLOTANTE MÓVIL ====== */}
      <nav className={`ios-bottom-nav mobile-only-nav ${scrolled ? 'scrolled' : ''}`}>
        <div 
          onClick={() => setActiveTab('agenda')} 
          className={`nav-item ${activeTab === 'agenda' ? 'active' : ''}`}
        >
          <Calendar size={22} strokeWidth={2.5} />
          <span>Agenda</span>
        </div>
        <div 
          onClick={() => setActiveTab('estatus')} 
          className={`nav-item ${activeTab === 'estatus' ? 'active' : ''}`}
        >
          <Activity size={22} strokeWidth={2.5} />
          <span>Estatus</span>
        </div>
        <div 
          onClick={() => setActiveTab('buscar')} 
          className={`nav-item ${activeTab === 'buscar' ? 'active' : ''}`}
        >
          <Search size={22} strokeWidth={2.5} />
          <span>Buscar</span>
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
                              }}>
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
    </div>
  );
}

export default Coach;
