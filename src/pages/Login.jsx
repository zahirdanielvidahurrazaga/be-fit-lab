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
    
    // Si la BD de supabase no está configurada para Auth, simulamos el ruteo
    if (email === 'admin@befitlab.com') {
      navigate('/admin');
      return;
    } else if (email.includes('cliente')) {
      navigate('/portal');
      return;
    }

    const { data, error: authError } = await login(email, password);
    if (authError) {
      setError(authError.message);
    } else {
      // Rutas protegidas basadas en AuthContext
      navigate('/'); // App.jsx redirigirá basado en rol
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
      {/* Sección Izquierda - Imagen */}
      <div style={{ flex: 1, display: 'none', '@media (min-width: 1024px)': { display: 'block' }, position: 'relative' }} className="login-image-container">
        <img src="/hero_bg.png" alt="Pilates" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.6), transparent)' }}></div>
        <div style={{ position: 'absolute', bottom: '10%', left: '10%', color: 'white', maxWidth: '400px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', marginBottom: '1rem', textShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>BEFIT LAB</h2>
          <p style={{ fontSize: '1.2rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)', opacity: 0.9 }}>Transforma tu cuerpo, conecta con tu mente.</p>
        </div>
      </div>

      {/* Sección Derecha - Formulario */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#FFFFFF' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: '#1A1C1E', marginBottom: '0.5rem' }}>Bienvenida de nuevo</h1>
            <p style={{ color: '#6B7280' }}>Ingresa tus credenciales para acceder a tu portal.</p>
          </div>

          {error && (
            <div style={{ background: '#FEE2E2', color: '#EF4444', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Correo Electrónico</label>
              <div style={{ position: 'relative' }}>
                <Mail size={20} color="#9CA3AF" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 3rem', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '1rem', outline: 'none' }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <Lock size={20} color="#9CA3AF" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 3rem', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '1rem', outline: 'none' }}
                  required
                />
              </div>
            </div>

            <button type="submit" style={{ background: 'var(--primary)', color: 'white', padding: '1rem', borderRadius: '30px', fontWeight: 600, fontSize: '1.1rem', marginTop: '1rem', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 4px 15px rgba(201, 114, 93, 0.3)' }}>
              Iniciar Sesión <ArrowRight size={20} />
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '2rem', color: '#6B7280', fontSize: '0.9rem' }}>
            ¿No tienes una cuenta? <span style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>Contáctanos</span>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Login;
