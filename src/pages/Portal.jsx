import React from 'react';
import { Home, Calendar, Star, Crown, LogOut, ArrowRight, Activity, Flame, TrendingUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Portal() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="app-shell">
      {/* Header Editorial */}
      <header style={{ padding: '3rem 6% 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: 'var(--midnight-accent)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <h1 style={{ fontSize: '2.2rem', fontFamily: 'var(--font-display)', color: 'white' }}>
            Hola, <span style={{ color: 'var(--midnight-accent)' }}>{user?.email?.split('@')[0] || 'Amanda'}</span>
          </h1>
        </div>
        <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--midnight-accent), var(--primary-container))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>
          {user?.email?.[0].toUpperCase() || 'A'}
        </div>
      </header>

      <main style={{ padding: '2rem 6% 120px' }}>
        
        {/* Sección: Próximas Clases (Carousel-like) */}
        <section style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--midnight-on-surface)' }}>Próximas Clases</h2>
            <Link to="/agenda" style={{ color: 'var(--midnight-accent)', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 600 }}>Ver todas</Link>
          </div>
          
          <div style={{ display: 'flex', gap: '1.2rem', overflowX: 'auto', paddingBottom: '1rem', scrollbarWidth: 'none' }}>
            <ClassCard title="Reformer Pilates" time="09:30 AM" instructor="Elena V." color="#FFB4A3" />
            <ClassCard title="Yoga Flow" time="11:00 AM" instructor="Sofía G." color="#76D8C3" />
            <ClassCard title="Fuerza Lab" time="06:00 PM" instructor="Marco R." color="#EFBAAE" />
          </div>
        </section>

        {/* Sección: Tu Progreso (Editorial Grid) */}
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--midnight-on-surface)', marginBottom: '1.5rem' }}>Tu Evolución</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            <div className="midnight-glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'rgba(118, 216, 195, 0.1)', color: '#76D8C3', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Flame size={20} />
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white' }}>1,240</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--midnight-on-surface-variant)' }}>Kcal Quemadas</div>
              </div>
            </div>
            <div className="midnight-glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'rgba(239, 186, 174, 0.1)', color: '#EFBAAE', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={20} />
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white' }}>12</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--midnight-on-surface-variant)' }}>Sesiones Mes</div>
              </div>
            </div>
          </div>
        </section>

        {/* Banner VIP / Upgrade */}
        <section className="midnight-glass-card" style={{ padding: '2rem', background: 'linear-gradient(135deg, rgba(201, 114, 93, 0.2), rgba(0,0,0,0))', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>¿Buscas más?</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--midnight-on-surface-variant)', marginBottom: '1.5rem', maxWidth: '80%' }}>Mejora tu plan a <span style={{color:'white', fontWeight: 700}}>ELITE</span> para sesiones personalizadas de nutrición.</p>
            <button className="midnight-gradient-btn" onClick={() => navigate('/planes')} style={{ padding: '0.8rem 1.5rem', fontSize: '0.85rem' }}>Ver Planes VIP</button>
          </div>
          <Crown size={80} style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.1, color: 'white', transform: 'rotate(-15deg)' }} />
        </section>

        <button onClick={handleLogout} style={{ marginTop: '3rem', width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#FFB4AB', padding: '1rem', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '0.9rem', fontWeight: 600 }}>
          <LogOut size={18} /> Cerrar Sesión
        </button>
      </main>

      {/* Navegación Inferior (App Navigation) */}
      <nav className="bottom-nav">
        <Link to="/portal" className="nav-item active">
          <Home size={24} />
          <span>Home</span>
        </Link>
        <Link to="/agenda" className="nav-item">
          <Calendar size={24} />
          <span>Agenda</span>
        </Link>
        <Link to="/evolucion" className="nav-item">
          <TrendingUp size={24} />
          <span>Evolución</span>
        </Link>
        <Link to="/nutricion" className="nav-item">
          <Star size={24} />
          <span>Nutrición</span>
        </Link>
      </nav>
    </div>
  );
}

function ClassCard({ title, time, instructor, color }) {
  return (
    <div className="midnight-glass-card" style={{ minWidth: '220px', padding: '1.5rem', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', width: '8px', height: '8px', borderRadius: '50%', background: color, boxShadow: `0 0 10px ${color}` }} />
      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--midnight-on-surface-variant)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>{time}</div>
      <h4 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'white' }}>{title}</h4>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--midnight-on-surface-variant)' }}>
        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {instructor[0]}
        </div>
        {instructor}
      </div>
    </div>
  )
}

export default Portal;
