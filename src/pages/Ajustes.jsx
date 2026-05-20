import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Settings, Bell, Moon, Lock, FileText, ShieldAlert, Trash2, ChevronRight, ChevronLeft, Check, AlertCircle, Home, TrendingUp, Utensils, CalendarDays, QrCode, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useScrollDetect } from '../hooks/useScrollDetect';

function Ajustes() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isScrolled = useScrollDetect(30);

  // Settings state
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // Modals
  const [showChangePassword, setShowChangePassword] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1);

  // Password change
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    const savedNotif = localStorage.getItem('befit_notifications');
    const savedDark = localStorage.getItem('befit_darkmode');
    if (savedNotif !== null) setNotifications(savedNotif === 'true');
    if (savedDark !== null) setDarkMode(savedDark === 'true');
  }, []);

  const toggleNotifications = () => {
    const newVal = !notifications;
    setNotifications(newVal);
    localStorage.setItem('befit_notifications', String(newVal));
  };

  const toggleDarkMode = () => {
    const newVal = !darkMode;
    setDarkMode(newVal);
    localStorage.setItem('befit_darkmode', String(newVal));
    // Apply dark mode to document
    document.documentElement.setAttribute('data-theme', newVal ? 'dark' : 'light');
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      setPasswordError(true);
      setPasswordMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(true);
      setPasswordMsg('Las contraseñas no coinciden.');
      return;
    }

    setChangingPassword(true);
    setPasswordError(false);
    setPasswordMsg('');

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPasswordError(true);
      setPasswordMsg('Error: ' + error.message);
    } else {
      setPasswordError(false);
      setPasswordMsg('Contraseña actualizada correctamente.');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowChangePassword(false);
        setPasswordMsg('');
      }, 2000);
    }
    setChangingPassword(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteStep === 1) {
      setDeleteStep(2);
      return;
    }
    // Step 2: actual delete
    try {
      // Delete user data from users table
      await supabase.from('reservations').delete().eq('user_id', user.id);
      await supabase.from('users').delete().eq('id', user.id);
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Error deleting account:', err);
    }
  };

  // Styles
  const cardStyle = {
    background: 'var(--app-surface-solid)',
    borderRadius: '24px',
    padding: '6px 0',
    marginBottom: '16px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.05)',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.05)'
  };

  const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    cursor: 'pointer',
    transition: 'background 0.2s ease'
  };

  const iconBoxStyle = {
    width: '36px', height: '36px', borderRadius: '12px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0
  };

  const inputStyle = {
    width: '100%',
    padding: '14px 18px',
    borderRadius: '9999px',
    border: '1px solid var(--accent)',
    background: 'var(--surface)',
    fontSize: '0.95rem',
    fontFamily: 'DM Sans, sans-serif',
    color: 'var(--on-surface)',
    outline: 'none',
    boxSizing: 'border-box'
  };

  const ToggleSwitch = ({ value, onToggle }) => (
    <div
      onClick={onToggle}
      style={{
        width: '52px', height: '30px', borderRadius: '15px',
        background: value ? 'var(--primary)' : 'rgba(140, 128, 121, 0.3)',
        padding: '3px', cursor: 'pointer',
        transition: 'background 0.3s ease',
        display: 'flex', alignItems: 'center'
      }}
    >
      <div style={{
        width: '24px', height: '24px', borderRadius: '50%',
        background: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
        transform: value ? 'translateX(22px)' : 'translateX(0)',
        transition: 'transform 0.3s ease'
      }} />
    </div>
  );

  // MODAL OVERLAY
  const ModalOverlay = ({ show, onClose, children }) => {
    if (!show) return null;
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.6)', zIndex: 9999,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)'
      }} onClick={onClose}>
        <div
          style={{
            background: 'var(--surface)', borderRadius: '28px 28px 0 0',
            width: '100%', maxWidth: '430px',
            maxHeight: '85vh', overflow: 'auto',
            padding: '24px 20px 40px',
            animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            borderTop: '1px solid rgba(255,255,255,0.1)'
          }}
          onClick={e => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    );
  };

  return (
    <div className="mobile-app-container" style={{ background: 'var(--app-bg)' }}>
      {/* HEADER UNIFICADO */}
      <header className="ios-header" style={{ paddingTop: '20px', paddingBottom: '5px', background: 'transparent', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              onClick={() => navigate(-1)}
              style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'rgba(255,139,66,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <ChevronLeft size={20} color="var(--primary)" />
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: '0 0 2px', fontWeight: 600 }}>Configuración</p>
              <h1 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', margin: 0, lineHeight: 1.1, color: 'var(--black)' }}>Ajustes</h1>
            </div>
          </div>
          <div style={{ 
            width: '42px', height: '42px', borderRadius: '50%', 
            background: 'rgba(255,139,66,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Settings size={20} color="var(--primary)" />
          </div>
        </div>
      </header>

      <main className="dashboard-main" style={{ display: 'block', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
        <div className="dashboard-sidebar" style={{ width: '100%' }}>

          {/* PREFERENCIAS */}
          <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--on-surface-variant)', margin: '0 0 8px', paddingLeft: '8px' }}>
            Preferencias
          </p>
          <div style={cardStyle}>
            <div style={rowStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ ...iconBoxStyle, background: 'rgba(255,139,66,0.1)' }}>
                  <Bell size={18} color="var(--primary)" />
                </div>
                <div>
                  <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--on-surface)', margin: 0 }}>Notificaciones</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', margin: '2px 0 0' }}>Recordatorio 1hr antes</p>
                </div>
              </div>
              <ToggleSwitch value={notifications} onToggle={toggleNotifications} />
            </div>

            <div style={{ height: '1px', background: 'rgba(140, 128, 121, 0.15)', margin: '0 20px' }} />

            <div style={rowStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ ...iconBoxStyle, background: 'rgba(140, 128, 121, 0.1)' }}>
                  <Moon size={18} color="var(--on-surface)" />
                </div>
                <div>
                  <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--on-surface)', margin: 0 }}>Modo Oscuro</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', margin: '2px 0 0' }}>Apariencia de la app</p>
                </div>
              </div>
              <ToggleSwitch value={darkMode} onToggle={toggleDarkMode} />
            </div>
          </div>

          {/* SEGURIDAD */}
          <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--on-surface-variant)', margin: '8px 0 8px', paddingLeft: '8px' }}>
            Seguridad
          </p>
          <div style={cardStyle}>
            <div style={rowStyle} onClick={() => setShowChangePassword(true)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ ...iconBoxStyle, background: 'rgba(0,103,126,0.1)' }}>
                  <Lock size={18} color="#00A3C4" />
                </div>
                <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--on-surface)', margin: 0 }}>Cambiar Contraseña</p>
              </div>
              <ChevronRight size={20} color="var(--on-surface-variant)" />
            </div>
          </div>

          {/* LEGAL */}
          <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--on-surface-variant)', margin: '8px 0 8px', paddingLeft: '8px' }}>
            Legal
          </p>
          <div style={cardStyle}>
            <div style={rowStyle} onClick={() => navigate('/privacidad')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ ...iconBoxStyle, background: 'rgba(126,86,46,0.1)' }}>
                  <FileText size={18} color="#A19289" />
                </div>
                <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--on-surface)', margin: 0 }}>Política de Privacidad</p>
              </div>
              <ChevronRight size={20} color="var(--on-surface-variant)" />
            </div>

            <div style={{ height: '1px', background: 'rgba(140, 128, 121, 0.15)', margin: '0 20px' }} />

            <div style={rowStyle} onClick={() => navigate('/terminos')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ ...iconBoxStyle, background: 'rgba(126,86,46,0.1)' }}>
                  <ShieldAlert size={18} color="#A19289" />
                </div>
                <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--on-surface)', margin: 0 }}>Términos y Condiciones</p>
              </div>
              <ChevronRight size={20} color="var(--on-surface-variant)" />
            </div>
          </div>

          {/* DANGER ZONE */}
          <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#ff4d4d', margin: '8px 0 8px', paddingLeft: '8px' }}>
            Zona de Peligro
          </p>
          <div style={{ ...cardStyle, marginBottom: '24px' }}>
            <div style={rowStyle} onClick={() => setShowDeleteConfirm(true)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ ...iconBoxStyle, background: 'rgba(255,77,77,0.1)' }}>
                  <Trash2 size={18} color="#ff4d4d" />
                </div>
                <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ff4d4d', margin: 0 }}>Eliminar Cuenta</p>
              </div>
              <ChevronRight size={20} color="#ff4d4d" />
            </div>
          </div>

          {/* VERSION */}
          <div style={{ textAlign: 'center', marginBottom: '100px' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', margin: 0, fontWeight: 500 }}>
              <Info size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
              BE FIT LAB v1.0.0
            </p>
          </div>

        </div>
      </main>

      {/* CHANGE PASSWORD MODAL */}
      <ModalOverlay show={showChangePassword} onClose={() => { setShowChangePassword(false); setPasswordMsg(''); }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'rgba(0,103,126,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px'
          }}>
            <Lock size={24} color="#00677e" />
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, fontFamily: 'DM Sans', color: '#1c1c1a' }}>Cambiar Contraseña</h2>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#564338', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'block' }}>
            Nueva contraseña
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#564338', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'block' }}>
            Confirmar contraseña
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Repite tu contraseña"
            style={inputStyle}
          />
        </div>

        {passwordMsg && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '12px 16px', borderRadius: '16px',
            background: passwordError ? '#ffdad6' : 'rgba(255,139,66,0.1)',
            color: passwordError ? '#93000a' : '#9b4500',
            fontSize: '0.85rem', marginBottom: '16px', fontWeight: 600
          }}>
            {passwordError ? <AlertCircle size={16} /> : <Check size={16} />} {passwordMsg}
          </div>
        )}

        <button
          onClick={handleChangePassword}
          disabled={changingPassword}
          style={{
            width: '100%', padding: '16px',
            borderRadius: '9999px', border: 'none',
            background: changingPassword ? '#ddc1b3' : '#00677e',
            color: 'white', fontSize: '1rem',
            fontWeight: 700, fontFamily: 'DM Sans',
            cursor: changingPassword ? 'not-allowed' : 'pointer',
            boxShadow: '0 8px 20px rgba(0,103,126,0.2)'
          }}
        >
          {changingPassword ? 'Actualizando...' : 'Actualizar Contraseña'}
        </button>
      </ModalOverlay>


      {/* DELETE ACCOUNT MODAL */}
      <ModalOverlay show={showDeleteConfirm} onClose={() => { setShowDeleteConfirm(false); setDeleteStep(1); }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: '#ffdad6', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <Trash2 size={28} color="#ba1a1a" />
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 8px', fontFamily: 'DM Sans', color: '#1c1c1a' }}>
            {deleteStep === 1 ? '¿Eliminar tu cuenta?' : '¿Estás segura?'}
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#564338', marginBottom: '24px' }}>
            {deleteStep === 1
              ? 'Se eliminarán todos tus datos, reservaciones e historial. Esta acción no se puede deshacer.'
              : 'Esta es tu última oportunidad. Al confirmar, tu cuenta será eliminada permanentemente.'}
          </p>

          <button
            onClick={handleDeleteAccount}
            style={{
              width: '100%', padding: '16px',
              borderRadius: '9999px', border: 'none',
              background: '#ba1a1a', color: 'white',
              fontSize: '1rem', fontWeight: 700, fontFamily: 'DM Sans',
              cursor: 'pointer', marginBottom: '12px',
              boxShadow: '0 8px 20px rgba(186,26,26,0.2)'
            }}
          >
            {deleteStep === 1 ? 'Sí, eliminar mi cuenta' : 'Confirmar eliminación definitiva'}
          </button>

          <button
            onClick={() => { setShowDeleteConfirm(false); setDeleteStep(1); }}
            style={{
              width: '100%', padding: '16px',
              borderRadius: '9999px',
              border: '1px solid #ddc1b3', background: 'transparent',
              fontSize: '1rem', fontWeight: 600, fontFamily: 'DM Sans',
              color: '#564338', cursor: 'pointer'
            }}
          >
            Cancelar
          </button>
        </div>
      </ModalOverlay>


    </div>
  );
}

export default Ajustes;
