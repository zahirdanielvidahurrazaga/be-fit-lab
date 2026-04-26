import React from 'react';
import { Target, TrendingUp, Trophy, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

function Evolucion() {
  return (
    <div style={{ backgroundColor: '#FDFBF7', minHeight: '100vh', padding: '3rem 5% 4rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* Botón Volver Súper Elegante */}
        <Link to="/" className="back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--on-surface-variant)', textDecoration: 'none', fontWeight: 500, marginBottom: '2.5rem', fontSize: '0.95rem' }}>
          <ArrowLeft size={18} /> Volver al inicio
        </Link>

        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="badge-peach" style={{ marginBottom: '1rem' }}>Progreso Físico</div>
            <h1 style={{ fontSize: 'clamp(2rem, 5vw, 2.8rem)', margin: 0, fontFamily: 'var(--font-display)' }}>Tu Evolución BEFIT</h1>
          </div>
          <div style={{ background: 'var(--primary)', color: 'white', padding: '0.8rem 1.5rem', borderRadius: 'var(--shape-xl)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
            <Trophy size={20} /> Nivel: Elite
          </div>
        </div>

        {/* Dashboard de métricas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
          <MetricCard icon={<Target color="var(--primary)" size={24} />} title="Clases Completadas" data="24" subtitle="¡Súper constante!" />
          <MetricCard icon={<TrendingUp color="var(--primary)" size={24} />} title="Racha Actual" data="8 Días" subtitle="Asistencia ininterrumpida" highlight />
          <MetricCard icon={<span style={{fontSize:'24px'}}>🍑</span>} title="Foco Muscular" data="Glúteo + Pierna" subtitle="Según tus últimas reservas" />
        </div>

        {/* Visualizer (Sección de gráfico simulado) */}
        <div style={{
          background: 'var(--surface-lowest)', borderRadius: 'var(--shape-xl)', padding: 'clamp(1.5rem, 4vw, 3rem)',
          border: '1px solid rgba(89,88,86,0.05)'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem', fontFamily: 'var(--font-display)' }}>Pesos y Medidas de Reto</h2>
          <div style={{ height: '300px', display: 'flex', alignItems: 'flex-end', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px dashed var(--surface-low)', position: 'relative', overflowX: 'auto' }}>
            {/* Simulación gráfica estética */}
            {[50, 60, 55, 75, 80, 95].map((val, i) => (
              <div key={i} style={{ flex: 1, minWidth: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '100%', maxWidth: '50px', height: `${val}%`, background: i === 5 ? 'var(--primary)' : 'var(--surface-low)',
                  borderRadius: '10px 10px 0 0', transition: 'all 0.5s ease', cursor: 'pointer'
                }}></div>
                <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>Mes {i+1}</div>
              </div>
            ))}
          </div>
          <p style={{ marginTop: '2rem', color: 'var(--on-surface-variant)', textAlign: 'center', fontSize: '0.95rem' }}>
            Un progreso verdaderamente orgánico enfocado en el crecimiento muscular sostenido, no en la báscula.
          </p>
        </div>

      </div>
    </div>
  );
}

function MetricCard({ icon, title, data, subtitle, highlight }) {
  return (
    <div style={{
      background: highlight ? 'var(--surface-low)' : 'var(--surface-lowest)',
      padding: '2rem', borderRadius: 'var(--shape-lg)',
      border: highlight ? '1px solid rgba(201, 114, 93, 0.2)' : '1px solid rgba(89,88,86,0.05)'
    }}>
      <div style={{ marginBottom: '1.5rem' }}>{icon}</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</div>
      <div style={{ fontSize: '2.5rem', fontWeight: 600, color: 'var(--on-surface)', marginBottom: '0.5rem' }}>{data}</div>
      <div style={{ fontSize: '0.85rem', color: highlight ? 'var(--primary)' : 'var(--on-surface-variant)' }}>{subtitle}</div>
    </div>
  );
}

export default Evolucion;
