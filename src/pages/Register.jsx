import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, ArrowRight } from 'lucide-react';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const { login } = useAuth(); // Por ahora simulamos que el registro inicia sesión directo
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    // Simulación: Si se registran exitosamente, los pasamos directo al portal
    alert("¡Cuenta creada exitosamente! Bienvenida a BEFIT LAB.");
    navigate('/portal');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'url("/hero_bg.png")', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      
      {/* Overlay de desenfoque masivo para que resalte la tarjeta glass */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 0 }}></div>

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

            <button type="submit" className="glass-button-dark" style={{ width: '100%', marginTop: '2rem' }}>
              Completar Registro <ArrowRight size={20} />
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
