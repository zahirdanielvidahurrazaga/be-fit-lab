import React, { useState, useEffect } from 'react';
import { ArrowRight, Flame, Heart, PlayCircle, Smartphone, Menu, X, Calendar, TrendingUp,
         Utensils, CheckCircle2, ChevronDown, MapPin, Phone, MessageCircle, Star } from 'lucide-react';

// Instagram icon (lucide-react v1.x doesn't export it)
const InstagramIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="0.5" fill={color} stroke="none"/>
  </svg>
);
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

// ── Cafetería products — actualiza cuando tenga foto e-commerce DB ──
const CAFE_PRODUCTS = [
  { id: 1, name: 'Agua de Jamaica',   price: '$45',  desc: 'Fresca, sin azúcar añadida. Antioxidante natural.',         emoji: '🌺', bg: '#FFF0EC' },
  { id: 2, name: 'Smoothie Verde',    price: '$85',  desc: 'Espinaca, manzana, jengibre y proteína vegetal.',           emoji: '🥑', bg: '#EEF4EC' },
  { id: 3, name: 'Cold Brew',         price: '$65',  desc: 'Cold brew de especialidad con leche de almendra.',          emoji: '☕', bg: '#F5F0E8' },
  { id: 4, name: 'Matcha Latte',      price: '$75',  desc: 'Matcha de grado ceremonial. Con leche de avena.',           emoji: '🍵', bg: '#EBF0E8' },
  { id: 5, name: 'Barra Proteica',    price: '$55',  desc: 'Chocolate y almendra. 20 g de proteína.',                   emoji: '🍫', bg: '#F0EAE8' },
  { id: 6, name: 'Agua de Coco',      price: '$50',  desc: 'Hidratación natural. Perfecta post-entrenamiento.',         emoji: '🥥', bg: '#FBF5E8' },
];

// ── Testimonios — reemplaza con los reales cuando los tengas ──
const TESTIMONIALS = [
  { name: 'Fernanda R.',      since: '2023', stars: 5, text: 'Llevo 6 meses en Be Fit Lab y mi cuerpo cambió por completo. El reformer es adictivo y los resultados hablan solos. ¡Las coaches son las mejores!' },
  { name: 'Ana Patricia M.',  since: '2022', stars: 5, text: 'El ambiente es increíble. Grupos pequeños, atención personalizada y coaches que realmente se preocupan por tu técnica. Vale cada peso.' },
  { name: 'Mariana C.',       since: '2024', stars: 5, text: 'Nunca me había sentido tan bien en un gym. Las instalaciones son top, siempre limpias, y la comunidad de chicas es muy motivadora.' },
];

// ── FAQ — actualiza con tus políticas reales ──
const FAQ_ITEMS = [
  { q: '¿Cuál es la política de cancelación?',
    a: 'Puedes cancelar o reagendar con al menos 5 horas de anticipación sin penalización. Cancelaciones con menos de 5 horas de anticipación se contarán como clase consumida.' },
  { q: '¿Necesito llevar algo especial?',
    a: 'Sí. Es obligatorio el uso de calcetines antiderrapantes (los vendemos en recepción desde $80). Lleva ropa cómoda de ejercicio y tu botella de agua.' },
  { q: '¿Los paquetes tienen fecha de vencimiento?',
    a: 'Todos los paquetes tienen vigencia de 30 días a partir de su activación, independientemente del número de clases incluidas. No se hacen reembolsos.' },
  { q: '¿Puedo venir si soy principiante?',
    a: '¡Claro! Todas nuestras clases contemplan niveles mixtos. Te recomendamos empezar con las clases "Básico" y nuestras coaches te guiarán en todo momento.' },
  { q: '¿Con cuánta anticipación debo llegar?',
    a: 'Te pedimos llegar al menos 10 minutos antes. Las puertas se cierran al iniciar la clase por respeto a todas las participantes. Llegadas tardías no serán admitidas.' },
  { q: '¿Cómo reservo mi lugar?',
    a: 'A través de nuestra App (disponible en App Store y próximamente en Google Play) o iniciando sesión en este sitio. Las reservas abren 7 días antes de cada clase.' },
];

// ── WhatsApp number — reemplaza con el real ──
const WA_NUMBER = '5212345678900';

const fadeUp = {
  hidden:  { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

// ─────────────────────────────────────────────────────────────────────────────

function Landing() {
  const navigate    = useNavigate();
  const location    = useLocation();
  const { user, role, membershipStatus, globalClasses, coaches } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showToast,  setShowToast]  = useState(false);
  const [scrolled,   setScrolled]   = useState(false);
  const [openFAQ,    setOpenFAQ]    = useState(null);

  useEffect(() => {
    if (location.state?.registered) {
      setShowToast(true);
      const t = setTimeout(() => setShowToast(false), 5000);
      return () => clearTimeout(t);
    }
  }, [location]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (isMenuOpen) document.body.style.overflow = 'hidden';
  else document.body.style.overflow = 'unset';

  const scrollTo = (id) => {
    setIsMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Public schedule — clases recurrentes agrupadas por día
  const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const recurring = globalClasses.filter(c => !c.date);
  const schedule  = [1,2,3,4,5,6].map(d => ({
    label:   DAYS[d],
    classes: recurring.filter(c => Number(c.day) === d).sort((a,b) => a.time.localeCompare(b.time)),
  })).filter(d => d.classes.length > 0);

  return (
    <div className="app-container" style={{ fontFamily: 'var(--font-body)' }}>

      {/* ── Toast registro ─────────────────────────────────────────── */}
      {showToast && (
        <div style={{ position:'fixed', top:'20px', right:'20px', zIndex:9999, background:'rgba(255,255,255,0.95)', backdropFilter:'blur(10px)', padding:'15px 20px', borderRadius:'15px', border:'1px solid rgba(255,145,77,0.3)', boxShadow:'0 10px 40px rgba(0,0,0,0.1)', display:'flex', alignItems:'center', gap:'15px', animation:'fadeInDown 0.5s ease' }}>
          <div style={{ width:'35px', height:'35px', borderRadius:'50%', background:'rgba(255,145,77,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}><CheckCircle2 size={20} color="var(--primary)" /></div>
          <div>
            <h4 style={{ margin:'0 0 2px', fontSize:'0.95rem', fontFamily:'var(--font-display)' }}>¡Bienvenida a Be Fit Lab!</h4>
            <p style={{ margin:0, fontSize:'0.8rem', color:'var(--on-surface-variant)' }}>Tu cuenta ha sido creada exitosamente.</p>
          </div>
          <button onClick={() => setShowToast(false)} style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--on-surface-variant)', display:'flex' }}><X size={18}/></button>
        </div>
      )}

      {/* ── Nav ────────────────────────────────────────────────────── */}
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:1000,
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'0 5%', height:'70px',
        background: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(0,0,0,0.06)' : 'none',
        transition:'all 0.3s ease',
      }}>
        <button onClick={() => window.scrollTo({top:0, behavior:'smooth'})} style={{ background:'none', border:'none', cursor:'pointer', padding:0 }}>
          <img src="/logo.png" alt="Be Fit Lab" style={{ height:'38px', width:'auto', display:'block' }} />
        </button>

        {/* Desktop links */}
        <div style={{ display:'flex', gap:'2rem', alignItems:'center' }} className="desktop-links">
          {[['Clases','clases'],['Horarios','horarios'],['Precios','precios'],['Estudio','estudio'],['Cafetería','cafeteria']].map(([label,id]) => (
            <button key={id} onClick={() => scrollTo(id)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'0.88rem', fontWeight:500, color:'var(--black)', fontFamily:'var(--font-body)' }}>{label}</button>
          ))}
        </div>

        <div className="desktop-actions" style={{ display:'flex', gap:'1rem', alignItems:'center' }}>
          {user
            ? <Link to={role==='ADMIN'?'/admin':'/portal'} style={{ fontSize:'0.9rem', fontWeight:500, textDecoration:'none', color:'var(--on-surface)' }}>Mi Portal</Link>
            : <Link to="/login" style={{ fontSize:'0.9rem', fontWeight:500, textDecoration:'none', color:'var(--on-surface)' }}>Iniciar Sesión</Link>
          }
          <button onClick={() => navigate('/planes')} className="btn-primary" style={{ padding:'0.55rem 1.6rem', fontSize:'0.88rem' }}>Comenzar</button>
        </div>

        <button className="mobile-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Menú">
          {isMenuOpen ? <X size={28}/> : <Menu size={28}/>}
        </button>
      </nav>

      {/* Mobile menu */}
      <div className={`mobile-menu-overlay ${isMenuOpen ? 'open' : ''}`}>
        <div style={{ display:'flex', flexDirection:'column', gap:'2rem', alignItems:'center' }}>
          {[['Clases','clases'],['Horarios','horarios'],['Precios','precios'],['El Estudio','estudio'],['Cafetería','cafeteria'],['FAQ','faq'],['Contacto','ubicacion']].map(([label,id]) => (
            <button key={id} onClick={() => scrollTo(id)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1.2rem', fontWeight:600, color:'var(--black)', fontFamily:'var(--font-body)' }}>{label}</button>
          ))}
          <div style={{ width:'50px', height:'1px', background:'rgba(0,0,0,0.1)' }} />
          <Link to={user?(role==='ADMIN'?'/admin':'/portal'):'/login'} onClick={()=>setIsMenuOpen(false)} style={{ fontSize:'1.2rem', fontWeight:600, color:'var(--primary)', textDecoration:'none' }}>
            {user ? 'Mi Portal' : 'Iniciar Sesión'}
          </Link>
        </div>
      </div>

      {/* ── Membership banner ──────────────────────────────────────── */}
      {user && role==='CLIENT' && membershipStatus!=='ACTIVE' && (
        <div style={{ position:'fixed', top:'80px', left:'50%', transform:'translateX(-50%)', zIndex:998, width:'94%', maxWidth:'600px', background:'rgba(255,255,255,0.92)', backdropFilter:'blur(20px)', borderRadius:'16px', padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px', border:'1px solid rgba(255,145,77,0.2)', boxShadow:'0 8px 30px rgba(0,0,0,0.08)', animation:'fadeInUp 0.4s ease' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', flex:1 }}>
            <div style={{ width:'34px', height:'34px', borderRadius:'50%', background:'linear-gradient(135deg,var(--primary),var(--accent))', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <span style={{ color:'white', fontWeight:800, fontSize:'0.85rem' }}>{user.email?.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <div style={{ fontSize:'0.85rem', fontWeight:700 }}>Hola, {user.user_metadata?.full_name || user.email?.split('@')[0]}</div>
              <div style={{ fontSize:'0.7rem', color:'#6B7280' }}>Aún no tienes membresía activa</div>
            </div>
          </div>
          <button onClick={()=>navigate('/planes')} style={{ padding:'7px 16px', borderRadius:'20px', border:'none', background:'var(--primary)', color:'white', fontSize:'0.75rem', fontWeight:700, cursor:'pointer', flexShrink:0 }}>Ver Planes</button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* HERO — SE MANTIENE EXACTAMENTE COMO ESTABA                  */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section style={{ minHeight:'100vh', display:'flex', alignItems:'center', padding:'10rem 5% 4rem', position:'relative', backgroundImage:'linear-gradient(rgba(253,251,247,0.8),rgba(253,251,247,0.2)),url("/hero_bg.png")', backgroundSize:'cover', backgroundPosition:'center 30%' }}>
        <div style={{ position:'absolute', right:'5%', top:'20%', width:'50vw', height:'50vw', background:'radial-gradient(circle,var(--surface-low) 0%,transparent 60%)', borderRadius:'50%', zIndex:-1, opacity:0.5 }} />
        <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.8, ease:'easeOut' }} className="hero-text-container" style={{ maxWidth:'850px' }}>
          <div className="badge-peach" style={{ background:'var(--surface-lowest)' }}>
            {user ? `¡Hola de nuevo, ${user.email.split('@')[0]}!` : 'Fuerza • Crecimiento • Conciencia'}
          </div>
          <h1 style={{ fontSize:'clamp(3rem,8vw,6.5rem)', lineHeight:1.05, marginBottom:'2rem', color:'var(--black)' }}>
            {user ? (<>Bienvenida a <br /><span style={{ color:'var(--primary)', fontStyle:'italic' }}>tu espacio VIP.</span></>) : (<>Rediseña tu <br /><span style={{ color:'var(--primary)', fontStyle:'italic' }}>potencial corporal.</span></>)}
          </h1>
          <p style={{ fontSize:'1.15rem', color:'var(--on-surface)', maxWidth:'550px', marginBottom:'3rem', fontWeight:400, lineHeight:1.7, backgroundColor:'rgba(253,251,247,0.85)', backdropFilter:'blur(10px)', padding:'15px 20px', borderRadius:'12px', boxShadow:'0 4px 20px rgba(0,0,0,0.03)' }}>
            {user ? 'Tienes una sesión activa. Accede a tu agenda personalizada, planes de nutrición y seguimiento de objetivos desde tu portal privado.' : 'La estética de Glúteos y bienestar integral combinando Pilates, Yoga, Danza y Fuerza. Accede a las instalaciones o a nuestra App inmersiva.'}
          </p>
          <div className="hero-buttons">
            {user ? (
              <button className="glass-button-dark" onClick={()=>navigate(role==='ADMIN'?'/admin':'/portal')}>Ir a mi Portal <ArrowRight size={20}/></button>
            ) : (
              <>
                <button className="glass-button" onClick={()=>navigate('/planes')}>Comenzar Transformación <ArrowRight size={20}/></button>
                <button className="glass-button-dark" onClick={()=>scrollTo('agenda-info')}><Smartphone size={20}/> Descubre la App</button>
              </>
            )}
          </div>
          <div style={{ marginTop:'3.5rem', display:'flex', alignItems:'center', gap:'1rem' }}>
            <div style={{ display:'flex' }}>
              <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:'var(--surface-low)', border:'2px solid var(--surface-lowest)' }} />
              <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:'var(--accent)', border:'2px solid var(--surface-lowest)', marginLeft:'-15px' }} />
              <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:'var(--primary)', border:'2px solid var(--surface-lowest)', marginLeft:'-15px', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px' }}>+1k</div>
            </div>
            <p style={{ fontSize:'0.85rem', color:'var(--on-surface-variant)', fontWeight:600 }}>Mujeres ya transformando <br/> su cuerpo con BE FIT LAB.</p>
          </div>
        </motion.div>
      </section>

      {/* ── Stats bar ──────────────────────────────────────────────── */}
      <section style={{ background:'#1A1C1E', padding:'2.5rem 5%' }}>
        <div style={{ maxWidth:'1200px', margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'2rem', textAlign:'center' }}>
          {[['+ 1,000','Mujeres transformadas'],['4','Disciplinas de élite'],['< 10','Alumnas por clase'],['100%','Equipo premium']].map(([num,label]) => (
            <div key={label}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:'clamp(2rem,4vw,2.8rem)', color:'white', fontWeight:400, lineHeight:1 }}>{num}</div>
              <div style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.5)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginTop:'6px' }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── El Método ──────────────────────────────────────────────── */}
      <section id="metodo" style={{ padding:'8rem 5%', background:'white', overflow:'hidden' }}>
        <div style={{ maxWidth:'1200px', margin:'0 auto', display:'flex', flexWrap:'wrap', gap:'5rem', alignItems:'center' }}>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once:true }} style={{ flex:'1 1 480px' }}>
            <span style={{ fontSize:'0.75rem', fontWeight:800, letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--primary)' }}>Nuestro método</span>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(2.2rem,5vw,3.5rem)', lineHeight:1.1, margin:'1rem 0 1.5rem', color:'var(--black)' }}>
              Glúteos. Fuerza.<br/><em>Transformación real.</em>
            </h2>
            <p style={{ fontSize:'1.05rem', color:'#4B5563', lineHeight:1.8, marginBottom:'2rem' }}>
              En Be Fit Lab fusionamos Reformer Pilates, Yoga Flow, Cardio Baile y Fuerza en un método diseñado específicamente para potenciar el tren inferior femenino. Grupos de máximo 10 alumnas garantizan atención personalizada en cada sesión.
            </p>
            <ul style={{ listStyle:'none', padding:0, margin:'0 0 2.5rem', display:'flex', flexDirection:'column', gap:'12px' }}>
              {['Grupos reducidos — máximo 10 alumnas por clase','Coaches certificadas con especialización en pilates','Equipo Balanced Body de gama profesional','Programa progresivo adaptado a tu nivel'].map(item => (
                <li key={item} style={{ display:'flex', gap:'12px', alignItems:'flex-start', fontSize:'0.95rem', color:'#374151' }}>
                  <div style={{ width:'20px', height:'20px', borderRadius:'50%', background:'rgba(255,139,66,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:'2px' }}>
                    <CheckCircle2 size={12} color="var(--primary)" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
            <button onClick={() => scrollTo('clases')} className="btn-primary" style={{ padding:'0.85rem 2rem' }}>
              Ver todas las clases <ArrowRight size={18}/>
            </button>
          </motion.div>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once:true }} style={{ flex:'1 1 400px' }}>
            <div style={{ position:'relative' }}>
              <div style={{ width:'100%', aspectRatio:'4/5', background:`url("/assets/agenda_lifestyle.png")`, backgroundSize:'cover', backgroundPosition:'center', borderRadius:'32px', boxShadow:'0 30px 80px rgba(0,0,0,0.12)' }} />
              <div style={{ position:'absolute', bottom:'-20px', right:'-20px', background:'white', borderRadius:'20px', padding:'18px 22px', boxShadow:'0 20px 40px rgba(0,0,0,0.1)', border:'1px solid rgba(0,0,0,0.04)' }}>
                <div style={{ fontFamily:'var(--font-display)', fontSize:'2rem', fontWeight:400, color:'var(--black)', lineHeight:1 }}>The glutes</div>
                <div style={{ fontFamily:'var(--font-display)', fontSize:'2rem', fontStyle:'italic', color:'var(--primary)', lineHeight:1 }}>specialists</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Clases ─────────────────────────────────────────────────── */}
      <section id="clases" style={{ padding:'8rem 5%', background:'#FAF9F6' }}>
        <div style={{ maxWidth:'1300px', margin:'0 auto' }}>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once:true }} style={{ textAlign:'center', marginBottom:'4rem' }}>
            <span style={{ fontSize:'0.75rem', fontWeight:800, letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--primary)' }}>Lo que hacemos</span>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(2rem,5vw,3rem)', margin:'1rem 0 1rem' }}>Cuatro disciplinas,<br/>un solo objetivo.</h2>
            <p style={{ color:'#4B5563', maxWidth:'560px', margin:'0 auto', fontSize:'1rem', lineHeight:1.7 }}>Cada clase está diseñada para trabajar fuerza, movilidad y estética del tren inferior con técnica y música que te mantienen motivada.</p>
          </motion.div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(270px,1fr))', gap:'1.5rem' }}>
            <ClassCard icon={<span style={{fontSize:'28px'}}>🍑</span>} title="Reformer Pilates" desc="Aislamiento muscular con tensión controlada sobre la cama reformer. El santo grial para glúteos y core." tag="Más popular" bgImage="/reformer_card.png" onClick={() => scrollTo('horarios')} />
            <ClassCard icon={<Flame strokeWidth={1.5} size={28} color="var(--primary)" />} title="Fuerza y Peso" desc="Hipertrofia guiada. Rompemos el músculo para que crezca más fuerte, con técnica impecable." bgImage="/strength_card.png" onClick={() => scrollTo('horarios')} />
            <ClassCard icon={<Heart strokeWidth={1.5} size={28} color="var(--primary)" />} title="Yoga Flow" desc="Elasticidad, control respiratorio y recuperación activa. El balance perfecto para tu entrenamiento." bgImage="/yoga_card.png" onClick={() => scrollTo('horarios')} />
            <ClassCard icon={<PlayCircle strokeWidth={1.5} size={28} color="var(--primary)" />} title="Cardio Baile" desc="Agilidad dinámica y quema calórica con ritmos explosivos. ¡La clase más divertida del estudio!" bgImage="/dance_card.png" onClick={() => scrollTo('horarios')} />
          </div>
        </div>
      </section>

      {/* ── Coaches ────────────────────────────────────────────────── */}
      {coaches.length > 0 && (
        <section id="coaches" style={{ padding:'8rem 5%', background:'white' }}>
          <div style={{ maxWidth:'1200px', margin:'0 auto' }}>
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once:true }} style={{ textAlign:'center', marginBottom:'4rem' }}>
              <span style={{ fontSize:'0.75rem', fontWeight:800, letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--primary)' }}>Nuestro equipo</span>
              <h2 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(2rem,5vw,3rem)', margin:'1rem 0 1rem' }}>Coaches certificadas,<br/>resultados reales.</h2>
            </motion.div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:'2rem' }}>
              {coaches.map(coach => (
                <motion.div key={coach.id} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once:true }}
                  style={{ background:'#FAF9F6', borderRadius:'28px', overflow:'hidden', border:'1px solid rgba(0,0,0,0.04)' }}>
                  <div style={{ width:'100%', aspectRatio:'1', background:coach.avatar_url?`url(${coach.avatar_url})`:'linear-gradient(135deg,#F5EFEB,#FFD4BA)', backgroundSize:'cover', backgroundPosition:'center top', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {!coach.avatar_url && <span style={{ fontFamily:'var(--font-display)', fontSize:'4rem', color:'var(--primary)', opacity:0.3 }}>{(coach.full_name||'C').charAt(0)}</span>}
                  </div>
                  <div style={{ padding:'24px' }}>
                    <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.3rem', margin:'0 0 4px', color:'var(--black)' }}>{coach.full_name}</h3>
                    {coach.experience && <span style={{ fontSize:'0.72rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.05em', color:'var(--primary)' }}>{coach.experience}</span>}
                    {coach.bio && <p style={{ fontSize:'0.88rem', color:'#4B5563', lineHeight:1.6, marginTop:'10px', marginBottom:0 }}>{coach.bio}</p>}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── El Estudio ─────────────────────────────────────────────── */}
      <section id="estudio" style={{ padding:'8rem 5%', background:'#1A1C1E' }}>
        <div style={{ maxWidth:'1200px', margin:'0 auto' }}>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once:true }} style={{ marginBottom:'4rem' }}>
            <span style={{ fontSize:'0.75rem', fontWeight:800, letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--primary)' }}>Nuestras instalaciones</span>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(2rem,5vw,3rem)', margin:'1rem 0 1rem', color:'white' }}>Un espacio diseñado<br/><em style={{ color:'var(--primary)' }}>para ti.</em></h2>
            <p style={{ color:'rgba(255,255,255,0.55)', maxWidth:'560px', fontSize:'1rem', lineHeight:1.7 }}>Instalaciones premium, camas reformer de grado profesional, vestidores con lockers, y el ambiente perfecto para enfocarte.</p>
          </motion.div>
          {/* Photo grid — replace background-image URLs with actual studio photos */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(12, 1fr)', gridTemplateRows:'auto', gap:'16px' }}>
            <div style={{ gridColumn:'span 8', gridRow:'span 2', background:`url("/assets/evolucion_lifestyle.png")`, backgroundSize:'cover', backgroundPosition:'center', borderRadius:'24px', minHeight:'400px' }} />
            <div style={{ gridColumn:'span 4', background:`url("/reformer_card.png")`, backgroundSize:'cover', backgroundPosition:'center', borderRadius:'24px', minHeight:'190px' }} />
            <div style={{ gridColumn:'span 4', background:`url("/strength_card.png")`, backgroundSize:'cover', backgroundPosition:'center', borderRadius:'24px', minHeight:'190px' }} />
          </div>
          <p style={{ marginTop:'16px', fontSize:'0.75rem', color:'rgba(255,255,255,0.25)', textAlign:'right' }}>
            {/* Reemplaza las imágenes del grid con fotos reales del estudio */}
          </p>
        </div>
      </section>

      {/* ── Horarios públicos ──────────────────────────────────────── */}
      <section id="horarios" style={{ padding:'8rem 5%', background:'#FAF9F6' }}>
        <div style={{ maxWidth:'1200px', margin:'0 auto' }}>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once:true }} style={{ textAlign:'center', marginBottom:'4rem' }}>
            <span style={{ fontSize:'0.75rem', fontWeight:800, letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--primary)' }}>Horarios</span>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(2rem,5vw,3rem)', margin:'1rem 0 1rem' }}>Encuentra tu clase ideal.</h2>
            <p style={{ color:'#4B5563', maxWidth:'500px', margin:'0 auto', fontSize:'1rem', lineHeight:1.7 }}>Horarios semanales. Reserva tu lugar desde la App o iniciando sesión aquí.</p>
          </motion.div>
          {schedule.length > 0 ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'1rem' }}>
              {schedule.map(({ label, classes }) => (
                <div key={label} style={{ background:'white', borderRadius:'20px', padding:'20px 16px', boxShadow:'0 4px 20px rgba(0,0,0,0.04)', border:'1px solid rgba(0,0,0,0.04)' }}>
                  <div style={{ fontWeight:800, fontSize:'0.8rem', textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--primary)', marginBottom:'14px' }}>{label}</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                    {classes.map(c => (
                      <div key={c.id} style={{ borderRadius:'12px', background:'#FAF9F6', padding:'10px 12px' }}>
                        <div style={{ fontWeight:800, fontSize:'0.9rem', color:'var(--black)' }}>{c.time}</div>
                        <div style={{ fontSize:'0.78rem', color:'#4B5563', marginTop:'2px' }}>{c.title}</div>
                        {c.instructor && <div style={{ fontSize:'0.7rem', color:'var(--primary)', fontWeight:700, marginTop:'2px' }}>{c.instructor}</div>}
                        <div style={{ display:'flex', alignItems:'center', gap:'4px', marginTop:'6px' }}>
                          <div style={{ width:'6px', height:'6px', borderRadius:'50%', background: c.spots>0?'#22C55E':'#EF4444' }} />
                          <span style={{ fontSize:'0.68rem', color:'#6B7280', fontWeight:600 }}>{c.spots>0?`${c.spots} lugares`:'Llena'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:'3rem', color:'#6B7280', fontSize:'0.95rem' }}>Horarios próximamente disponibles.</div>
          )}
          <div style={{ textAlign:'center', marginTop:'3rem' }}>
            <button onClick={()=>navigate('/login')} className="btn-primary" style={{ padding:'0.9rem 2.5rem' }}>
              Reservar mi lugar <ArrowRight size={18}/>
            </button>
          </div>
        </div>
      </section>

      {/* ── Precios ────────────────────────────────────────────────── */}
      <section id="precios" style={{ padding:'8rem 5%', background:'white' }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto' }}>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once:true }} style={{ textAlign:'center', marginBottom:'4rem' }}>
            <span style={{ fontSize:'0.75rem', fontWeight:800, letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--primary)' }}>Membresías y paquetes</span>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(2rem,5vw,3rem)', margin:'1rem 0 1rem' }}>Invierte en ti misma.</h2>
            <p style={{ color:'#4B5563', maxWidth:'500px', margin:'0 auto', fontSize:'1rem', lineHeight:1.7 }}>Sin contratos. Sin letra chica. Solo resultados. Todos los paquetes tienen vigencia de 30 días.</p>
          </motion.div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:'1.5rem', alignItems:'stretch' }}>
            <PricingCard
              title="Clase Suelta"
              price="$XXX"
              desc="Perfecta para probar. Úsala cuando quieras dentro del mes."
              features={['1 clase de tu elección','Vigencia 30 días','Acceso a la App','Sin compromisos']}
              cta="Comprar clase"
              onClick={() => navigate('/planes')}
            />
            <PricingCard
              title="Paquete 10 Clases"
              price="$XXX"
              desc="El más popular. Constancia que se transforma en resultados."
              features={['10 clases de cualquier tipo','Vigencia 30 días','Acceso completo a la App','Lista de espera automática']}
              cta="Elegir paquete"
              featured
              onClick={() => navigate('/planes')}
            />
            <PricingCard
              title="Paquete 20 Clases"
              price="$XXX"
              desc="Para las que van en serio. La mejor relación precio-resultado."
              features={['20 clases de cualquier tipo','Vigencia 30 días','Acceso completo a la App','Prioridad en horarios populares']}
              cta="Elegir paquete"
              onClick={() => navigate('/planes')}
            />
          </div>
          <p style={{ textAlign:'center', marginTop:'2rem', fontSize:'0.82rem', color:'#9CA3AF' }}>
            * Todos los precios en MXN · IVA incluido · Vigencia 30 días desde activación · No reembolsables
          </p>
        </div>
      </section>

      {/* ── Cafetería ──────────────────────────────────────────────── */}
      <section id="cafeteria" style={{ padding:'8rem 5%', background:'#FAF9F6' }}>
        <div style={{ maxWidth:'1200px', margin:'0 auto' }}>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once:true }} style={{ display:'flex', flexWrap:'wrap', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'4rem', gap:'2rem' }}>
            <div>
              <span style={{ fontSize:'0.75rem', fontWeight:800, letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--primary)' }}>Cafetería Be Fit Lab</span>
              <h2 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(2rem,5vw,3rem)', margin:'1rem 0 0.5rem' }}>Nutre tu esfuerzo.</h2>
              <p style={{ color:'#4B5563', maxWidth:'480px', fontSize:'1rem', lineHeight:1.7 }}>Bebidas, suplementos y snacks saludables seleccionados por nuestro equipo de nutrición. Recoge en el estudio.</p>
            </div>
            <a href={`https://wa.me/${WA_NUMBER}?text=Hola%20Be%20Fit%20Lab%2C%20quiero%20ordenar%20de%20la%20cafeter%C3%ADa%20%F0%9F%8D%91`} target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', gap:'8px', background:'#22C55E', color:'white', padding:'12px 22px', borderRadius:'30px', textDecoration:'none', fontWeight:700, fontSize:'0.9rem', flexShrink:0 }}>
              <MessageCircle size={18}/> Ordenar por WhatsApp
            </a>
          </motion.div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))', gap:'1.5rem' }}>
            {CAFE_PRODUCTS.map(product => (
              <motion.div key={product.id} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once:true }}
                style={{ background:'white', borderRadius:'24px', overflow:'hidden', border:'1px solid rgba(0,0,0,0.04)', boxShadow:'0 4px 20px rgba(0,0,0,0.04)', transition:'transform 0.2s', cursor:'default' }}
                whileHover={{ y: -4 }}
              >
                <div style={{ background:product.bg, padding:'2.5rem', textAlign:'center', fontSize:'3rem' }}>{product.emoji}</div>
                <div style={{ padding:'20px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:'6px' }}>
                    <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.1rem', margin:0, color:'var(--black)' }}>{product.name}</h3>
                    <span style={{ fontWeight:800, color:'var(--primary)', fontSize:'1.05rem' }}>{product.price}</span>
                  </div>
                  <p style={{ fontSize:'0.83rem', color:'#6B7280', margin:'0 0 14px', lineHeight:1.5 }}>{product.desc}</p>
                  <a href={`https://wa.me/${WA_NUMBER}?text=Hola%2C%20quiero%20ordenar%3A%20${encodeURIComponent(product.name)}`} target="_blank" rel="noopener noreferrer"
                    style={{ display:'block', textAlign:'center', padding:'9px', borderRadius:'12px', background:'rgba(34,197,94,0.08)', color:'#16A34A', fontWeight:700, fontSize:'0.82rem', textDecoration:'none', border:'1px solid rgba(34,197,94,0.15)' }}>
                    Pedir por WhatsApp
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonios ────────────────────────────────────────────── */}
      <section style={{ padding:'8rem 5%', background:'#1A1C1E' }}>
        <div style={{ maxWidth:'1200px', margin:'0 auto' }}>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once:true }} style={{ textAlign:'center', marginBottom:'4rem' }}>
            <span style={{ fontSize:'0.75rem', fontWeight:800, letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--primary)' }}>Lo que dicen ellas</span>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(2rem,5vw,3rem)', margin:'1rem 0', color:'white' }}>Resultados reales,<br/><em style={{ color:'var(--primary)' }}>historias reales.</em></h2>
          </motion.div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:'1.5rem' }}>
            {TESTIMONIALS.map(t => (
              <motion.div key={t.name} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once:true }}
                style={{ background:'rgba(255,255,255,0.05)', borderRadius:'24px', padding:'32px', border:'1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display:'flex', gap:'3px', marginBottom:'16px' }}>
                  {[...Array(t.stars)].map((_,i) => <Star key={i} size={16} color="#FF8B42" fill="#FF8B42"/>)}
                </div>
                <p style={{ color:'rgba(255,255,255,0.75)', fontSize:'0.95rem', lineHeight:1.7, margin:'0 0 24px', fontStyle:'italic' }}>"{t.text}"</p>
                <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                  <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:'linear-gradient(135deg,var(--primary),var(--accent))', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, color:'white', flexShrink:0 }}>{t.name.charAt(0)}</div>
                  <div>
                    <div style={{ fontWeight:700, color:'white', fontSize:'0.9rem' }}>{t.name}</div>
                    <div style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.4)' }}>Socia desde {t.since}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── App Download ───────────────────────────────────────────── */}
      <section id="agenda-info" style={{ padding:'8rem 5%', background:'white' }}>
        <div style={{ maxWidth:'1200px', margin:'0 auto', display:'flex', flexWrap:'wrap', gap:'5rem', alignItems:'center' }}>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once:true }} style={{ flex:'1 1 480px' }}>
            <span style={{ fontSize:'0.75rem', fontWeight:800, letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--primary)' }}>Be Fit Lab App</span>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(2rem,5vw,3.2rem)', margin:'1rem 0 1.5rem', lineHeight:1.1 }}>Tu estudio,<br/><em style={{ color:'var(--primary)' }}>en tu bolsillo.</em></h2>
            <p style={{ fontSize:'1.05rem', color:'#4B5563', lineHeight:1.8, marginBottom:'2.5rem' }}>Reserva clases, sigue tu progreso, recibe planes de nutrición personalizados y gestiona tu membresía — todo desde una App diseñada exclusivamente para socias de Be Fit Lab.</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'12px' }}>
              <a href="https://apps.apple.com/mx/app/be-fit-lab/id6772008660" target="_blank" rel="noopener noreferrer">
                <img src="/assets/appstore.svg" alt="App Store" style={{ height:'44px', width:'auto', display:'block' }} />
              </a>
              <img src="/assets/googleplay.svg" alt="Próximamente Google Play" title="Próximamente en Google Play" style={{ height:'44px', width:'auto', opacity:0.35, filter:'grayscale(1)', cursor:'not-allowed' }} />
            </div>
          </motion.div>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once:true }} style={{ flex:'1 1 380px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              {[{icon:<Calendar size={22} color="var(--primary)"/>, t:'Reservas', d:'Agenda y cancela clases en segundos'},{icon:<TrendingUp size={22} color="var(--primary)"/>, t:'Tu progreso', d:'Gráficas de evolución y medidas'},{icon:<Utensils size={22} color="var(--primary)"/>, t:'Nutrición', d:'Planes y recetario personalizado'},{icon:<Smartphone size={22} color="var(--primary)"/>, t:'Todo en uno', d:'App exclusiva para socias activas'}].map(({icon,t,d}) => (
                <div key={t} style={{ background:'#FAF9F6', borderRadius:'20px', padding:'22px', border:'1px solid rgba(0,0,0,0.04)' }}>
                  <div style={{ background:'rgba(255,139,66,0.1)', width:'44px', height:'44px', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'14px' }}>{icon}</div>
                  <div style={{ fontWeight:700, fontSize:'0.9rem', marginBottom:'4px' }}>{t}</div>
                  <div style={{ fontSize:'0.78rem', color:'#6B7280', lineHeight:1.5 }}>{d}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────── */}
      <section id="faq" style={{ padding:'8rem 5%', background:'#FAF9F6' }}>
        <div style={{ maxWidth:'780px', margin:'0 auto' }}>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once:true }} style={{ textAlign:'center', marginBottom:'4rem' }}>
            <span style={{ fontSize:'0.75rem', fontWeight:800, letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--primary)' }}>Preguntas frecuentes</span>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(2rem,5vw,3rem)', margin:'1rem 0' }}>Todo lo que necesitas saber.</h2>
          </motion.div>
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            {FAQ_ITEMS.map((item, i) => (
              <FAQItem key={i} q={item.q} a={item.a} open={openFAQ===i} onToggle={() => setOpenFAQ(openFAQ===i ? null : i)} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Ubicación ──────────────────────────────────────────────── */}
      <section id="ubicacion" style={{ padding:'8rem 5%', background:'white' }}>
        <div style={{ maxWidth:'1200px', margin:'0 auto', display:'flex', flexWrap:'wrap', gap:'5rem', alignItems:'flex-start' }}>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once:true }} style={{ flex:'1 1 380px' }}>
            <span style={{ fontSize:'0.75rem', fontWeight:800, letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--primary)' }}>Encuéntranos</span>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(2rem,5vw,3rem)', margin:'1rem 0 2rem', lineHeight:1.1 }}>Ven a<br/><em style={{ color:'var(--primary)' }}>conocernos.</em></h2>
            <div style={{ display:'flex', flexDirection:'column', gap:'20px', marginBottom:'2.5rem' }}>
              <div style={{ display:'flex', gap:'14px', alignItems:'flex-start' }}>
                <div style={{ background:'rgba(255,139,66,0.1)', width:'42px', height:'42px', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><MapPin size={20} color="var(--primary)"/></div>
                <div>
                  <div style={{ fontWeight:700, marginBottom:'2px' }}>Dirección</div>
                  <div style={{ fontSize:'0.9rem', color:'#4B5563', lineHeight:1.5 }}>
                    {/* Reemplaza con la dirección real */}
                    Calle y número, Colonia,<br/>Ciudad, Estado, CP
                  </div>
                </div>
              </div>
              <div style={{ display:'flex', gap:'14px', alignItems:'flex-start' }}>
                <div style={{ background:'rgba(255,139,66,0.1)', width:'42px', height:'42px', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Phone size={20} color="var(--primary)"/></div>
                <div>
                  <div style={{ fontWeight:700, marginBottom:'2px' }}>Teléfono / WhatsApp</div>
                  <div style={{ fontSize:'0.9rem', color:'#4B5563' }}>+52 (XX) XXXX-XXXX</div>
                </div>
              </div>
              <div style={{ display:'flex', gap:'14px', alignItems:'flex-start' }}>
                <div style={{ background:'rgba(255,139,66,0.1)', width:'42px', height:'42px', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><InstagramIcon size={20} color="var(--primary)"/></div>
                <div>
                  <div style={{ fontWeight:700, marginBottom:'2px' }}>Instagram</div>
                  <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer" style={{ fontSize:'0.9rem', color:'var(--primary)', fontWeight:600 }}>@befitlab</a>
                </div>
              </div>
            </div>
            <a href={`https://wa.me/${WA_NUMBER}?text=Hola%20Be%20Fit%20Lab%2C%20quisiera%20m%C3%A1s%20informaci%C3%B3n%20%F0%9F%8D%91`} target="_blank" rel="noopener noreferrer"
              style={{ display:'inline-flex', alignItems:'center', gap:'10px', background:'#22C55E', color:'white', padding:'14px 28px', borderRadius:'30px', textDecoration:'none', fontWeight:700, fontSize:'0.95rem', boxShadow:'0 8px 24px rgba(34,197,94,0.25)' }}>
              <MessageCircle size={20}/> Contáctanos por WhatsApp
            </a>
          </motion.div>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once:true }} style={{ flex:'1 1 480px' }}>
            {/* Reemplaza el src con el embed real de Google Maps para tu dirección */}
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3762.661!2d-99.1332!3d19.4284!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zBe Fit Lab!5e0!3m2!1ses!2smx!4v1"
              width="100%"
              height="420"
              style={{ border:0, borderRadius:'24px', boxShadow:'0 20px 50px rgba(0,0,0,0.1)', display:'block' }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Be Fit Lab — Ubicación"
            />
          </motion.div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer style={{ background:'#1A1C1E', padding:'5rem 5% 2.5rem' }}>
        <div style={{ maxWidth:'1200px', margin:'0 auto' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'3rem', marginBottom:'4rem' }}>
            <div>
              <img src="/logo.png" alt="Be Fit Lab" style={{ height:'40px', width:'auto', marginBottom:'16px', filter:'brightness(0) invert(1)', display:'block' }} />
              <p style={{ color:'rgba(255,255,255,0.45)', fontSize:'0.85rem', lineHeight:1.7, maxWidth:'220px' }}>The glutes specialists. Transformación real a través del movimiento consciente.</p>
              <div style={{ display:'flex', gap:'12px', marginTop:'20px' }}>
                <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer" style={{ width:'36px', height:'36px', background:'rgba(255,255,255,0.08)', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center' }}><InstagramIcon size={18} color="rgba(255,255,255,0.6)"/></a>
                <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noopener noreferrer" style={{ width:'36px', height:'36px', background:'rgba(255,255,255,0.08)', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center' }}><MessageCircle size={18} color="rgba(255,255,255,0.6)"/></a>
              </div>
            </div>
            <div>
              <div style={{ fontWeight:700, color:'white', fontSize:'0.85rem', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'16px' }}>Estudio</div>
              {[['Clases','clases'],['Horarios','horarios'],['El Estudio','estudio'],['Coaches','coaches']].map(([l,id]) => (
                <button key={id} onClick={() => scrollTo(id)} style={{ display:'block', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.45)', fontSize:'0.88rem', padding:'5px 0', fontFamily:'var(--font-body)', textAlign:'left' }}>{l}</button>
              ))}
            </div>
            <div>
              <div style={{ fontWeight:700, color:'white', fontSize:'0.85rem', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'16px' }}>Membresías</div>
              {[['Precios y paquetes','precios'],['Cafetería','cafeteria'],['Iniciar sesión',null],['Crear cuenta',null]].map(([l,id]) => (
                id
                  ? <button key={l} onClick={() => scrollTo(id)} style={{ display:'block', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.45)', fontSize:'0.88rem', padding:'5px 0', fontFamily:'var(--font-body)', textAlign:'left' }}>{l}</button>
                  : <Link key={l} to={l.includes('sesión')?'/login':'/registro'} style={{ display:'block', color:'rgba(255,255,255,0.45)', fontSize:'0.88rem', padding:'5px 0', textDecoration:'none' }}>{l}</Link>
              ))}
            </div>
            <div>
              <div style={{ fontWeight:700, color:'white', fontSize:'0.85rem', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'16px' }}>Legal</div>
              {[['Términos y condiciones','/terminos'],['Política de privacidad','/privacidad'],['Aviso de cancelación','faq']].map(([l,path]) => (
                path.startsWith('/')
                  ? <Link key={l} to={path} style={{ display:'block', color:'rgba(255,255,255,0.45)', fontSize:'0.88rem', padding:'5px 0', textDecoration:'none' }}>{l}</Link>
                  : <button key={l} onClick={() => scrollTo(path)} style={{ display:'block', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.45)', fontSize:'0.88rem', padding:'5px 0', fontFamily:'var(--font-body)', textAlign:'left' }}>{l}</button>
              ))}
            </div>
          </div>
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.08)', paddingTop:'2rem', display:'flex', flexWrap:'wrap', justifyContent:'space-between', gap:'1rem' }}>
            <p style={{ color:'rgba(255,255,255,0.25)', fontSize:'0.8rem', margin:0 }}>© {new Date().getFullYear()} Be Fit Lab. Todos los derechos reservados.</p>
            <p style={{ color:'rgba(255,255,255,0.25)', fontSize:'0.8rem', margin:0 }}>Made with ♥ in México</p>
          </div>
        </div>
      </footer>

      {/* WhatsApp flotante */}
      <a href={`https://wa.me/${WA_NUMBER}?text=Hola%20Be%20Fit%20Lab%2C%20quisiera%20m%C3%A1s%20informaci%C3%B3n`} target="_blank" rel="noopener noreferrer"
        style={{ position:'fixed', bottom:'28px', right:'24px', zIndex:999, width:'56px', height:'56px', background:'#22C55E', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 24px rgba(34,197,94,0.4)', transition:'transform 0.2s' }}
        onMouseOver={e=>e.currentTarget.style.transform='scale(1.1)'}
        onMouseOut={e=>e.currentTarget.style.transform='scale(1)'}
        aria-label="WhatsApp"
      >
        <MessageCircle size={26} color="white" />
      </a>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ClassCard({ icon, title, desc, tag, bgImage, onClick }) {
  return (
    <motion.div whileHover={{ y: -6 }} onClick={onClick}
      style={{ background:'white', borderRadius:'28px', padding:'2rem', cursor:'pointer', position:'relative', overflow:'hidden', border:'1px solid rgba(0,0,0,0.04)', boxShadow:'0 4px 20px rgba(0,0,0,0.05)',
        backgroundImage: bgImage ? `linear-gradient(rgba(255,255,255,0.88),rgba(255,255,255,0.95)),url(${bgImage})` : undefined,
        backgroundSize:'cover', backgroundPosition:'center', transition:'box-shadow 0.2s, transform 0.2s' }}>
      {tag && <div style={{ position:'absolute', top:'16px', right:'16px', background:'var(--primary)', color:'white', fontSize:'0.65rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.08em', padding:'4px 10px', borderRadius:'20px' }}>{tag}</div>}
      <div style={{ marginBottom:'1.5rem' }}>{icon}</div>
      <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.5rem', marginBottom:'0.75rem', color:'var(--black)' }}>{title}</h3>
      <p style={{ color:'#4B5563', fontSize:'0.92rem', lineHeight:1.6, marginBottom:'1.5rem' }}>{desc}</p>
      <div style={{ display:'flex', alignItems:'center', gap:'6px', color:'var(--primary)', fontSize:'0.88rem', fontWeight:700 }}>
        Ver horarios <ArrowRight size={16}/>
      </div>
    </motion.div>
  );
}

function PricingCard({ title, price, desc, features, cta, featured, onClick }) {
  return (
    <motion.div whileHover={{ y: -4 }}
      style={{ background: featured ? '#1A1C1E' : 'white', borderRadius:'28px', padding:'2.5rem', border: featured ? 'none' : '1px solid rgba(0,0,0,0.06)', boxShadow: featured ? '0 30px 60px rgba(0,0,0,0.2)' : '0 4px 20px rgba(0,0,0,0.04)', position:'relative', display:'flex', flexDirection:'column', gap:'0' }}>
      {featured && <div style={{ position:'absolute', top:'-12px', left:'50%', transform:'translateX(-50%)', background:'var(--primary)', color:'white', fontSize:'0.7rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.08em', padding:'5px 16px', borderRadius:'20px', whiteSpace:'nowrap' }}>Más popular</div>}
      <div style={{ marginBottom:'1.5rem' }}>
        <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.4rem', margin:'0 0 6px', color: featured ? 'white' : 'var(--black)' }}>{title}</h3>
        <p style={{ fontSize:'0.85rem', color: featured ? 'rgba(255,255,255,0.5)' : '#6B7280', margin:0 }}>{desc}</p>
      </div>
      <div style={{ marginBottom:'1.5rem' }}>
        <span style={{ fontFamily:'var(--font-display)', fontSize:'2.8rem', fontWeight:400, color: featured ? 'white' : 'var(--black)', lineHeight:1 }}>{price}</span>
        <span style={{ fontSize:'0.8rem', color: featured ? 'rgba(255,255,255,0.4)' : '#9CA3AF', marginLeft:'6px' }}>MXN</span>
      </div>
      <ul style={{ listStyle:'none', padding:0, margin:'0 0 2rem', display:'flex', flexDirection:'column', gap:'10px', flex:1 }}>
        {features.map(f => (
          <li key={f} style={{ display:'flex', gap:'10px', alignItems:'flex-start', fontSize:'0.88rem', color: featured ? 'rgba(255,255,255,0.7)' : '#374151' }}>
            <CheckCircle2 size={16} color="var(--primary)" style={{ flexShrink:0, marginTop:'2px' }}/> {f}
          </li>
        ))}
      </ul>
      <button onClick={onClick} style={{ width:'100%', padding:'13px', borderRadius:'14px', border: featured ? 'none' : '2px solid var(--primary)', background: featured ? 'var(--primary)' : 'transparent', color: featured ? 'white' : 'var(--primary)', fontWeight:700, fontSize:'0.9rem', cursor:'pointer', fontFamily:'var(--font-body)', transition:'all 0.2s' }}
        onMouseOver={e=>{if(!featured){e.currentTarget.style.background='var(--primary)';e.currentTarget.style.color='white';}}}
        onMouseOut={e=>{if(!featured){e.currentTarget.style.background='transparent';e.currentTarget.style.color='var(--primary)';}}}
      >{cta}</button>
    </motion.div>
  );
}

function FAQItem({ q, a, open, onToggle }) {
  return (
    <div style={{ background:'white', borderRadius:'16px', border:'1px solid rgba(0,0,0,0.06)', overflow:'hidden' }}>
      <button onClick={onToggle} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', background:'none', border:'none', cursor:'pointer', textAlign:'left', gap:'16px', fontFamily:'var(--font-body)' }}>
        <span style={{ fontWeight:700, fontSize:'0.95rem', color:'var(--black)', lineHeight:1.4 }}>{q}</span>
        <ChevronDown size={20} color="var(--primary)" style={{ flexShrink:0, transform: open ? 'rotate(180deg)' : 'rotate(0)', transition:'transform 0.25s' }} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:0.25 }} style={{ overflow:'hidden' }}>
            <div style={{ padding:'0 24px 20px', fontSize:'0.9rem', color:'#4B5563', lineHeight:1.7 }}>{a}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Landing;
