import React, { useState, useEffect, useRef } from 'react';
import { LogOut, Users, Activity, QrCode, CheckCircle2, Plus, Minus, Calendar, BarChart3, Phone, Mail, TrendingUp, DollarSign, Utensils } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

function Admin() {
  const { user, logout, globalClasses, recipes, updateClassSpots, checkInClient, addClass, deleteClass, addRecipe, deleteRecipe, allUsers, activatePlan, fetchClassesByDayOfWeek, fetchGlobalClasses } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('mostrador');
  
  // Gestión de días
  const currentDay = new Date().getDay(); // 0 = Dom, 1 = Lun, ... 6 = Sab
  const [selectedDay, setSelectedDay] = useState(currentDay);
  
  // QR Scanner
  const qrInputRef = useRef(null);
  const [scannedQR, setScannedQR] = useState('');
  const [showSuccessMsg, setShowSuccessMsg] = useState(false);
  const [qrMessage, setQrMessage] = useState('');
  const [scannedClient, setScannedClient] = useState(null);

  // Inscribir
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [showInscribirSuccess, setShowInscribirSuccess] = useState(false);

  // Pagos
  const [selectedPayMethod, setSelectedPayMethod] = useState('efectivo');
  const [showPaySuccess, setShowPaySuccess] = useState(false);

  // Formularios de Creación
  const [showAddClass, setShowAddClass] = useState(false);
  const [newClass, setNewClass] = useState({ title: '', time: '', day_of_week: currentDay, instructor: '', spots: 10, max_spots: 10 });
  
  const [showAddRecipe, setShowAddRecipe] = useState(false);
  const [newRecipe, setNewRecipe] = useState({ title: '', time: 'Desayuno', kcal: '', time_prep: '', img: '', ingredients: '', steps: '' });

  const handleLogout = () => { logout(); navigate('/'); };

  // Filtrar clases por el día seleccionado
  const displayClasses = globalClasses.filter(c => c.day_of_week === selectedDay);
  
  // Métricas del día seleccionado
  const totalAlumnasHoy = displayClasses.reduce((acc, c) => acc + ((c.max_spots || 10) - c.spots), 0);
  const totalMaxSpots = displayClasses.reduce((acc, c) => acc + (c.max_spots || 10), 0);
  const avgOccupancy = totalMaxSpots > 0 ? Math.round((totalAlumnasHoy / totalMaxSpots) * 100) : 0;

  // Alumnas reales de DB
  const alumnas = allUsers.map(u => ({
    id: u.id,
    name: u.full_name || u.email.split('@')[0],
    plan: u.membership_plan || 'Sin Plan',
    classes: u.classes_remaining || 0,
    phone: u.phone || 'N/A',
    email: u.email,
    status: u.membership_status?.toLowerCase() || 'inactive'
  }));

  const [selectedAlumnaId, setSelectedAlumnaId] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('fit');

  useEffect(() => {
    if (activeTab === 'mostrador' && qrInputRef.current) {
      qrInputRef.current.focus();
    }
  }, [activeTab]);

  const handleQRScan = async (e) => {
    e.preventDefault();
    if (scannedQR.trim() !== '') {
      const result = await checkInClient(scannedQR);
      setQrMessage(result.message);
      setScannedClient(result.clientInfo);
      setShowSuccessMsg(true);
      setScannedQR('');
      
      // Mostrar info por 5 segundos antes de volver al escáner
      setTimeout(() => {
        setShowSuccessMsg(false);
        setScannedClient(null);
        if (activeTab === 'mostrador' && qrInputRef.current) qrInputRef.current.focus();
      }, 5000);
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

  const handlePago = async () => {
    if (!selectedAlumnaId) return;
    
    // Simular integración de pagos guardando en BD (por simplificar asume que activatePlan actualiza BD)
    const planDetails = selectedPlan === 'fit' ? { title: 'Plan FIT', classes: 20 } : { title: 'Plan Premium', classes: 30 };
    await activatePlan(planDetails.title, planDetails.classes, selectedAlumnaId);
    
    setShowPaySuccess(true);
    setTimeout(() => {
      setShowPaySuccess(false);
      setSelectedAlumnaId('');
    }, 2500);
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    await addClass({ 
      title: newClass.title,
      time: newClass.time,
      instructor: newClass.instructor,
      day_of_week: parseInt(newClass.day_of_week), 
      spots: parseInt(newClass.spots)
    });
    setShowAddClass(false);
    setNewClass({ title: '', time: '', day_of_week: selectedDay, instructor: '', spots: 10, max_spots: 10 });
    fetchGlobalClasses(); // Refresh
  };

  const handleCreateRecipe = async (e) => {
    e.preventDefault();
    const ingredientsArr = newRecipe.ingredients.split(',').map(s => s.trim()).filter(s => s);
    const stepsArr = newRecipe.steps.split('.').map(s => s.trim()).filter(s => s);
    await addRecipe({ ...newRecipe, ingredients: ingredientsArr, steps: stepsArr });
    setShowAddRecipe(false);
    setNewRecipe({ title: '', time: 'Desayuno', kcal: '', time_prep: '', img: '', ingredients: '', steps: '' });
  };

  const inputStyle = { width: '100%', padding: '14px 16px', borderRadius: '14px', border: '1px solid rgba(55,61,59,0.08)', background: 'var(--surface-lowest)', fontFamily: 'var(--font-body)', fontSize: '0.9rem', outline: 'none', transition: 'border 0.2s' };
  const labelStyle = { fontSize: '0.78rem', fontWeight: 700, color: 'var(--on-surface-variant)', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' };

  const daysOfWeek = [
    { num: 1, label: 'LUN' },
    { num: 2, label: 'MAR' },
    { num: 3, label: 'MIE' },
    { num: 4, label: 'JUE' },
    { num: 5, label: 'VIE' },
    { num: 6, label: 'SAB' },
    { num: 0, label: 'DOM' }
  ];

  return (
    <div className="mobile-app-container" style={{ background: 'var(--surface-lowest)' }}>
      {/* HEADER PREMIUM */}
      <header className="ios-header" style={{ background: 'var(--surface-lowest)', paddingBottom: '10px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', margin: 0, lineHeight: 1.1, color: 'var(--black)' }}>Gestión Lab</h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--primary)', margin: '4px 0 0', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>CONTROL CENTER</p>
          </div>
          <div onClick={handleLogout} style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', cursor: 'pointer', border: '1px solid rgba(0,0,0,0.03)' }}>
            <LogOut size={18} color="var(--primary)" />
          </div>
        </div>
      </header>

      <main className="dashboard-main admin-dashboard-main">
        {/* DESKTOP LAYOUT WRAPPER */}
        <div className="admin-content-area">
          
          {/* COLUMNA IZQUIERDA (Sidebar en Desktop) */}
          <div className="dashboard-sidebar">
            <AnimatePresence mode="wait">
            {/* ============ TAB: MOSTRADOR (QR + métricas rápidas) ============ */}
            {activeTab === 'mostrador' && (
              <motion.div key="mostrador" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} transition={{duration:0.3}}>
                {/* LECTOR QR PREMIUM */}
                <section>
                  <div className="wallet-card" style={{ 
                    background: 'linear-gradient(135deg, #1A1C1E, #2C302E)', 
                    padding: '40px 20px', textAlign: 'center', position: 'relative', overflow: 'hidden',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    
                    {showSuccessMsg ? (
                      scannedClient ? (
                        // TARJETA DE INFO DE CLIENTE
                        <div className="qr-client-card">
                          <div className="qr-client-avatar">
                            {scannedClient.name.substring(0, 2).toUpperCase()}
                          </div>
                          <h3 className="qr-client-name">{scannedClient.name}</h3>
                          <div className="qr-client-email">{scannedClient.email}</div>
                          
                          <div style={{ marginBottom: '20px' }}>
                            <span className={`status-badge ${scannedClient.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                              {scannedClient.status === 'ACTIVE' ? 'MEMBRESÍA ACTIVA' : 'INACTIVA'}
                            </span>
                          </div>
                          
                          <div className="qr-client-stats">
                            <div className="qr-client-stat">
                              <div className="stat-value">{scannedClient.classesRemaining}</div>
                              <div className="stat-label">Clases</div>
                            </div>
                            <div className="qr-client-stat" style={{ gridColumn: 'span 2' }}>
                              <div className="stat-value" style={{ fontSize: '1rem', marginTop: '4px' }}>{scannedClient.plan}</div>
                              <div className="stat-label">Plan</div>
                            </div>
                          </div>
                          
                          <div style={{ marginTop: '20px', fontSize: '0.8rem', color: '#4ADE80', fontWeight: 'bold' }}>
                            <CheckCircle2 size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} />
                            {qrMessage}
                          </div>
                        </div>
                      ) : (
                        // MENSAJE DE ÉXITO SIMPLE (Fallback)
                        <div style={{ animation: 'fadeIn 0.3s ease' }}>
                          <div style={{ width: '70px', height: '70px', background: 'rgba(34,197,94,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', border: '1px solid rgba(34,197,94,0.3)' }}>
                            <CheckCircle2 size={35} color="#22C55E" />
                          </div>
                          <h2 style={{ fontSize: '1.8rem', color: 'white', fontFamily: 'var(--font-display)', margin: 0 }}>Acceso Concedido</h2>
                          <p style={{ color: 'var(--accent)', fontSize: '0.9rem', margin: '8px 0 0', fontWeight: 600 }}>{qrMessage}</p>
                        </div>
                      )
                    ) : (
                      // ESCÁNER
                      <div onClick={() => qrInputRef.current?.focus()} style={{ cursor: 'pointer' }}>
                        {/* Animación de escáner simulada */}
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: 'var(--accent)', opacity: 0.5, boxShadow: '0 0 15px var(--accent)', animation: 'scanLine 3s infinite linear' }}></div>

                        <div style={{ width: '80px', height: '80px', border: '2px dashed rgba(255,255,255,0.3)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', position: 'relative' }}>
                           <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '20px', height: '20px', borderTop: '2px solid var(--accent)', borderLeft: '2px solid var(--accent)', borderTopLeftRadius: '24px' }}></div>
                           <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '20px', height: '20px', borderTop: '2px solid var(--accent)', borderRight: '2px solid var(--accent)', borderTopRightRadius: '24px' }}></div>
                           <div style={{ position: 'absolute', bottom: '-2px', left: '-2px', width: '20px', height: '20px', borderBottom: '2px solid var(--accent)', borderLeft: '2px solid var(--accent)', borderBottomLeftRadius: '24px' }}></div>
                           <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '20px', height: '20px', borderBottom: '2px solid var(--accent)', borderRight: '2px solid var(--accent)', borderBottomRightRadius: '24px' }}></div>
                           <QrCode size={35} color="white" opacity={0.8} />
                        </div>
                        <h2 style={{ fontSize: '1.4rem', color: 'white', fontFamily: 'var(--font-display)', margin: 0, letterSpacing: '0.05em' }}>Escanear QR</h2>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', margin: '8px 0 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Aproximar código de alumna</p>
                      </div>
                    )}
                    <form onSubmit={handleQRScan} style={{ position: 'absolute', top: '-1000px', left: '-1000px' }}>
                      <input ref={qrInputRef} type="text" value={scannedQR} onChange={(e) => setScannedQR(e.target.value)} autoFocus autoComplete="off" />
                    </form>
                  </div>
                </section>

                <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div style={{ padding: '20px', background: 'white', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.02)' }}>
                    <div style={{ color: 'var(--primary)', marginBottom: '12px', background: 'rgba(255,145,77,0.1)', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={20} /></div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--black)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>{totalAlumnasHoy}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 700, marginTop: '5px' }}>Reservas ({daysOfWeek.find(d=>d.num===selectedDay)?.label})</div>
                  </div>
                  <div style={{ padding: '20px', background: 'white', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.02)' }}>
                    <div style={{ color: 'var(--accent)', marginBottom: '12px', background: 'rgba(238,186,137,0.2)', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Activity size={20} /></div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--black)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>{avgOccupancy}<span style={{fontSize: '1.2rem', color: 'var(--on-surface-variant)'}}>%</span></div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 700, marginTop: '5px' }}>Ocupación Prom.</div>
                  </div>
                </section>
              </motion.div>
            )}

            {/* Resto de los tabs se renderizan en la columna derecha en desktop */}
            <div className="desktop-only-placeholder" style={{ display: 'none' }}>
              {/* En desktop, la barra de navegación lateral podría ir aquí */}
            </div>
            </AnimatePresence>
          </div>

          {/* COLUMNA DERECHA (Contenido Principal en Desktop) */}
          <div className="dashboard-content">
            <AnimatePresence mode="wait">
            {/* ============ TAB: CLASES (Antes Cupos) ============ */}
            {activeTab === 'clases' && (
              <motion.div key="clases" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} transition={{duration:0.3}}>
                <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h2 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-display)', margin: 0 }}>Gestión de Clases</h2>
                  <button onClick={() => setShowAddClass(!showAddClass)} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Plus size={16} /> Nueva
                  </button>
                </div>

                {/* Selector de Días */}
                <div style={{ marginBottom: '20px' }}>
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
                </div>

                {showAddClass && (
                  <div className="ios-glass-card" style={{ padding: '15px', marginBottom: '15px', background: 'white' }}>
                    <input placeholder="Título (ej. Full Body)" value={newClass.title} onChange={e => setNewClass({...newClass, title: e.target.value})} style={{...inputStyle, marginBottom: '10px'}} />
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                      <input placeholder="Hora (ej. 07:00 AM)" value={newClass.time} onChange={e => setNewClass({...newClass, time: e.target.value})} style={inputStyle} />
                      <select value={newClass.day_of_week} onChange={e => setNewClass({...newClass, day_of_week: e.target.value})} style={{...inputStyle, WebkitAppearance: 'none'}}>
                        {daysOfWeek.map(d => (
                          <option key={d.num} value={d.num}>{d.label}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                      <input placeholder="Instructor" value={newClass.instructor} onChange={e => setNewClass({...newClass, instructor: e.target.value})} style={inputStyle} />
                      <input type="number" placeholder="Cupos" value={newClass.spots} onChange={e => setNewClass({...newClass, spots: e.target.value})} style={inputStyle} />
                    </div>
                    <button onClick={handleCreateClass} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--primary)', color: 'white', fontWeight: 700, border: 'none' }}>Guardar Clase</button>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {displayClasses.length > 0 ? displayClasses.map((c) => (
                    <div key={c.id} className="ios-glass-card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1rem', margin: '0 0 4px 0', fontFamily: 'var(--font-display)' }}>{c.title}</h3>
                        <p style={{ fontSize: '0.78rem', color: 'var(--on-surface-variant)', margin: 0 }}>{c.time} • {c.instructor}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button onClick={() => updateClassSpots(c.id, Math.max(0, c.spots - 1))} style={{ width: '28px', height: '28px', borderRadius: '8px', border: 'none', background: 'rgba(55,61,59,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Minus size={14} color="var(--on-surface)" />
                        </button>
                        <span style={{ fontSize: '1.2rem', fontWeight: 800, color: c.spots === 0 ? '#FF4D4D' : 'var(--primary)', minWidth: '25px', textAlign: 'center' }}>{c.spots}</span>
                        <button onClick={() => updateClassSpots(c.id, c.spots + 1)} style={{ width: '28px', height: '28px', borderRadius: '8px', border: 'none', background: 'rgba(55,61,59,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Plus size={14} color="var(--on-surface)" />
                        </button>
                        <button onClick={() => deleteClass(c.id)} style={{ width: '28px', height: '28px', borderRadius: '8px', border: 'none', background: '#FF4D4D15', color: '#FF4D4D', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '5px' }}>
                          <Minus size={14} />
                        </button>
                      </div>
                    </div>
                  )) : (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: '0.9rem', fontStyle: 'italic', background: 'rgba(55,61,59,0.03)', borderRadius: '16px' }}>
                      No hay clases programadas para este día.
                    </div>
                  )}
                </div>
              </section>
              </motion.div>
            )}

            {/* ============ TAB: VENTAS (Inscribir + Cobros) ============ */}
            {activeTab === 'ventas' && (
              <motion.div key="ventas" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} transition={{duration:0.3}} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                {/* SECCIÓN INSCRIBIR */}
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

                {/* SECCIÓN COBROS */}
                <section>
                  <h2 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-display)', marginBottom: '20px' }}>Cobro de Membresía</h2>
                  {showPaySuccess ? (
                    <SuccessCard message="Pago confirmado y clases asignadas." />
                  ) : (
                    <div className="ios-glass-card" style={{ background: 'var(--surface)', border: 'none', padding: '22px' }}>
                      <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>Alumna</label>
                        <select value={selectedAlumnaId} onChange={(e)=>setSelectedAlumnaId(e.target.value)} style={{ ...inputStyle, WebkitAppearance: 'none' }}>
                          <option value="">Seleccionar alumna...</option>
                          {alumnas.map(a => <option key={a.id} value={a.id}>{a.name} ({a.email})</option>)}
                        </select>
                      </div>
                      <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>Membresía</label>
                        <select value={selectedPlan} onChange={(e)=>setSelectedPlan(e.target.value)} style={{ ...inputStyle, WebkitAppearance: 'none' }}>
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
              </motion.div>
            )}

            {/* ============ TAB: NUTRICION ============ */}
            {activeTab === 'nutricion' && (
              <motion.div key="nutricion" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} transition={{duration:0.3}}>
                <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h2 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-display)', margin: 0 }}>Gestión de Nutrición</h2>
                  <button onClick={() => setShowAddRecipe(!showAddRecipe)} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                    <Plus size={16} /> Nueva
                  </button>
                </div>

                {showAddRecipe && (
                  <div className="ios-glass-card" style={{ padding: '15px', marginBottom: '15px', background: 'white' }}>
                    <select value={newRecipe.time} onChange={e => setNewRecipe({...newRecipe, time: e.target.value})} style={{...inputStyle, marginBottom: '10px', WebkitAppearance: 'none'}}>
                      <option value="Desayuno">Desayuno</option>
                      <option value="Almuerzo">Almuerzo</option>
                      <option value="Cena">Cena</option>
                      <option value="Snack">Snack</option>
                    </select>
                    <input placeholder="Título (ej. Bowl de Pollo)" value={newRecipe.title} onChange={e => setNewRecipe({...newRecipe, title: e.target.value})} style={{...inputStyle, marginBottom: '10px'}} />
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                      <input placeholder="Kcal (ej. 450)" value={newRecipe.kcal} onChange={e => setNewRecipe({...newRecipe, kcal: e.target.value})} style={inputStyle} />
                      <input placeholder="Tiempo (ej. 15 min)" value={newRecipe.time_prep} onChange={e => setNewRecipe({...newRecipe, time_prep: e.target.value})} style={inputStyle} />
                    </div>
                    <input placeholder="URL de Imagen (Unsplash...)" value={newRecipe.img} onChange={e => setNewRecipe({...newRecipe, img: e.target.value})} style={{...inputStyle, marginBottom: '10px'}} />
                    <textarea placeholder="Ingredientes separados por comas (Pollo, Arroz, Limón)" value={newRecipe.ingredients} onChange={e => setNewRecipe({...newRecipe, ingredients: e.target.value})} style={{...inputStyle, marginBottom: '10px', height: '60px', resize: 'none'}} />
                    <textarea placeholder="Pasos separados por puntos (Cocinar. Servir.)" value={newRecipe.steps} onChange={e => setNewRecipe({...newRecipe, steps: e.target.value})} style={{...inputStyle, marginBottom: '15px', height: '60px', resize: 'none'}} />
                    
                    <button onClick={handleCreateRecipe} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--primary)', color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer' }}>Guardar Receta</button>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {recipes && recipes.length > 0 ? recipes.map((r) => (
                    <div key={r.id} className="ios-glass-card" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '15px', background: 'var(--surface)' }}>
                      <img src={r.img || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400&h=300"} alt={r.title} style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase' }}>{r.time}</div>
                        <h3 style={{ fontSize: '0.95rem', margin: '2px 0', fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>{r.title}</h3>
                        <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', margin: 0 }}>{r.kcal} kcal • {r.time_prep}</p>
                      </div>
                      <button onClick={() => deleteRecipe(r.id)} style={{ width: '32px', height: '32px', borderRadius: '10px', border: 'none', background: '#FF4D4D15', color: '#FF4D4D', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Minus size={16} />
                      </button>
                    </div>
                  )) : (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: '0.9rem', fontStyle: 'italic', background: 'rgba(55,61,59,0.03)', borderRadius: '16px' }}>
                      No hay recetas registradas.
                    </div>
                  )}
                </div>
              </section>
              </motion.div>
            )}

            {/* ============ TAB: REPORTES (Métricas de Negocio) PREMIUM ============ */}
            {activeTab === 'reportes' && (
              <motion.div key="reportes" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} transition={{duration:0.3}}>
                <section>
                <h2 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-display)', marginBottom: '20px', color: 'var(--black)' }}>Resumen Financiero</h2>
                
                <div style={{ background: 'linear-gradient(135deg, #2C302E, #1A1C1E)', padding: '25px', borderRadius: '24px', marginBottom: '20px', boxShadow: '0 15px 35px rgba(0,0,0,0.15)' }}>
                   <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '5px' }}>Ingresos Brutos (Mes)</div>
                   <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '15px' }}>
                      <div style={{ fontSize: '2.8rem', fontWeight: 900, color: 'white', fontFamily: 'var(--font-display)', lineHeight: 1 }}>$42,850</div>
                      <div style={{ background: 'rgba(34,197,94,0.2)', color: '#4ADE80', padding: '4px 8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800 }}>+15%</div>
                   </div>
                   <div style={{ height: '60px', display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
                     {[30, 45, 60, 40, 70, 85, 100].map((h, i) => (
                       <div key={i} style={{ flex: 1, height: `${h}%`, background: i === 6 ? 'var(--accent)' : 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                     ))}
                   </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                  <div style={{ padding: '20px', background: 'white', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.02)' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Retención</div>
                        <TrendingUp size={16} color="var(--primary)" />
                     </div>
                     <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--black)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>92<span style={{ fontSize: '1rem', color: 'var(--on-surface-variant)' }}>%</span></div>
                  </div>
                  <div style={{ padding: '20px', background: 'white', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.02)' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Ticket Prom.</div>
                        <DollarSign size={16} color="var(--primary)" />
                     </div>
                     <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--black)', fontFamily: 'var(--font-display)', lineHeight: 1 }}><span style={{ fontSize: '1rem', color: 'var(--on-surface-variant)' }}>$</span>850</div>
                  </div>
                </div>

                <div style={{ padding: '20px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '20px' }}>
                   <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                      <div style={{ background: '#22C55E', color: 'white', padding: '10px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(34,197,94,0.3)' }}><Activity size={20}/></div>
                      <div>
                         <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#166534', marginBottom: '2px' }}>Crecimiento Acelerado</div>
                         <div style={{ fontSize: '0.8rem', color: '#15803D', fontWeight: 600 }}>La retención ha mejorado un 2% este mes.</div>
                      </div>
                   </div>
                </div>
              </section>
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* ====== BOTTOM NAV PREMIUM ====== */}
      <nav className="ios-bottom-nav" style={{ padding: '0 10px 25px', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="nav-item" onClick={() => setActiveTab('clases')} style={{ opacity: activeTab === 'clases' ? 1 : 0.4, color: activeTab === 'clases' ? 'var(--primary)' : 'var(--on-surface-variant)' }}>
          <Calendar size={22} strokeWidth={2.5} />
          <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>Clases</span>
        </div>
        <div className="nav-item" onClick={() => setActiveTab('ventas')} style={{ opacity: activeTab === 'ventas' ? 1 : 0.4, color: activeTab === 'ventas' ? 'var(--primary)' : 'var(--on-surface-variant)' }}>
          <DollarSign size={22} strokeWidth={2.5} />
          <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>Ventas</span>
        </div>
        
        {/* FAB CENTRAL ESTILO LUXURY */}
        <div className="nav-item" onClick={() => setActiveTab('mostrador')} style={{ position: 'relative', top: '-20px', opacity: 1 }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #1A1C1E, #2C302E)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', color: 'var(--accent)', border: '4px solid white' }}>
            <QrCode size={26} />
          </div>
        </div>

        <div className="nav-item" onClick={() => setActiveTab('reportes')} style={{ opacity: activeTab === 'reportes' ? 1 : 0.4, color: activeTab === 'reportes' ? 'var(--primary)' : 'var(--on-surface-variant)' }}>
          <BarChart3 size={22} strokeWidth={2.5} />
          <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>Reportes</span>
        </div>
        <div className="nav-item" onClick={() => setActiveTab('nutricion')} style={{ opacity: activeTab === 'nutricion' ? 1 : 0.4, color: activeTab === 'nutricion' ? 'var(--primary)' : 'var(--on-surface-variant)' }}>
          <Utensils size={22} strokeWidth={2.5} />
          <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>Nutrición</span>
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

export default Admin;
