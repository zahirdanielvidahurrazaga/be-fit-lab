import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Lock, Mail, ArrowRight, ChevronLeft, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { motion } from 'framer-motion';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutos

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const isNative = Capacitor.isNativePlatform();

  // Forzar light en Login/Welcome
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  // ==============================
  // RATE LIMITING (Anti-Fuerza Bruta)
  // ==============================
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(null);

  const isLockedOut = () => {
    if (!lockoutUntil) return false;
    if (Date.now() < lockoutUntil) return true;
    // Expiró el bloqueo
    setLockoutUntil(null);
    setLoginAttempts(0);
    return false;
  };

  const getRemainingLockoutTime = () => {
    if (!lockoutUntil) return 0;
    return Math.ceil((lockoutUntil - Date.now()) / 60000);
  };

  // ==============================
  // OLVIDÉ MI CONTRASEÑA
  // ==============================
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState(null);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim().toLowerCase(), {
      redirectTo: window.location.origin + '/login',
    });

    if (error) {
      setResetError(error.message);
    } else {
      setResetSuccess(true);
    }
    setResetLoading(false);
  };

  // ==============================
  // LOGIN
  // ==============================
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Verificar bloqueo
    if (isLockedOut()) {
      setError(`Demasiados intentos. Intenta de nuevo en ${getRemainingLockoutTime()} minutos.`);
      return;
    }

    setLoading(true);
    setError(null);
    const cleanEmail = email.trim().toLowerCase();
    const { data, error: authError } = await login(cleanEmail, password);
    
    if (authError) {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);

      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        setLockoutUntil(Date.now() + LOCKOUT_DURATION_MS);
        setError(`Cuenta bloqueada temporalmente por seguridad. Intenta de nuevo en 15 minutos.`);
      } else {
        setError(`Error (${authError.message}). ${MAX_LOGIN_ATTEMPTS - newAttempts} intentos restantes.`);
      }
      setLoading(false);
    } else {
      setLoginAttempts(0);
      navigate('/portal');
    }
  };

  // ==============================
  // UI: RECUPERAR CONTRASEÑA
  // ==============================
  if (showForgotPassword) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'url("/hero_bg.png")', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 0 }}></div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', zIndex: 1 }}>
          <div style={{ 
            width: '100%', maxWidth: '450px', 
            background: 'rgba(255, 255, 255, 0.65)', 
            backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
            padding: '3rem', borderRadius: '30px',
            border: '1px solid rgba(255,255,255,0.5)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
          }}>

            {resetSuccess ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                  <CheckCircle2 size={32} color="#22C55E" />
                </div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: '#1A1C1E', marginBottom: '0.5rem' }}>Correo enviado</h2>
                <p style={{ color: '#4B5563', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                  Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada y spam.
                </p>
                <button onClick={() => { setShowForgotPassword(false); setResetSuccess(false); setResetEmail(''); }} className="glass-button-dark" style={{ width: '100%' }}>
                  Volver al Login <ArrowRight size={20} />
                </button>
              </div>
            ) : (
              <>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: '#1A1C1E', marginBottom: '0.5rem' }}>Recuperar contraseña</h1>
                  <p style={{ color: '#4B5563', fontWeight: 500, fontSize: '0.9rem' }}>Ingresa tu correo y te enviaremos un enlace de recuperación.</p>
                </div>

                {resetError && (
                  <div style={{ background: '#FEE2E2', color: '#EF4444', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>
                    {resetError}
                  </div>
                )}

                <form onSubmit={handleResetPassword}>
                  <div className="premium-input-group">
                    <label>Correo Electrónico</label>
                    <Mail size={20} className="premium-input-icon" />
                    <input 
                      type="email" 
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="ejemplo@correo.com"
                      className="premium-input"
                      required
                    />
                  </div>

                  <button type="submit" className="glass-button-dark" style={{ width: '100%', marginTop: '1.5rem' }} disabled={resetLoading}>
                    {resetLoading ? 'Enviando...' : 'Enviar enlace de recuperación'} <ArrowRight size={20} />
                  </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                  <span onClick={() => { setShowForgotPassword(false); setResetError(null); }} style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
                    Volver al inicio de sesión
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==============================
  // UI: LOGIN PRINCIPAL
  // ==============================
  return (
    <div style={{ position: 'relative', width: '100%', overflowX: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'url("/welcome_bg.png")', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      
      {/* Overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.25) 35%, rgba(0,0,0,0.55) 65%, rgba(0,0,0,0.85) 100%)', backdropFilter: 'blur(8px)', zIndex: 0 }}></div>

      {/* BOTÓN VOLVER AL SITIO */}
      {!isNative && (
        <div 
          onClick={() => navigate('/')} 
          style={{ 
            position: 'absolute', top: '20px', left: '20px', zIndex: 10,
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '10px 18px', borderRadius: '50px',
            background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(20px)',
            color: 'white', fontSize: '0.85rem', fontWeight: 600,
            cursor: 'pointer', border: '1px solid rgba(255,255,255,0.2)',
            transition: 'all 0.3s ease'
          }}>
          <ChevronLeft size={18} />
          Volver al sitio
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isNative ? '20px 16px' : '40px 20px', zIndex: 1 }}>
        <div style={{ 
          width: '100%', 
          maxWidth: '440px', 
          background: 'rgba(255, 255, 255, 0.65)', 
          backdropFilter: 'blur(30px)', 
          WebkitBackdropFilter: 'blur(30px)',
          padding: isNative ? '2.5rem 1.25rem' : '3rem 2rem', 
          borderRadius: '30px',
          border: '1px solid rgba(255,255,255,0.5)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          boxSizing: 'border-box'
        }}>
          
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: '#1A1C1E', marginBottom: '0.5rem' }}>Bienvenida de nuevo</h1>
            <p style={{ color: '#4B5563', fontWeight: 500 }}>Ingresa tus credenciales para acceder a tu portal.</p>
          </div>

          {error && (
            <div style={{ 
              background: isLockedOut() ? '#FEF3C7' : '#FEE2E2', 
              color: isLockedOut() ? '#92400E' : '#EF4444', 
              padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', 
              fontSize: '0.85rem', textAlign: 'center',
              display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center',
              border: isLockedOut() ? '1px solid rgba(146,64,14,0.2)' : '1px solid rgba(239,68,68,0.2)'
            }}>
              {isLockedOut() && <AlertTriangle size={18} />}
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="premium-input-group">
              <label>Correo Electrónico</label>
              <Mail size={20} className="premium-input-icon" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                className="premium-input"
                required
                disabled={isLockedOut()}
              />
            </div>

            <div className="premium-input-group">
              <label>Contraseña</label>
              <Lock size={20} className="premium-input-icon" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="premium-input"
                required
                disabled={isLockedOut()}
              />
            </div>

            {/* OLVIDÉ MI CONTRASEÑA */}
            <div style={{ textAlign: 'right', marginTop: '8px' }}>
              <span 
                onClick={() => setShowForgotPassword(true)} 
                style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
              >
                ¿Olvidaste tu contraseña?
              </span>
            </div>

            <button type="submit" className="glass-button-dark" style={{ width: '100%', marginTop: '1.5rem' }} disabled={loading || isLockedOut()}>
              {loading ? 'Validando...' : isLockedOut() ? `Bloqueado (${getRemainingLockoutTime()} min)` : 'Iniciar Sesión'} <ArrowRight size={20} />
            </button>
          </form>

          {isNative ? (
            <div style={{ textAlign: 'center', marginTop: '2rem', color: '#4B5563', fontSize: '0.85rem', fontWeight: 500, lineHeight: 1.5 }}>
              Esta aplicación es exclusiva para miembros activos de Be Fit Lab.
            </div>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginTop: '2rem', color: '#4B5563', fontSize: '0.9rem' }}>
                ¿No tienes una cuenta? <span onClick={() => navigate('/registro')} style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>Regístrate aquí</span>
              </div>
              
              <div style={{ marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid rgba(0,0,0,0.05)', textAlign: 'center' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', fontWeight: 600, marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lleva tu entrenamiento a otro nivel</p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <a
                    href="https://apps.apple.com/mx/app/be-fit-lab/id6772008660"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Descargar Be Fit Lab en App Store"
                  >
                    <img
                      src="/assets/appstore.svg"
                      alt="Download on the App Store"
                      style={{ height: '36px', width: '120px', objectFit: 'contain', cursor: 'pointer', transition: 'transform 0.2s ease', display: 'block' }}
                      onMouseOver={(e) => e.currentTarget.style.transform='scale(1.05)'}
                      onMouseOut={(e) => e.currentTarget.style.transform='scale(1)'}
                    />
                  </a>
                  <img
                    src="/assets/googleplay.svg"
                    alt="Próximamente en Google Play"
                    title="Próximamente en Google Play"
                    style={{ height: '36px', width: '120px', objectFit: 'contain', cursor: 'not-allowed', opacity: 0.45, filter: 'grayscale(1)', transition: 'opacity 0.2s ease' }}
                  />
                </div>
              </div>
            </>
          )}

        </div>
      </motion.div>
    </div>
  );
}

export default Login;
