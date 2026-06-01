import React, { useState, useEffect, useRef } from 'react';
import { LogOut, Users, Activity, QrCode, CheckCircle2, Plus, Minus, Calendar, CalendarPlus, ChevronRight, BarChart3, Phone, Mail, TrendingUp, DollarSign, Utensils, Award, Pencil, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollDetect } from '../hooks/useScrollDetect';
import AdminCafeteria from '../components/AdminCafeteria';
import AdminReportes from '../components/AdminReportes';
import AdminClientas from '../components/AdminClientas';
import { Coffee, Bell, UserCog } from 'lucide-react';

const daysOfWeek = [
  { num: 1, label: 'Lunes' },
  { num: 2, label: 'Martes' },
  { num: 3, label: 'Miércoles' },
  { num: 4, label: 'Jueves' },
  { num: 5, label: 'Viernes' },
  { num: 6, label: 'Sábado' },
  { num: 0, label: 'Domingo' }
];

function Admin() {
  const { user, logout, globalClasses, recipes, updateClassSpots, checkInClient, addClass, deleteClass, addRecipe, deleteRecipe, allUsers, coaches, activatePlan, fetchClassesByDayOfWeek, fetchGlobalClasses, assignCustomBadge, removeCustomBadge, badgeConfigs, createBadgeConfig, updateBadgeConfig, deleteBadgeConfig, addMultipleClasses, setNotifOpen } = useAuth();
  const isScrolled = useScrollDetect(30);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('mostrador');
  const [showTopMenu, setShowTopMenu] = useState(false);
  
  // Gestión de días
  const currentDay = new Date().getDay(); // 0 = Dom, 1 = Lun, ... 6 = Sab
  const [selectedDay, setSelectedDay] = useState(currentDay);
  
  // QR Scanner
  const qrInputRef = useRef(null);
  const [scannedQR, setScannedQR] = useState('');
  const [qrMessage, setQrMessage] = useState('');
  const [scannedClient, setScannedClient] = useState(null);
  const [scanLog, setScanLog] = useState([]);

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
  const [classMode, setClassMode] = useState('single');
  const [newClass, setNewClass] = useState({
    title: '', time: '', instructor: '', coach_id: '', spots: 10, level: 'Todos los niveles', category: 'Fuerza',
    description: '',
    date: new Date().toISOString().split('T')[0],
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    daysOfWeek: []
  });
  
  const [showAddRecipe, setShowAddRecipe] = useState(false);
  const [newRecipe, setNewRecipe] = useState({ title: '', time: 'Desayuno', kcal: '', time_prep: '', img: '', ingredients: '', steps: '' });

  // Insignias
  const [selectedBadgeUser, setSelectedBadgeUser] = useState('');
  const [newCustomBadge, setNewCustomBadge] = useState({ icon: '🏆', label: '' });
  const [newRuleBadge, setNewRuleBadge] = useState({ icon: '🔥', label: '', description: '', rule_type: 'TOTAL_CLASSES', rule_value: 1 });
  const [editingBadgeId, setEditingBadgeId] = useState(null);

  const handleLogout = () => { logout(); navigate('/'); };

  // Estado del Calendario Interactivo
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null); // 'YYYY-MM-DD' o null
  const [calendarView, setCalendarView] = useState('month'); // 'month' | 'day'
  
  // Helpers del Calendario
  const currentYear = currentMonthDate.getFullYear();
  const currentMonth = currentMonthDate.getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Ajuste para que empiece en Lunes
  
  const nextMonth = () => setCurrentMonthDate(new Date(currentYear, currentMonth + 1, 1));
  const prevMonth = () => setCurrentMonthDate(new Date(currentYear, currentMonth - 1, 1));
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const getWeekDays = (dateStr) => {
    if (!dateStr || dateStr === 'bulk') return [];
    const selectedDate = new Date(dateStr + "T12:00:00");
    const day = selectedDate.getDay();
    const diffToMonday = selectedDate.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), diffToMonday);
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDays.push({
        dateStr: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
        dayNum: d.getDate(),
        dayName: ['D', 'L', 'M', 'M', 'J', 'V', 'S'][d.getDay()]
      });
    }
    return weekDays;
  };

  const getDayOfWeekFromDateStr = (dateStr) => {
    return new Date(dateStr + "T12:00:00").getDay();
  };

  const getClassesForDate = (dateStr) => {
    if (!dateStr || dateStr === 'bulk') return [];
    const dayOfWeek = getDayOfWeekFromDateStr(dateStr);
    return globalClasses.filter(c => 
      c.date === dateStr || 
      (!c.date && (c.day === dayOfWeek || c.day === String(dayOfWeek)))
    );
  };

  const currentMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  
  // Clases para el día seleccionado en el modal
  const selectedDayClasses = getClassesForDate(selectedCalendarDay);
  
  // Métricas del día de hoy (para dashboard)
  const todayStr = new Date().toISOString().split('T')[0];
  const todayClasses = getClassesForDate(todayStr);
  
  const totalAlumnasHoy = todayClasses.reduce((acc, c) => acc + ((c.max_spots || 10) - c.spots), 0);
  const totalMaxSpots = todayClasses.reduce((acc, c) => acc + (c.max_spots || 10), 0);
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
      // Evitar doble escaneo accidental (cooldown de 1 hora por usuaria)
      const lastScanStr = localStorage.getItem(`last_checkin_${scannedQR.trim()}`);
      if (lastScanStr && (Date.now() - parseInt(lastScanStr)) < 1000 * 60 * 60) {
        showToast("Esta alumna ya registró asistencia hace poco.", "error");
        setQrMessage("Ya registrado recientemente");
        setScannedQR('');
        return;
      }

      const result = await checkInClient(scannedQR.trim());
      if (result.success) {
         localStorage.setItem(`last_checkin_${scannedQR.trim()}`, Date.now().toString());
      }
      setQrMessage(result.message);
      setScannedClient(result.clientInfo);
      setScannedQR('');

      if (result.clientInfo) {
        setScanLog(prev => [{
          ...result.clientInfo,
          message: result.message,
          success: result.success,
          scannedAt: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        }, ...prev]);
      }

      // Limpiar panel de último scan después de 8s, el log persiste
      setTimeout(() => {
        setScannedClient(null);
        setQrMessage('');
        if (activeTab === 'mostrador' && qrInputRef.current) qrInputRef.current.focus();
      }, 8000);
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

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 2500);
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    
    if (!newClass.title || !newClass.time || !newClass.instructor) {
      showToast("Llena todos los campos: Título, Hora e Instructor.", "error");
      return;
    }

    let result;
    if (classMode === 'single') {
      if (!newClass.date) return showToast("Selecciona una fecha.", "error");
      const d = new Date(newClass.date + "T12:00:00");
      result = await addClass({
        title: newClass.title,
        time: newClass.time,
        instructor: newClass.instructor,
        coach_id: newClass.coach_id || null,
        category: newClass.category,
        description: newClass.description || null,
        date: newClass.date,
        day: d.getDay(),
        spots: parseInt(newClass.spots),
        level: newClass.level
      });
    } else {
      if (!newClass.startDate || !newClass.endDate || newClass.daysOfWeek.length === 0) {
        return showToast("Selecciona el rango de fechas y los días.", "error");
      }
      const start = new Date(newClass.startDate + "T12:00:00");
      const end = new Date(newClass.endDate + "T12:00:00");
      const classesToCreate = [];
      let current = new Date(start);
      while (current <= end) {
        if (newClass.daysOfWeek.includes(current.getDay())) {
          classesToCreate.push({
            title: newClass.title,
            time: newClass.time,
            instructor: newClass.instructor,
            coach_id: newClass.coach_id || null,
            category: newClass.category,
            description: newClass.description || null,
            date: current.toISOString().split('T')[0],
            day: current.getDay(),
            spots: parseInt(newClass.spots),
            level: newClass.level
          });
        }
        current.setDate(current.getDate() + 1);
      }
      if (classesToCreate.length === 0) return showToast("No hay días coincidentes en el rango.", "error");
      result = await addMultipleClasses(classesToCreate);
    }
    
    if (result && !result.success) {
      showToast("Error: " + (result.error?.message || "No se pudo guardar"), "error");
      console.error("Error detallado al agregar clase:", result.error);
      return;
    }

    showToast("¡Clase(s) creadas con éxito!");
    setShowAddClass(false);
    setNewClass({
      title: '', time: '', instructor: '', coach_id: '', spots: 10, level: 'Todos los niveles', category: 'Fuerza',
      description: '',
      date: new Date().toISOString().split('T')[0],
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      daysOfWeek: []
    });
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

  const handleAssignBadge = async () => {
    if (!selectedBadgeUser || !newCustomBadge.label) {
      showToast("Selecciona alumna y escribe el nombre de la insignia", "error");
      return;
    }
    const res = await assignCustomBadge(selectedBadgeUser, newCustomBadge);
    if (res.success) {
      showToast("Insignia asignada con éxito");
      setNewCustomBadge({ icon: '🏆', label: '' });
    } else {
      showToast("Error al asignar insignia", "error");
    }
  };

  const handleRemoveBadge = async (label) => {
    const res = await removeCustomBadge(selectedBadgeUser, label);
    if (res.success) showToast("Insignia removida");
  };

  const handleSaveRuleBadge = async () => {
    if (!newRuleBadge.label) {
      showToast("Escribe el nombre de la insignia", "error");
      return;
    }
    const payload = {
      icon: newRuleBadge.icon,
      label: newRuleBadge.label,
      description: newRuleBadge.description,
      rule_type: newRuleBadge.rule_type,
      rule_value: newRuleBadge.rule_value,
      is_active: true
    };
    
    let res;
    if (editingBadgeId) {
      res = await updateBadgeConfig(editingBadgeId, payload);
    } else {
      res = await createBadgeConfig(payload);
    }
    
    if (res.success) {
      showToast(editingBadgeId ? "Regla actualizada con éxito" : "Regla creada con éxito");
      setNewRuleBadge({ icon: '🔥', label: '', description: '', rule_type: 'TOTAL_CLASSES', rule_value: 1 });
      setEditingBadgeId(null);
    } else {
      showToast("Error al guardar regla", "error");
    }
  };

  const cancelEditBadge = () => {
    setEditingBadgeId(null);
    setNewRuleBadge({ icon: '🔥', label: '', description: '', rule_type: 'TOTAL_CLASSES', rule_value: 1 });
  };
  
  const handleEditRuleBadge = (badge) => {
    setEditingBadgeId(badge.id);
    setNewRuleBadge(badge);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteRuleBadge = async (id) => {
    const res = await deleteBadgeConfig(id);
    if (res.success) showToast("Regla eliminada");
  };

  const inputStyle = { width: '100%', padding: '14px 16px', borderRadius: '14px', border: '1px solid rgba(55,61,59,0.08)', background: 'var(--surface-lowest)', fontFamily: 'var(--font-body)', fontSize: '0.9rem', outline: 'none', transition: 'border 0.2s' };
  const labelStyle = { fontSize: '0.78rem', fontWeight: 700, color: 'var(--on-surface-variant)', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' };

  const getRuleDescription = (type, value) => {
    switch (type) {
      case 'TOTAL_CLASSES': return `Meta: Asistir a ${value} clases en total`;
      case 'WEEKLY_CLASSES': return `Meta: Asistir a ${value} clases en una misma semana`;
      case 'DIFFERENT_COACHES': return `Meta: Tomar clase con ${value} coaches diferentes`;
      case 'PROFILE_COMPLETE': return 'Meta: Completar perfil (Foto y datos)';
      case 'MANUAL': return 'Otorgamiento manual (Eventos/Retos)';
      default: return `Meta: ${value} (${type})`;
    }
  };

  // coaches are now fetched directly from useAuth

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
    <div className="admin-app-container">
      {/* HEADER PREMIUM (MOBILE ONLY) */}
      <header className="ios-header mobile-only-header" style={{ background: 'var(--surface-lowest)', paddingBottom: '10px', borderBottom: '1px solid rgba(0,0,0,0.05)', position: 'relative', zIndex: 50 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', margin: 0, lineHeight: 1.1, color: 'var(--black)' }}>Gestión Lab</h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--primary)', margin: '4px 0 0', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>CONTROL CENTER</p>
          </div>
          
          <div style={{ position: 'relative' }}>
            <div onClick={() => setShowTopMenu(!showTopMenu)} style={{ width: '40px', height: '40px', borderRadius: '50%', background: showTopMenu ? 'var(--primary)' : 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
              <Menu size={20} color={showTopMenu ? 'white' : 'var(--black)'} />
            </div>
            
            <AnimatePresence>
              {showTopMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                  animate={{ opacity: 1, y: 0, scale: 1 }} 
                  exit={{ opacity: 0, y: 10, scale: 0.95 }} 
                  transition={{ duration: 0.2 }}
                  style={{ position: 'absolute', top: '50px', right: 0, background: 'white', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', padding: '8px', width: '200px', border: '1px solid rgba(0,0,0,0.05)', zIndex: 100 }}
                >
                  <div onClick={() => { setActiveTab('reportes'); setShowTopMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer', borderRadius: '10px', color: 'var(--black)', fontWeight: 600 }}>
                    <BarChart3 size={18} color="var(--primary)" /> Reportes
                  </div>
                  <div onClick={() => { setActiveTab('clientas'); setShowTopMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer', borderRadius: '10px', color: 'var(--black)', fontWeight: 600 }}>
                    <UserCog size={18} color="var(--primary)" /> Clientas
                  </div>
                  <div onClick={() => { setActiveTab('insignias'); setShowTopMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer', borderRadius: '10px', color: 'var(--black)', fontWeight: 600 }}>
                    <Award size={18} color="var(--primary)" /> Insignias
                  </div>
                  <div onClick={() => { setActiveTab('nutricion'); setShowTopMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer', borderRadius: '10px', color: 'var(--black)', fontWeight: 600 }}>
                    <Utensils size={18} color="var(--primary)" /> Comida
                  </div>
                  <div onClick={() => { setActiveTab('cafeteria'); setShowTopMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer', borderRadius: '10px', color: 'var(--black)', fontWeight: 600 }}>
                    <Coffee size={18} color="var(--primary)" /> Cafetería
                  </div>
                  <div onClick={() => { setNotifOpen(true); setShowTopMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer', borderRadius: '10px', color: 'var(--black)', fontWeight: 600 }}>
                    <Bell size={18} color="var(--primary)" /> Enviar aviso
                  </div>
                  <div style={{ height: '1px', background: 'rgba(0,0,0,0.05)', margin: '8px' }} />
                  <div onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer', borderRadius: '10px', color: '#ff3b30', fontWeight: 600 }}>
                    <LogOut size={18} /> Cerrar Sesión
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* DESKTOP SIDEBAR PANEL */}
      <aside className="admin-desktop-sidebar">
        <div className="sidebar-brand">
          <h1 className="sidebar-title">Gestión Lab</h1>
          <p className="sidebar-subtitle">CONTROL CENTER</p>
        </div>
        <nav className="sidebar-nav">
          <div onClick={() => setActiveTab('mostrador')} className={`sidebar-nav-item ${activeTab === 'mostrador' ? 'active' : ''}`}>
            <QrCode size={20} />
            <span>Mostrador QR</span>
          </div>
          <div onClick={() => setActiveTab('clases')} className={`sidebar-nav-item ${activeTab === 'clases' ? 'active' : ''}`}>
            <Calendar size={20} />
            <span>Clases</span>
          </div>
          <div onClick={() => setActiveTab('ventas')} className={`sidebar-nav-item ${activeTab === 'ventas' ? 'active' : ''}`}>
            <DollarSign size={20} />
            <span>Ventas</span>
          </div>
          <div onClick={() => setActiveTab('reportes')} className={`sidebar-nav-item ${activeTab === 'reportes' ? 'active' : ''}`}>
            <BarChart3 size={20} />
            <span>Reportes</span>
          </div>
          <div onClick={() => setActiveTab('clientas')} className={`sidebar-nav-item ${activeTab === 'clientas' ? 'active' : ''}`}>
            <UserCog size={20} />
            <span>Clientas</span>
          </div>
          <div onClick={() => setActiveTab('nutricion')} className={`sidebar-nav-item ${activeTab === 'nutricion' ? 'active' : ''}`}>
            <Utensils size={20} />
            <span>Nutrición</span>
          </div>
          <div onClick={() => setActiveTab('cafeteria')} className={`sidebar-nav-item ${activeTab === 'cafeteria' ? 'active' : ''}`}>
            <Coffee size={20} />
            <span>Cafetería</span>
          </div>
          <div onClick={() => setNotifOpen(true)} className="sidebar-nav-item">
            <Bell size={20} />
            <span>Enviar aviso</span>
          </div>
          <div onClick={() => setActiveTab('insignias')} className={`sidebar-nav-item ${activeTab === 'insignias' ? 'active' : ''}`}>
            <Award size={20} />
            <span>Insignias</span>
          </div>
        </nav>
        
        <div className="sidebar-footer" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Cerrar Sesión</span>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="admin-main-content">
        <div className="admin-content-area">
          <AnimatePresence mode="wait">
            
            {/* ============ TAB: MOSTRADOR (QR + métricas + log) ============ */}
            {activeTab === 'mostrador' && (
              <motion.div key="mostrador" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} transition={{duration:0.3}}>
                <div className="admin-double-column">

                  {/* LECTOR QR — siempre muestra el escáner */}
                  <section style={{ width: '100%' }}>
                    <div className="wallet-card" style={{
                      background: 'linear-gradient(135deg, #1A1C1E, #2C302E)',
                      padding: '40px 20px', textAlign: 'center', position: 'relative', overflow: 'hidden',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '24px', cursor: 'pointer'
                    }} onClick={() => qrInputRef.current?.focus()}>
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: 'var(--accent)', opacity: 0.5, boxShadow: '0 0 15px var(--accent)', animation: 'scanLine 3s infinite linear' }} />
                      <div style={{ width: '80px', height: '80px', border: '2px dashed rgba(255,255,255,0.3)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '20px', height: '20px', borderTop: '2px solid var(--accent)', borderLeft: '2px solid var(--accent)', borderTopLeftRadius: '24px' }} />
                        <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '20px', height: '20px', borderTop: '2px solid var(--accent)', borderRight: '2px solid var(--accent)', borderTopRightRadius: '24px' }} />
                        <div style={{ position: 'absolute', bottom: '-2px', left: '-2px', width: '20px', height: '20px', borderBottom: '2px solid var(--accent)', borderLeft: '2px solid var(--accent)', borderBottomLeftRadius: '24px' }} />
                        <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '20px', height: '20px', borderBottom: '2px solid var(--accent)', borderRight: '2px solid var(--accent)', borderBottomRightRadius: '24px' }} />
                        <QrCode size={35} color="white" opacity={0.8} />
                      </div>
                      <h2 style={{ fontSize: '1.4rem', color: 'white', fontFamily: 'var(--font-display)', margin: 0, letterSpacing: '0.05em' }}>Escanear QR</h2>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', margin: '8px 0 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Aproximar código de alumna</p>
                      <form onSubmit={handleQRScan} style={{ position: 'absolute', top: '-1000px', left: '-1000px' }}>
                        <input ref={qrInputRef} type="text" value={scannedQR} onChange={(e) => setScannedQR(e.target.value)} autoFocus autoComplete="off" />
                      </form>
                    </div>
                  </section>

                  {/* COLUMNA DERECHA: último scan + métricas */}
                  <section style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%' }}>

                    {/* Panel del último scan */}
                    <AnimatePresence>
                      {scannedClient && (
                        <motion.div
                          key="client-panel"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          style={{
                            background: 'white', borderRadius: '24px',
                            boxShadow: '0 10px 30px rgba(34,197,94,0.12)',
                            border: '1px solid rgba(34,197,94,0.2)',
                            padding: '20px', display: 'flex', alignItems: 'center', gap: '16px'
                          }}
                        >
                          <div style={{
                            width: '52px', height: '52px', borderRadius: '50%', flexShrink: 0,
                            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.1rem', fontWeight: 900, color: 'white'
                          }}>
                            {scannedClient.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--black)', fontFamily: 'var(--font-display)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {scannedClient.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 600, marginTop: '2px' }}>
                              {scannedClient.plan} · {scannedClient.classesRemaining} clases restantes
                            </div>
                            <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', color: '#16a34a', fontWeight: 700 }}>
                              <CheckCircle2 size={13} />
                              {qrMessage}
                            </div>
                          </div>
                          <div style={{
                            flexShrink: 0, padding: '5px 10px', borderRadius: '10px', fontSize: '0.65rem', fontWeight: 800,
                            background: scannedClient.status === 'ACTIVE' ? 'rgba(34,197,94,0.1)' : 'rgba(255,77,77,0.1)',
                            color: scannedClient.status === 'ACTIVE' ? '#16a34a' : '#dc2626',
                            textTransform: 'uppercase', letterSpacing: '0.05em'
                          }}>
                            {scannedClient.status === 'ACTIVE' ? 'Activa' : 'Inactiva'}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Métricas */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
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
                    </div>
                  </section>
                </div>

                {/* LOG DE ASISTENCIA DEL DÍA */}
                {scanLog.length > 0 && (
                  <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '30px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <h2 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-display)', margin: 0 }}>
                        Asistencia de hoy
                      </h2>
                      <div style={{ background: 'rgba(255,145,77,0.1)', color: 'var(--primary)', borderRadius: '10px', padding: '4px 12px', fontSize: '0.75rem', fontWeight: 800 }}>
                        {scanLog.length} {scanLog.length === 1 ? 'alumna' : 'alumnas'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {scanLog.map((entry, i) => (
                        <div key={i} style={{
                          background: 'white', borderRadius: '18px', padding: '14px 18px',
                          display: 'flex', alignItems: 'center', gap: '14px',
                          boxShadow: '0 4px 15px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)'
                        }}>
                          {/* Avatar */}
                          <div style={{
                            width: '42px', height: '42px', borderRadius: '50%', flexShrink: 0,
                            background: entry.success
                              ? 'linear-gradient(135deg, var(--primary), var(--accent))'
                              : 'rgba(255,77,77,0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.85rem', fontWeight: 900,
                            color: entry.success ? 'white' : '#dc2626'
                          }}>
                            {entry.name ? entry.name.substring(0, 2).toUpperCase() : '??'}
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--black)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {entry.name || 'Desconocido'}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)', fontWeight: 600, marginTop: '2px' }}>
                              {entry.plan || 'Sin plan'} · {entry.classesRemaining ?? '—'} clases restantes
                            </div>
                          </div>

                          {/* Tiempo + estado */}
                          <div style={{ flexShrink: 0, textAlign: 'right' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--on-surface-variant)' }}>
                              {entry.scannedAt}
                            </div>
                            <div style={{
                              marginTop: '4px', fontSize: '0.65rem', fontWeight: 800,
                              padding: '3px 8px', borderRadius: '8px', textTransform: 'uppercase',
                              background: entry.success ? 'rgba(34,197,94,0.1)' : 'rgba(255,77,77,0.1)',
                              color: entry.success ? '#16a34a' : '#dc2626'
                            }}>
                              {entry.success ? 'Check-in ✓' : 'Sin reserva'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.section>
                )}
              </motion.div>
            )}
  
            {/* ============ TAB: CLASES (Calendario Interactivo) ============ */}
            {activeTab === 'clases' && (
              <motion.div key="clases" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} transition={{duration:0.3}}>
                <section>
                  {calendarView === 'month' ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', margin: 0, fontWeight: 800 }}>Calendario</h2>
                        <button 
                          onClick={() => {
                            setNewClass(prev => ({...prev, date: todayStr, startDate: todayStr, endDate: todayStr}));
                            setClassMode('range');
                            setSelectedCalendarDay('bulk');
                            setCalendarView('day');
                          }} 
                          style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,139,66,0.3)' }}
                        >
                          <CalendarPlus size={18} /> Carga Masiva
                        </button>
                      </div>
      
                      {/* Navegación del Calendario */}
                      <div className="ios-glass-card" style={{ padding: '20px', background: 'white', margin: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                          <button onClick={prevMonth} style={{ background: 'rgba(0,0,0,0.04)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <ChevronRight size={20} color="var(--black)" style={{ transform: 'rotate(180deg)' }} />
                          </button>
                          <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-display)', margin: 0, textTransform: 'capitalize' }}>
                            {monthNames[currentMonth]} {currentYear}
                          </h3>
                          <button onClick={nextMonth} style={{ background: 'rgba(0,0,0,0.04)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <ChevronRight size={20} color="var(--black)" />
                          </button>
                        </div>

                        {/* Días de la semana */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px', marginBottom: '10px', textAlign: 'center' }}>
                          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                            <div key={i} style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--on-surface-variant)' }}>{d}</div>
                          ))}
                        </div>

                        {/* Cuadrícula de Días */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' }}>
                          {Array.from({ length: startDay }).map((_, i) => (
                            <div key={`empty-${i}`} style={{ aspectRatio: '1', borderRadius: '12px' }} />
                          ))}
                          
                          {Array.from({ length: daysInMonth }).map((_, i) => {
                            const dayNum = i + 1;
                            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                            const isToday = dateStr === todayStr;
                            const classesOnDay = getClassesForDate(dateStr);
                            const hasClasses = classesOnDay.length > 0;
                            
                            return (
                              <motion.button
                                key={dayNum}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => {
                                  setNewClass(prev => ({...prev, date: dateStr}));
                                  setClassMode('single');
                                  setSelectedCalendarDay(dateStr);
                                  setCalendarView('day');
                                }}
                                style={{ 
                                  aspectRatio: '1', borderRadius: '12px', border: 'none', cursor: 'pointer',
                                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative',
                                  background: isToday ? 'var(--primary)' : (hasClasses ? 'rgba(0,0,0,0.03)' : 'transparent'),
                                  color: isToday ? 'white' : 'var(--black)',
                                  fontWeight: isToday ? 800 : (hasClasses ? 700 : 500)
                                }}
                              >
                                <span style={{ fontSize: '1rem' }}>{dayNum}</span>
                                {hasClasses && (
                                  <div style={{ display: 'flex', gap: '2px', position: 'absolute', bottom: '6px' }}>
                                    {classesOnDay.slice(0, 3).map((_, idx) => (
                                      <div key={idx} style={{ width: '4px', height: '4px', borderRadius: '50%', background: isToday ? 'white' : 'var(--primary)' }} />
                                    ))}
                                  </div>
                                )}
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  ) : (
                    <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} transition={{duration:0.2}}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <button onClick={() => setCalendarView('month')} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', padding: 0 }}>
                          <ChevronRight size={22} style={{ transform: 'rotate(180deg)' }} /> 
                          {selectedCalendarDay !== 'bulk' ? monthNames[new Date(selectedCalendarDay + "T12:00:00").getMonth()] : 'Atrás'}
                        </button>
                      </div>
                      
                      {selectedCalendarDay !== 'bulk' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px', marginBottom: '25px', background: 'white', padding: '15px 10px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                          {getWeekDays(selectedCalendarDay).map((d, i) => {
                            const isSelected = d.dateStr === selectedCalendarDay;
                            const classesOnDay = getClassesForDate(d.dateStr);
                            const hasClasses = classesOnDay.length > 0;
                            
                            return (
                              <div 
                                key={i} 
                                onClick={() => {
                                  setSelectedCalendarDay(d.dateStr);
                                  setNewClass(prev => ({...prev, date: d.dateStr}));
                                }}
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                              >
                                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--on-surface-variant)' }}>{d.dayName}</span>
                                <div style={{ 
                                  width: '36px', height: '36px', borderRadius: '50%', 
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  background: isSelected ? 'var(--primary)' : 'transparent',
                                  color: isSelected ? 'white' : 'var(--black)',
                                  fontWeight: isSelected ? 800 : 600,
                                  fontSize: '1.1rem'
                                }}>
                                  {d.dayNum}
                                </div>
                                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: hasClasses ? (isSelected ? 'white' : 'var(--primary)') : 'transparent', marginTop: '-2px' }} />
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {/* Lista de clases del día */}
                      {selectedCalendarDay !== 'bulk' && (
                        <div style={{ marginBottom: '25px' }}>
                          <h4 style={{ fontSize: '1.1rem', margin: '0 0 15px 0', color: 'var(--black)', fontFamily: 'var(--font-display)', textTransform: 'capitalize' }}>
                            {new Date(selectedCalendarDay + "T12:00:00").toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {selectedDayClasses.length > 0 ? selectedDayClasses.map((c) => (
                              <div key={c.id} style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', borderRadius: '16px', border: '1px solid var(--border-subtle)', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                                <div style={{ flex: 1 }}>
                                  <h3 style={{ fontSize: '1.05rem', margin: '0 0 4px 0', fontFamily: 'var(--font-display)' }}>{c.title}</h3>
                                  <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: 0, fontWeight: 600 }}>{c.time} • {c.instructor}</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <button onClick={() => updateClassSpots(c.id, Math.max(0, c.spots - 1))} style={{ width: '32px', height: '32px', borderRadius: '10px', border: 'none', background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                    <Minus size={14} color="var(--black)" />
                                  </button>
                                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: c.spots === 0 ? '#FF4D4D' : 'var(--primary)', minWidth: '24px', textAlign: 'center' }}>{c.spots}</span>
                                  <button onClick={() => updateClassSpots(c.id, c.spots + 1)} style={{ width: '32px', height: '32px', borderRadius: '10px', border: 'none', background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                    <Plus size={14} color="var(--black)" />
                                  </button>
                                  <button onClick={() => deleteClass(c.id)} style={{ width: '32px', height: '32px', borderRadius: '10px', border: 'none', background: '#FF4D4D15', color: '#FF4D4D', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '5px', cursor: 'pointer' }}>
                                    <Minus size={14} />
                                  </button>
                                </div>
                              </div>
                            )) : (
                              <p style={{ textAlign: 'center', color: '#888', fontStyle: 'italic', fontSize: '0.9rem', padding: '20px' }}>Sin clases programadas.</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Formulario de Creación */}
                      <div style={{ background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid var(--border-subtle)', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                        <h4 style={{ fontSize: '1rem', marginBottom: '15px', color: 'var(--black)' }}>
                          {selectedCalendarDay === 'bulk' ? 'Configurar Rango Masivo' : 'Añadir clase a este día'}
                        </h4>

                        {classMode === 'range' && (
                          <div style={{ marginBottom: '15px' }}>
                            <label style={labelStyle}>Rango de Fechas</label>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                              <div style={{flex: 1}}>
                                <span style={{fontSize: '0.7rem', color: '#666'}}>Desde</span>
                                <input type="date" value={newClass.startDate} onChange={e => setNewClass({...newClass, startDate: e.target.value})} style={inputStyle} />
                              </div>
                              <div style={{flex: 1}}>
                                <span style={{fontSize: '0.7rem', color: '#666'}}>Hasta</span>
                                <input type="date" value={newClass.endDate} onChange={e => setNewClass({...newClass, endDate: e.target.value})} style={inputStyle} />
                              </div>
                            </div>
                            <label style={labelStyle}>Días a repetir</label>
                            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                              {daysOfWeek.map(d => (
                                <button 
                                  key={d.num}
                                  onClick={() => setNewClass(prev => ({
                                    ...prev,
                                    daysOfWeek: prev.daysOfWeek.includes(d.num) ? prev.daysOfWeek.filter(n => n !== d.num) : [...prev.daysOfWeek, d.num]
                                  }))}
                                  style={{ 
                                    padding: '6px 12px', borderRadius: '20px', border: '1px solid', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold',
                                    borderColor: newClass.daysOfWeek.includes(d.num) ? 'var(--primary)' : 'var(--border-subtle)',
                                    background: newClass.daysOfWeek.includes(d.num) ? 'var(--primary)' : 'white',
                                    color: newClass.daysOfWeek.includes(d.num) ? 'white' : '#666',
                                    transition: 'all 0.2s'
                                  }}
                                >
                                  {d.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <input placeholder="Título (ej. Full Body)" value={newClass.title} onChange={e => setNewClass({...newClass, title: e.target.value})} style={{...inputStyle, marginBottom: '10px'}} />
                        <textarea
                          placeholder="Descripción (ej. Clase de reformer para trabajar core y glúteos...)"
                          value={newClass.description}
                          onChange={e => setNewClass({...newClass, description: e.target.value})}
                          rows={2}
                          style={{...inputStyle, resize: 'none', fontFamily: 'inherit', marginBottom: '10px'}}
                        />
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                          <input placeholder="Hora (ej. 07:00 AM)" value={newClass.time} onChange={e => setNewClass({...newClass, time: e.target.value})} style={inputStyle} />
                          <select value={newClass.coach_id} onChange={e => {
                            const c = coaches.find(x => x.id === e.target.value);
                            setNewClass({...newClass, coach_id: e.target.value, instructor: c ? (c.full_name || c.email) : ''});
                          }} style={{...inputStyle, WebkitAppearance: 'none'}}>
                            <option value="">Coach...</option>
                            {coaches.map(c => <option key={c.id} value={c.id}>{c.full_name || c.email}</option>)}
                          </select>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                          <input type="number" placeholder="Cupos" value={newClass.spots} onChange={e => setNewClass({...newClass, spots: e.target.value})} style={inputStyle} />
                          <select value={newClass.level} onChange={e => setNewClass({...newClass, level: e.target.value})} style={{...inputStyle, WebkitAppearance: 'none'}}>
                            <option value="Todos los niveles">Todos los niveles</option>
                            <option value="Principiante">Principiante</option>
                            <option value="Intermedio">Intermedio</option>
                            <option value="Avanzado">Avanzado</option>
                          </select>
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                          <select value={newClass.category} onChange={e => setNewClass({...newClass, category: e.target.value})} style={{...inputStyle, WebkitAppearance: 'none'}}>
                            <option value="Fuerza">Fuerza</option>
                            <option value="Resistencia">Resistencia</option>
                            <option value="Relajacion">Relajación o estiramiento</option>
                            <option value="Gym libre">Gym libre</option>
                          </select>
                        </div>
                        
                        <button onClick={async (e) => {
                          await handleCreateClass(e);
                          if (classMode === 'range') setCalendarView('month');
                        }} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--primary)', color: 'white', fontWeight: 800, border: 'none', cursor: 'pointer' }}>
                          {classMode === 'single' ? 'Guardar Clase' : 'Generar Clases Múltiples'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </section>
              </motion.div>
            )}
  
            {/* ============ TAB: VENTAS (Inscribir + Cobros) ============ */}
            {activeTab === 'ventas' && (
              <motion.div key="ventas" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} transition={{duration:0.3}}>
                <div className="admin-double-column">
                  {/* SECCIÓN INSCRIBIR */}
                  <section style={{ width: '100%' }}>
                    <h2 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-display)', marginBottom: '20px' }}>Inscripción Directa</h2>
                    {showInscribirSuccess ? (
                      <SuccessCard message="Alumna registrada exitosamente." />
                    ) : (
                      <div className="ios-glass-card" style={{ background: 'var(--surface)', border: 'none', padding: '22px', margin: 0 }}>
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
                  <section style={{ width: '100%' }}>
                    <h2 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-display)', marginBottom: '20px' }}>Cobro de Membresía</h2>
                    {showPaySuccess ? (
                      <SuccessCard message="Pago confirmado y clases asignadas." />
                    ) : (
                      <div className="ios-glass-card" style={{ background: 'var(--surface)', border: 'none', padding: '22px', margin: 0 }}>
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
                </div>
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
  
                  <div className="admin-responsive-grid">
                    {recipes && recipes.length > 0 ? recipes.map((r) => (
                      <div key={r.id} className="ios-glass-card" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '15px', background: 'var(--surface)', margin: 0 }}>
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
                      <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: '0.9rem', fontStyle: 'italic', background: 'rgba(55,61,59,0.03)', borderRadius: '16px' }}>
                        No hay recetas registradas.
                      </div>
                    )}
                  </div>
                </section>
              </motion.div>
            )}

            {/* ============ TAB: CAFETERÍA ============ */}
            {activeTab === 'cafeteria' && (
              <motion.div key="cafeteria" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} transition={{duration:0.3}}>
                <AdminCafeteria />
              </motion.div>
            )}

            {/* ============ TAB: INSIGNIAS ============ */}
            {activeTab === 'insignias' && (
              <motion.div key="insignias" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} transition={{duration:0.3}}>
                <div className="admin-double-column">
                  
                  {/* Columna Izquierda: Reglas Automáticas */}
                  <section>
                    <h2 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-display)', marginBottom: '20px' }}>Creador de Insignias Automáticas</h2>
                    <div className="ios-glass-card" style={{ background: 'var(--surface)', border: 'none', padding: '22px', margin: 0, marginBottom: '20px' }}>
                      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                        <div style={{ width: '80px' }}>
                          <label style={labelStyle}>Icono</label>
                          <input type="text" value={newRuleBadge.icon} onChange={e => setNewRuleBadge({...newRuleBadge, icon: e.target.value})} style={{...inputStyle, textAlign: 'center', fontSize: '1.5rem'}} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={labelStyle}>Nombre (Ej. Fuego Continuo)</label>
                          <input type="text" value={newRuleBadge.label} onChange={e => setNewRuleBadge({...newRuleBadge, label: e.target.value})} style={inputStyle} />
                        </div>
                      </div>
                      <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>Descripción Corta</label>
                        <input type="text" placeholder="Asiste a 3 clases en una semana" value={newRuleBadge.description} onChange={e => setNewRuleBadge({...newRuleBadge, description: e.target.value})} style={inputStyle} />
                      </div>
                      <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>¿Qué se debe cumplir?</label>
                        <select value={newRuleBadge.rule_type} onChange={e => setNewRuleBadge({...newRuleBadge, rule_type: e.target.value})} style={{...inputStyle, WebkitAppearance: 'none'}}>
                          <option value="TOTAL_CLASSES">Total de clases asistidas</option>
                          <option value="WEEKLY_CLASSES">Clases en una misma semana</option>
                          <option value="DIFFERENT_COACHES">Coaches diferentes tomados</option>
                          <option value="PROFILE_COMPLETE">Completar el perfil (Foto y datos)</option>
                          <option value="MANUAL">Otorgamiento Manual (Eventos/Retos)</option>
                        </select>
                      </div>
                      {newRuleBadge.rule_type !== 'PROFILE_COMPLETE' && newRuleBadge.rule_type !== 'MANUAL' && (
                        <div style={{ marginBottom: '16px' }}>
                          <label style={labelStyle}>Valor Objetivo (Ej. 3, 10, 100)</label>
                          <input type="number" min="1" value={newRuleBadge.rule_value} onChange={e => setNewRuleBadge({...newRuleBadge, rule_value: parseInt(e.target.value)})} style={inputStyle} />
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={handleSaveRuleBadge} style={{ flex: 1, padding: '15px', borderRadius: '14px', background: 'var(--primary)', color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '0.95rem' }}>
                          {editingBadgeId ? 'Guardar Cambios' : 'Crear Insignia'}
                        </button>
                        {editingBadgeId && (
                          <button onClick={cancelEditBadge} style={{ padding: '15px 25px', borderRadius: '14px', background: 'var(--surface-lowest)', color: 'var(--on-surface)', border: '1px solid var(--border-subtle)', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}>
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>

                    <h2 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-display)', marginBottom: '15px' }}>Reglas Activas</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {badgeConfigs.map(badge => (
                        <div key={badge.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', padding: '15px', borderRadius: '14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '1.8rem' }}>{badge.icon}</span>
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--black)', fontSize: '0.95rem' }}>{badge.label}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>
                                {getRuleDescription(badge.rule_type, badge.rule_value)}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleEditRuleBadge(badge)} style={{ background: 'rgba(255,139,66,0.1)', color: 'var(--primary)', border: 'none', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => handleDeleteRuleBadge(badge.id)} style={{ background: '#FF4D4D15', color: '#FF4D4D', border: 'none', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                              <Minus size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {badgeConfigs.length === 0 && <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', fontStyle: 'italic' }}>No hay reglas configuradas.</p>}
                    </div>
                  </section>

                  {/* Columna Derecha: Asignación Manual */}
                  <section>
                    <h2 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-display)', marginBottom: '20px' }}>Otorgamiento Manual</h2>
                    <div className="ios-glass-card" style={{ background: 'var(--surface)', border: 'none', padding: '22px', margin: 0 }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', marginBottom: '15px' }}>
                        Asigna insignias configuradas como "Manual" o insignias personalizadas temporales a alumnas específicas.
                      </p>
                      <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>Seleccionar Alumna</label>
                        <select value={selectedBadgeUser} onChange={(e)=>setSelectedBadgeUser(e.target.value)} style={{ ...inputStyle, WebkitAppearance: 'none' }}>
                          <option value="">Buscar alumna...</option>
                          {alumnas.map(a => <option key={a.id} value={a.id}>{a.name} ({a.email})</option>)}
                        </select>
                      </div>

                      {selectedBadgeUser && (
                        <>
                          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                            <div style={{ width: '80px' }}>
                              <label style={labelStyle}>Icono</label>
                              <input type="text" value={newCustomBadge.icon} onChange={e => setNewCustomBadge({...newCustomBadge, icon: e.target.value})} style={{...inputStyle, textAlign: 'center', fontSize: '1.5rem'}} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <label style={labelStyle}>Nombre de Insignia</label>
                              <input type="text" placeholder="Ej. Reto Verano 2026" value={newCustomBadge.label} onChange={e => setNewCustomBadge({...newCustomBadge, label: e.target.value})} style={inputStyle} />
                            </div>
                          </div>
                          <button onClick={handleAssignBadge} style={{ width: '100%', padding: '15px', borderRadius: '14px', background: 'var(--primary)', color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '0.95rem', marginBottom: '20px' }}>
                            Otorgar a Alumna
                          </button>

                          <h3 style={{ fontSize: '0.9rem', color: 'var(--on-surface-variant)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tiene actualmente:</h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {allUsers.find(u => u.id === selectedBadgeUser)?.custom_badges?.filter(b => !b._internal_notified_id)?.length > 0 ? (
                              allUsers.find(u => u.id === selectedBadgeUser).custom_badges.filter(b => !b._internal_notified_id).map((badge, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-lowest)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '1.5rem' }}>{badge.icon}</span>
                                    <span style={{ fontWeight: 700, color: 'var(--black)' }}>{badge.label}</span>
                                  </div>
                                  <button onClick={() => handleRemoveBadge(badge.label)} style={{ background: '#FF4D4D15', color: '#FF4D4D', border: 'none', width: '30px', height: '30px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                    <Minus size={14} />
                                  </button>
                                </div>
                              ))
                            ) : (
                              <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', fontStyle: 'italic', margin: 0 }}>Ninguna insignia manual.</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </section>
                </div>
              </motion.div>
            )}

            {/* ============ TAB: REPORTES (Métricas de Negocio) PREMIUM ============ */}
            {activeTab === 'reportes' && (
              <motion.div key="reportes" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} transition={{duration:0.3}}>
                <AdminReportes />
              </motion.div>
            )}

            {activeTab === 'clientas' && (
              <motion.div key="clientas" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} transition={{duration:0.3}}>
                <AdminClientas />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ====== BOTTOM NAV PREMIUM — INSTAGRAM STYLE ====== */}
      <nav className={`ios-bottom-nav mobile-only-nav ${isScrolled ? 'scrolled' : ''}`}>
        <div onClick={() => setActiveTab('clases')} className={`nav-item ${activeTab === 'clases' ? 'active' : ''}`}>
          <Calendar size={22} strokeWidth={2.5} />
          <span>Clases</span>
        </div>
        
        <button 
          className="nav-qr-button" 
          onClick={() => setActiveTab('mostrador')}
          style={activeTab === 'mostrador' ? {
            background: 'linear-gradient(135deg, #FF914D, #FF6B00)',
            boxShadow: '0 0 25px rgba(255, 145, 77, 0.8), 0 0 0 4px rgba(255, 255, 255, 1)'
          } : {}}
        >
          <QrCode size={24} strokeWidth={2.5} />
        </button>

        <div onClick={() => setActiveTab('ventas')} className={`nav-item ${activeTab === 'ventas' ? 'active' : ''}`}>
          <DollarSign size={22} strokeWidth={2.5} />
          <span>Ventas</span>
        </div>
      </nav>

      {/* PREMIUM TOAST NOTIFICATION */}
      {toast.show && (
        <div style={{
          position: 'fixed', top: '30px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, animation: 'fadeIn 0.3s ease',
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '16px 24px', borderRadius: '16px',
          background: toast.type === 'error' 
            ? 'linear-gradient(135deg, #FF4D4D, #FF6B6B)' 
            : 'linear-gradient(135deg, #22C55E, #4ADE80)',
          color: 'white', fontWeight: 700, fontSize: '0.9rem',
          boxShadow: toast.type === 'error' 
            ? '0 15px 40px rgba(255,77,77,0.35)' 
            : '0 15px 40px rgba(34,197,94,0.35)',
          backdropFilter: 'blur(20px)',
          fontFamily: 'var(--font-body)',
          minWidth: '280px', maxWidth: '90vw',
        }}>
          <div style={{ 
            width: '32px', height: '32px', borderRadius: '50%', 
            background: 'rgba(255,255,255,0.25)', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', flexShrink: 0 
          }}>
            <CheckCircle2 size={18} />
          </div>
          <span>{toast.message}</span>
        </div>
      )}
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
