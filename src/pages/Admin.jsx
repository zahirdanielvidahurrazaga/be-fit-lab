import React, { useState, useEffect, useRef } from 'react';
import { LogOut, Users, Activity, QrCode, UserPlus, CreditCard, CheckCircle2, Plus, Minus, Calendar, BarChart3, Phone, Mail, TrendingUp, DollarSign, PieChart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function Admin() {
  const { user, logout, globalClasses, updateClassSpots, checkInClient } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('mostrador');
  
  // QR Scanner
  const qrInputRef = useRef(null);
  const [scannedQR, setScannedQR] = useState('');
  const [showSuccessMsg, setShowSuccessMsg] = useState(false);
  const [qrMessage, setQrMessage] = useState('');

  // Inscribir
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [showInscribirSuccess, setShowInscribirSuccess] = useState(false);

  // Pagos
  const [selectedPayMethod, setSelectedPayMethod] = useState('efectivo');
  const [showPaySuccess, setShowPaySuccess] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  const todayClasses = globalClasses.filter(c => c.day === new Date().getDate());
  const totalAlumnasHoy = todayClasses.reduce((acc, c) => acc + (10 - c.spots), 0);
  const avgOccupancy = todayClasses.length > 0 ? Math.round((totalAlumnasHoy / (todayClasses.length * 10)) * 100) : 0;

  // Mock alumnas
  const alumnas = [
    { id: 1, name: "María López", plan: "Premium", classes: 8, phone: "2221234567", email: "maria@correo.com" },
    { id: 2, name: "Ana García", plan: "FIT", classes: 5, phone: "2229876543", email: "ana@correo.com" },
    { id: 3, name: "Sofía Ramírez", plan: "Básico", classes: 2, phone: "2225554433", email: "sofia@correo.com" },
    { id: 4, name: "Valentina Torres", plan: "Premium", classes: 12, phone: "2228887766", email: "vale@correo.com" },
    { id: 5, name: "Isabella Ruiz", plan: "FIT", classes: 0, phone: "2221112233", email: "isa@correo.com" },
    { id: 6, name: "Camila Herrera", plan: "Premium", classes: 6, phone: "2224445566", email: "cami@correo.com" },
  ];

  useEffect(() => {
    if (activeTab === 'mostrador' && qrInputRef.current) {
      qrInputRef.current.focus();
    }
  }, [activeTab]);

  const handleQRScan = (e) => {
    e.preventDefault();
    if (scannedQR.trim() !== '') {
      const result = checkInClient(scannedQR);
      setQrMessage(result.message);
      setShowSuccessMsg(true);
      setScannedQR('');
      setTimeout(() => setShowSuccessMsg(false), 3000);
      if (qrInputRef.current) qrInputRef.current.focus();
    }
  };

  const handleInscribir = () => {
    if (newName.trim() && newEmail.trim()) {
      setShowInscribirSuccess(true);
      setTimeout(() => {
        setShowInscribirSuccess(false);
        setNewName(''); setNewEmail(''); setNewPhone('');
      }, 2500);
    }
  };

  const handlePago = () => {
    setShowPaySuccess(true);
    setTimeout(() => setShowPaySuccess(false), 2500);
  };

  const inputStyle = { width: '100%', padding: '14px 16px', borderRadius: '14px', border: '1px solid rgba(55,61,59,0.08)', background: 'var(--surface-lowest)', fontFamily: 'var(--font-body)', fontSize: '0.9rem', outline: 'none', transition: 'border 0.2s' };
  const labelStyle = { fontSize: '0.78rem', fontWeight: 700, color: 'var(--on-surface-variant)', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' };

  return (
    <div className="mobile-app-container" style={{ background: 'var(--surface-lowest)' }}>
      {/* HEADER */}
      <header className="ios-header" style={{ background: 'var(--surface-lowest)', paddingBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', margin: 0, lineHeight: 1.2 }}>Gestión Lab</h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', margin: 0, fontWeight: 500 }}>{user?.email?.split('@')[0] || 'Admin'}</p>
          </div>
          <div onClick={handleLogout} style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'var(--app-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(55,61,59,0.05)', cursor: 'pointer' }}>
            <LogOut size={20} color="var(--primary)" />
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-sidebar">

          {/* ============ TAB: MOSTRADOR (QR + métricas rápidas) ============ */}
          {activeTab === 'mostrador' && (
            <>
              {/* LECTOR QR */}
              <section>
                <div className="wallet-card" style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))', padding: '30px 20px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                  {showSuccessMsg ? (
                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                      <div style={{ width: '60px', height: '60px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                        <CheckCircle2 size={30} color="white" />
                      </div>
                      <h2 style={{ fontSize: '1.5rem', color: 'white', fontFamily: 'var(--font-display)', margin: 0 }}>¡Check-in Exitoso!</h2>
                      <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.85rem', margin: '5px 0 0' }}>{qrMessage}</p>
                    </div>
                  ) : (
                    <div onClick={() => qrInputRef.current?.focus()} style={{ cursor: 'pointer' }}>
                      <div style={{ width: '60px', height: '60px', background: 'rgba(255,255,255,0.2)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                        <QrCode size={30} color="white" />
                      </div>
                      <h2 style={{ fontSize: '1.5rem', color: 'white', fontFamily: 'var(--font-display)', margin: 0 }}>Escáner de Acceso</h2>
                      <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.85rem', margin: '5px 0 0' }}>Detectando códigos en tiempo real...</p>
                    </div>
                  )}
                  <form onSubmit={handleQRScan} style={{ position: 'absolute', top: '-1000px', left: '-1000px' }}>
                    <input ref={qrInputRef} type="text" value={scannedQR} onChange={(e) => setScannedQR(e.target.value)} autoFocus autoComplete="off" />
                  </form>
                </div>
              </section>

              <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="ios-glass-card" style={{ padding: '18px', background: 'var(--surface)', border: 'none' }}>
                  <div style={{ color: 'var(--primary)', marginBottom: '8px' }}><Users size={22} /></div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{totalAlumnasHoy}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', fontWeight: 600, textTransform: 'uppercase', marginTop: '4px' }}>Alumnas Hoy</div>
                </div>
                <div className="ios-glass-card" style={{ padding: '18px', background: 'var(--surface)', border: 'none' }}>
                  <div style={{ color: 'var(--accent)', marginBottom: '8px' }}><Activity size={22} /></div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{avgOccupancy}%</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', fontWeight: 600, textTransform: 'uppercase', marginTop: '4px' }}>Ocupación</div>
                </div>
              </section>
            </>
          )}

          {/* ============ TAB: CUPOS (Control de disponibilidad) ============ */}
          {activeTab === 'cupos' && (
            <section>
              <h2 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-display)', marginBottom: '15px' }}>Gestión de Disponibilidad</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {todayClasses.length > 0 ? todayClasses.map((c) => (
                  <div key={c.id} className="ios-glass-card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '1rem', margin: '0 0 4px 0', fontFamily: 'var(--font-display)' }}>{c.title}</h3>
                      <p style={{ fontSize: '0.78rem', color: 'var(--on-surface-variant)', margin: 0 }}>{c.time} • {c.instructor}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button onClick={() => updateClassSpots(c.id, Math.max(0, c.spots - 1))} style={{ width: '32px', height: '32px', borderRadius: '10px', border: 'none', background: 'rgba(55,61,59,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Minus size={16} color="var(--on-surface)" />
                      </button>
                      <div style={{ textAlign: 'center', minWidth: '35px' }}>
                        <span style={{ fontSize: '1.4rem', fontWeight: 800, color: c.spots === 0 ? '#FF4D4D' : 'var(--primary)' }}>{c.spots}</span>
                      </div>
                      <button onClick={() => updateClassSpots(c.id, c.spots + 1)} style={{ width: '32px', height: '32px', borderRadius: '10px', border: 'none', background: 'rgba(55,61,59,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Plus size={16} color="var(--on-surface)" />
                      </button>
                    </div>
                  </div>
                )) : (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: '0.9rem', fontStyle: 'italic', background: 'rgba(55,61,59,0.03)', borderRadius: '16px' }}>
                    No hay clases programadas para hoy.
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ============ TAB: INSCRIBIR ============ */}
          {activeTab === 'inscribir' && (
            <section>
              <h2 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-display)', marginBottom: '20px' }}>Inscripción Directa</h2>
              {showInscribirSuccess ? (
                <SuccessCard message="Alumna registrada exitosamente." />
              ) : (
                <div className="ios-glass-card" style={{ background: 'var(--surface)', border: 'none', padding: '22px' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={labelStyle}>Nombre Completo</label>
                    <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ej. Ana Pérez" style={inputStyle} />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={labelStyle}>Correo Electrónico</label>
                    <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="ana@ejemplo.com" style={inputStyle} />
                  </div>
                  <div style={{ marginBottom: '22px' }}>
                    <label style={labelStyle}>WhatsApp</label>
                    <input type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="10 dígitos" style={inputStyle} />
                  </div>
                  <button onClick={handleInscribir} style={{ width: '100%', padding: '15px', borderRadius: '14px', background: 'var(--primary)', color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '0.95rem' }}>
                    Crear Expediente
                  </button>
                </div>
              )}
            </section>
          )}

          {/* ============ TAB: PAGOS ============ */}
          {activeTab === 'pagos' && (
            <section>
              <h2 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-display)', marginBottom: '20px' }}>Cobro de Membresía</h2>
              {showPaySuccess ? (
                <SuccessCard message="Pago confirmado y clases asignadas." />
              ) : (
                <div className="ios-glass-card" style={{ background: 'var(--surface)', border: 'none', padding: '22px' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={labelStyle}>Alumna</label>
                    <select style={{ ...inputStyle, WebkitAppearance: 'none' }}>
                      <option value="">Seleccionar alumna...</option>
                      {alumnas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={labelStyle}>Membresía</label>
                    <select style={{ ...inputStyle, WebkitAppearance: 'none' }}>
                      <option value="fit">Plan FIT — 20 clases ($1,200)</option>
                      <option value="premium">Plan Premium — 30 clases ($1,800)</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: '22px' }}>
                    <label style={labelStyle}>Método</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                      {['efectivo', 'tarjeta', 'transferencia'].map(m => (
                        <div key={m} onClick={() => setSelectedPayMethod(m)} style={{ 
                          padding: '12px 8px', textAlign: 'center', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem',
                          background: selectedPayMethod === m ? 'var(--primary)' : 'var(--surface-lowest)',
                          color: selectedPayMethod === m ? 'white' : 'var(--on-surface-variant)',
                          border: selectedPayMethod === m ? '1px solid var(--primary)' : '1px solid rgba(55,61,59,0.08)'
                        }}>{m.toUpperCase()}</div>
                      ))}
                    </div>
                  </div>
                  <button onClick={handlePago} style={{ width: '100%', padding: '15px', borderRadius: '14px', background: 'var(--primary)', color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '0.95rem' }}>
                    Confirmar Transacción
                  </button>
                </div>
              )}
            </section>
          )}

          {/* ============ TAB: REPORTES (Métricas de Negocio) ============ */}
          {activeTab === 'reportes' && (
            <section>
              <h2 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-display)', marginBottom: '20px' }}>Estado del Negocio</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <ReportMetric icon={<DollarSign size={18}/>} label="INGRESOS MES" value="$42,850" trend="+15%" />
                <ReportMetric icon={<TrendingUp size={18}/>} label="RETENCIÓN" value="92%" trend="+2%" />
              </div>

              <div className="ios-glass-card" style={{ padding: '20px', background: 'var(--surface)', border: 'none', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                   <h3 style={{ fontSize: '0.9rem', fontWeight: 800 }}>Ocupación Semanal</h3>
                   <PieChart size={16} color="var(--primary)" />
                </div>
                <div style={{ height: '100px', display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                   {[30, 45, 60, 85, 70, 40, 20].map((h, i) => (
                     <div key={i} style={{ flex: 1, height: `${h}%`, background: 'var(--primary)', opacity: 0.2 + (h/100), borderRadius: '4px' }} />
                   ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                   {['L','M','M','J','V','S','D'].map(d => <span key={d} style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--on-surface-variant)' }}>{d}</span>)}
                </div>
              </div>

              <div className="ios-glass-card" style={{ padding: '15px', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.1)' }}>
                 <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ background: '#22C55E', color: 'white', padding: '6px', borderRadius: '8px' }}><TrendingUp size={16}/></div>
                    <div>
                       <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>Crecimiento Saludable</div>
                       <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>12 nuevas alumnas este periodo.</div>
                    </div>
                 </div>
              </div>
            </section>
          )}

        </div>
      </main>

      {/* ====== BOTTOM NAV PREMIUM ====== */}
      <nav className="ios-bottom-nav" style={{ padding: '0 10px 25px' }}>
        <div className="nav-item" onClick={() => setActiveTab('cupos')} style={{ opacity: activeTab === 'cupos' ? 1 : 0.4 }}>
          <Calendar size={20} strokeWidth={2.5} />
          <span style={{ fontSize: '0.55rem' }}>Cupos</span>
        </div>
        <div className="nav-item" onClick={() => setActiveTab('inscribir')} style={{ opacity: activeTab === 'inscribir' ? 1 : 0.4 }}>
          <UserPlus size={20} strokeWidth={2.5} />
          <span style={{ fontSize: '0.55rem' }}>Inscribir</span>
        </div>
        
        <button className="nav-central-action" onClick={() => setActiveTab('mostrador')} style={{ background: activeTab === 'mostrador' ? 'var(--primary)' : '#1A1C1E', width: '50px', height: '50px', transform: 'translateY(-15px)' }}>
          <QrCode size={24} />
        </button>

        <div className="nav-item" onClick={() => setActiveTab('pagos')} style={{ opacity: activeTab === 'pagos' ? 1 : 0.4 }}>
          <CreditCard size={20} strokeWidth={2.5} />
          <span style={{ fontSize: '0.55rem' }}>Pagos</span>
        </div>
        <div className="nav-item" onClick={() => setActiveTab('reportes')} style={{ opacity: activeTab === 'reportes' ? 1 : 0.4 }}>
          <BarChart3 size={20} strokeWidth={2.5} />
          <span style={{ fontSize: '0.55rem' }}>Reportes</span>
        </div>
      </nav>
    </div>
  );
}

function SuccessCard({ message }) {
  return (
    <div className="ios-glass-card" style={{ padding: '40px 20px', textAlign: 'center', background: 'var(--surface)', border: 'none' }}>
      <div style={{ width: '60px', height: '60px', background: 'rgba(34,197,94,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
        <CheckCircle2 size={30} color="#22C55E" />
      </div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '5px' }}>¡Éxito!</h3>
      <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.85rem' }}>{message}</p>
    </div>
  );
}

function ReportMetric({ icon, label, value, trend }) {
  return (
    <div className="ios-glass-card" style={{ padding: '15px', background: 'var(--surface)', border: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', marginBottom: '8px' }}>
         {icon}
         <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--on-surface-variant)', letterSpacing: '0.05em' }}>{label}</span>
      </div>
      <div style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--on-surface)' }}>{value}</div>
      <div style={{ fontSize: '0.7rem', color: '#22C55E', fontWeight: 800, marginTop: '2px' }}>{trend} ↑</div>
    </div>
  );
}

export default Admin;
