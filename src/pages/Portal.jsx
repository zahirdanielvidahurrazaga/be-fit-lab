import React from 'react';
import { User, Calendar, CreditCard, Settings, LogOut, Star, Activity, Crown, ArrowRight, Play } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

function Portal() {
  const navigate = useNavigate();

  return (
    <div className="portal-container">
      
      {/* Top Mobile Header */}
      <div className="portal-mobile-header" style={{
        display: 'none', justifyContent: 'space-between', alignItems: 'center',
        padding: '1.2rem 5%', background: 'var(--surface-lowest)', borderBottom: '1px solid rgba(0,0,0,0.05)',
        position: 'sticky', top: 0, zIndex: 10
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 600 }}>
          BEFIT <span style={{ color: 'var(--primary)' }}>LAB</span>
        </div>
        <Link to="/" style={{ color: 'var(--on-surface-variant)' }}><LogOut size={22}/></Link>
      </div>

      {/* Sidebar Navigation */}
      <aside className="portal-sidebar">
        <div className="desktop-logo" style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 600, marginBottom: '3rem' }}>
          BEFIT <span style={{ color: 'var(--primary)' }}>LAB</span>
        </div>
        
        <nav className="portal-nav">
          <SidebarItem icon={<Activity size={22} />} label="Perfil" active />
          <SidebarItem icon={<Calendar size={22} />} label="Clases" onClick={() => navigate('/agenda')} />
          <SidebarItem icon={<Star size={22} />} label="Evolución" onClick={() => navigate('/evolucion')} />
          <SidebarItem icon={<Crown size={22} />} label="Nutrición" onClick={() => navigate('/nutricion')} />
          <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.05)', margin: '1rem 0' }} />
          <SidebarItem icon={<CreditCard size={22} />} label="Membresía" />
          <SidebarItem icon={<Settings size={22} />} label="Configuración" />
        </nav>

        <Link to="/" className="desktop-logout" style={{ color: 'var(--on-surface-variant)', textDecoration: 'none', fontSize: '0.9rem', marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LogOut size={16} /> Salir del portal
        </Link>
      </aside>

      {/* Pantalla Dashboard Principal */}
      <main className="portal-main" style={{ padding: '0', background: 'var(--surface)' }}>
        
        {/* Cover Photo & Header Profile */}
        <div style={{
          height: '220px', 
          background: 'linear-gradient(to right, rgba(201, 114, 93, 0.9), rgba(201, 114, 93, 0.4)), url("/hero_bg.png")', 
          backgroundPosition: 'center', backgroundSize: 'cover',
          position: 'relative', borderBottomLeftRadius: 'var(--shape-xl)'
        }}>
          {/* Avatar Flotante */}
          <div style={{
            position: 'absolute', bottom: '-40px', left: '6%',
            width: '100px', height: '100px', borderRadius: '50%',
            background: 'var(--surface-lowest)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 25px rgba(0,0,0,0.08)', border: '4px solid var(--surface)'
          }}>
            <div style={{ 
              width: '100%', height: '100%', borderRadius: '50%', 
              background: 'linear-gradient(45deg, var(--on-surface), var(--primary))', 
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.5rem', fontFamily: 'var(--font-display)' 
            }}>
              A
            </div>
          </div>

          <div style={{ position: 'absolute', right: '6%', bottom: '20px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', padding: '8px 16px', borderRadius: '20px', color: 'white', fontWeight: 500, fontSize: '0.85rem' }}>
            Nivel: Fundadora Elite 👑
          </div>
        </div>

        {/* Dashboard Content */}
        <div style={{ padding: '4rem 6% 6rem' }}>
          <div style={{ marginBottom: '3rem' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '0.2rem', fontFamily: 'var(--font-display)', color: 'var(--black)' }}>Bienvenida, Amanda.</h1>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: '1.05rem' }}>Lista para tu próximo desafío estructural.</p>
          </div>

          {/* Grid de 2 Columnas Principal */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            
            {/* Columna Izquierda: Acción Principal */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Tarjeta de Próxima Clase Súper Premium */}
              <div style={{
                background: 'linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url("/reformer_card.png")',
                backgroundSize: 'cover', backgroundPosition: 'center',
                borderRadius: 'var(--shape-xl)', padding: '2.5rem', color: 'white',
                boxShadow: '0 15px 35px rgba(0,0,0,0.1)', position: 'relative', overflow: 'hidden'
              }}>
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <div style={{ display: 'inline-block', background: 'var(--primary)', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
                    Tu Próxima Reserva
                  </div>
                  <h2 style={{ fontSize: '2.2rem', fontFamily: 'var(--font-display)', marginBottom: '0.5rem', lineHeight: 1.1, color: '#FFFFFF', textShadow: '0 4px 15px rgba(0,0,0,0.4)' }}>Reformer Avanzado</h2>
                  <div style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.9)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={18} /> Mañana, 09:30 AM
                  </div>
                  <button onClick={() => navigate('/agenda')} style={{ background: 'white', color: 'var(--black)', border: 'none', padding: '0.8rem 1.8rem', borderRadius: 'var(--shape-xl)', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'transform 0.2s' }}>
                    Modificar Horario <ArrowRight size={16} />
                  </button>
                </div>
              </div>

              {/* Tarjeta de Accesos Rápidos */}
              <div style={{ background: 'var(--surface-lowest)', borderRadius: 'var(--shape-xl)', padding: '2rem', border: '1px solid rgba(0,0,0,0.03)' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', fontFamily: 'var(--font-display)' }}>Tus Atajos Frecuentes</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                  <ShortcutCard icon={<Star size={20} color="var(--primary)"/>} title="Mi Evolución" desc="Medidas e históricos" onClick={() => navigate('/evolucion')} />
                  <ShortcutCard icon={<Crown size={20} color="var(--primary)"/>} title="Nutrición" desc="Plan personalizado" onClick={() => navigate('/nutricion')} />
                </div>
              </div>

            </div>

            {/* Columna Derecha: Membresía & Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Resumen Membresía */}
              <div style={{ background: 'var(--surface-lowest)', padding: '2.5rem', borderRadius: 'var(--shape-xl)', border: '1px solid rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--on-surface-variant)', fontWeight: 600 }}>Membresía Activa</div>
                  <Crown size={20} color="var(--primary)" />
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '0.5rem', fontFamily: 'var(--font-display)' }}>Plan Ilimitado</div>
                <div style={{ color: 'var(--on-surface-variant)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>Valido hasta: 14 Mar 2027</div>
                
                {/* Visual Progress Bar de días (Estético) */}
                <div style={{ width: '100%', height: '6px', background: 'var(--surface-low)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '85%', height: '100%', background: 'var(--primary)' }}></div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--primary)', marginTop: '8px', fontWeight: 500 }}>
                  Renovación Automática Activa
                </div>
              </div>

              {/* Racha / Logro */}
              <div style={{ background: 'var(--primary)', padding: '2rem', borderRadius: 'var(--shape-xl)', color: 'white', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', minWidth: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={28} color="white" />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9 }}>Racha Actual</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 600, fontFamily: 'var(--font-display)', marginBottom: '4px' }}>8 Semanas</div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>¡Estás en tu mejor momento!</div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }) {
  return (
    <div className="portal-nav-item" onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '12px', padding: '1rem',
      borderRadius: 'var(--shape-md)', cursor: 'pointer',
      background: active ? 'var(--surface)' : 'transparent',
      color: active ? 'var(--primary)' : 'var(--on-surface-variant)',
      fontWeight: active ? '600' : '500',
      transition: 'all 0.2s ease'
    }}>
      {icon} <span>{label}</span>
    </div>
  )
}

function ShortcutCard({ icon, title, desc, onClick }) {
  return (
    <div onClick={onClick} style={{ padding: '1rem', background: 'var(--surface)', borderRadius: 'var(--shape-md)', cursor: 'pointer', transition: 'background 0.2s', border: '1px solid rgba(0,0,0,0.02)' }}>
      <div style={{ marginBottom: '12px' }}>{icon}</div>
      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--on-surface)', marginBottom: '4px' }}>{title}</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>{desc}</div>
    </div>
  )
}

export default Portal;
