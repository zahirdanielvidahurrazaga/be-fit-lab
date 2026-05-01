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
      {/* HEADER TIPO iOS */}
      <header className="ios-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', margin: 0, lineHeight: 1.2 }}>Instructor</h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', margin: 0, fontWeight: 500 }}>{user?.email?.split('@')[0] || 'Coach'}</p>
          </div>
          <div 
            onClick={handleLogout}
            style={{ 
              width: '45px', height: '45px', borderRadius: '50%', 
              background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(10px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(55,61,59,0.05)', cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.8)'
            }}>
            <LogOut size={20} color="var(--primary)" />
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        
        <div className="dashboard-sidebar">
          {/* MÉTRICAS HOY */}
          <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="ios-glass-card" style={{ padding: '20px' }}>
              <div style={{ color: 'var(--primary)', marginBottom: '8px' }}><Users size={24} /></div>
              <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                {todayClasses.reduce((acc, c) => acc + (10 - c.spots), 0)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 600, textTransform: 'uppercase', marginTop: '5px' }}>Alumnas Hoy</div>
            </div>
            <div className="ios-glass-card" style={{ padding: '20px' }}>
              <div style={{ color: 'var(--accent)', marginBottom: '8px' }}><CalendarIcon size={24} /></div>
              <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                {todayClasses.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 600, textTransform: 'uppercase', marginTop: '5px' }}>Tus Clases</div>
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

          {/* ======= TAB: DIRECTORIO ======= */}
          {activeTab === 'directorio' && (
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Directorio de Alumnas</h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>{alumnas.length} registradas</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {alumnas.map(a => (
                  <div key={a.id} className="ios-glass-card" style={{ 
                    padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    opacity: a.status === 'inactive' ? 0.5 : 1
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ 
                        width: '44px', height: '44px', borderRadius: '50%', 
                        background: a.status === 'active' ? 'linear-gradient(135deg, var(--primary), var(--accent))' : 'rgba(55,61,59,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 700, fontSize: '0.9rem'
                      }}>
                        {a.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>{a.name}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                          <span style={{ 
                            fontSize: '0.7rem', fontWeight: 700, 
                            padding: '2px 8px', borderRadius: '6px',
                            background: a.plan === 'Premium' ? 'rgba(255,145,77,0.12)' : 'rgba(55,61,59,0.06)',
                            color: a.plan === 'Premium' ? 'var(--primary)' : 'var(--on-surface-variant)'
                          }}>
                            {a.plan}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>
                            {a.classes} clases restantes
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <a href={`tel:${a.phone}`} style={{ 
                        width: '34px', height: '34px', borderRadius: '10px', 
                        background: 'rgba(55,61,59,0.04)', display: 'flex', 
                        alignItems: 'center', justifyContent: 'center', textDecoration: 'none'
                      }}>
                        <Phone size={15} color="var(--on-surface-variant)" />
                      </a>
                      <a href={`mailto:${a.email}`} style={{ 
                        width: '34px', height: '34px', borderRadius: '10px', 
                        background: 'rgba(55,61,59,0.04)', display: 'flex', 
                        alignItems: 'center', justifyContent: 'center', textDecoration: 'none'
                      }}>
                        <Mail size={15} color="var(--on-surface-variant)" />
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

      {/* FLOATING BOTTOM NAV TIPO iPHONE */}
      <nav className="ios-bottom-nav">
        <div className="nav-item" onClick={() => setActiveTab('agenda')} style={{ opacity: activeTab === 'agenda' ? 1 : 0.5, color: activeTab === 'agenda' ? 'var(--primary)' : 'var(--on-surface-variant)' }}>
          <CalendarIcon size={24} strokeWidth={2.5} />
          <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>Agenda</span>
        </div>
        <div className="nav-item" onClick={() => setActiveTab('directorio')} style={{ opacity: activeTab === 'directorio' ? 1 : 0.5, color: activeTab === 'directorio' ? 'var(--primary)' : 'var(--on-surface-variant)' }}>
          <Users size={24} strokeWidth={2.5} />
          <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>Alumnas</span>
        </div>
      </nav>
    </div>
  );
}

function ClassCoachRow({ title, time, occupancy, status }) {
  const getStatusColor = () => {
    if (status === 'active') return 'var(--primary)';
    if (status === 'full') return 'var(--accent)';
    return 'var(--on-surface-variant)';
  };

  return (
    <div className="ios-glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <div style={{ width: '45px', height: '45px', borderRadius: '14px', background: `rgba(255,145,77,0.1)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Clock size={16} color={getStatusColor()} />
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>{title}</h4>
          <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginTop: '2px', fontWeight: 500 }}>
            <span style={{ color: getStatusColor() }}>{time}</span> • {occupancy} Alumnas
          </div>
        </div>
      </div>
      <ChevronRight size={20} color="var(--on-surface-variant)" opacity={0.5} />
    </div>
  )
}

export default Coach;
