import React from 'react';
import { Home, Calendar, Star, TrendingUp, ChevronLeft, Download, Clock, ChefHat } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

function Nutricion() {
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      {/* Header */}
      <header style={{ padding: '2rem 6% 1rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <button onClick={() => navigate('/portal')} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', width: '45px', height: '45px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}>
          <ChevronLeft size={24} />
        </button>
        <h1 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', color: 'white' }}>Nutrición</h1>
      </header>

      <main style={{ padding: '2rem 6% 120px' }}>
        
        {/* Plan del Día Banner */}
        <div className="midnight-glass-card" style={{ padding: '2rem', marginBottom: '2.5rem', background: 'linear-gradient(135deg, rgba(201, 114, 93, 0.1), transparent)', borderLeft: '4px solid var(--midnight-accent)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--midnight-accent)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Objetivo Diario</div>
          <h2 style={{ fontSize: '1.5rem', color: 'white', marginBottom: '1rem' }}>Recomposición Corporal</h2>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
             <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white' }}>1,850</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--midnight-on-surface-variant)', textTransform: 'uppercase' }}>Kcal</div>
             </div>
             <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white' }}>130g</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--midnight-on-surface-variant)', textTransform: 'uppercase' }}>Prot</div>
             </div>
             <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white' }}>180g</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--midnight-on-surface-variant)', textTransform: 'uppercase' }}>Carb</div>
             </div>
          </div>
        </div>

        {/* Lista de Comidas */}
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--midnight-on-surface)', marginBottom: '1.5rem' }}>Tu Menú de Hoy</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
           <MealItem 
             time="Desayuno" 
             title="Tostadas de Aguacate y Huevo" 
             kcal="350" 
             img="https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=80&w=200&h=200"
           />
           <MealItem 
             time="Almuerzo" 
             title="Salmón con Quinoa y Espárragos" 
             kcal="580" 
             img="https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=80&w=200&h=200"
           />
           <MealItem 
             time="Cena" 
             title="Bowl de Pollo y Verduras" 
             kcal="420" 
             img="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200&h=200"
           />
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
        <Link to="/evolucion" className="nav-item">
          <TrendingUp size={24} />
          <span>Evolución</span>
        </Link>
        <Link to="/nutricion" className="nav-item active">
          <Star size={24} />
          <span>Nutrición</span>
        </Link>
      </nav>
    </div>
  );
}

function MealItem({ time, title, kcal, img }) {
  return (
    <div className="midnight-glass-card" style={{ padding: '1rem', display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
      <div style={{ width: '80px', height: '80px', borderRadius: '15px', overflow: 'hidden' }}>
        <img src={img} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--midnight-accent)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>{time}</div>
        <h3 style={{ fontSize: '1rem', color: 'white', marginBottom: '0.4rem' }}>{title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem', color: 'var(--midnight-on-surface-variant)' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Flame size={14} /> {kcal} kcal
           </div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={14} /> 15 min
           </div>
        </div>
      </div>
      <button style={{ background: 'rgba(255,255,255,0.05)', border: 'none', width: '40px', height: '40px', borderRadius: '12px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ChevronLeft size={20} style={{ transform: 'rotate(180deg)' }} />
      </button>
    </div>
  );
}

export default Nutricion;
