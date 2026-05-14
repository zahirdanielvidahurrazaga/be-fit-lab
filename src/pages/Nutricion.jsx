import React, { useState } from 'react';
import { ChevronLeft, ChefHat, Flame, Clock, User, Calendar, Utensils, TrendingUp, CheckCircle2, Droplets, Play } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Nutricion() {
  const navigate = useNavigate();
  const { user, recipes } = useAuth();
  const [showRecipe, setShowRecipe] = useState(false);
  const [recipeData, setRecipeData] = useState(null);

  const handleMealClick = (meal) => {
    setRecipeData(meal);
    setShowRecipe(true);
  };

  // Usamos las recetas globales que vienen de Supabase
  const meals = recipes || [];

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
               <h1 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', margin: 0, lineHeight: 1.1 }}>Nutrición</h1>
               <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', margin: 0, fontWeight: 600 }}>Plan de {user?.email?.split('@')[0] || 'Amanda'}</p>
            </div>
          </div>
          <div style={{ color: 'var(--primary)', background: 'rgba(255,145,77,0.1)', padding: '10px', borderRadius: '12px' }}>
             <ChefHat size={22} />
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-sidebar">
          {/* Plan del Día Banner con Imagen */}
          <div className="wallet-card" style={{ 
            padding: '25px 20px', borderRadius: '28px', 
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.8)), url("/assets/nutricion_lifestyle.png")',
            backgroundSize: 'cover', backgroundPosition: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)', border: 'none'
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.6rem' }}>OBJETIVO DIARIO</div>
            <h2 style={{ fontSize: '2rem', color: 'white', marginBottom: '2rem', fontFamily: 'var(--font-display)', lineHeight: 1.1 }}>Recomposición <span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>Elite</span></h2>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', padding: '15px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.2)' }}>
               <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>1,850</div>
                  <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', fontWeight: 800, letterSpacing: '0.05em', marginTop: '4px' }}>KCAL</div>
               </div>
               <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)' }}></div>
               <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>130g</div>
                  <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', fontWeight: 800, letterSpacing: '0.05em', marginTop: '4px' }}>PROT</div>
               </div>
               <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)' }}></div>
               <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>180g</div>
                  <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', fontWeight: 800, letterSpacing: '0.05em', marginTop: '4px' }}>CARB</div>
               </div>
            </div>
          </div>

          {/* HIDRATACIÓN */}
          <div className="ios-glass-card" style={{ padding: '15px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(0,122,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#007AFF' }}>
                <Droplets size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Hidratación</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>Meta: 2.5L hoy</div>
              </div>
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--on-surface)' }}>1.8L</div>
          </div>
        </div>

        <div className="dashboard-content">
          {/* Lista de Comidas */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
               <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Menú Recomendado</h2>
               <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>Viernes, 01 Mayo</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
               {meals.map(meal => (
                 <MealItem 
                   key={meal.id}
                   time={meal.time} 
                   title={meal.title} 
                   kcal={meal.kcal} 
                   img={meal.img}
                   timePrep={meal.timePrep}
                   onClick={() => handleMealClick(meal)}
                 />
               ))}
            </div>
          </section>
        </div>
      </main>

      {/* DRAWER DE RECETA INTEGRADO */}
      {showRecipe && (
        <div className="modal-overlay" onClick={() => setShowRecipe(false)}>
          <div className="modal-drawer" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: '30px' }}>
            <div className="modal-close-pill"></div>
            
            <div style={{ height: '220px', borderRadius: '24px', overflow: 'hidden', marginBottom: '20px', position: 'relative' }}>
              <img src={recipeData?.img} alt="Recipe" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', bottom: '15px', right: '15px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', padding: '8px 15px', borderRadius: '14px', fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                {recipeData?.kcal} kcal
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
               <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{recipeData?.time}</div>
               <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(0,0,0,0.2)' }}></div>
               <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)' }}>{recipeData?.timePrep} preparación</div>
            </div>
            
            <h2 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', marginBottom: '20px', lineHeight: 1.1 }}>{recipeData?.title}</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
               <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <Utensils size={16} color="var(--primary)" /> Ingredientes
                  </h4>
                  <ul style={{ paddingLeft: '0', listStyle: 'none', color: 'var(--on-surface-variant)', fontSize: '0.85rem', lineHeight: 1.8 }}>
                    {recipeData?.ingredients.map((ing, i) => (
                      <li key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                        <div style={{ marginTop: '6px', width: '4px', height: '4px', borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }}></div>
                        {ing}
                      </li>
                    ))}
                  </ul>
               </div>
               <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <Play size={16} color="var(--primary)" /> Pasos
                  </h4>
                  <ol style={{ paddingLeft: '0', listStyle: 'none', color: 'var(--on-surface-variant)', fontSize: '0.85rem', lineHeight: 1.7 }}>
                    {recipeData?.steps.map((step, i) => (
                      <li key={i} style={{ marginBottom: '10px' }}>
                        <span style={{ fontWeight: 800, color: 'var(--on-surface)', marginRight: '5px' }}>{i+1}.</span> {step}
                      </li>
                    ))}
                  </ol>
               </div>
            </div>

            <button onClick={() => setShowRecipe(false)} className="glass-button-dark" style={{ width: '100%', justifyContent: 'center' }}>Volver al Menú</button>
          </div>
        </div>
      )}

      {/* FLOATING BOTTOM NAV TIPO iPHONE */}
      <nav className="ios-bottom-nav">
        <Link to="/portal" className="nav-item">
          <User size={24} strokeWidth={2.5} />
          <span>Yo</span>
        </Link>
        <Link to="/evolucion" className="nav-item">
          <TrendingUp size={24} strokeWidth={2.5} />
          <span>Metas</span>
        </Link>
        <Link to="/nutricion" className="nav-item active">
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

function MealItem({ time, title, kcal, img, timePrep, onClick }) {
  return (
    <div 
      onClick={onClick}
      style={{ 
        padding: '14px', display: 'flex', gap: '1.2rem', alignItems: 'center', cursor: 'pointer', 
        background: 'white', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.03)',
        border: '1px solid rgba(0,0,0,0.02)', transition: 'transform 0.2s ease, box-shadow 0.2s ease'
      }}
      onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 15px 35px rgba(0,0,0,0.06)'; }}
      onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.03)'; }}
    >
      <div style={{ width: '85px', height: '85px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 20px rgba(0,0,0,0.1)', flexShrink: 0 }}>
        <img src={img} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>{time}</div>
        <h3 style={{ fontSize: '1.05rem', color: 'var(--black)', marginBottom: '0.5rem', fontFamily: 'var(--font-display)', lineHeight: 1.2, fontWeight: 800 }}>{title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 700 }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Flame size={14} color="var(--primary)" /> {kcal} kcal
           </div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={14} /> {timePrep}
           </div>
        </div>
      </div>
      <div style={{ background: 'rgba(255,145,77,0.08)', color: 'var(--primary)', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ChevronLeft size={18} style={{ transform: 'rotate(180deg)' }} />
      </div>
    </div>
  );
}

export default Nutricion;
