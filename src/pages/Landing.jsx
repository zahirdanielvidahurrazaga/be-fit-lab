import React, { useState } from 'react';
import { ArrowRight, Flame, Heart, PlayCircle, Smartphone, Menu, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

function Landing() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
        
        {/* Desktop Links (Se ocultan en móvil vía CSS) */}
        <div className="desktop-links" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <Link to="/agenda" style={{ fontSize: '0.9rem', fontWeight: 500, textDecoration: 'none', color: 'var(--on-surface)' }}>Agenda / Clases</Link>
          <Link to="/evolucion" style={{ fontSize: '0.9rem', fontWeight: 500, textDecoration: 'none', color: 'var(--on-surface)' }}>Mi Evolución</Link>
          <Link to="/nutricion" style={{ fontSize: '0.9rem', fontWeight: 500, textDecoration: 'none', color: 'var(--on-surface)' }}>Nutrición</Link>
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
          <Link to="/agenda" onClick={() => setIsMenuOpen(false)}>Agenda / Clases</Link>
          <Link to="/evolucion" onClick={() => setIsMenuOpen(false)}>Mi Evolución</Link>
          <Link to="/nutricion" onClick={() => setIsMenuOpen(false)}>Plan de Nutrición</Link>
          <div style={{ width: '50px', height: '1px', background: 'rgba(0,0,0,0.1)', margin: '1rem 0'}} />
          <Link to="/portal" onClick={() => setIsMenuOpen(false)}>Acceder a mi Portal</Link>
          <button 
            onClick={() => { setIsMenuOpen(false); navigate('/agenda'); }} 
            className="btn-primary" 
            style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}
          >
            Reservar Clase
          </button>
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
          <div className="badge-peach" style={{ background: 'var(--surface-lowest)' }}>Fuerza • Crecimiento • Conciencia</div>
          <h1 style={{ 
            fontSize: 'clamp(3rem, 8vw, 6.5rem)', 
            lineHeight: 1.05,
            marginBottom: '2rem',
            color: 'var(--black)'
          }}>
            Rediseña tu <br />
            <span style={{ color: 'var(--primary)', fontStyle: 'italic' }}>potencial corporal.</span>
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
            La estética de Glúteos y bienestar integral combinando Pilates, Yoga, Danza y Fuerza. Accede a las instalaciones o a nuestra App inmersiva.
          </p>
          
          <div className="hero-buttons">
            <button className="glass-button" onClick={() => navigate('/planes')}>
              Comenzar Transformación <ArrowRight size={20} />
            </button>
            <button className="glass-button-dark" onClick={() => navigate('/portal')}>
               <Smartphone size={20} /> Explorar la App
            </button>
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
      <section style={{ padding: '6rem 5%', background: '#F8F5F1' }}>
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
            <DisciplineCard icon={<Heart strokeWidth={1.5} color="var(--primary)" size={32} />} title="Yoga Flow" desc="Elasticidad y control respiratorio para la recuperación musculares." bgImage="/yoga_card.png" />
            <DisciplineCard icon={<PlayCircle strokeWidth={1.5} color="var(--primary)" size={32} />} title="Cardio Baile" desc="Agilidad dinámica y quema calórica con ritmos explosivos." bgImage="/dance_card.png" />
            <DisciplineCard icon={<span style={{fontSize:'32px'}}>🍑</span>} title="Reformer Pilates" desc="Aislamiento muscular y tensión controlada. Santo grial del cuerpo." bgImage="/reformer_card.png" />
            <DisciplineCard icon={<Flame strokeWidth={1.5} color="var(--primary)" size={32} />} title="Fuerza y Peso" desc="Técnicas probadas de hipertrofia. Romper el músculo para crecer." bgImage="/strength_card.png" />
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
