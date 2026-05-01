import React from 'react';
import { ChevronLeft, Activity, Flame, User, Calendar, Utensils, TrendingUp, Award, Target, ChevronRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Evolucion() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="mobile-app-container">
      {/* HEADER TIPO iOS */}
      <header className="ios-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div 
              onClick={() => navigate('/portal')}
              style={{ 
                width: '40px', height: '40px', borderRadius: '12px', 
                background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(10px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(55,61,59,0.05)', cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.8)'
              }}>
              <ChevronLeft size={20} color="var(--primary)" />
            </div>
            <div>
               <h1 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', margin: 0, lineHeight: 1.1 }}>Evolución</h1>
               <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', margin: 0, fontWeight: 600 }}>Logros de {user?.email?.split('@')[0] || 'Amanda'}</p>
            </div>
          </div>
          <div style={{ color: 'var(--primary)', background: 'rgba(255,145,77,0.1)', padding: '10px', borderRadius: '12px' }}>
            <TrendingUp size={22} />
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-sidebar">
          {/* Resumen General */}
          <div className="wallet-card" style={{ padding: '25px 20px', borderRadius: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.2rem' }}>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.4rem' }}>SCORE BEFIT</div>
                <div style={{ fontSize: '3.2rem', fontWeight: 900, color: 'white', fontFamily: 'var(--font-display)', lineHeight: 1 }}>94<span style={{ fontSize: '1rem', opacity: 0.6 }}>/100</span></div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.25)', color: 'white', padding: '6px 12px', borderRadius: '10px', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em' }}> NIVEL PRO</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '16px' }}>
               <Award size={20} color="white" />
               <p style={{ fontSize: '0.85rem', color: 'white', lineHeight: 1.4, margin: 0 }}>
                  Has superado el <span style={{ fontWeight: 800 }}>85% de tus objetivos</span> este mes.
               </p>
            </div>
          </div>

          {/* INSIGNIAS RÁPIDAS */}
          <section style={{ marginTop: '20px' }}>
            <h2 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '12px' }}>Tus Insignias</h2>
            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '10px' }} className="no-scrollbar">
               <BadgeIcon icon="🔥" label="7 Días" color="#FF914D" />
               <BadgeIcon icon="🧘" label="Flow Pro" color="#EEBA89" />
               <BadgeIcon icon="💪" label="Fuerza" color="#373D3B" />
               <BadgeIcon icon="🥗" label="Foodie" color="#76D8C3" />
            </div>
          </section>
        </div>

        <div className="dashboard-content">
          {/* Métricas de Cuerpo */}
          <section>
            <h2 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '15px' }}>Composición Corporal</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
               <MetricBox label="PESO" value="62.4" unit="kg" trend="-0.5" />
               <MetricBox label="GRASA" value="21.8" unit="%" trend="-1.2" />
               <MetricBox label="CADERA" value="94.5" unit="cm" trend="+0.8" highlight />
               <MetricBox label="MÚSCULO" value="32.1" unit="%" trend="+1.5" highlight />
            </div>
          </section>

          {/* Gráfico de Tendencia */}
          <section style={{ marginTop: '25px' }}>
            <div className="ios-glass-card" style={{ padding: '22px' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,145,77,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Target size={18} color="var(--primary)" />
                     </div>
                     <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>Fuerza Semanal</h2>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 800, background: 'rgba(255,145,77,0.08)', padding: '4px 8px', borderRadius: '6px' }}>+12% vs ant.</div>
               </div>
               
               <div style={{ height: '160px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '10px' }}>
                  {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                     <div style={{ 
                        width: '100%', 
                        height: `${h}%`, 
                        background: i === 3 ? 'var(--primary)' : 'rgba(55, 61, 59, 0.05)', 
                        borderRadius: '6px',
                        transition: 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                     }} />
                     <span style={{ fontSize: '0.65rem', fontWeight: 800, color: i === 3 ? 'var(--primary)' : 'var(--on-surface-variant)' }}>
                        {['L', 'M', 'M', 'J', 'V', 'S', 'D'][i]}
                     </span>
                  </div>
                  ))}
               </div>
            </div>
          </section>
        </div>
      </main>

      {/* FLOATING BOTTOM NAV TIPO iPHONE */}
      <nav className="ios-bottom-nav">
        <Link to="/portal" className="nav-item">
          <User size={24} strokeWidth={2.5} />
          <span>Yo</span>
        </Link>
        <Link to="/evolucion" className="nav-item active">
          <TrendingUp size={24} strokeWidth={2.5} />
          <span>Metas</span>
        </Link>
        <Link to="/nutricion" className="nav-item">
          <Utensils size={24} strokeWidth={2.5} />
          <span>Comida</span>
        </Link>
        <Link to="/agenda" className="nav-item">
          <Calendar size={24} strokeWidth={2.5} />
          <span>Clases</span>
        </Link>
      </nav>
    </div>
  );
}

function BadgeIcon({ icon, label, color }) {
   return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
         <div style={{ 
            width: '56px', height: '56px', borderRadius: '18px', 
            background: 'var(--surface)', border: `1px solid ${color}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
         }}>
            {icon}
         </div>
         <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--on-surface-variant)' }}>{label}</span>
      </div>
   );
}

function MetricBox({ label, value, unit, trend, highlight }) {
  return (
    <div className="ios-glass-card" style={{ padding: '18px', border: '1px solid rgba(255,255,255,0.9)' }}>
      <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--on-surface-variant)', marginBottom: '0.8rem', letterSpacing: '0.1em' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '0.8rem' }}>
        <span style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--on-surface)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>{value}</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 700 }}>{unit}</span>
      </div>
      <div style={{ 
         fontSize: '0.7rem', fontWeight: 800, 
         color: trend.startsWith('+') ? (highlight ? 'var(--primary)' : '#22C55E') : 'var(--primary)',
         display: 'flex', alignItems: 'center', gap: '3px'
      }}>
        {trend.startsWith('+') ? '↑' : '↓'} {trend.replace('+', '').replace('-', '')} {unit}
      </div>
    </div>
  );
}

export default Evolucion;
