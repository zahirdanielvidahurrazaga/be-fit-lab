import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar as CalendarIcon, Home, Star, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';

function Agenda() {
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      day: d.getDate(),
      name: d.toLocaleDateString('es-MX', { weekday: 'short' }).charAt(0).toUpperCase(),
      date: d
    };
  });

  return (
    <div className="app-shell">
      {/* Header Fijo de Pantalla */}
      <header style={{ padding: '2rem 6% 1rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <button onClick={() => navigate('/portal')} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', width: '45px', height: '45px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}>
          <ChevronLeft size={24} />
        </button>
        <h1 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', color: 'white' }}>Agenda</h1>
      </header>

      <main style={{ padding: '1rem 0 120px' }}>
        {/* Selector de Fecha (Calendar Strip) */}
        <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', padding: '0 6% 2rem', scrollbarWidth: 'none' }}>
          {days.map((d) => (
            <button 
              key={d.day}
              onClick={() => setSelectedDay(d.day)}
              style={{
                minWidth: '65px', height: '90px', borderRadius: '20px', border: 'none',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
                background: selectedDay === d.day ? 'var(--midnight-accent)' : 'var(--midnight-surface-high)',
                color: selectedDay === d.day ? 'var(--on-primary)' : 'white',
                cursor: 'pointer', transition: 'all 0.3s ease'
              }}
            >
              <span style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.8 }}>{d.name}</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 800 }}>{d.day}</span>
            </button>
          ))}
        </div>

        {/* Lista de Clases del Día */}
        <div style={{ padding: '0 6%', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
           <ClassItem time="07:00 AM" title="Pilates Reformer" instructor="Valeria N." level="Avanzado" spots={2} color="#FFB4A3" />
           <ClassItem time="09:30 AM" title="Yoga Flow" instructor="Olga M." level="Intermedio" spots={0} color="#76D8C3" full />
           <ClassItem time="05:00 PM" title="Fuerza Lab" instructor="Claudia S." level="Todos los niveles" spots={5} color="#EFBAAE" />
           <ClassItem time="06:30 PM" title="Cardio Baile" instructor="Marco R." level="Principiante" spots={8} color="#D17963" />
        </div>
      </main>

      {/* Navegación Inferior */}
      <nav className="bottom-nav">
        <Link to="/portal" className="nav-item">
          <Home size={24} />
          <span>Home</span>
        </Link>
        <Link to="/agenda" className="nav-item active">
          <CalendarIcon size={24} />
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

function ClassItem({ time, title, instructor, level, spots, color, full }) {
  return (
    <div className="midnight-glass-card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: full ? 0.6 : 1 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--midnight-on-surface-variant)', textTransform: 'uppercase' }}>{time} • {level}</span>
        </div>
        <h3 style={{ fontSize: '1.2rem', color: 'white', marginBottom: '0.2rem' }}>{title}</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--midnight-on-surface-variant)' }}>Con {instructor}</p>
      </div>
      
      <div style={{ textAlign: 'right' }}>
        <button 
          className={full ? 'glass-button-dark' : 'midnight-gradient-btn'} 
          disabled={full}
          style={{ padding: '0.6rem 1.2rem', fontSize: '0.8rem' }}
        >
          {full ? 'Lleno' : 'Reservar'}
        </button>
        {!full && <div style={{ fontSize: '0.7rem', color: 'var(--midnight-accent)', marginTop: '5px', fontWeight: 700 }}>{spots} cupos</div>}
      </div>
    </div>
  );
}

export default Agenda;
