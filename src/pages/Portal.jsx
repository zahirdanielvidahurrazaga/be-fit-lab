import React, { useState } from 'react';
import { Calendar, Utensils, TrendingUp, Play, User, QrCode, ChevronRight, Activity, Flame } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { QRCodeCanvas } from 'qrcode.react';

function Portal() {
  const navigate = useNavigate();
  const { user, plan, logout, classesRemaining, myReservations, cancelClass } = useAuth();
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);

  const handleCancelClick = (res) => {
    setSelectedReservation(res);
    setShowCancelModal(true);
  };

  const confirmCancellation = () => {
    if (selectedReservation) {
      cancelClass(selectedReservation.classId);
    }
    setShowCancelModal(false);
  };

  return (
    <div className="mobile-app-container">
      
      {/* BACKGROUND DECORATION */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '30vh', background: 'linear-gradient(to bottom, rgba(238,186,137,0.15), transparent)', zIndex: -1 }}></div>

      {/* HEADER TIPO iOS */}
      <header className="ios-header" style={{ paddingTop: '20px', background: 'transparent' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', fontFamily: 'var(--font-display)', margin: 0, lineHeight: 1.1, color: 'var(--black)' }}>Hola, {user?.email?.split('@')[0] || 'Amanda'}</h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--primary)', margin: '5px 0 0', fontWeight: 700, letterSpacing: '0.05em' }}>Membresía Premium Activa</p>
          </div>
          <div style={{ position: 'relative' }}>
            <div 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              style={{ 
                width: '45px', height: '45px', borderRadius: '50%', 
                background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(10px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(55,61,59,0.05)', cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.8)'
              }}>
              <User size={20} color="var(--primary)" />
            </div>

            {/* DROPDOWN PERFIL INTEGRADO */}
            {showProfileMenu && (
              <div className="profile-dropdown">
                <div style={{ padding: '10px 15px', borderBottom: '1px solid rgba(55,61,59,0.05)', marginBottom: '5px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{user?.email?.split('@')[0] || 'Amanda'}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)' }}>Socia Activa</div>
                </div>
                <div className="profile-dropdown-item" onClick={() => setShowProfileMenu(false)}>
                   Mi Cuenta (Próximamente)
                </div>
                <div className="profile-dropdown-item" onClick={() => setShowProfileMenu(false)}>
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

      <main className="dashboard-main">
        
        {/* LADO IZQUIERDO: Perfil y Accesos */}
        <div className="dashboard-sidebar">
          {/* MÓDULO QR TIPO BLACK CARD */}
          <section>
            <div className="wallet-card" style={{ 
              background: 'linear-gradient(135deg, #2C302E 0%, #1A1C1E 100%)', 
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              border: '1px solid rgba(255,255,255,0.1)',
              position: 'relative', overflow: 'hidden'
            }}>
              {/* Reflejo estilo tarjeta de crédito */}
              <div style={{ position: 'absolute', top: 0, left: '-100%', width: '50%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)', transform: 'skewX(-20deg)' }}></div>

              <div className="wallet-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, var(--accent), #D4A373)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#1A1C1E', fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>B</div>
                  <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--accent)', letterSpacing: '2px' }}>BEFIT LAB</span>
                </div>
                <QrCode size={20} color="var(--accent)" opacity={0.8} />
              </div>
              
              <div className="wallet-body" style={{ padding: '25px 20px' }}>
                <div style={{ background: 'white', padding: '12px', borderRadius: '16px', display: 'inline-block', boxShadow: '0 10px 20px rgba(0,0,0,0.3)' }}>
                  <QRCodeCanvas 
                    value={user?.id || 'befit-client-id'} 
                    size={130}
                    level={"H"}
                    includeMargin={false}
                    fgColor="#1A1C1E"
                  />
                </div>
              </div>
              
              <div className="wallet-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Clases Disponibles</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', fontFamily: 'var(--font-display)' }}>{classesRemaining} <span style={{fontSize: '0.9rem', fontWeight: 500, color: 'var(--accent)'}}>sesiones</span></div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Vigencia</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white' }}>24 Nov</div>
                </div>
              </div>
            </div>
          </section>

          {/* ACCESOS RÁPIDOS GLASS (Rediseñados) */}
          <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="ios-glass-btn" onClick={() => navigate('/nutricion')} style={{ padding: '20px 15px', background: 'linear-gradient(to bottom right, rgba(255,255,255,0.9), rgba(255,255,255,0.6))', border: '1px solid white', boxShadow: '0 10px 20px rgba(0,0,0,0.03)' }}>
              <div className="icon-wrapper" style={{ color: 'var(--primary)', background: 'rgba(255,145,77,0.1)', width: '45px', height: '45px', marginBottom: '12px' }}>
                <Utensils size={22} />
              </div>
              <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--black)' }}>Nutrición</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', marginTop: '4px' }}>Ver recetario</span>
            </div>
            <div className="ios-glass-btn" onClick={() => navigate('/evolucion')} style={{ padding: '20px 15px', background: 'linear-gradient(to bottom right, rgba(255,255,255,0.9), rgba(255,255,255,0.6))', border: '1px solid white', boxShadow: '0 10px 20px rgba(0,0,0,0.03)' }}>
              <div className="icon-wrapper" style={{ color: 'var(--accent)', background: 'rgba(238,186,137,0.2)', width: '45px', height: '45px', marginBottom: '12px' }}>
                <Activity size={22} />
              </div>
              <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--black)' }}>Evolución</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', marginTop: '4px' }}>Tu progreso</span>
            </div>
          </section>
        </div>

        {/* LADO DERECHO: Reservas y Métricas */}
        <div className="dashboard-content">
          {/* METRICAS VITALES */}
          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '15px', fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}>Tu Desempeño</h2>
            <div className="ios-glass-card" style={{ padding: '25px', display: 'flex', justifyContent: 'space-around', background: 'white', border: 'none', boxShadow: '0 15px 35px rgba(0,0,0,0.03)' }}>
               <div style={{ textAlign: 'center' }}>
                  <div style={{ color: 'var(--primary)', marginBottom: '8px', background: 'rgba(255,145,77,0.1)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}><Flame size={20} /></div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--black)', lineHeight: 1 }}>4 <span style={{fontSize: '1rem', color: 'var(--on-surface-variant)'}}>días</span></div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '5px' }}>Racha actual</div>
               </div>
               <div style={{ width: '1px', background: 'rgba(0,0,0,0.05)' }}></div>
               <div style={{ textAlign: 'center' }}>
                  <div style={{ color: 'var(--accent)', marginBottom: '8px', background: 'rgba(238,186,137,0.2)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}><Activity size={20} /></div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--black)', lineHeight: 1 }}>1.2<span style={{fontSize: '1rem', color: 'var(--on-surface-variant)'}}>k</span></div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '5px' }}>Kcal Quemadas</div>
               </div>
            </div>
          </section>

          {/* PRÓXIMAS CLASES */}
          <section style={{ marginTop: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '15px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}>Mis Reservas</h2>
              <Link to="/agenda" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', textDecoration: 'none', background: 'rgba(255,145,77,0.1)', padding: '4px 10px', borderRadius: '20px' }}>Ver agenda</Link>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {myReservations && myReservations.length > 0 ? (
                myReservations.map((res, index) => (
                  <ClassRow 
                    key={index}
                    title={res.title} 
                    time={res.time} 
                    instructor={res.instructor} 
                    color={res.color || 'var(--primary)'} 
                    onClick={() => handleCancelClick(res)} 
                  />
                ))
              ) : (
                <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: '0.9rem', background: 'white', borderRadius: '16px', border: '1px dashed rgba(0,0,0,0.1)' }}>
                  <Calendar size={30} color="rgba(0,0,0,0.1)" style={{ margin: '0 auto 10px' }} />
                  <p style={{ margin: 0, fontWeight: 500 }}>No tienes clases próximas.</p>
                  <Link to="/agenda" style={{ display: 'inline-block', marginTop: '10px', color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>Agendar ahora</Link>
                </div>
              )}
            </div>
          </section>
        </div>

      </main>

      {/* MODAL INTEGRADO PARA CANCELAR */}
      {showCancelModal && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="glass-modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-display)', marginBottom: '15px' }}>Detalle de Reserva</h2>
            <div style={{ background: 'rgba(55,61,59,0.03)', padding: '15px', borderRadius: '16px', marginBottom: '20px', textAlign: 'left' }}>
               <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--on-surface)' }}>{selectedReservation?.title}</div>
               <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, marginTop: '5px' }}>{selectedReservation?.time}</div>
            </div>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.85rem', marginBottom: '20px', lineHeight: 1.5 }}>
              ¿Deseas cancelar esta asistencia? La clase se devolverá a tu paquete si cancelas con 12hrs de anticipación.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowCancelModal(false)} className="btn-outline" style={{ flex: 1, padding: '12px', fontSize: '0.9rem' }}>Volver</button>
              <button onClick={confirmCancellation} className="btn-primary" style={{ flex: 1, padding: '12px', fontSize: '0.9rem', justifyContent: 'center', background: '#FF4D4D', boxShadow: '0 10px 25px rgba(255,77,77,0.3)' }}>Cancelar Clase</button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING BOTTOM NAV TIPO iPHONE */}
      <nav className="ios-bottom-nav">
        <Link to="/portal" className="nav-item active">
          <User size={24} strokeWidth={2.5} />
        </Link>
        <Link to="/evolucion" className="nav-item">
          <TrendingUp size={24} strokeWidth={2.5} />
        </Link>
        <Link to="/nutricion" className="nav-item">
          <Utensils size={24} strokeWidth={2.5} />
        </Link>
        <Link to="/agenda" className="nav-item">
          <Calendar size={24} strokeWidth={2.5} />
        </Link>
      </nav>
    </div>
  );
}

function ClassRow({ title, time, instructor, color, onClick }) {
  return (
    <div 
      onClick={onClick}
      style={{ 
        padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        cursor: 'pointer', background: 'white', borderRadius: '16px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.03)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
      }}
      onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.01)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.05)'; }}
      onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.02)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${color}30` }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: color, boxShadow: `0 0 10px ${color}` }}></div>
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--black)' }}>{title}</h4>
          <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginTop: '4px', fontWeight: 600 }}>
            <span style={{ color: color }}>{time}</span> • {instructor}
          </div>
        </div>
      </div>
      <ChevronRight size={20} color="var(--on-surface-variant)" opacity={0.3} />
    </div>
  )
}

export default Portal;
