import React, { useState } from 'react';
import { Calendar, Utensils, TrendingUp, Play, User, QrCode, ChevronRight, Activity, Flame } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { QRCodeCanvas } from 'qrcode.react';

function Portal() {
  const navigate = useNavigate();
  const { user, logout, classesRemaining, myReservations, cancelClass } = useAuth();
  
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
      
      {/* HEADER TIPO iOS */}
      <header className="ios-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', margin: 0, lineHeight: 1.2 }}>Hola, {user?.email?.split('@')[0] || 'Amanda'}</h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', margin: 0, fontWeight: 500 }}>Membresía Premium Activa</p>
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
          {/* MÓDULO QR TIPO APPLE WALLET */}
          <section>
            <div className="wallet-card">
              <div className="wallet-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '30px', height: '30px', background: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--primary)', fontFamily: 'var(--font-display)' }}>B</div>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'white', letterSpacing: '1px' }}>BEFIT LAB</span>
                </div>
                <QrCode size={20} color="rgba(255,255,255,0.8)" />
              </div>
              
              <div className="wallet-body">
                <div style={{ background: 'white', padding: '15px', borderRadius: '16px', display: 'inline-block' }}>
                  <QRCodeCanvas 
                    value={user?.id || 'befit-client-id'} 
                    size={140}
                    level={"H"}
                    includeMargin={false}
                    fgColor="#373D3B"
                  />
                </div>
              </div>
              
              <div className="wallet-footer">
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase' }}>Clases Restantes</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>{classesRemaining} sesiones</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase' }}>Vigencia</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>24 Nov</div>
                </div>
              </div>
            </div>
          </section>

          {/* ACCESOS RÁPIDOS GLASS */}
          <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="ios-glass-btn" onClick={() => navigate('/nutricion')}>
              <div className="icon-wrapper" style={{ color: 'var(--primary)', background: 'rgba(255,145,77,0.1)' }}>
                <Utensils size={20} />
              </div>
              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Mi Plan</span>
            </div>
            <div className="ios-glass-btn" onClick={() => navigate('/evolucion')}>
              <div className="icon-wrapper" style={{ color: 'var(--accent)', background: 'rgba(238,186,137,0.15)' }}>
                <Activity size={20} />
              </div>
              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Evolución</span>
            </div>
          </section>
        </div>

        {/* LADO DERECHO: Reservas y Métricas */}
        <div className="dashboard-content">
          {/* METRICAS VITALES */}
          <section>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '15px' }}>Tu Desempeño</h2>
            <div className="ios-glass-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-around' }}>
               <div style={{ textAlign: 'center' }}>
                  <div style={{ color: 'var(--primary)', marginBottom: '5px' }}><Flame size={24} style={{ margin: '0 auto' }}/></div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>4</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', fontWeight: 600, textTransform: 'uppercase' }}>Racha Días</div>
               </div>
               <div style={{ width: '1px', background: 'rgba(55,61,59,0.1)' }}></div>
               <div style={{ textAlign: 'center' }}>
                  <div style={{ color: 'var(--accent)', marginBottom: '5px' }}><Activity size={24} style={{ margin: '0 auto' }}/></div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>1,240</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', fontWeight: 600, textTransform: 'uppercase' }}>Kcal Quemadas</div>
               </div>
            </div>
          </section>

          {/* PRÓXIMAS CLASES */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Mis Reservas</h2>
              <Link to="/agenda" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}>Ver todas</Link>
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
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: '0.9rem', fontStyle: 'italic', background: 'rgba(55,61,59,0.03)', borderRadius: '16px' }}>
                  No tienes próximas clases agendadas.
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
      className="ios-glass-card" 
      onClick={onClick}
      style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `rgba(255,145,77,0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: color }}></div>
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>{title}</h4>
          <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginTop: '2px' }}>{time} • {instructor}</div>
        </div>
      </div>
      <ChevronRight size={20} color="var(--on-surface-variant)" opacity={0.5} />
    </div>
  )
}

export default Portal;
