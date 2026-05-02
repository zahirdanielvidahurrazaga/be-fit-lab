import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, ArrowRight, ChevronLeft, CheckCircle2 } from 'lucide-react';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
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
      // Redirigir a la landing page con un indicador de éxito
      navigate('/', { state: { registered: true } });
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'url("/hero_bg.png")', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      
      {/* Overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 0 }}></div>

      {/* BOTÓN VOLVER AL SITIO */}
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

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', zIndex: 1 }}>
        <div style={{ 
          width: '100%', 
          maxWidth: '450px', 
          background: 'rgba(255, 255, 255, 0.65)', 
          backdropFilter: 'blur(30px)', 
          WebkitBackdropFilter: 'blur(30px)',
          padding: '3rem', 
          borderRadius: '30px',
          border: '1px solid rgba(255,255,255,0.5)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }}>
          
          {/* FORMULARIO DE REGISTRO */}
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: '#1A1C1E', marginBottom: '0.5rem' }}>Crea tu Cuenta</h1>
            <p style={{ color: '#4B5563', fontWeight: 500 }}>El primer paso hacia tu transformación.</p>
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
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="premium-input"
                autoComplete="new-password"
                required
              />
            </div>

            <div className="premium-input-group">
              <label>Confirmar Contraseña</label>
              <Lock size={20} className="premium-input-icon" />
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="premium-input"
                autoComplete="new-password"
                required
              />
            </div>

            <button type="submit" className="glass-button-dark" style={{ width: '100%', marginTop: '2rem' }} disabled={loading}>
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
