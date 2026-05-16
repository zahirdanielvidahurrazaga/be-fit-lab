import React, { useState } from 'react';
import { Calendar, Utensils, TrendingUp, User, QrCode, ChevronRight, Activity, Flame, Sparkles, Clock, MapPin } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { QRCodeCanvas } from 'qrcode.react';
import { motion } from 'framer-motion';
import { useScrollDetect } from '../hooks/useScrollDetect';

function Portal() {
  const navigate = useNavigate();
  const { user, plan, logout, classesRemaining, myReservations, cancelClass } = useAuth();
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const isScrolled = useScrollDetect(30);

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

  const rawName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Amanda';
  const userName = rawName.split(' ')[0]; // Solo el primer nombre para el saludo
  const greeting = new Date().getHours() < 12 ? 'Buenos días' : new Date().getHours() < 18 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="mobile-app-container" style={{ background: 'var(--app-bg)' }}>

      {/* HEADER UNIFICADO */}
      <header className="ios-header" style={{ paddingTop: '20px', paddingBottom: '5px', background: 'transparent' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: '0 0 2px', fontWeight: 600 }}>{greeting}</p>
            <h1 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', margin: 0, lineHeight: 1.1, color: 'var(--black)' }}>{userName} ✨</h1>
          </motion.div>
          <div style={{ position: 'relative' }}>
            <div 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              style={{ 
                width: '42px', height: '42px', borderRadius: '50%', 
                background: 'rgba(255,139,66,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer'
              }}>
              <User size={20} color="var(--primary)" />
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
        
        <div className="dashboard-sidebar">

          {/* MEMBERSHIP CARD - Minimal */}
          <motion.section initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{duration:0.5}}>
            <div style={{ 
              background: 'linear-gradient(135deg, #1C1C1A 0%, #0D0D0C 100%)', borderRadius: '28px', padding: '25px',
              color: 'white', position: 'relative', overflow: 'hidden',
              boxShadow: 'var(--card-shadow)',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              {/* Subtle glow */}
              <div style={{ position: 'absolute', top: '-50%', right: '-30%', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(255,139,66,0.1) 0%, transparent 70%)', borderRadius: '50%' }}></div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px', position: 'relative', zIndex: 1 }}>
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '4px' }}>Membresía</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>Premium</div>
                </div>
                <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, var(--primary), var(--accent))', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontFamily: 'var(--font-display)', fontSize: '1rem' }}>B</div>
              </div>

              <div style={{ display: 'flex', gap: '30px', position: 'relative', zIndex: 1 }}>
                <div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{classesRemaining}</div>
                  <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>Clases</div>
                </div>
                <div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-display)', lineHeight: 1 }}>4</div>
                  <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>Racha</div>
                </div>
              </div>
            </div>
          </motion.section>

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

      {/* QR BOTTOM SHEET */}
      {showQR && (
        <>
          <div className="qr-sheet-overlay" onClick={() => setShowQR(false)} />
          <div className="qr-bottom-sheet" style={{ padding: '12px 24px 20px', background: 'var(--surface)' }}>
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
                  <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--black)', letterSpacing: '2px' }}>BEFIT LAB</span>
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
              <div className="user-name">{user?.user_metadata?.full_name || 'Miembro BeFit'}</div>
              <div>{user?.email}</div>
            </div>
          </div>
        </>
      )}

      {/* FLOATING BOTTOM NAV — INSTAGRAM STYLE */}
      <nav className={`ios-bottom-nav ${isScrolled ? 'scrolled' : ''}`}>
        <Link to="/portal" className="nav-item active">
          <User size={22} strokeWidth={2.5} />
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
function TicketCard({ title, time, instructor, color, onClick }) {
  return (
    <div 
      onClick={onClick}
      style={{ 
        background: 'var(--app-surface-solid)', borderRadius: '24px', overflow: 'hidden',
        boxShadow: 'var(--card-shadow)', border: '1px solid var(--border-subtle)',
        cursor: 'pointer', transition: 'transform 0.2s ease'
      }}
    >
      {/* Top Section */}
      <div style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ 
            width: '50px', height: '50px', borderRadius: '50%', overflow: 'hidden',
            background: 'var(--surface)', flexShrink: 0
          }}>
            <img src={`https://i.pravatar.cc/150?u=${instructor}`} alt={instructor} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--black)', fontFamily: 'var(--font-display)' }}>{title}</h4>
            <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginTop: '3px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              {instructor}
            </div>
          </div>
        </div>
        <ChevronRight size={18} color="var(--on-surface-variant)" opacity={0.3} />
      </div>

      {/* Dashed Divider */}
      <div style={{ borderTop: '1px dashed rgba(0,0,0,0.08)', marginLeft: '20px', marginRight: '20px' }}></div>
      
      {/* Bottom Section - Ticket Info */}
      <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={14} color="var(--primary)" />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>{time}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MapPin size={14} color="var(--on-surface-variant)" />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)' }}>BEFIT LAB</span>
        </div>
      </div>
    </div>
  )
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
