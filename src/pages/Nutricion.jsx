import React from 'react';
import { Home, Calendar, Star, TrendingUp, ChevronLeft, Download, Clock, ChefHat } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

function Nutricion() {
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      {/* Header (Refined) */}
      <header style={{ padding: '3rem 6% 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <button onClick={() => navigate('/portal')} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', width: '45px', height: '45px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}>
            <ChevronLeft size={24} />
          </button>
          <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', color: 'white' }}>Plan Nutrición</h1>
        </div>
        <div style={{ color: 'var(--midnight-accent)' }}>
           <ChefHat size={24} />
        </div>
      </header>

      <main style={{ padding: '2rem 6% 120px' }}>
        
        {/* Plan del Día Banner (Refined Luxury) */}
        <div className="midnight-glass-card" style={{ 
          padding: '2.5rem 2rem', 
          marginBottom: '3rem', 
          background: 'linear-gradient(135deg, rgba(201, 114, 93, 0.15) 0%, rgba(19, 19, 19, 0) 100%)', 
          borderLeft: '4px solid var(--midnight-accent)' 
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--midnight-accent)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.6rem' }}>OBJETIVO DIARIO</div>
          <h2 style={{ fontSize: '1.8rem', color: 'white', marginBottom: '2rem', fontFamily: 'var(--font-display)' }}>Recomposición Pro</h2>
          <div style={{ display: 'flex', gap: '2rem' }}>
             <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>1,850</div>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: 800, letterSpacing: '0.05em', marginTop: '4px' }}>KCAL</div>
             </div>
             <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>130g</div>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: 800, letterSpacing: '0.05em', marginTop: '4px' }}>PROT</div>
             </div>
             <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>180g</div>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: 800, letterSpacing: '0.05em', marginTop: '4px' }}>CARB</div>
             </div>
          </div>
        </div>

        {/* Lista de Comidas */}
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--midnight-on-surface)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>Menú Recomendado</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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

      {/* Navegación Inferior (Consistent) */}
      <nav className="bottom-nav">
        <Link to="/portal" className="nav-item">
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
        <Link to="/nutricion" className="nav-item active">
          <Star size={22} />
          <span>PLAN</span>
        </Link>
      </nav>
    </div>
  );
}

function MealItem({ time, title, kcal, img }) {
  return (
    <div className="midnight-glass-card" style={{ padding: '1.2rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
      <div style={{ width: '90px', height: '90px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 8px 20px rgba(0,0,0,0.3)' }}>
        <img src={img} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--midnight-accent)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>{time}</div>
        <h3 style={{ fontSize: '1.1rem', color: 'white', marginBottom: '0.6rem', fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>{title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Flame size={14} color="var(--midnight-accent)" /> {kcal} kcal
           </div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Clock size={14} /> 15 min
           </div>
        </div>
      </div>
      <button style={{ background: 'rgba(255,255,255,0.03)', border: 'none', width: '45px', height: '45px', borderRadius: '15px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ChevronLeft size={20} style={{ transform: 'rotate(180deg)', opacity: 0.5 }} />
      </button>
    </div>
  );
}

export default Nutricion;
