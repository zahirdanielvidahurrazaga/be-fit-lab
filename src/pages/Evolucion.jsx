import React from 'react';
import { Home, Calendar, Star, TrendingUp, ChevronLeft, Activity, Flame, Target, Play } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

function Evolucion() {
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      {/* Header (Refined) */}
      <header style={{ padding: '3rem 6% 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <button onClick={() => navigate('/portal')} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', width: '45px', height: '45px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}>
            <ChevronLeft size={24} />
          </button>
          <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', color: 'white' }}>Métricas</h1>
        </div>
        <div style={{ color: 'var(--midnight-accent)' }}>
           <Activity size={24} />
        </div>
      </header>

      <main style={{ padding: '2rem 6% 120px' }}>
        
        {/* Resumen General (Refined) */}
        <div className="midnight-glass-card" style={{ 
          padding: '2.5rem 2rem', 
          marginBottom: '3rem', 
          background: 'linear-gradient(135deg, rgba(118, 216, 195, 0.15) 0%, rgba(19, 19, 19, 0) 100%)',
          borderLeft: '4px solid #76D8C3'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#76D8C3', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.5rem' }}>Puntuación Lab</div>
              <div style={{ fontSize: '3rem', fontWeight: 900, color: 'white', fontFamily: 'var(--font-display)', lineHeight: 1 }}>94<span style={{ fontSize: '1rem', opacity: 0.4 }}>/100</span></div>
            </div>
            <div style={{ background: 'rgba(118, 216, 195, 0.1)', color: '#76D8C3', padding: '6px 14px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em' }}>NIVEL PRO</div>
          </div>
          <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>Has superado el <span style={{ color: 'white', fontWeight: 700 }}>85% de tus objetivos</span>. Tu enfoque en fuerza es impecable.</p>
        </div>

        {/* Métricas de Cuerpo */}
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--midnight-on-surface)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>Composición Corporal</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '3.5rem' }}>
           <MetricBox label="PESO" value="62.4" unit="kg" trend="-0.5" />
           <MetricBox label="CINTURA" value="68.2" unit="cm" trend="-1.2" />
           <MetricBox label="CADERA" value="94.5" unit="cm" trend="+0.8" highlight />
           <MetricBox label="MÚSCULO" value="32.1" unit="%" trend="+1.5" highlight />
        </div>

        {/* Gráfico de Tendencia (Refined) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--midnight-on-surface)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Actividad Semanal</h2>
          <div style={{ fontSize: '0.75rem', color: 'var(--midnight-accent)', fontWeight: 700 }}>+12% vs sem. pasada</div>
        </div>
        <div className="midnight-glass-card" style={{ padding: '2.5rem 2rem', height: '240px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px' }}>
           {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
             <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  width: '100%', 
                  height: `${h}%`, 
                  background: i === 3 ? 'var(--midnight-accent)' : 'rgba(255,255,255,0.05)', 
                  borderRadius: '8px',
                  boxShadow: i === 3 ? '0 8px 16px rgba(255, 180, 163, 0.2)' : 'none',
                  transition: 'all 0.3s ease'
                }} />
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: i === 3 ? 'white' : 'rgba(255,255,255,0.2)' }}>
                  {['L', 'M', 'M', 'J', 'V', 'S', 'D'][i]}
                </span>
             </div>
           ))}
        </div>

      </main>

      {/* Navegación Inferior (Luxury Pill) */}
      <nav className="bottom-nav">
        <Link to="/portal" className="nav-item">
          <Home size={22} />
          <span>PORTAL</span>
        </Link>
        <Link to="/agenda" className="nav-item">
          <Calendar size={22} />
          <span>AGENDA</span>
        </Link>
        
        <button className="nav-central-btn" onClick={() => navigate('/agenda')}>
           <Play size={24} fill="currentColor" />
        </button>

        <Link to="/evolucion" className="nav-item active">
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
}

function MetricBox({ label, value, unit, trend, highlight }) {
  return (
    <div className="midnight-glass-card" style={{ padding: '1.5rem', border: highlight ? '1px solid rgba(118, 216, 195, 0.1)' : '1px solid rgba(255,255,255,0.03)' }}>
      <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', marginBottom: '0.8rem', letterSpacing: '0.1em' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '0.8rem' }}>
        <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'white', fontFamily: 'var(--font-display)' }}>{value}</span>
        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>{unit}</span>
      </div>
      <div style={{ fontSize: '0.7rem', fontWeight: 800, color: trend.startsWith('+') ? (highlight ? '#76D8C3' : '#FFB4AB') : '#76D8C3' }}>
        {trend.startsWith('+') ? '↑' : '↓'} {trend.replace('+', '').replace('-', '')} {unit}
      </div>
    </div>
  );
}

export default Evolucion;
