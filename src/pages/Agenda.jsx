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
      {/* Header Fijo de Pantalla (Refined) */}
      <header style={{ padding: '3rem 6% 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <button onClick={() => navigate('/portal')} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', width: '45px', height: '45px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}>
            <ChevronLeft size={24} />
          </button>
          <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', color: 'white' }}>Agenda</h1>
        </div>
        <div style={{ color: 'var(--midnight-accent)' }}>
           <CalendarIcon size={24} />
        </div>
      </header>

      <main style={{ padding: '2rem 0 120px' }}>
        {/* Selector de Fecha (Refined Calendar Strip) */}
        <div style={{ display: 'flex', gap: '0.8rem', overflowX: 'auto', padding: '0 6% 2.5rem', scrollbarWidth: 'none' }}>
          {days.map((d) => (
            <button 
              key={d.day}
              onClick={() => setSelectedDay(d.day)}
              style={{
                minWidth: '60px', height: '85px', borderRadius: '22px', border: 'none',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px',
                background: selectedDay === d.day ? 'var(--midnight-accent)' : 'var(--midnight-surface-high)',
                color: selectedDay === d.day ? 'var(--on-primary)' : 'rgba(255,255,255,0.4)',
                cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: selectedDay === d.day ? '0 10px 20px rgba(255, 180, 163, 0.2)' : 'none',
                transform: selectedDay === d.day ? 'scale(1.05)' : 'scale(1)'
              }}
            >
              <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em' }}>{d.name}</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 900 }}>{d.day}</span>
            </button>
          ))}
        </div>

        {/* Lista de Clases del Día */}
        <div style={{ padding: '0 6%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
           <ClassItem time="07:00 AM" title="Pilates Reformer" instructor="Valeria N." level="AVANZADO" spots={2} color="#FFB4A3" />
           <ClassItem time="09:30 AM" title="Yoga Flow" instructor="Olga M." level="INTERMEDIO" spots={0} color="#76D8C3" full />
           <ClassItem time="05:00 PM" title="Fuerza Lab" instructor="Claudia S." level="GENERAL" spots={5} color="#EFBAAE" />
           <ClassItem time="06:30 PM" title="Cardio Baile" instructor="Marco R." level="PRINCIPIANTE" spots={8} color="#D17963" />
        </div>
      </main>

      {/* Navegación Inferior (Consistent) */}
      <nav className="bottom-nav">
        <Link to="/portal" className="nav-item">
          <Home size={22} />
          <span>PORTAL</span>
        </Link>
        <Link to="/agenda" className="nav-item active">
          <CalendarIcon size={22} />
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
}

function ClassItem({ time, title, instructor, level, spots, color, full }) {
  return (
    <div className="midnight-glass-card" style={{ 
      padding: '1.5rem', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      opacity: full ? 0.4 : 1,
      borderLeft: `4px solid ${color}`
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.6rem' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--midnight-on-surface-variant)', letterSpacing: '0.15em' }}>{time} • {level}</span>
        </div>
        <h3 style={{ fontSize: '1.3rem', color: 'white', marginBottom: '0.3rem', fontFamily: 'var(--font-display)' }}>{title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
           <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: 'white' }}>
             {instructor[0]}
           </div>
           {instructor}
        </div>
      </div>
      
      <div style={{ textAlign: 'right' }}>
        <button 
          className={full ? 'glass-button-dark' : 'midnight-gradient-btn'} 
          disabled={full}
          style={{ padding: '0.7rem 1.4rem', fontSize: '0.75rem', fontWeight: 800 }}
        >
          {full ? 'LLENO' : 'RESERVAR'}
        </button>
        {!full && <div style={{ fontSize: '0.65rem', color: color, marginTop: '8px', fontWeight: 800, letterSpacing: '0.05em' }}>{spots} DISPONIBLES</div>}
      </div>
    </div>
  );
}

export default Agenda;
