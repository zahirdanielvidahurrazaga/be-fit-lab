import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ArrowRight } from 'lucide-react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    const cleanEmail = email.trim().toLowerCase();
    const { data, error: authError } = await login(cleanEmail, password);
    
    if (authError) {
      setError(authError.message);
    } else {
      // Redirección inmediata basada en el correo de demo o el rol
      if (cleanEmail === 'admin@befitlab.com') {
        navigate('/admin');
      } else if (cleanEmail.includes('cliente')) {
        navigate('/portal');
      } else {
        navigate('/'); // Redirección por defecto
      }
    }
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
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: '#1A1C1E', marginBottom: '0.5rem' }}>Bienvenida de nuevo</h1>
            <p style={{ color: '#4B5563', fontWeight: 500 }}>Ingresa tus credenciales para acceder a tu portal.</p>
          </div>

          {error && (
            <div style={{ background: '#FEE2E2', color: '#EF4444', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>
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
              />
            </div>

            <button type="submit" className="glass-button-dark" style={{ width: '100%', marginTop: '2rem' }}>
              Iniciar Sesión <ArrowRight size={20} />
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '2rem', color: '#4B5563', fontSize: '0.9rem' }}>
            ¿No tienes una cuenta? <span onClick={() => navigate('/registro')} style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>Regístrate aquí</span>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Login;
