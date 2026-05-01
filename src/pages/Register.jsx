import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, ArrowRight, ChevronLeft, CheckCircle2 } from 'lucide-react';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
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
      // Mostrar pantalla de éxito integrada (sin alert)
      setSuccess(true);
      setLoading(false);
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
          
          {success ? (
            /* PANTALLA DE ÉXITO POST-REGISTRO */
            <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
              <div style={{ 
                width: '80px', height: '80px', borderRadius: '50%', 
                background: 'rgba(255,145,77,0.1)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                margin: '0 auto 25px' 
              }}>
                <CheckCircle2 size={40} color="var(--primary)" />
              </div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: '#1A1C1E', marginBottom: '0.5rem' }}>
                ¡Cuenta Creada!
              </h1>
              <p style={{ color: '#4B5563', fontWeight: 500, fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                Tu cuenta ha sido creada exitosamente. Sin embargo, <strong>aún no cuentas con un plan activo</strong>.
              </p>
              
              <div style={{ 
                background: 'rgba(255,145,77,0.08)', 
                padding: '20px', borderRadius: '16px', marginBottom: '25px',
                border: '1px solid rgba(255,145,77,0.15)'
              }}>
                <p style={{ margin: 0, color: '#1A1C1E', fontSize: '0.9rem', fontWeight: 600 }}>
                  Para acceder al portal, necesitas adquirir una membresía.
                </p>
                <p style={{ margin: '8px 0 0', color: '#6B7280', fontSize: '0.8rem' }}>
                  Puedes elegir un plan en línea o acudir directamente al estudio.
                </p>
              </div>

              <button 
                onClick={() => navigate('/planes')} 
                className="glass-button-dark" 
                style={{ width: '100%', marginBottom: '12px' }}
              >
                Ver Planes y Membresías <ArrowRight size={20} />
              </button>
              
              <button 
                onClick={() => navigate('/login')} 
                style={{ 
                  width: '100%', padding: '14px', borderRadius: '30px', 
                  background: 'transparent', border: '1px solid rgba(55,61,59,0.15)',
                  color: '#4B5563', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem'
                }}
              >
                Ya tengo plan, Iniciar Sesión
              </button>
            </div>
          ) : (
            /* FORMULARIO DE REGISTRO */
            <>
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
            </>
          )}

        </div>
      </div>
    </div>
  );
}

export default Register;
