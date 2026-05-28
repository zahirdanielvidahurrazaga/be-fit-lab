import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, ArrowRight, ChevronLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { activatePlan } = useAuth();
  const purchasedPlan = location.state?.purchasedPlan;
  const isNative = Capacitor.isNativePlatform();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    if (!acceptTerms) {
      setError("Debes aceptar los Términos y la Política de Privacidad para continuar.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      setLoading(false);
      return;
    }
    
    // Opcional: Validación más estricta (letras y números)
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(password)) {
      setError("La contraseña debe contener al menos una mayúscula, una minúscula y un número.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        }
      }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      if (purchasedPlan && data.user) {
        // El usuario compró un plan antes de registrarse
        // Esperar a que el trigger cree el perfil, luego activar plan via contexto
        setTimeout(async () => {
          const classes = purchasedPlan.title.includes('FIT') ? 20 : (purchasedPlan.title.includes('Premium') ? 30 : 15);
          await activatePlan(purchasedPlan.title, classes, data.user.id);
          navigate('/portal');
        }, 1000);
      } else {
        // Registro normal (sin pago previo), enviar a landing
        navigate('/', { state: { registered: true } });
      }
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', overflowX: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'url("/hero_bg.png")', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      
      {/* Overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 0 }}></div>

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

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isNative ? '20px 16px' : '40px 20px', zIndex: 1 }}>
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
          
          {/* FORMULARIO DE REGISTRO */}
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            {purchasedPlan ? (
               <>
                 <div style={{ display: 'inline-block', padding: '6px 12px', background: 'rgba(238,186,137,0.2)', color: 'var(--accent)', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '10px' }}>
                   Pago Exitoso
                 </div>
                 <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: '#1A1C1E', marginBottom: '0.5rem', lineHeight: 1.1 }}>Crea tu cuenta para disfrutar tu {purchasedPlan.title}</h1>
               </>
            ) : (
               <>
                 <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: '#1A1C1E', marginBottom: '0.5rem' }}>Crea tu Cuenta</h1>
                 <p style={{ color: '#4B5563', fontWeight: 500 }}>El primer paso hacia tu transformación.</p>
               </>
            )}
          </div>

          {error && (
            <div style={{ background: '#FEE2E2', color: '#EF4444', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="premium-input-group">
              <label>Nombre Completo</label>
              <User size={20} className="premium-input-icon" />
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. María Sánchez"
                className="premium-input"
                required
              />
            </div>

            <div className="premium-input-group">
              <label>Correo Electrónico</label>
              <Mail size={20} className="premium-input-icon" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                className="premium-input"
                autoComplete="email"
                required
              />
            </div>

            <div className="premium-input-group">
              <label>Contraseña Segura</label>
              <Lock size={20} className="premium-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="premium-input"
                style={{ paddingRight: '3rem' }}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{ position: 'absolute', right: '1rem', top: '42px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)', opacity: 0.7, padding: 0, display: 'flex', alignItems: 'center' }}
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="premium-input-group">
              <label>Confirmar Contraseña</label>
              <Lock size={20} className="premium-input-icon" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="premium-input"
                style={{ paddingRight: '3rem' }}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(v => !v)}
                style={{ position: 'absolute', right: '1rem', top: '42px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)', opacity: 0.7, padding: 0, display: 'flex', alignItems: 'center' }}
                tabIndex={-1}
                aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* CONSENTIMIENTO LEGAL */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '1.5rem', cursor: 'pointer', fontSize: '0.82rem', color: '#4B5563', lineHeight: 1.5 }}>
              <input 
                type="checkbox" 
                checked={acceptTerms} 
                onChange={(e) => setAcceptTerms(e.target.checked)} 
                style={{ marginTop: '3px', accentColor: 'var(--primary)', width: '18px', height: '18px', flexShrink: 0 }}
              />
              <span>
                Acepto los <Link to="/terminos" target="_blank" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}>Términos y Condiciones</Link> y la <Link to="/privacidad" target="_blank" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}>Política de Privacidad</Link> de Be Fit Lab.
              </span>
            </label>

            <button type="submit" className="glass-button-dark" style={{ width: '100%', marginTop: '1.5rem', opacity: acceptTerms ? 1 : 0.5 }} disabled={loading || !acceptTerms}>
              {loading ? 'Creando cuenta...' : 'Completar Registro'} <ArrowRight size={20} />
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '2rem', color: '#4B5563', fontSize: '0.9rem' }}>
            ¿Ya tienes una cuenta? <span onClick={() => navigate('/login')} style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>Inicia Sesión</span>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Register;
