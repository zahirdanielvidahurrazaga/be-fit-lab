import React from 'react';
import { Home, Calendar, Star, TrendingUp, ChevronLeft, Activity, Flame, Target } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

function Evolucion() {
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      {/* Header */}
      <header style={{ padding: '2rem 6% 1rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <button onClick={() => navigate('/portal')} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', width: '45px', height: '45px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}>
          <ChevronLeft size={24} />
        </button>
        <h1 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', color: 'white' }}>Mi Evolución</h1>
      </header>

      <main style={{ padding: '2rem 6% 120px' }}>
        
        {/* Resumen General */}
        <div className="midnight-glass-card" style={{ padding: '2rem', marginBottom: '2.5rem', background: 'linear-gradient(135deg, rgba(118, 216, 195, 0.1), transparent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--midnight-accent)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Puntuación Lab</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white' }}>94/100</div>
            </div>
            <div style={{ background: 'var(--midnight-accent)', color: 'var(--on-primary)', padding: '4px 12px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700 }}>Nivel Pro</div>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--midnight-on-surface-variant)' }}>Has superado el 85% de tus objetivos mensuales. Tu enfoque en el tren inferior es impecable.</p>
        </div>

        {/* Métricas de Cuerpo */}
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--midnight-on-surface)', marginBottom: '1.5rem' }}>Medidas y Composición</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '3rem' }}>
           <MetricBox label="Peso" value="62.4" unit="kg" trend="-0.5" />
           <MetricBox label="Cintura" value="68.2" unit="cm" trend="-1.2" />
           <MetricBox label="Cadera" value="94.5" unit="cm" trend="+0.8" highlight />
           <MetricBox label="Músculo" value="32.1" unit="%" trend="+1.5" highlight />
        </div>

        {/* Gráfico de Tendencia */}
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--midnight-on-surface)', marginBottom: '1.5rem' }}>Actividad Semanal</h2>
        <div className="midnight-glass-card" style={{ padding: '2rem', height: '220px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px' }}>
           {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
             <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '100%', height: `${h}%`, background: i === 3 ? 'var(--midnight-accent)' : 'rgba(255,255,255,0.1)', borderRadius: '6px' }} />
                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--midnight-on-surface-variant)' }}>
                  {['L', 'M', 'M', 'J', 'V', 'S', 'D'][i]}
                </span>
             </div>
           ))}
        </div>

      </main>

      {/* Navegación Inferior */}
      <nav className="bottom-nav">
        <Link to="/portal" className="nav-item">
          <Home size={24} />
          <span>Home</span>
        </Link>
        <Link to="/agenda" className="nav-item">
          <Calendar size={24} />
          <span>Agenda</span>
        </Link>
        <Link to="/evolucion" className="nav-item active">
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

function MetricBox({ label, value, unit, trend, highlight }) {
  return (
    <div className="midnight-glass-card" style={{ padding: '1.2rem' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--midnight-on-surface-variant)', marginBottom: '0.5rem' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white' }}>{value}</span>
        <span style={{ fontSize: '0.8rem', color: 'var(--midnight-on-surface-variant)' }}>{unit}</span>
      </div>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: trend.startsWith('+') ? (highlight ? '#76D8C3' : '#FFB4AB') : '#76D8C3' }}>
        {trend} {trend.startsWith('+') ? '↑' : '↓'} este mes
      </div>
    </div>
  );
}

export default Evolucion;
