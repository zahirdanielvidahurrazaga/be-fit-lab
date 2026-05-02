import React, { useState } from 'react';
import { Users, Calendar as CalendarIcon, Clock, LogOut, ChevronRight, ClipboardList, X, CheckCircle2, Mail, Phone, ChevronLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

function Coach() {
  const { user, logout, globalClasses, myReservations } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('agenda'); // agenda, directorio
  const [selectedClass, setSelectedClass] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const todayClasses = globalClasses.filter(c => c.day === new Date().getDate());

  // Mock de directorio de alumnas
  const alumnas = [
    { id: 1, name: "María López", plan: "Premium", classes: 8, phone: "2221234567", email: "maria@correo.com", status: "active" },
    { id: 2, name: "Ana García", plan: "FIT", classes: 5, phone: "2229876543", email: "ana@correo.com", status: "active" },
    { id: 3, name: "Sofía Ramírez", plan: "Básico", classes: 2, phone: "2225554433", email: "sofia@correo.com", status: "active" },
    { id: 4, name: "Valentina Torres", plan: "Premium", classes: 12, phone: "2228887766", email: "vale@correo.com", status: "active" },
    { id: 5, name: "Isabella Ruiz", plan: "FIT", classes: 0, phone: "2221112233", email: "isa@correo.com", status: "inactive" },
    { id: 6, name: "Camila Herrera", plan: "Premium", classes: 6, phone: "2224445566", email: "cami@correo.com", status: "active" },
    { id: 7, name: "Luciana Morales", plan: "Básico", classes: 3, phone: "2227778899", email: "lu@correo.com", status: "active" },
  ];

  return (
    <div className="mobile-app-container">
      {/* HEADER PREMIUM */}
      <header className="ios-header" style={{ paddingBottom: '15px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', margin: 0, lineHeight: 1.1, color: 'var(--black)' }}>Instructor</h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--primary)', margin: '4px 0 0', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{user?.email?.split('@')[0] || 'Coach'} • COACH</p>
          </div>
          <div 
            onClick={handleLogout}
            style={{ 
              width: '45px', height: '45px', borderRadius: '50%', 
              background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 10px 25px rgba(0,0,0,0.05)', cursor: 'pointer',
              border: '1px solid rgba(0,0,0,0.03)'
            }}>
            <LogOut size={18} color="var(--primary)" />
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        
        <div className="dashboard-sidebar">
          {/* MÉTRICAS HOY PREMIUM */}
          <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div style={{ padding: '20px', background: 'white', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.02)' }}>
              <div style={{ color: 'var(--primary)', marginBottom: '12px', background: 'rgba(255,145,77,0.1)', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={20} /></div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--black)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                {todayClasses.reduce((acc, c) => acc + (10 - c.spots), 0)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 700, marginTop: '5px' }}>Alumnas Hoy</div>
            </div>
            <div style={{ padding: '20px', background: 'white', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.02)' }}>
              <div style={{ color: 'var(--accent)', marginBottom: '12px', background: 'rgba(238,186,137,0.2)', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CalendarIcon size={20} /></div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--black)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                {todayClasses.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 700, marginTop: '5px' }}>Tus Clases</div>
            </div>
          </section>
        </div>

        <div className="dashboard-content">
          
          {/* ======= TAB: AGENDA ======= */}
          {activeTab === 'agenda' && (
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Agenda del Día</h2>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {todayClasses.length > 0 ? (
                  todayClasses.map(c => (
                    <div 
                      key={c.id} 
                      onClick={() => setSelectedClass(c)}
                      style={{ cursor: 'pointer' }}
                    >
                      <ClassCoachRow 
                        title={c.title} 
                        time={c.time} 
                        occupancy={`${10 - c.spots}/10`} 
                        status={c.spots === 0 ? "full" : "active"} 
                      />
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: '0.9rem', fontStyle: 'italic', background: 'rgba(55,61,59,0.03)', borderRadius: '16px' }}>
                    No tienes clases programadas para hoy.
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ======= TAB: DIRECTORIO PREMIUM ======= */}
          {activeTab === 'directorio' && (
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, fontFamily: 'var(--font-display)' }}>Directorio de Alumnas</h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 800, background: 'rgba(255,145,77,0.1)', padding: '4px 10px', borderRadius: '12px' }}>{alumnas.length} ACTIVAS</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {alumnas.map(a => (
                  <div key={a.id} style={{ 
                    padding: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    opacity: a.status === 'inactive' ? 0.5 : 1, background: 'white', borderRadius: '20px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.02)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{ 
                        width: '48px', height: '48px', borderRadius: '14px', 
                        background: a.status === 'active' ? 'linear-gradient(135deg, #1A1C1E, #2C302E)' : 'rgba(55,61,59,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: a.status === 'active' ? 'var(--accent)' : 'var(--on-surface-variant)', 
                        fontWeight: 800, fontSize: '1rem', fontFamily: 'var(--font-display)',
                        boxShadow: a.status === 'active' ? '0 8px 15px rgba(0,0,0,0.15)' : 'none'
                      }}>
                        {a.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--black)' }}>{a.name}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
                          <span style={{ 
                            fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase',
                            padding: '3px 8px', borderRadius: '6px',
                            background: a.plan === 'Premium' ? 'rgba(255,145,77,0.1)' : 'rgba(0,0,0,0.05)',
                            color: a.plan === 'Premium' ? 'var(--primary)' : 'var(--on-surface-variant)'
                          }}>
                            {a.plan}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>
                            {a.classes} sesiones
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <a href={`tel:${a.phone}`} style={{ 
                        width: '36px', height: '36px', borderRadius: '12px', 
                        background: 'rgba(0,122,255,0.08)', display: 'flex', 
                        alignItems: 'center', justifyContent: 'center', textDecoration: 'none'
                      }}>
                        <Phone size={16} color="#007AFF" />
                      </a>
                      <a href={`mailto:${a.email}`} style={{ 
                        width: '36px', height: '36px', borderRadius: '12px', 
                        background: 'rgba(55,61,59,0.06)', display: 'flex', 
                        alignItems: 'center', justifyContent: 'center', textDecoration: 'none'
                      }}>
                        <Mail size={16} color="var(--on-surface-variant)" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      </main>

      {/* MODAL DETALLE DE CLASE */}
      {selectedClass && (
        <div className="modal-overlay" onClick={() => setSelectedClass(null)}>
          <div className="glass-modal" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'left', maxWidth: '420px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-display)', margin: 0 }}>{selectedClass.title}</h2>
              <div onClick={() => setSelectedClass(null)} style={{ cursor: 'pointer', padding: '5px' }}>
                <X size={20} color="var(--on-surface-variant)" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div style={{ padding: '14px', background: 'rgba(255,145,77,0.06)', borderRadius: '14px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '5px' }}>Horario</div>
                <div style={{ fontSize: '1rem', fontWeight: 700 }}>{selectedClass.time}</div>
              </div>
              <div style={{ padding: '14px', background: 'rgba(255,145,77,0.06)', borderRadius: '14px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '5px' }}>Nivel</div>
                <div style={{ fontSize: '1rem', fontWeight: 700 }}>{selectedClass.level}</div>
              </div>
              <div style={{ padding: '14px', background: 'rgba(255,145,77,0.06)', borderRadius: '14px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '5px' }}>Ocupación</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: selectedClass.spots === 0 ? '#FF4D4D' : 'var(--primary)' }}>
                  {10 - selectedClass.spots}/10
                </div>
              </div>
              <div style={{ padding: '14px', background: 'rgba(255,145,77,0.06)', borderRadius: '14px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '5px' }}>Disponibles</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: selectedClass.spots === 0 ? '#FF4D4D' : '#22C55E' }}>
                  {selectedClass.spots} lugar{selectedClass.spots !== 1 ? 'es' : ''}
                </div>
              </div>
            </div>

            {/* Lista de alumnas inscritas (mock) */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                Alumnas Inscritas
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {['María López', 'Ana García', 'Valentina Torres'].slice(0, 10 - selectedClass.spots > 3 ? 3 : 10 - selectedClass.spots).map((name, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'rgba(55,61,59,0.03)', borderRadius: '12px' }}>
                    <div style={{ 
                      width: '30px', height: '30px', borderRadius: '50%', 
                      background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: '0.65rem', fontWeight: 700
                    }}>
                      {name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{name}</span>
                    <CheckCircle2 size={14} color="#22C55E" style={{ marginLeft: 'auto' }} />
                  </div>
                ))}
                {(10 - selectedClass.spots) > 3 && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', textAlign: 'center', padding: '8px', fontStyle: 'italic' }}>
                    +{(10 - selectedClass.spots) - 3} alumnas más
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={() => setSelectedClass(null)} 
              style={{ 
                width: '100%', padding: '14px', borderRadius: '14px', 
                background: 'var(--primary)', color: 'white', 
                fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '0.9rem' 
              }}
            >
              Cerrar Detalle
            </button>
          </div>
        </div>
      )}

      {/* ====== BOTTOM NAV PREMIUM ====== */}
      <nav className="ios-bottom-nav" style={{ padding: '0 10px 25px', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="nav-item" onClick={() => setActiveTab('agenda')} style={{ opacity: activeTab === 'agenda' ? 1 : 0.4, color: activeTab === 'agenda' ? 'var(--primary)' : 'var(--on-surface-variant)' }}>
          <CalendarIcon size={24} strokeWidth={2.5} />
          <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>Agenda</span>
        </div>
        <div className="nav-item" onClick={() => setActiveTab('directorio')} style={{ opacity: activeTab === 'directorio' ? 1 : 0.4, color: activeTab === 'directorio' ? 'var(--primary)' : 'var(--on-surface-variant)' }}>
          <Users size={24} strokeWidth={2.5} />
          <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>Alumnas</span>
        </div>
      </nav>
    </div>
  );
}

function ClassCoachRow({ title, time, occupancy, status }) {
  const getStatusColor = () => {
    if (status === 'active') return 'var(--primary)';
    if (status === 'full') return '#FF4D4D';
    return 'var(--on-surface-variant)';
  };

  return (
    <div style={{ 
      padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'white', borderRadius: '20px', boxShadow: '0 8px 20px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.02)',
      transition: 'transform 0.2s ease', cursor: 'pointer'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <div style={{ 
          width: '45px', height: '45px', borderRadius: '14px', 
          background: status === 'full' ? 'rgba(255,77,77,0.1)' : 'rgba(255,145,77,0.1)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: status === 'full' ? '1px solid rgba(255,77,77,0.2)' : '1px solid rgba(255,145,77,0.2)'
        }}>
          <div style={{ 
            width: '12px', height: '12px', borderRadius: '50%', 
            background: getStatusColor(),
            boxShadow: `0 0 10px ${getStatusColor()}`
          }}></div>
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--black)' }}>{title}</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>{time}</span>
            <span style={{ 
              fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.05em',
              padding: '2px 8px', borderRadius: '8px',
              background: status === 'full' ? 'rgba(255,77,77,0.1)' : 'rgba(0,0,0,0.05)',
              color: status === 'full' ? '#FF4D4D' : 'var(--on-surface-variant)'
            }}>
              {occupancy} LUG.
            </span>
          </div>
        </div>
      </div>
      <ChevronRight size={20} color="var(--on-surface-variant)" opacity={0.3} />
    </div>
  )
}

export default Coach;
