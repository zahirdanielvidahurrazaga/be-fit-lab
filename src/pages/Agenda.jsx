import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Calendar as CalendarIcon, Clock, ChevronRight, User, TrendingUp, Play, Utensils, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function Agenda() {
  const navigate = useNavigate();
  const { user, classesRemaining, bookClass, globalClasses } = useAuth();
  const [selectedDay, setSelectedDay] = useState(12);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleReserveClick = (classObj) => {
    if (!user) {
      navigate('/planes');
      return;
    }
    if (classesRemaining <= 0) {
      alert("No te quedan clases disponibles. Renueva tu paquete.");
      return;
    }
    setModalData(classObj);
    setShowModal(true);
    setIsSuccess(false);
  };

  const confirmReservation = () => {
    const success = bookClass(modalData);

    if (success) {
      setIsSuccess(true);
      setTimeout(() => {
        setShowModal(false);
        setIsSuccess(false);
      }, 2000);
    }
  };

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      day: d.getDate(),
      name: d.toLocaleDateString('es-MX', { weekday: 'short' }).charAt(0).toUpperCase(),
      date: d
    };
  });

  return (
    <div className="mobile-app-container">
      {/* HEADER TIPO iOS */}
      <header className="ios-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div 
              onClick={() => navigate(user ? '/portal' : '/')}
              style={{ 
                width: '40px', height: '40px', borderRadius: '12px', 
                background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(10px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(55,61,59,0.05)', cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.8)'
              }}>
              <ChevronLeft size={20} color="var(--primary)" />
            </div>
            <h1 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', margin: 0, lineHeight: 1.2 }}>{user ? 'Reservas' : 'Horarios'}</h1>
          </div>
          <div style={{ color: 'var(--primary)' }}>
             <CalendarIcon size={24} />
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        
        <div className="dashboard-sidebar">
          {/* Tarjeta Informativa / Premium Wallet (Sólo para usuarios) */}
          {user ? (
            <section style={{ marginBottom: '20px' }}>
              <div className="wallet-card" style={{ padding: '30px 20px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.6rem' }}>TU MEMBRESÍA</div>
                <h2 style={{ fontSize: '2.2rem', color: 'white', marginBottom: '1.5rem', fontFamily: 'var(--font-display)', lineHeight: 1 }}>Premium</h2>
                <div style={{ display: 'flex', gap: '2rem' }}>
                   <div>
                      <div style={{ fontSize: '2rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>{classesRemaining}</div>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)', fontWeight: 800, letterSpacing: '0.05em', marginTop: '4px' }}>CLASES DISPONIBLES</div>
                   </div>
                </div>
              </div>
            </section>
          ) : (
            <section style={{ marginBottom: '20px' }}>
              <div style={{ 
                borderRadius: '24px', overflow: 'hidden', position: 'relative', 
                boxShadow: '0 15px 35px rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', height: '220px' 
              }}>
                <img src="/assets/agenda_lifestyle.png" alt="Be Fit Lab Training" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }} />
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 100%)' }}></div>
                <div style={{ position: 'relative', zIndex: 1, padding: '30px 20px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', textAlign: 'center' }}>
                  <h2 style={{ fontSize: '2rem', color: 'white', margin: '0 0 5px 0', fontFamily: 'var(--font-display)', lineHeight: 1.1 }}>Únete a la Élite</h2>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', marginBottom: '15px' }}>Accede a nuestros horarios exclusivos.</p>
                  <button onClick={() => navigate('/planes')} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: 'none', background: 'var(--accent)', color: 'var(--black)', fontWeight: 900, cursor: 'pointer', boxShadow: '0 10px 25px rgba(238,186,137,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Adquirir Membresía
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Selector de Fecha (Refined Calendar Strip) */}
          <section>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--on-surface)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '15px' }}>Selecciona una fecha</h2>
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px', scrollbarWidth: 'none' }}>
              {days.map((d) => (
                <button 
                  key={d.day}
                  onClick={() => setSelectedDay(d.day)}
                  style={{
                    flex: '0 0 auto', width: '65px', height: '85px', borderRadius: '18px', border: 'none',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    background: selectedDay === d.day ? 'var(--primary)' : 'rgba(255,145,77,0.08)',
                    color: selectedDay === d.day ? 'white' : 'var(--on-surface-variant)',
                    cursor: 'pointer', transition: 'all 0.3s ease',
                    boxShadow: selectedDay === d.day ? '0 10px 20px rgba(55,61,59,0.1)' : 'none',
                    transform: selectedDay === d.day ? 'scale(1.05)' : 'scale(1)'
                  }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.1em' }}>{d.name}</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'var(--font-display)' }}>{d.day}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="dashboard-content">
          {/* Lista de Clases del Día */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--on-surface)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Clases Disponibles</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
               {globalClasses.filter(c => c.day === selectedDay).length > 0 ? (
                 globalClasses.filter(c => c.day === selectedDay).map(c => (
                   <ClassItem 
                     key={c.id}
                     classData={c}
                     full={c.spots === 0} 
                     onReserve={() => handleReserveClick(c)} 
                   />
                 ))
               ) : (
                 <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: '0.9rem', fontStyle: 'italic', background: 'rgba(55,61,59,0.03)', borderRadius: '16px' }}>
                   No hay clases programadas para este día.
                 </div>
               )}
            </div>
          </section>
        </div>

      </main>

      {/* MODAL INTEGRADO */}
      {showModal && (
        <div className="modal-overlay">
          <div className="glass-modal">
            {isSuccess ? (
              <div style={{ animation: 'scaleUp 0.3s ease' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,145,77,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                  <CheckCircle2 size={35} color="var(--primary)" />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', marginBottom: '5px' }}>¡Reserva Exitosa!</h2>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', marginBottom: '0' }}>Se ha descontado 1 clase.</p>
              </div>
            ) : (
              <div>
                <h2 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-display)', marginBottom: '15px' }}>Confirmar Reserva</h2>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', marginBottom: '20px' }}>
                  ¿Deseas reservar tu lugar para <strong>{modalData?.title}</strong> a las <strong>{modalData?.time}</strong>?
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setShowModal(false)} className="btn-outline" style={{ flex: 1, padding: '12px' }}>Cancelar</button>
                  <button onClick={confirmReservation} className="btn-primary" style={{ flex: 1, padding: '12px', justifyContent: 'center' }}>Confirmar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====== BOTTOM NAV PREMIUM ====== */}
      {user && (
        <nav className="ios-bottom-nav" style={{ padding: '0 10px 25px', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
          <Link to="/portal" className="nav-item" style={{ color: 'var(--on-surface-variant)' }}>
            <User size={22} strokeWidth={2.5} />
            <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>Portal</span>
          </Link>
          <Link to="/evolucion" className="nav-item" style={{ color: 'var(--on-surface-variant)' }}>
            <TrendingUp size={22} strokeWidth={2.5} />
            <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>Stats</span>
          </Link>
          <Link to="/nutricion" className="nav-item" style={{ color: 'var(--on-surface-variant)' }}>
            <Utensils size={22} strokeWidth={2.5} />
            <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>Fuel</span>
          </Link>
          <Link to="/agenda" className="nav-item active" style={{ color: 'var(--primary)' }}>
            <CalendarIcon size={22} strokeWidth={2.5} />
            <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>Agenda</span>
          </Link>
        </nav>
      )}
    </div>
  );
}

function ClassItem({ classData, full, onReserve }) {
  const { user, classesRemaining } = useAuth();
  const { time, title, instructor, level, spots, color } = classData;

  return (
    <div style={{ 
      padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
      background: 'white', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', 
      border: '1px solid rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden',
      opacity: full ? 0.6 : 1, transition: 'transform 0.2s ease', cursor: 'pointer'
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: color }}></div>
      
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: color, letterSpacing: '0.1em', background: `${color}15`, padding: '4px 10px', borderRadius: '8px' }}>{time}</span>
          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--on-surface-variant)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{level}</span>
        </div>
        <h3 style={{ fontSize: '1.4rem', color: 'var(--black)', margin: '0 0 5px 0', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>{title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>
           <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'white', fontWeight: 800 }}>
             {instructor[0]}
           </div>
           {instructor}
        </div>
      </div>
      
      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
        <button 
          disabled={full || (user && classesRemaining <= 0)}
          onClick={() => {
            if(!full && onReserve) {
               onReserve();
            }
          }}
          style={{ 
            padding: '12px 20px', fontSize: '0.8rem', fontWeight: 800, borderRadius: '16px', border: 'none',
            background: full || (user && classesRemaining <= 0) ? 'rgba(0,0,0,0.05)' : 'var(--black)',
            color: full || (user && classesRemaining <= 0) ? 'var(--on-surface-variant)' : 'white',
            cursor: full || (user && classesRemaining <= 0) ? 'not-allowed' : 'pointer',
            boxShadow: full || (user && classesRemaining <= 0) ? 'none' : '0 10px 20px rgba(0,0,0,0.15)',
            textTransform: 'uppercase', letterSpacing: '0.05em'
          }}
        >
          {full ? 'Agotado' : (!user ? 'Ver Planes' : (classesRemaining <= 0 ? 'Sin Clases' : 'Reservar'))}
        </button>
        {!full && <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 800 }}>{spots} LUGARES</div>}
      </div>
    </div>
  );
}

export default Agenda;
