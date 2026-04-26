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
      {/* Hero Profile Header (Ultra Luxury) */}
      <div style={{
        height: '240px',
        background: 'linear-gradient(to bottom, rgba(19, 19, 19, 0) 0%, rgba(19, 19, 19, 1) 100%), url("/hero_bg.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center 20%',
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-end',
        padding: '0 6% 40px'
      }}>
        {/* Floating Avatar Overlay */}
        <div style={{
          position: 'absolute',
          bottom: '-30px',
          left: '6%',
          zIndex: 10
        }}>
          <div style={{
            width: '90px',
            height: '90px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, var(--midnight-accent), var(--primary-container))',
            border: '4px solid var(--midnight-bg)',
            boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            fontWeight: 800,
            color: 'white',
            fontFamily: 'var(--font-display)'
          }}>
            {user?.email?.[0].toUpperCase() || 'A'}
          </div>
          <div style={{
            position: 'absolute',
            bottom: '-5px',
            right: '-5px',
            background: '#76D8C3',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            border: '3px solid var(--midnight-bg)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
          }} />
        </div>

        <div style={{ zIndex: 2 }}>
           <div style={{ color: 'var(--midnight-accent)', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
             Membresía Elite
           </div>
           <h1 style={{ fontSize: '2.4rem', fontFamily: 'var(--font-display)', color: 'white', lineHeight: 1 }}>
             {user?.email?.split('@')[0] || 'Amanda'}
           </h1>
        </div>
      </div>

      <main style={{ padding: '60px 6% 120px' }}>
        
        {/* Atajos Rápidos (Nuevos) */}
        <section style={{ marginBottom: '3rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
           <div className="midnight-glass-card" style={{ padding: '1.2rem', display: 'flex', alignItems: 'center', gap: '12px' }} onClick={() => navigate('/agenda')}>
              <div style={{ color: 'var(--midnight-accent)' }}><Calendar size={20} /></div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Mi Agenda</span>
           </div>
           <div className="midnight-glass-card" style={{ padding: '1.2rem', display: 'flex', alignItems: 'center', gap: '12px' }} onClick={() => navigate('/nutricion')}>
              <div style={{ color: 'var(--midnight-accent)' }}><Star size={20} /></div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Nutrición</span>
           </div>
        </section>

        {/* Sección: Próximas Clases */}
        <section style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--midnight-on-surface)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Próximas Clases</h2>
            <Link to="/agenda" style={{ color: 'var(--midnight-accent)', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 700 }}>VER TODAS</Link>
          </div>
          
          <div style={{ display: 'flex', gap: '1.2rem', overflowX: 'auto', paddingBottom: '1rem', scrollbarWidth: 'none' }}>
            <ClassCard title="Reformer Pilates" time="09:30 AM" instructor="Elena V." color="#FFB4A3" />
            <ClassCard title="Yoga Flow" time="11:00 AM" instructor="Sofía G." color="#76D8C3" />
            <ClassCard title="Fuerza Lab" time="06:00 PM" instructor="Marco R." color="#EFBAAE" />
          </div>
        </section>

        {/* Sección: Tu Progreso */}
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--midnight-on-surface)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>Estadísticas Vitales</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            <div className="midnight-glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '3px solid #76D8C3' }}>
              <div style={{ color: '#76D8C3' }}><Flame size={20} /></div>
              <div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white' }}>1.2k</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--midnight-on-surface-variant)', fontWeight: 700, textTransform: 'uppercase' }}>Calorías</div>
              </div>
            </div>
            <div className="midnight-glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '3px solid #EFBAAE' }}>
              <div style={{ color: '#EFBAAE' }}><Activity size={20} /></div>
              <div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white' }}>12</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--midnight-on-surface-variant)', fontWeight: 700, textTransform: 'uppercase' }}>Sesiones</div>
              </div>
            </div>
          </div>
        </section>

        {/* Banner Elite Luxury */}
        <section className="midnight-glass-card" style={{ 
          padding: '2.5rem 2rem', 
          background: 'linear-gradient(225deg, rgba(201, 114, 93, 0.2) 0%, rgba(19, 19, 19, 1) 100%)', 
          position: 'relative', 
          overflow: 'hidden',
          border: '1px solid rgba(255,180,163,0.1)'
        }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', marginBottom: '0.5rem', color: 'white' }}>Upgrade a ELITE</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--midnight-on-surface-variant)', marginBottom: '2rem', maxWidth: '85%', lineHeight: 1.5 }}>Libera el acceso total a nutrición clínica y sesiones 1 a 1.</p>
            <button className="midnight-gradient-btn" onClick={() => navigate('/planes')} style={{ padding: '1rem 2rem', fontSize: '0.9rem' }}>MEJORAR MI PLAN</button>
          </div>
          <Crown size={120} style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.05, color: 'white', transform: 'rotate(-10deg)' }} />
        </section>

        <button onClick={handleLogout} style={{ marginTop: '4rem', width: '100%', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', padding: '1rem', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em' }}>
          CERRAR SESIÓN DE SEGURIDAD
        </button>
      </main>

      {/* Navegación Inferior (App Navigation) */}
      <nav className="bottom-nav">
        <Link to="/portal" className="nav-item active">
          <Home size={22} />
          <span>PORTAL</span>
        </Link>
        <Link to="/agenda" className="nav-item">
          <Calendar size={22} />
          <span>AGENDA</span>
        </Link>
        <Link to="/evolucion" className="nav-item">
          <TrendingUp size={22} />
          <span>MÉTRICAS</span>
        </Link>
        <Link to="/nutricion" className="nav-item">
          <Star size={22} />
          <span>PLAN</span>
        </Link>
      </nav>
    </div>
  );
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
