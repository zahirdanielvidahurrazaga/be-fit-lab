import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Camera, Mail, Phone, Shield, Clock, ChevronRight, Check, AlertCircle, Utensils, TrendingUp, CalendarDays, QrCode, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useScrollDetect } from '../hooks/useScrollDetect';

function MiCuenta() {
  const navigate = useNavigate();
  const { user, plan, classesRemaining, membershipStatus, myReservations } = useAuth();
  const isScrolled = useScrollDetect(30);

  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [classHistory, setClassHistory] = useState([]);

  // Load user data
  useEffect(() => {
    if (user) {
      loadProfile();
      loadClassHistory();
    }
  }, [user]);

  const loadProfile = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('full_name, phone, emergency_contact_name, emergency_contact_phone')
      .eq('id', user.id)
      .single();

    if (data) {
      setFullName(data.full_name || '');
      setPhone(data.phone || '');
      setEmergencyName(data.emergency_contact_name || '');
      setEmergencyPhone(data.emergency_contact_phone || '');
    }
  };

  const loadClassHistory = async () => {
    const { data } = await supabase
      .from('reservations')
      .select('*, classes(title, instructor, time, day)')
      .eq('user_id', user.id)
      .eq('checked_in', true)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) setClassHistory(data);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);

    const { error: updateError } = await supabase
      .from('users')
      .update({
        full_name: fullName,
        phone: phone,
        emergency_contact_name: emergencyName,
        emergency_contact_phone: emergencyPhone
      })
      .eq('id', user.id);

    if (updateError) {
      setError('Error al guardar. Intenta de nuevo.');
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Styles
  const cardStyle = {
    background: 'var(--app-surface-solid)',
    borderRadius: '24px',
    padding: '20px',
    marginBottom: '16px',
    boxShadow: 'var(--card-shadow)',
    border: '1px solid var(--border-subtle)'
  };

  const labelStyle = {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'var(--on-surface-variant)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '6px',
    display: 'block'
  };

  const inputStyle = {
    width: '100%',
    padding: '14px 18px',
    borderRadius: '9999px',
    border: '1px solid var(--border-subtle)',
    background: 'var(--surface-low)',
    fontSize: '0.95rem',
    fontFamily: 'DM Sans, sans-serif',
    color: 'var(--on-surface)',
    outline: 'none',
    transition: 'border-color 0.2s ease',
    boxSizing: 'border-box'
  };

  const inputReadOnlyStyle = {
    ...inputStyle,
    background: 'var(--surface-low)',
    color: 'var(--on-surface-variant)',
    opacity: 0.6,
    cursor: 'not-allowed'
  };

  return (
    <div className="mobile-app-container" style={{ background: 'var(--app-bg)' }}>
      {/* HEADER UNIFICADO */}
      <header className="ios-header" style={{ paddingTop: '20px', paddingBottom: '5px', background: 'transparent' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div 
              onClick={() => navigate('/portal')}
              style={{ 
                width: '36px', height: '36px', borderRadius: '50%', 
                background: 'rgba(255,139,66,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Home size={18} color="var(--primary)" />
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: '0 0 2px', fontWeight: 600 }}>Mi perfil</p>
              <h1 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', margin: 0, lineHeight: 1.1, color: 'var(--black)' }}>Mi Cuenta</h1>
            </div>
          </div>
          <div style={{ 
            width: '42px', height: '42px', borderRadius: '50%', 
            background: 'rgba(255,139,66,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <User size={20} color="var(--primary)" />
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-sidebar">

          {/* AVATAR */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '100px', height: '100px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #FF8B42, #EEBA89)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 12px 30px rgba(255,139,66,0.3)'
              }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white', fontFamily: 'DM Sans' }}>
                  {fullName ? fullName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
              <div style={{
                position: 'absolute', bottom: '0', right: '0',
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'var(--app-surface-solid)', border: '2px solid var(--app-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: 'var(--card-shadow)', cursor: 'pointer'
              }}>
                <Camera size={14} color="var(--primary)" />
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <h3 style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--on-surface-variant)', margin: '0 0 16px' }}>
              Datos Personales
            </h3>

            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Nombre completo</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Tu nombre"
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#FF8B42'}
                onBlur={(e) => e.target.style.borderColor = '#ddc1b3'}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Teléfono</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+52 000 000 0000"
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#FF8B42'}
                onBlur={(e) => e.target.style.borderColor = '#ddc1b3'}
              />
            </div>

            <div>
              <label style={labelStyle}>Email</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  value={user?.email || ''}
                  readOnly
                  style={inputReadOnlyStyle}
                />
                <Mail size={16} color="#8a7266" style={{ position: 'absolute', right: '18px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>
          </div>

          {/* MI MEMBRESÍA */}
          <div style={{
            ...cardStyle,
            background: 'linear-gradient(135deg, #2D2928 0%, #3d3532 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Decorative circle */}
            <div style={{
              position: 'absolute', top: '-30px', right: '-30px',
              width: '120px', height: '120px', borderRadius: '50%',
              background: 'rgba(255,139,66,0.15)'
            }} />

            <h3 style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)', margin: '0 0 12px', position: 'relative' }}>
              Mi Membresía
            </h3>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative' }}>
              <div>
                <p style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 4px', fontFamily: 'DM Sans' }}>
                  {plan || 'Sin Plan'}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                  {membershipStatus === 'ACTIVE' ? '✓ Activa' : '○ Inactiva'}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '2.8rem', fontWeight: 900, margin: 0, lineHeight: 1, color: '#FF8B42', fontFamily: 'DM Sans' }}>
                  {classesRemaining}
                </p>
                <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', margin: 0, fontWeight: 600 }}>
                  clases restantes
                </p>
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <h3 style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--on-surface-variant)', margin: '0 0 16px' }}>
              Historial de Clases
            </h3>

            {classHistory.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: '#8a7266', textAlign: 'center', padding: '20px 0' }}>
                Aún no tienes clases completadas
              </p>
            ) : (
              classHistory.map((item, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '12px 0',
                  borderBottom: i < classHistory.length - 1 ? '1px solid #f0ede9' : 'none'
                }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '14px',
                    background: 'var(--surface-low)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Check size={18} color="var(--primary)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1c1c1a', margin: 0 }}>
                      {item.classes?.title || 'Clase'}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#8a7266', margin: '2px 0 0' }}>
                      {item.classes?.instructor || 'Coach'} · {item.classes?.time || ''} · {dayNames[item.classes?.day] || ''}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={cardStyle}>
            <h3 style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--on-surface-variant)', margin: '0 0 16px' }}>
              <Shield size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              Contacto de Emergencia
            </h3>

            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Nombre</label>
              <input
                type="text"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                placeholder="Nombre del contacto"
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#FF8B42'}
                onBlur={(e) => e.target.style.borderColor = '#ddc1b3'}
              />
            </div>

            <div>
              <label style={labelStyle}>Teléfono</label>
              <input
                type="tel"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder="+52 000 000 0000"
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#FF8B42'}
                onBlur={(e) => e.target.style.borderColor = '#ddc1b3'}
              />
            </div>
          </div>

          {/* ERROR / SUCCESS MESSAGES */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '12px 16px', borderRadius: '16px',
              background: '#ffdad6', color: '#93000a',
              fontSize: '0.85rem', marginBottom: '16px'
            }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {saved && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '12px 16px', borderRadius: '16px',
              background: 'rgba(255,139,66,0.1)', color: '#9b4500',
              fontSize: '0.85rem', marginBottom: '16px', fontWeight: 600
            }}>
              <Check size={16} /> Cambios guardados correctamente
            </div>
          )}

          {/* GUARDAR BUTTON */}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%', padding: '16px',
              borderRadius: '9999px', border: 'none',
              background: saving ? '#ddc1b3' : '#FF8B42',
              color: 'white', fontSize: '1rem',
              fontWeight: 700, fontFamily: 'DM Sans, sans-serif',
              cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: '0 8px 20px rgba(255,139,66,0.3)',
              transition: 'all 0.3s ease',
              marginBottom: '16px'
            }}
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>

          {/* LINK TO SETTINGS */}
          <div
            onClick={() => navigate('/ajustes')}
            style={{
              ...cardStyle,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer', marginBottom: '100px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '14px',
                background: 'var(--surface-low)', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Shield size={18} color="var(--on-surface-variant)" />
              </div>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1c1c1a' }}>Ajustes</span>
            </div>
            <ChevronRight size={20} color="#8a7266" />
          </div>

        </div>
      </main>

      {/* BOTTOM NAV */}
      {user && (
        <nav className={`ios-bottom-nav ${isScrolled ? 'scrolled' : ''}`}>
          <Link to="/portal" className="nav-item">
            <Home size={22} strokeWidth={2.5} />
            <span>Yo</span>
          </Link>
          <Link to="/evolucion" className="nav-item">
            <TrendingUp size={22} strokeWidth={2.5} />
            <span>Metas</span>
          </Link>
          <button className="nav-qr-button" onClick={() => navigate('/portal')}>
            <QrCode size={24} strokeWidth={2.5} />
          </button>
          <Link to="/nutricion" className="nav-item">
            <Utensils size={22} strokeWidth={2.5} />
            <span>Comida</span>
          </Link>
          <Link to="/agenda" className="nav-item">
            <CalendarDays size={22} strokeWidth={2.5} />
            <span>Clases</span>
          </Link>
        </nav>
      )}
    </div>
  );
}

export default MiCuenta;
