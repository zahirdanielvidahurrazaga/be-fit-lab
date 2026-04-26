import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';

function Agenda() {
  const [selectedDay, setSelectedDay] = useState('Hoy');

  return (
    <div style={{ backgroundColor: 'var(--surface-low)', minHeight: '100vh', paddingBottom: '3rem' }}>
      {/* Mini Navegación */}
      <nav style={{ padding: '1.5rem 5%', background: 'var(--surface-lowest)', display: 'flex', alignItems: 'center', gap: '1.5rem', borderBottom: '1px solid rgba(89, 88, 86, 0.08)' }}>
        <Link to="/" style={{ color: 'var(--on-surface)', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={24} />
        </Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, letterSpacing: '0.02em', margin: 0, fontFamily: 'var(--font-display)' }}>Agenda tu Entrenamiento</h1>
      </nav>

      <div style={{ maxWidth: '800px', margin: '3rem auto', padding: '0 5%' }}>
        {/* Filtros de día estilo iOS */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--surface)', padding: '0.4rem', borderRadius: 'var(--shape-xl)', marginBottom: '3rem', flexWrap: 'wrap' }}>
          {['Ayer', 'Hoy', 'Mañana', 'Jueves'].map(day => (
            <button 
              key={day}
              onClick={() => setSelectedDay(day)}
              style={{
                flex: 1, padding: '0.8rem', border: 'none', borderRadius: 'var(--shape-xl)', cursor: 'pointer',
                fontWeight: selectedDay === day ? 600 : 500, minWidth: '70px',
                color: selectedDay === day ? 'var(--on-primary)' : 'var(--on-surface-variant)',
                backgroundColor: selectedDay === day ? 'var(--primary)' : 'transparent',
                transition: 'all 0.3s ease'
              }}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Lista de clases */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <ClassCard 
            time="07:00 AM" duration="50 min" title="Flow Mat Wake-up" instructor="Valeria N."
            spots={2} type="Yoga" disabled={false}
          />
          <ClassCard 
            time="09:30 AM" duration="60 min" title="Reformer Avanzado 🍑" instructor="Olga"
            spots={0} type="Pilates" disabled={true}
          />
          <ClassCard 
            time="06:00 PM" duration="50 min" title="Fuerza y Glúteos 101" instructor="Claudia"
            spots={5} type="Fuerza" disabled={false}
          />
        </div>
      </div>
    </div>
  );
}

function ClassCard({ time, duration, title, instructor, spots, type, disabled }) {
  return (
    <div className={`class-card ${disabled ? 'disabled' : ''}`}>
      <div className="class-card-info">
        <div style={{ textAlign: 'center', minWidth: '85px' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--primary)' }}>{time}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <Clock size={12} /> {duration}
          </div>
        </div>
        
        <div style={{ borderLeft: '1px solid #EAE6DF', paddingLeft: '1.5rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--on-surface-variant)', marginBottom: '4px' }}>
            {type}
          </div>
          <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-body)', fontWeight: 600, margin: 0, color: 'var(--on-surface)' }}>{title}</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--on-surface-variant)', margin: '4px 0 0 0' }}>Con {instructor}</p>
        </div>
      </div>

      <div className="class-card-action">
        <button className={disabled ? 'btn-agenda-disabled' : 'btn-primary'} disabled={disabled} style={!disabled ? {padding: '0.8rem 2rem', width: '100%', justifyContent: 'center'} : {}}>
          {disabled ? 'Lleno' : 'Reservar Lugar'}
        </button>
        {!disabled && <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>{spots} cupos libres</span>}
      </div>
    </div>
  );
}

export default Agenda;
