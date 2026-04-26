import React, { useState } from 'react';
import { ArrowRight, Flame, Heart, PlayCircle, Smartphone, Menu, X, Calendar, TrendingUp, Utensils } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Landing() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleNavClick = (e, path, sectionId) => {
    if (user) {
      navigate(path);
    } else {
      e.preventDefault();
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      setIsMenuOpen(false);
    }
  };

  // Previene el scroll del body cuando el menú móvil está abierto
  if (isMenuOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = 'unset';
  }

  return (
    <div className="app-container">
      {/* Navigation VIP */}
      <nav className={`glass-nav ${isMenuOpen ? 'nav-open-mobile' : ''}`}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 600, letterSpacing: '0.05em', zIndex: 1001, position: 'relative' }}>
          BEFIT <span style={{ color: 'var(--primary)' }}>LAB</span>
        </div>
        
        {/* Desktop Links */}
        <div className="desktop-links" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <a href="#agenda-info" onClick={(e) => handleNavClick(e, '/agenda', 'agenda-info')} style={{ fontSize: '0.9rem', fontWeight: 500, textDecoration: 'none', color: 'var(--on-surface)', cursor: 'pointer' }}>Agenda / Clases</a>
          <a href="#evolucion-info" onClick={(e) => handleNavClick(e, '/evolucion', 'evolucion-info')} style={{ fontSize: '0.9rem', fontWeight: 500, textDecoration: 'none', color: 'var(--on-surface)', cursor: 'pointer' }}>Mi Evolución</a>
          <a href="#nutricion-info" onClick={(e) => handleNavClick(e, '/nutricion', 'nutricion-info')} style={{ fontSize: '0.9rem', fontWeight: 500, textDecoration: 'none', color: 'var(--on-surface)', cursor: 'pointer' }}>Nutrición</a>
        </div>

        {/* Desktop Actions (Se ocultan en móvil)*/}
        <div className="desktop-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link to="/portal" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--on-surface)', fontWeight: 500, fontSize: '0.95rem', textDecoration: 'none' }}>
            Portal
          </Link>
          <button onClick={() => navigate('/agenda')} className="btn-primary" style={{ padding: '0.6rem 1.8rem' }}>Agendar Clase</button>
        </div>

        {/* Botón Hamburguesa Móvil */}
        <button 
          className="mobile-toggle" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Abrir menú"
        >
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </nav>

      {/* --- Overlay Menú Móvil --- */}
      <div className={`mobile-menu-overlay ${isMenuOpen ? 'open' : ''}`}>
        <div style={{display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center', marginTop: '-50px'}}>
          <a href="#agenda-info" style={{fontSize: '1.2rem', fontWeight: 600, color: 'var(--black)', textDecoration: 'none'}} onClick={(e) => handleNavClick(e, '/agenda', 'agenda-info')}>Agenda / Clases</a>
          <a href="#evolucion-info" style={{fontSize: '1.2rem', fontWeight: 600, color: 'var(--black)', textDecoration: 'none'}} onClick={(e) => handleNavClick(e, '/evolucion', 'evolucion-info')}>Mi Evolución</a>
          <a href="#nutricion-info" style={{fontSize: '1.2rem', fontWeight: 600, color: 'var(--black)', textDecoration: 'none'}} onClick={(e) => handleNavClick(e, '/nutricion', 'nutricion-info')}>Plan de Nutrición</a>
          <div style={{ width: '50px', height: '1px', background: 'rgba(0,0,0,0.1)', margin: '1rem 0'}} />
          <Link to={user ? (role === 'ADMIN' ? '/admin' : '/portal') : '/login'} onClick={() => setIsMenuOpen(false)} style={{fontSize: '1.2rem', fontWeight: 600, color: 'var(--primary)', textDecoration: 'none'}}>
            {user ? 'Acceder a mi Portal' : 'Iniciar Sesión'}
          </Link>
        </div>
      </div>


      {/* Hero Section Masterpiece */}
      <section style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        padding: '10rem 5% 4rem',
        position: 'relative',
        backgroundImage: 'linear-gradient(rgba(253, 251, 247, 0.8), rgba(253, 251, 247, 0.2)), url("/hero_bg.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center 30%',
      }}>
        {/* Soft Peach Abstract Glow */}
        <div style={{
          position: 'absolute', right: '5%', top: '20%', width: '50vw', height: '50vw',
          background: 'radial-gradient(circle, var(--surface-low) 0%, transparent 60%)',
          borderRadius: '50%', zIndex: -1, opacity: 0.5
        }} />

        <div className="animate-fade-up hero-text-container" style={{ maxWidth: '850px' }}>
          <div className="badge-peach" style={{ background: 'var(--surface-lowest)' }}>
            {user ? `¡Hola de nuevo, ${user.email.split('@')[0]}!` : 'Fuerza • Crecimiento • Conciencia'}
          </div>
          <h1 style={{ 
            fontSize: 'clamp(3rem, 8vw, 6.5rem)', 
            lineHeight: 1.05,
            marginBottom: '2rem',
            color: 'var(--black)'
          }}>
            {user ? (
              <>
                Bienvenida a <br />
                <span style={{ color: 'var(--primary)', fontStyle: 'italic' }}>tu espacio VIP.</span>
              </>
            ) : (
              <>
                Rediseña tu <br />
                <span style={{ color: 'var(--primary)', fontStyle: 'italic' }}>potencial corporal.</span>
              </>
            )}
          </h1>
          <p style={{ 
            fontSize: '1.15rem', 
            color: 'var(--on-surface)', 
            maxWidth: '550px',
            marginBottom: '3rem',
            fontWeight: 400,
            lineHeight: 1.7,
            backgroundColor: 'rgba(253, 251, 247, 0.85)',
            backdropFilter: 'blur(10px)',
            padding: '15px 20px',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
          }}>
            {user 
              ? 'Tienes una sesión activa. Accede a tu agenda personalizada, planes de nutrición y seguimiento de objetivos desde tu portal privado.'
              : 'La estética de Glúteos y bienestar integral combinando Pilates, Yoga, Danza y Fuerza. Accede a las instalaciones o a nuestra App inmersiva.'
            }
          </p>
          
          <div className="hero-buttons">
            {user ? (
              <button className="glass-button-dark" onClick={() => navigate(role === 'ADMIN' ? '/admin' : '/portal')}>
                Ir a mi Portal Personalizado <ArrowRight size={20} />
              </button>
            ) : (
              <>
                <button className="glass-button" onClick={() => navigate('/planes')}>
                  Comenzar Transformación <ArrowRight size={20} />
                </button>
                <button className="glass-button-dark" onClick={() => navigate('/login')}>
                   <Smartphone size={20} /> Iniciar Sesión
                </button>
              </>
            )}
          </div>
          
          <div style={{ marginTop: '3.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface-low)', border: '2px solid var(--surface-lowest)' }} />
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent)', border: '2px solid var(--surface-lowest)', marginLeft: '-15px' }} />
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', border: '2px solid var(--surface-lowest)', marginLeft: '-15px', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize: '12px' }}>+1k</div>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>
              Mujeres ya transformando <br/> su cuerpo con BEFIT LAB.
            </p>
          </div>
        </div>
      </section>

      {/* Nuestras Disciplinas */}
      <section id="metodo" style={{ padding: '6rem 5%', background: '#F8F5F1' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ marginBottom: '4rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 3rem)', marginBottom: '1rem' }}>El Método Lab</h2>
            <p style={{ color: 'var(--on-surface-variant)', maxWidth: '600px', margin: '0 auto', fontSize: '1.1rem' }}>
              Cuatro pilares de entrenamiento diseñados específicamente para potenciar la fuerza, movilidad y volumen del tren inferior.
            </p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '1.5rem' 
          }}>
            <DisciplineCard icon={<Heart strokeWidth={1.5} color="var(--primary)" size={32} />} title="Yoga Flow" desc="Elasticidad y control respiratorio para la recuperación muscular." bgImage="/yoga_card.png" />
            <DisciplineCard icon={<PlayCircle strokeWidth={1.5} color="var(--primary)" size={32} />} title="Cardio Baile" desc="Agilidad dinámica y quema calórica con ritmos explosivos." bgImage="/dance_card.png" />
            <DisciplineCard icon={<span style={{fontSize:'32px'}}>🍑</span>} title="Reformer Pilates" desc="Aislamiento muscular y tensión controlada. Santo grial del cuerpo." bgImage="/reformer_card.png" />
            <DisciplineCard icon={<Flame strokeWidth={1.5} color="var(--primary)" size={32} />} title="Fuerza y Peso" desc="Técnicas probadas de hipertrofia. Romper el músculo para crecer." bgImage="/strength_card.png" />
          </div>
        </div>
      </section>

      {/* --- SECCIONES INFORMATIVAS (CARTA DE PRESENTACIÓN) --- */}
      
      {/* 1. Agenda Info */}
      <section id="agenda-info" style={{ padding: '8rem 5%', background: 'white', overflow: 'hidden' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '4rem', alignItems: 'center' }}>
          <div style={{ flex: '1 1 500px' }}>
            <div className="badge-peach" style={{marginBottom: '1.5rem'}}><Calendar size={16} /> Horarios y Reservas</div>
            <h2 style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>Tu tiempo, tus reglas.</h2>
            <p style={{ fontSize: '1.1rem', color: '#4B5563', lineHeight: 1.8, marginBottom: '2rem' }}>
              En BEFIT LAB olvidamos las agendas de papel. Nuestra App te permite reservar tu lugar en Reformer Pilates o Yoga Flow con un solo toque. Consulta la disponibilidad en tiempo real y gestiona tus clases 24/7.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <h4 style={{marginBottom: '0.5rem', color: 'var(--primary)'}}>Fácil de usar</h4>
                <p style={{fontSize: '0.9rem', color: '#6B7280'}}>Cancela o reagenda tus clases hasta 12 horas antes sin cargos.</p>
              </div>
              <div>
                <h4 style={{marginBottom: '0.5rem', color: 'var(--primary)'}}>Lista de Espera</h4>
                <p style={{fontSize: '0.9rem', color: '#6B7280'}}>¿Clase llena? Nuestra IA te avisará en cuanto se libere un cupo.</p>
              </div>
            </div>
          </div>
          <div style={{ flex: '1 1 400px', position: 'relative' }}>
             <div style={{ width: '100%', height: '500px', background: 'url("/agenda_mock.png")', backgroundSize: 'cover', borderRadius: '30px', boxShadow: '0 30px 60px rgba(0,0,0,0.1)' }}></div>
          </div>
        </div>
      </section>

      {/* 2. Mi Evolución Info */}
      <section id="evolucion-info" style={{ padding: '8rem 5%', background: '#FAF9F6' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap-reverse', gap: '4rem', alignItems: 'center' }}>
          <div style={{ flex: '1 1 400px' }}>
             <div style={{ width: '100%', height: '500px', background: 'url("/evolucion_mock.png")', backgroundSize: 'cover', borderRadius: '30px', boxShadow: '0 30px 60px rgba(0,0,0,0.1)' }}></div>
          </div>
          <div style={{ flex: '1 1 500px' }}>
            <div className="badge-peach" style={{marginBottom: '1.5rem'}}><TrendingUp size={16} /> Seguimiento Bio-Digital</div>
            <h2 style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>Lo que no se mide, no crece.</h2>
            <p style={{ fontSize: '1.1rem', color: '#4B5563', lineHeight: 1.8, marginBottom: '2rem' }}>
              Visualiza tu transformación con gráficas interactivas. Registramos tus perímetros, composición corporal y récords personales en cada disciplina. Tu evolución es la motivación que necesitas para seguir adelante.
            </p>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center'}}>
                <div style={{width: '24px', height: '24px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px'}}>✓</div>
                <span>Gráficas de progreso muscular en tiempo real.</span>
              </li>
              <li style={{display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center'}}>
                <div style={{width: '24px', height: '24px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px'}}>✓</div>
                <span>Historial de medidas y composición corporal.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 3. Nutrición Info */}
      <section id="nutricion-info" style={{ padding: '8rem 5%', background: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <div className="badge-peach" style={{margin: '0 auto 1.5rem'}}><Utensils size={16} /> Nutrición Consciente</div>
          <h2 style={{ fontSize: '3.5rem', marginBottom: '2rem' }}>Alimenta tu esfuerzo.</h2>
          <p style={{ fontSize: '1.2rem', color: '#4B5563', maxWidth: '800px', margin: '0 auto 4rem' }}>
            La nutrición es el combustible de tu cambio. En BEFIT LAB, tu membresía incluye acceso a planes alimenticios diseñados para complementar tu entrenamiento.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <div style={{ padding: '3rem', borderRadius: '24px', background: '#FDFCFB', border: '1px solid #F1EFE9' }}>
               <h3>Recetario Digital</h3>
               <p style={{marginTop: '1rem', color: '#6B7280'}}>Cientos de recetas saludables y deliciosas con cálculo calórico automático.</p>
            </div>
            <div style={{ padding: '3rem', borderRadius: '24px', background: '#FDFCFB', border: '1px solid #F1EFE9' }}>
               <h3>Lista de Compras</h3>
               <p style={{marginTop: '1rem', color: '#6B7280'}}>Generamos tu lista del súper basada en tu plan semanal para que no pierdas tiempo.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function DisciplineCard({ icon, title, desc, bgImage }) {
  return (
    <div className="card-discipline" style={bgImage ? {
      backgroundImage: `linear-gradient(rgba(255,255,255,0.75), rgba(255,255,255,0.9)), url(${bgImage})`,
      backgroundSize: 'cover', backgroundPosition: 'center',
    } : {}}>
      <div style={{ marginBottom: 'auto', position: 'relative', zIndex: 2 }}>
        <div style={{ marginBottom: '2rem' }}>{icon}</div>
        <h3 style={{ fontSize: '1.6rem', marginBottom: '1rem', fontFamily: 'var(--font-display)' }}>{title}</h3>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.95rem', lineHeight: 1.6, fontWeight: bgImage ? 500 : 400 }}>{desc}</p>
      </div>
      <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--on-surface)', fontSize: '0.9rem', fontWeight: 600, position: 'relative', zIndex: 2 }}>
        Explorar clases <ArrowRight size={16} color="var(--primary)" />
      </div>
    </div>
  )
}

export default Landing;
