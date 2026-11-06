import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { CursorGlow, Contador, useEsEscritorio, Escena, irASeccion, FraseEncendida } from '../components/landing/Inmersivo';
import { irConTransicion } from '../components/TransicionesWeb';
import HeroEscritorio from '../components/landing/HeroEscritorio';
import SeccionCoaches from '../components/landing/SeccionCoaches';
import { BotonMenu, MenuMovil } from '../components/landing/MenuMovil';
import { mapaRefraccion } from '../lib/lente';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);
import { ScheduleCalendar } from '../components/ScheduleCalendar';
import { PricingCarousel } from '../components/PricingCarousel';
import { ArrowRight, Flame, Heart, PlayCircle, Smartphone, Menu, X, Calendar, TrendingUp,
         Utensils, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, MapPin, Phone, MessageCircle, Star, LogOut } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence, useScroll, useTransform, useSpring as useMotionSpring, useMotionValueEvent } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import PolaroidGallery from '../components/PolaroidGallery';
import LandingEvento from '../components/LandingEvento';
import { ESTUDIO } from '../config/estudio';

// Link de react-router con animaciones de framer-motion (hover naranja + desplazamiento)
const MotionLink = motion(Link);

// ── Instagram SVG (not in lucide-react v1.x) ─────────────────────────────────
const InstagramIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="0.5" fill={color} stroke="none"/>
  </svg>
);

// ── Glass styles ──────────────────────────────────────────────────────────────
const glass = {
  background: 'rgba(255,255,255,0.55)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.45)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.7)',
};
const glassDark = {
  background: 'rgba(13,13,12,0.7)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.07)',
  boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
};
const glassMid = {
  background: 'rgba(255,255,255,0.35)',
  backdropFilter: 'blur(16px) saturate(160%)',
  WebkitBackdropFilter: 'blur(16px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.3)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
};

// ── Framer variants ───────────────────────────────────────────────────────────
const SPRING      = { type: 'spring', stiffness: 300, damping: 28 };
const BOUNCE      = { type: 'spring', stiffness: 420, damping: 18 };
const SLOW_SPRING = { type: 'spring', stiffness: 200, damping: 30 };

const fadeUp = {
  hidden:  { opacity: 0, y: 48, filter: 'blur(6px)' },
  visible: { opacity: 1, y: 0,  filter: 'blur(0px)', transition: { ...SPRING } },
};
const scaleIn = {
  hidden:  { opacity: 0, scale: 0.88, y: 20 },
  visible: { opacity: 1, scale: 1,    y: 0,  transition: { ...SPRING } },
};
const stagger = (delay = 0.07) => ({
  hidden:  {},
  visible: { transition: { staggerChildren: delay, delayChildren: 0.05 } },
});
const slideRight = {
  hidden:  { opacity: 0, x: -50, filter: 'blur(6px)' },
  visible: { opacity: 1, x: 0,   filter: 'blur(0px)', transition: { ...SLOW_SPRING } },
};
const slideLeft = {
  hidden:  { opacity: 0, x: 50,  filter: 'blur(6px)' },
  visible: { opacity: 1, x: 0,   filter: 'blur(0px)', transition: { ...SLOW_SPRING } },
};

// ── Floating blob ─────────────────────────────────────────────────────────────
const Blob = ({ style }) => (
  <motion.div
    animate={{ y: [0, -22, 0], x: [0, 12, 0], scale: [1, 1.05, 1] }}
    transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
    style={{ position: 'absolute', borderRadius: '50%', filter: 'blur(70px)', pointerEvents: 'none', zIndex: 0, ...style }}
  />
);

// ── Data ──────────────────────────────────────────────────────────────────────
const CAFE_PRODUCTS = [
  { id:1, name:'Agua de Jamaica',  price:'$45', desc:'Fresca, sin azúcar añadida. Antioxidante natural.',        emoji:'🌺', bg:'rgba(255,180,160,0.25)' },
  { id:2, name:'Smoothie Verde',   price:'$85', desc:'Espinaca, manzana, jengibre y proteína vegetal.',          emoji:'🥑', bg:'rgba(160,210,160,0.25)' },
  { id:3, name:'Cold Brew',        price:'$65', desc:'Cold brew de especialidad con leche de almendra.',         emoji:'☕', bg:'rgba(200,170,130,0.25)' },
  { id:4, name:'Matcha Latte',     price:'$75', desc:'Matcha de grado ceremonial. Con leche de avena.',          emoji:'🍵', bg:'rgba(140,190,140,0.25)' },
  { id:5, name:'Barra Proteica',   price:'$55', desc:'Chocolate y almendra. 20 g de proteína.',                  emoji:'🍫', bg:'rgba(180,140,120,0.25)' },
  { id:6, name:'Agua de Coco',     price:'$50', desc:'Hidratación natural. Perfecta post-entrenamiento.',        emoji:'🥥', bg:'rgba(220,200,160,0.25)' },
];
const TESTIMONIALS = [
  { name:'Ailed Mastranzo', since:'Hace 8 meses', stars:5, text:'Increíble lugar y ambiente; entrenamiento para mujeres, la vibra es súper linda lo recomiendo bastante' },
  { name:'Lulu Ramirez', since:'Hace 8 meses', stars:5, text:'Be fit lab se convirtió en uno de mis lugares favoritos, me encanta la hermosa comunidad que hay, las couches son las mejores, siempre nos motivan y nos consienten mucho, en definitiva el mejor lugar para hacer ejercicio 🫶🏼' },
  { name:'Daphne Gonzalez Gonzalez', since:'Hace 10 meses', stars:5, text:'me encanta!!! el mejor lugar para demostrarte amor propio!!. No solo es un lugar para hacer ejercicio, de verdad es como una familia!' },
  { name:'Sandygilsa', since:'Hace 8 meses', stars:5, text:'Me encanta formar parte de una comunidad tan bonita, me está ayudando para ser constante en el ejercicio y sus actividades y eventos nos motivan a cuidar nuestro cuerpo 🤍' },
  { name:'Daniela Todd', since:'Hace 9 meses', stars:5, text:'Me encanta ser parte de BeFit Lab, me hace sentir siempre motivada y segura de mi misma gracias al ambiente y las coaches' },
  { name:'Yolanda Maldonado', since:'Hace 8 meses', stars:5, text:'El mejor fitnes studio, la atención es increíble y personalizada, además de que el lugar está de 100%. Gracias por lugares como este' },
  { name:'Hector Ochoa', since:'Hace un año', stars:5, text:'A mi esposa le encanta y veo grandes cambios en ella asi como fisicos y desestres , muy bien este estudio super recomendable y gracias a este estudio por todo lo que hacen por ellas y por mi esposa' },
];
const FAQ_ITEMS = [
  { q:'¿Cuál es la política de cancelación?',      a:'Puedes cancelar o reagendar con al menos 5 horas de anticipación sin penalización. Cancelaciones con menos de 5 horas se contarán como clase consumida.' },
  { q:'¿Necesito llevar algo especial?',            a:'Es obligatorio el uso de calcetines antiderrapantes (los vendemos en recepción desde $80). Lleva ropa cómoda de ejercicio y tu botella de agua.' },
  { q:'¿Los paquetes tienen fecha de vencimiento?', a:'Todos los paquetes tienen vigencia de 30 días a partir de su activación, sin importar el número de clases incluidas. No se hacen reembolsos.' },
  { q:'¿Puedo venir si soy principiante?',          a:'¡Claro! Todas nuestras clases contemplan niveles mixtos. Te recomendamos empezar con clases "Básico" y nuestras coaches te guiarán en todo momento.' },
  { q:'¿Con cuánta anticipación debo llegar?',      a:'Llega al menos 10 minutos antes. Las puertas se cierran al iniciar la clase por respeto a todas las participantes.' },
  { q:'¿Cómo reservo mi lugar?',                    a:'A través de nuestra App (disponible en App Store y Google Play) o iniciando sesión en este sitio. Las reservas abren 7 días antes de cada clase.' },
];
const WA_NUMBER = ESTUDIO.contacto.whatsapp; // +52 221 266 4253

// ─────────────────────────────────────────────────────────────────────────────

// ── Parallax Testimonials — GSAP ScrollTrigger ───────────────────────────────
const ParallaxTestimonials = () => {
  const sectionRef  = useRef(null);
  const titleRef    = useRef(null);
  const cardsRef    = useRef(null);
  const cardRefs    = useRef([]);

  const alignments  = ['flex-start', 'flex-end', 'center'];

  // En móvil desactivamos los efectos caros (blobs animados + backdrop-filter +
  // animaciones flotantes infinitas) que causaban lentitud; en PC se mantienen.
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => {
    const onR = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(min-width: 768px)', () => {
        // ── 1. Título: se mueve MÁS LENTO que el scroll (0.3× velocidad)
        gsap.to(titleRef.current, {
          y: -120,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1.2,
          },
        });

        // ── 2. Grupo de tarjetas: sube MUCHO MÁS RÁPIDO (efecto principal)
        //    Arranca 500px abajo del viewport y termina en su posición natural
        gsap.fromTo(
          cardsRef.current,
          { y: 500 },
          {
            y: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top bottom',    // empieza cuando la sección entra por abajo
              end: 'center center',   // termina cuando el centro de la sección llega al centro del viewport
              scrub: 1.5,
            },
          }
        );

        // ── 3. Cada tarjeta individual con velocidad ligeramente diferente
        cardRefs.current.forEach((card, i) => {
          if (!card) return;
          const speed = [1.8, 1.4, 1.1][i] ?? 1;  // primera sube más rápido
          gsap.fromTo(
            card,
            { y: i * 60 },
            {
              y: -(i * 30),
              ease: 'none',
              scrollTrigger: {
                trigger: sectionRef.current,
                start: 'top bottom',
                end: 'bottom top',
                scrub: speed,
              },
            }
          );
        });
      });

      // Mobile: versión más suave
      mm.add('(max-width: 767px)', () => {
        gsap.fromTo(
          cardsRef.current,
          { y: 300 },
          {
            y: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top bottom',
              end: 'center center',
              scrub: 1.2,
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      style={{ background: '#F6EFE8', position: 'relative', overflow: 'clip', minHeight: '140vh', paddingBottom: '10vh' }}
    >
      {/* Blobs decorativos — animados solo en PC (en móvil estáticos y con menos blur) */}
      {/* Luz suave y QUIETA (antes: manchas azules moviéndose sin parar). */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '70vw', height: '70vw', background: 'radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 70%)', filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Título — se mueve lento (GSAP lo anima) */}
      <div
        ref={titleRef}
        style={{ position: 'sticky', top: '15vh', zIndex: 1, textAlign: 'center', paddingTop: '15vh', pointerEvents: 'none' }}
      >
        <span style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--primary)' }}>
          Comunidad
        </span>
        <h2 style={{ fontSize: 'clamp(3.5rem,8vw,7.5rem)', margin: '1rem 0 0', color: 'var(--black)', letterSpacing: '-0.04em', lineHeight: 1 }}>
          Resultados<br/>reales.
        </h2>
      </div>

      {/* Tarjetas — suben más rápido (GSAP ScrollTrigger) */}
      <div
        ref={cardsRef}
        style={{ position: 'relative', zIndex: 2, maxWidth: '900px', margin: '0 auto', padding: '0 5%', paddingTop: '5vh' }}
      >
        {TESTIMONIALS.map((t, i) => (
          <div
            key={t.name}
            ref={el => (cardRefs.current[i] = el)}
            style={{
              display: 'flex',
              justifyContent: alignments[i % alignments.length],
              // Horizontal offset extra para mayor separación izq/der
              paddingLeft:  i % 3 === 0 ? '0%'  : i % 3 === 1 ? '18%' : '8%',
              paddingRight: i % 3 === 0 ? '18%' : i % 3 === 1 ? '0%'  : '8%',
              marginTop: i === 0 ? 0 : '40px',
              position: 'relative',
              zIndex: i + 1,
            }}
          >
            {/* Floating idle animation — solo en PC; en móvil rotación estática */}
            {/* Tarjeta derecha y quieta (antes giraba y flotaba sin parar); la subida
                al bajar (GSAP) se conserva. */}
            <motion.div
              whileHover={isMobile ? undefined : { y: -4, transition: { duration: 0.3 } }}
              style={{ width: '100%', maxWidth: '420px' }}
            >
              <div style={{ background: '#ffffff', border: '1px solid rgba(26,23,20,0.08)', borderRadius: '24px', padding: '30px 32px', boxShadow: '0 18px 40px rgba(60,35,20,0.07)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <span aria-hidden="true" style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: '3.2rem', lineHeight: 0.6, color: 'var(--primary)', paddingTop: '18px' }}>“</span>
                  <div style={{ display: 'flex', gap: '3px' }}>
                    {[...Array(t.stars)].map((_, s) => <Star key={s} size={13} color="var(--primary)" fill="var(--primary)" />)}
                  </div>
                </div>
                <p style={{ color: 'var(--on-surface)', fontSize: '1.02rem', lineHeight: 1.65, margin: '0 0 24px', fontWeight: 500 }}>{t.text}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--app-bg)', color: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0, fontSize: '1rem' }}>{t.name.charAt(0)}</div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--black)', fontSize: '0.95rem' }}>{t.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>Reseña en Google · {t.since.toLowerCase()}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default function Landing() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, role, membershipStatus, globalClasses, coaches, badgeConfigs, logout, disciplines } = useAuth();
  // Montos de clase suelta e inscripción: los mismos que cobra el servidor (app_config, lectura pública).
  const [precios, setPrecios] = useState({ claseSuelta: null, inscripcion: null });
  useEffect(() => {
    let vivo = true;
    supabase.from('app_config').select('clase_suelta_monto, inscripcion_monto').eq('id', 1).single()
      .then(({ data }) => { if (vivo && data) setPrecios({ claseSuelta: Number(data.clase_suelta_monto) || null, inscripcion: Number(data.inscripcion_monto) || null }); });
    return () => { vivo = false; };
  }, []);
  const escritorio = useEsEscritorio();
  // Mapa de refracción de la barra de vidrio (solo Chromium, como la barra de la app).
  const navRef = useRef(null);
  const [mapaNav, setMapaNav] = useState(null);
  useEffect(() => {
    const ua = navigator.userAgent;
    if (!/Chrome|Chromium|Edg\//.test(ua) || /iPhone|iPad|iPod|CriOS/.test(ua)) return undefined;
    let ultimo = '';
    const medir = () => {
      const el = navRef.current; if (!el) return;
      const w = Math.round(el.offsetWidth), h = Math.round(el.offsetHeight);
      if (w < 50 || h < 30 || `${w}x${h}` === ultimo) return;
      ultimo = `${w}x${h}`;
      try { setMapaNav({ url: mapaRefraccion(w, h, h / 2, 16), w, h }); } catch { setMapaNav(null); }
    };
    medir();
    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, []);
  const [discActiva, setDiscActiva] = useState(0);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [origenMenu, setOrigenMenu] = useState(null);
  const [showToast,  setShowToast]  = useState(false);
  const [scrolled,   setScrolled]   = useState(false);
  const [openFAQ,    setOpenFAQ]    = useState(null);
  const [selectedDiscipline, setSelectedDiscipline] = useState(null);
  
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center' });
  const scrollPrev = useCallback(() => { if (emblaApi) emblaApi.scrollPrev(); }, [emblaApi]);
  const scrollNext = useCallback(() => { if (emblaApi) emblaApi.scrollNext(); }, [emblaApi]);
  // Disciplina al centro del carrusel (en celular se resalta sola).
  useEffect(() => {
    if (!emblaApi) return undefined;
    const fn = () => setDiscActiva(emblaApi.selectedScrollSnap());
    emblaApi.on('select', fn); emblaApi.on('reInit', fn);
    return () => { emblaApi.off('select', fn); emblaApi.off('reInit', fn); };
  }, [emblaApi]);

  useEffect(() => {
    if (location.state?.registered) { setShowToast(true); const t = setTimeout(() => setShowToast(false), 5000); return () => clearTimeout(t); }
  }, [location]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // Bloqueo de scroll con el menú abierto, en un efecto: se libera al cerrar Y al salir
  // de esta pantalla (antes, ir a Login desde el menú dejaba la siguiente pantalla sin scroll).
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const scrollTo = (id) => { setMenuOpen(false); if(id === 'cafeteria') { navigate('/cafeteria'); return; } irASeccion(id); };

  // Schedule
  const DAYS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const recurring  = globalClasses.filter(c => !c.date);
  const schedule   = [1,2,3,4,5,6].map(d => ({
    label:   DAYS[d],
    classes: recurring.filter(c => Number(c.day) === d).sort((a,b) => a.time.localeCompare(b.time)),
  })).filter(d => d.classes.length > 0);

  return (
    <div style={{ fontFamily:'var(--font-body)', overflowX:'clip' /* 'hidden' rompería el sticky de las secciones inmersivas */ }}>
      <CursorGlow />

      {/* ── Toast ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showToast && (
          <motion.div initial={{ opacity:0, y:-40, scale:0.9 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:-40, scale:0.9 }} transition={SPRING}
            style={{ position:'fixed', top:'20px', right:'20px', zIndex:9999, ...glass, padding:'15px 20px', borderRadius:'18px', display:'flex', alignItems:'center', gap:'15px' }}>
            <CheckCircle2 size={22} color="var(--primary)"/>
            <div>
              <h4 style={{ margin:'0 0 2px', fontSize:'0.95rem', fontFamily:'var(--font-display)' }}>¡Bienvenida a {ESTUDIO.nombre}!</h4>
              <p style={{ margin:0, fontSize:'0.8rem', color:'#6B7280' }}>Tu cuenta fue creada exitosamente.</p>
            </div>
            <button onClick={() => setShowToast(false)} style={{ background:'none', border:'none', cursor:'pointer', display:'flex' }}><X size={18}/></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Nav ───────────────────────────────────────────────────── */}
      {/* Barra de vidrio líquido (la misma familia que la barra de la app): píldora
          flotante con desenfoque, filo de luz y brillo; en Chrome además dobla el fondo
          en las orillas (refracción con filtro SVG, ver lib/lente.js). */}
      {mapaNav && (
        <svg width="0" height="0" style={{ position:'absolute' }} aria-hidden="true">
          <filter id="lg-refraccion-sitio" x="0" y="0" width="100%" height="100%" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feImage href={mapaNav.url} x="0" y="0" width={mapaNav.w} height={mapaNav.h} result="mapa" preserveAspectRatio="none" />
            <feDisplacementMap in="SourceGraphic" in2="mapa" scale="34" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
      )}
      <motion.nav
        ref={navRef}
        className="lg-nav"
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ...SPRING, delay: 0.2 }}
        style={mapaNav ? { backdropFilter:'url(#lg-refraccion-sitio) blur(12px) saturate(190%) brightness(1.06)' } : undefined}>
        <span className="lg-brillo" aria-hidden="true" />
        <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.97 }} onClick={() => window.scrollTo({ top:0, behavior:'smooth' })} style={{ background:'none', border:'none', cursor:'pointer', padding:0, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', height: '100%' }}>
          {/* Solo el durazno (pedido de Zahir); el logo completo queda en el pie de página. */}
          <img src={ESTUDIO.marca.icono} alt={ESTUDIO.nombre} style={{ height:'40px', width:'auto', objectFit: 'contain' }}/>
        </motion.button>

        <div className="desktop-links" style={{ display:'flex', gap:'2rem', alignItems:'center' }}>
          {[['Clases','clases'],['Horarios','horarios'],['Precios','precios'],['Studio','estudio'],['Cafetería','cafeteria']].map(([label,id]) => (
            <motion.button key={id} whileHover={{ scale:1.05, color:'var(--primary)' }} whileTap={{ scale:0.95 }} onClick={() => scrollTo(id)}
              style={{ background:'none', border:'none', cursor:'pointer', fontSize:'0.88rem', fontWeight:500, color:'var(--black)', fontFamily:'var(--font-body)', transition:'color 0.2s' }}>
              {label}
            </motion.button>
          ))}
        </div>

        <div className="desktop-actions" style={{ display:'flex', gap:'1rem', alignItems:'center' }}>
          {user
            ? <>
                <Link to={role==='ADMIN' ? '/admin' : membershipStatus==='ACTIVE' ? '/portal' : '/planes'} style={{ fontSize:'0.88rem', fontWeight:500, textDecoration:'none', color:'var(--on-surface)' }}>Mi Portal</Link>
                <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.96 }} onClick={() => logout()} title="Cerrar sesión"
                  style={{ display:'flex', alignItems:'center', gap:'6px', background:'none', border:'none', cursor:'pointer', fontSize:'0.88rem', fontWeight:500, color:'var(--on-surface)', fontFamily:'var(--font-body)' }}>
                  <LogOut size={16} /> Salir
                </motion.button>
              </>
            : <Link to="/login" style={{ fontSize:'0.88rem', fontWeight:500, textDecoration:'none', color:'var(--on-surface)' }}>Iniciar Sesión</Link>
          }
          <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.96 }} onClick={() => irASeccion('precios')} className="btn-primary" style={{ padding:'0.55rem 1.6rem', fontSize:'0.88rem' }}>
            Comenzar
          </motion.button>
        </div>

        <BotonMenu abierto={menuOpen} onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setOrigenMenu({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
          setMenuOpen(!menuOpen);
        }} />
      </motion.nav>

      {/* Menú de celular: círculo que se abre desde el botón + lista editorial (MenuMovil.jsx). */}
      <MenuMovil
        abierto={menuOpen}
        origen={origenMenu}
        items={[['Clases','clases'],['Horarios','horarios'],['Precios','precios'],['Coaches','coaches'],['Studio','estudio'],['Cafetería','cafeteria'],['Contacto','ubicacion']]}
        onIr={scrollTo}
        onCerrar={() => setMenuOpen(false)}
        user={user}
        destinoCuenta={user ? (role==='ADMIN' ? '/admin' : '/portal') : '/login'}
        onLogout={() => { setMenuOpen(false); logout(); }}
        whatsapp={WA_NUMBER}
        instagram={ESTUDIO.contacto.instagramUrl}
      />

      {/* ── Membership banner ─────────────────────────────────────── */}
      {user && role==='CLIENT' && membershipStatus!=='ACTIVE' && (
        <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} transition={SPRING}
          style={{ position:'fixed', top:'80px', left:'50%', transform:'translateX(-50%)', zIndex:998, width:'94%', maxWidth:'600px', ...glass, borderRadius:'16px', padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', flex:1 }}>
            <div style={{ width:'34px', height:'34px', borderRadius:'50%', background:'linear-gradient(135deg,var(--primary),var(--accent))', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <span style={{ color:'white', fontWeight:800, fontSize:'0.85rem' }}>{user.email?.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <div style={{ fontSize:'0.85rem', fontWeight:700 }}>Hola, {user.user_metadata?.full_name || user.email?.split('@')[0]}</div>
              <div style={{ fontSize:'0.7rem', color:'#6B7280' }}>Aún no tienes membresía activa</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', flexShrink:0 }}>
            <Link to="/planes" style={{ padding:'7px 16px', borderRadius:'20px', background:'var(--primary)', color:'white', fontSize:'0.75rem', fontWeight:700, cursor:'pointer', textDecoration:'none' }}>Ver Planes</Link>
            <button onClick={() => logout()} title="Cerrar sesión" aria-label="Cerrar sesión"
              style={{ width:'34px', height:'34px', borderRadius:'50%', border:'none', background:'rgba(0,0,0,0.06)', color:'#6B7280', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
              <LogOut size={16} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Cada sección es una ESCENA con su propia entrada/salida (hoja, expandir o normal),
          variadas a propósito para que el recorrido no repita siempre lo mismo. */}
      <Escena z={1} fondo="var(--app-bg)" salida="apilar">
      {/* ════════════════════════════════════════════════════════════ */}
      {/* HERO — ACTUALIZADO CON NUEVA FOTO                           */}
      {/* ════════════════════════════════════════════════════════════ */}
      {/* Portada: foto con marco y título gigante abajo a la izquierda (HeroEscritorio). */}
      <HeroEscritorio
        user={user}
        destinoPortal={role==='ADMIN' ? '/admin' : membershipStatus==='ACTIVE' ? '/portal' : '/planes'}
        precioClase={precios.claseSuelta}
        onPrimeraClase={(e) => { try { localStorage.setItem('befit_redirect_after_auth', '/planes?comprar=clase_suelta'); } catch { /* sin storage */ } irConTransicion('/registro', e); }}
        onApp={() => scrollTo('agenda-info')}
        onEntrar={(destino) => irConTransicion(destino)}
      />

      </Escena>
      <Escena z={2} fondo="var(--app-bg)" entrada="hoja">
      {/* ── Stats bar — Clean Editorial ──────────────────────────────── */}
      <section style={{ padding:'5rem 5% 4rem', borderBottom:'1px solid rgba(0,0,0,0.05)', marginTop: '-1rem' }}>
        <div style={{ maxWidth:'1200px', margin:'0 auto' }}>
          <motion.div
            variants={stagger(0.1)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once:true, margin:'-60px' }}
            className="stats-grid"
          >
            {[
              { to:1000, suffix:'+', label:'Mujeres transformadas' },
              { to:10,   suffix:'',  label:'Disciplinas de élite'  },
              { to:12,   suffix:'',  label:'Máx. alumnas por clase'},
              { to:100,  suffix:'%', label:'Equipo premium'        },
            ].map(({ to, suffix, label }, i) => (
              <motion.div
                key={label}
                variants={{
                  hidden:  { opacity:0, y:20 },
                  visible: { opacity:1, y:0, transition:{ ...SPRING, delay: i * 0.08 } },
                }}
                style={{ textAlign:'center' }}
              >
                <div style={{
                  fontFamily:'var(--font-body)',
                  fontSize:'clamp(2.5rem,8vw,5.5rem)',
                  fontWeight:800,
                  color:'var(--primary)',
                  lineHeight:1,
                  letterSpacing:'-0.04em',
                  marginBottom:'0.8rem',
                }}>
                  <Contador to={to} suffix={suffix}/>
                </div>
                <div style={{
                  fontSize:'0.75rem',
                  fontWeight:700,
                  color:'var(--on-surface-variant)',
                  textTransform:'uppercase',
                  letterSpacing:'0.15em',
                }}>
                  {label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
        {/* Bottom rule */}
        <div style={{ position:'absolute', bottom:0, left:'5%', right:'5%', height:'1px', background:'rgba(255,255,255,0.07)' }}/>
      </section>

      {/* ── Próximo evento (abierto al público, no solo socias) ───── */}
      {/* Solo se pinta si hay un evento con inscripción abierta. */}
      <LandingEvento />

      </Escena>
      <Escena z={3} fondo="#FFFFFF">
      {/* ── El Método ─────────────────────────────────────────────── */}
      <section id="metodo" style={{ padding:'var(--esp-seccion) 5%', background:'var(--surface-lowest)', position:'relative', overflow:'hidden' }}>
        <div style={{ maxWidth:'1200px', margin:'0 auto', display:'flex', flexWrap:'wrap', gap:'6rem', alignItems:'center' }}>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once:true, margin:"-100px" }} style={{ flex:'1 1 500px' }}>
            <span style={{ fontSize:'0.85rem', fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--on-surface-variant)' }}>Nuestro método</span>
            <h2 style={{ fontSize:'clamp(3rem,6vw,4.5rem)', lineHeight:1.05, margin:'1.5rem 0 2rem', letterSpacing:'-0.04em', color:'var(--black)' }}>
              Glúteos.<br/>Fuerza.<br/><span style={{ color:'var(--primary)', fontFamily:"'Playfair Display', serif", fontStyle:'italic', fontWeight:500 }}>Transformación real.</span>
            </h2>
            {/* Se enciende palabra por palabra al bajar (ref. Dhun). */}
            <FraseEncendida
              texto="Aquí, no solo entrenamos cuerpos; nutrimos intenciones y construimos comunidades para silenciar el ruido del mundo. Entrenar es la meditación en movimiento que te devuelve la calma y la claridad que necesitas para tomar las riendas de tu día. Bienvenida a tu mejor versión."
              acento={['comunidades', 'calma', 'versión']}
              style={{ fontSize:'1.35rem', lineHeight:1.55, marginBottom:'3rem', maxWidth:'500px', fontWeight:600, letterSpacing:'-0.01em' }} />
            <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} onClick={() => scrollTo('clases')} className="btn-primary" style={{ padding:'1.1rem 2.5rem', borderRadius:'40px', fontSize:'1rem' }}>
              Descubrir disciplinas <ArrowRight size={18}/>
            </motion.button>
          </motion.div>
          <motion.div variants={slideLeft} initial="hidden" whileInView="visible" viewport={{ once:true, margin:"-100px" }} style={{ flex:'1 1 400px', display:'flex', justifyContent:'center' }}>
            <motion.div 
              whileHover={{ scale: 1.02, y: -5 }} 
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} 
              style={{ position:'relative', width:'100%', maxWidth:'480px' }}
            >
              <div style={{ width:'100%', aspectRatio:'4/5', background:`url("/fotos-hero/IMG_5377.JPG")`, backgroundColor:'var(--surface-low)', backgroundSize:'cover', backgroundPosition:'center', borderRadius:'40px', boxShadow:'0 30px 80px rgba(0,0,0,0.1)' }}/>
              
              <motion.div 
                initial={{ opacity:0, y:40, scale:0.95 }} 
                whileInView={{ opacity:1, y:0, scale:1 }} 
                viewport={{ once:true }} 
                transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                style={{ 
                  position:'absolute', bottom:'-30px', left:'-30px', 
                  background:'rgba(255,255,255,0.8)', backdropFilter:'blur(20px) saturate(180%)', 
                  borderRadius:'24px', padding:'24px 32px', boxShadow:'0 30px 60px rgba(0,0,0,0.12)', border:'1px solid rgba(255,255,255,0.4)' 
                }}
              >
                <div style={{ fontSize:'1.2rem', fontWeight:700, color:'var(--on-surface-variant)', letterSpacing:'-0.02em' }}>The glutes</div>
                <div style={{ fontSize:'2.2rem', fontWeight:700, color:'var(--primary)', letterSpacing:'-0.04em', lineHeight:1 }}>specialists.</div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      </Escena>
      <Escena z={4} fondo="#FFFFFF" entrada="expandir">
      {/* ── Clases ────────────────────────────────────────────────── */}
      {(() => {
        // Catálogo curado desde el admin (disciplinas marcadas "featured"). Si la BD
        // aún no responde o está vacía, caemos a este set para no romper la sección.
        const FALLBACK = [
          { id: 'pilates', title: 'Pilates', image: '/fotos-hero/IMG_5395.JPG', desc: 'Aislamiento muscular con tensión controlada. El santo grial para glúteos y core.' },
          { id: 'barre', title: 'Barre', image: '/fotos-hero/_DSC3158.jpg', desc: 'Movimientos inspirados en el ballet clásico combinados con pilates. Esculpe tu cuerpo con elegancia.' },
          { id: 'yoga', title: 'Yoga y meditación', image: '/fotos-hero/IMG_5394.JPG', desc: 'Elasticidad, control respiratorio y recuperación activa. Encuentra tu balance perfecto.' },
          { id: 'cardio', title: 'Cardio Dance', image: '/fotos-hero/_DSC3454.jpg', desc: 'Agilidad dinámica y quema calórica con ritmos explosivos. ¡Baila y suda al máximo!' },
          { id: 'glute', title: 'Glute Power', image: '/fotos-hero/IMG_5397.JPG', desc: 'Lleva tus glúteos al límite con cargas y bombeo para potencia, firmeza y definición.' },
        ];
        const featured = (disciplines || []).filter(d => d.featured);
        // El texto va abajo (bottomText) para no tapar la cara de las coaches en las fotos.
        const DISCIPLINES = (featured.length
          ? featured.map(d => ({ id: d.id, title: d.name, image: d.image_url, desc: d.short_desc || d.description || '' }))
          : FALLBACK
        ).map(d => ({ ...d, bottomText: true }));
        const NUM_WORD = { 1:'Un', 2:'Dos', 3:'Tres', 4:'Cuatro', 5:'Cinco', 6:'Seis', 7:'Siete', 8:'Ocho', 9:'Nueve', 10:'Diez', 11:'Once', 12:'Doce' };
        const enfoquesTitle = DISCIPLINES.length === 1
          ? 'Un enfoque.'
          : `${NUM_WORD[DISCIPLINES.length] || 'Múltiples'} enfoques.`;

        return (
          <>
            <section id="clases" style={{ padding:'var(--esp-seccion) 5%', backgroundColor:'var(--surface-lowest)', position:'relative', overflow:'hidden' }}>
              {/* ── Aurora Animated Background ── */}
              <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
                <motion.div
                  animate={{ scale: [0.9, 1.4, 0.9], opacity: [0.6, 1, 0.6], x: ['-5%', '10%', '-5%'] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  style={{ position: 'absolute', top: '-10%', left: '-20%', width: '70vw', height: '70vw', background: 'radial-gradient(circle, rgba(130,170,255,0.8) 0%, rgba(130,170,255,0) 70%)', filter: 'blur(70px)' }}
                />
                <motion.div
                  animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0.9, 0.5], y: ['-5%', '15%', '-5%'] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '80vw', height: '80vw', background: 'radial-gradient(circle, rgba(140,200,255,0.7) 0%, rgba(140,200,255,0) 70%)', filter: 'blur(90px)' }}
                />
                <motion.div
                  animate={{ scale: [1.2, 0.8, 1.2], opacity: [0.4, 0.9, 0.4], x: ['10%', '-10%', '10%'] }}
                  transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                  style={{ position: 'absolute', top: '10%', left: '40%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(180,160,255,0.7) 0%, rgba(180,160,255,0) 70%)', filter: 'blur(80px)' }}
                />
              </div>

              <div style={{ maxWidth:'1200px', margin:'0 auto', position:'relative', zIndex:1 }}>
                <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once:true, margin:"-100px" }} style={{ display:'flex', flexWrap:'wrap', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'2rem', gap:'2rem' }}>
                  <div style={{ maxWidth:'600px' }}>
                    <span style={{ fontSize:'0.85rem', fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--on-surface-variant)' }}>Disciplinas</span>
                    <h2 style={{ fontSize:'clamp(3rem,6vw,4.5rem)', margin:'1.5rem 0 0', color:'var(--black)', letterSpacing:'-0.04em' }}>
                      {enfoquesTitle}<br/><span style={{ color:'var(--primary)', fontFamily:"'Playfair Display', serif", fontStyle:'italic', fontWeight:500 }}>Un solo objetivo.</span>
                    </h2>
                  </div>
                </motion.div>
                
                {/* Embla Viewport */}
                <motion.div variants={stagger(0.1)} initial="hidden" whileInView="visible" viewport={{ once:true, margin:"-100px" }} style={{ position: 'relative' }}>
                  {/* Orillas difuminadas: las tarjetas se desvanecen al entrar/salir (se nota que sigue). */}
                  <div ref={emblaRef} className="disc-viewport" style={{ overflow: 'hidden', cursor: 'grab', paddingBottom: '2rem' }}>
                    <div style={{ display: 'flex', marginLeft: '-1.5rem', backfaceVisibility: 'hidden', touchAction: 'pan-y' }}>
                      {DISCIPLINES.map((d, di) => {
                        const enfocada = escritorio || di === discActiva;
                        const isFlipped = selectedDiscipline === d.id;
                        const hasTopText = !d.bottomText && d.title;
                        const hasBottomText = d.bottomText || d.bottomTitle;
                        
                        return (
                          <div 
                            key={d.id} 
                            style={{ 
                              flex: '0 0 auto', 
                              minWidth: '0', 
                              width: 'clamp(300px, 80vw, 340px)', 
                              paddingLeft: '1.5rem' 
                            }}
                          >
                            {/* Capa aparte para el resalte: mezclarlo con los variants del padre lo anulaba. */}
                            <motion.div
                              initial={false}
                              animate={{ scale: enfocada ? 1 : 0.92, opacity: enfocada ? 1 : 0.55 }}
                              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                              style={{ height: '100%' }}
                            >
                            <motion.div 
                              variants={scaleIn}
                              style={{ 
                                perspective: '1000px', 
                                aspectRatio: '3/4',
                                width: '100%',
                                height: '100%'
                              }}
                            >
                        <motion.div
                          animate={{ rotateY: isFlipped ? 180 : 0 }}
                          transition={{ duration: 0.6, type: 'spring', stiffness: 200, damping: 20 }}
                          style={{
                            width: '100%', height: '100%',
                            position: 'relative',
                            transformStyle: 'preserve-3d',
                            cursor: 'pointer'
                          }}
                          onClick={() => setSelectedDiscipline(isFlipped ? null : d.id)}
                        >
                          {/* Front Face */}
                          <motion.div 
                            className="disc-frente"
                            style={{
                              position: 'absolute', inset: 0,
                              backfaceVisibility: 'hidden',
                              borderRadius: '24px', overflow: 'hidden',
                              backgroundColor: 'var(--surface-low)',
                              boxShadow: '0 20px 40px rgba(0,0,0,0.06)'
                            }}
                          >
                            {/* Foto en su propia capa: en computadora se acerca al pasar el mouse. */}
                            <div className="disc-foto" style={{ position: 'absolute', inset: 0, backgroundImage: `url("${d.image}")`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                            {/* Gradient overlays depending on text position */}
                            {hasTopText && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 40%)' }} />}
                            {hasBottomText && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)' }} />}
                            
                            {/* Top Text */}
                            {hasTopText && (
                              <div style={{ position: 'absolute', top: '15px', left: '10px', right: '10px', textAlign: 'center' }}>
                                <h3 style={{ 
                                  margin: 0, color: 'white', 
                                  fontSize: '3rem', 
                                  fontWeight: 900, 
                                  textTransform: 'uppercase', 
                                  letterSpacing: '-0.02em', 
                                  lineHeight: 0.95,
                                  textShadow: '0 10px 30px rgba(0,0,0,0.6)',
                                  wordBreak: 'break-word',
                                  hyphens: 'auto'
                                }}>
                                  {d.title}
                                </h3>
                              </div>
                            )}

                            {/* Bottom Text */}
                            {hasBottomText && (
                              <div style={{ position: 'absolute', bottom: '18px', left: '14px', right: '14px', textAlign: 'center' }}>
                                <h3 style={{
                                  margin: 0, color: 'white',
                                  fontSize: 'clamp(2rem, 7vw, 2.6rem)',
                                  fontWeight: 900,
                                  textTransform: 'uppercase',
                                  letterSpacing: '-0.02em',
                                  lineHeight: 0.95,
                                  textShadow: '0 10px 30px rgba(0,0,0,0.6)',
                                  wordBreak: 'normal',
                                  overflowWrap: 'normal',
                                  hyphens: 'none'
                                }}>
                                  {d.bottomTitle || d.title}
                                </h3>
                              </div>
                            )}
                          </motion.div>

                          {/* Back Face */}
                          <div style={{
                            position: 'absolute', inset: 0,
                            backfaceVisibility: 'hidden',
                            borderRadius: '24px', overflow: 'hidden',
                            background: `url("${d.image}")`,
                            backgroundSize: 'cover', backgroundPosition: 'center',
                            color: 'white',
                            transform: 'rotateY(180deg)',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                          }}>
                            {/* Overlay Blur */}
                            <div style={{ 
                              position: 'absolute', inset: 0, 
                              background: 'rgba(0,0,0,0.4)', 
                              backdropFilter: 'blur(20px)',
                              WebkitBackdropFilter: 'blur(20px)' 
                            }} />
                            {/* Content */}
                            <div style={{
                              position: 'relative',
                              height: '100%',
                              padding: '32px 24px',
                              display: 'flex', flexDirection: 'column', justifyContent: 'center',
                            }}>
                              <h3 style={{ margin: '0 0 16px', fontSize: '1.8rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1, color: 'var(--primary)' }}>{d.title}</h3>
                              <p style={{ fontSize: '1.05rem', lineHeight: 1.5, opacity: 0.9, margin: 0, flex: 1, color: 'white' }}>{d.desc}</p>
                              
                              <motion.button 
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} 
                                onClick={(e) => { e.stopPropagation(); setSelectedDiscipline(null); scrollTo('horarios'); }} 
                                style={{ 
                                  width: '100%', padding: '1rem', borderRadius: '100px', 
                                  background: 'color-mix(in srgb, var(--primary) 25%, transparent)', 
                                  backdropFilter: 'blur(12px) saturate(180%)',
                                  WebkitBackdropFilter: 'blur(12px) saturate(180%)',
                                  color: 'white', 
                                  fontSize: '1rem', fontWeight: 700, 
                                  border: '1px solid color-mix(in srgb, var(--primary) 50%, transparent)', 
                                  cursor: 'pointer',
                                  marginTop: '16px'
                                }}
                              >
                                Ver horarios
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      </motion.div>
                            </motion.div>
                    </div>
                  );
                })}
                    </div>
                  </div>
                  
                  {/* Glassmorphism Navigation Overlays */}
                  <div className="carousel-nav" style={{ position: 'absolute', top: '50%', left: '0', right: '0', transform: 'translateY(-50%)', display: 'flex', justifyContent: 'space-between', padding: '0 10px', pointerEvents: 'none', zIndex: 10 }}>
                    <motion.button 
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} 
                      onClick={scrollPrev} 
                      style={{ 
                        pointerEvents: 'auto', width: '56px', height: '56px', borderRadius: '50%', 
                        background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255,255,255,0.6)', color: 'var(--black)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', 
                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)' 
                      }}
                    >
                      <ChevronLeft size={28} />
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} 
                      onClick={scrollNext} 
                      style={{ 
                        pointerEvents: 'auto', width: '56px', height: '56px', borderRadius: '50%', 
                        background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255,255,255,0.6)', color: 'var(--black)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', 
                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)' 
                      }}
                    >
                      <ChevronRight size={28} />
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            </section>
          </>
        );
      })()}


      </Escena>
      <Escena z={5} fondo="#FFFFFF">
      {/* ── Coaches (fotos redondas; datos públicos de coach_directory) ── */}
      <SeccionCoaches clases={globalClasses} />

      {/* ── El Estudio · Galería Polaroid ─────────────────────────── */}
      <PolaroidGallery />

      {/* Cinta de marca: corta el ritmo a la mitad de la página. */}
      </Escena>
      <Escena z={7} fondo="var(--app-bg)">
      {/* ── Horarios ──────────────────────────────────────────────── */}
      <section id="horarios" style={{ padding:'var(--esp-seccion) 5%', background:'var(--surface)', position:'relative', overflow:'hidden' }}>
        <div style={{ maxWidth:'1200px', margin:'0 auto', position:'relative', zIndex:1 }}>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once:true, margin:"-100px" }} style={{ textAlign:'center', marginBottom:'3.5rem' }}>
            <span style={{ fontSize:'0.85rem', fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--on-surface-variant)' }}>Horarios</span>
            <h2 style={{ fontSize:'clamp(3rem,6vw,4.5rem)', margin:'1.5rem 0', color:'var(--black)', letterSpacing:'-0.04em' }}>Tu tiempo es ahora.</h2>
          </motion.div>
          <ScheduleCalendar 
            globalClasses={globalClasses} 
            coaches={coaches} 
            badgeConfigs={badgeConfigs}
            onReserve={() => irConTransicion('/login')} 
            abrirEnDia
            marcarEnVivo
          />
        </div>
      </section>

      </Escena>
      <Escena z={8} fondo="#FFF8F4">
      {/* ── Precios (Rediseño Pastel Glass) ───────────────────────── */}
      <section id="precios" style={{ padding:'var(--esp-seccion) 5%', background:'#FFF8F4', position:'relative', overflow:'visible' }}>
        
        {/* Decoraciones de fondo pastel */}
        <div style={{ position:'absolute', top:'-10%', left:'-5%', width:'400px', height:'400px', background:'var(--primary)', filter:'blur(150px)', opacity:0.1, borderRadius:'50%', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:'-10%', right:'-5%', width:'500px', height:'500px', background:'#FFB085', filter:'blur(150px)', opacity:0.15, borderRadius:'50%', pointerEvents:'none' }} />

        <div style={{ maxWidth:'1400px', margin:'0 auto', position:'relative', zIndex:1 }}>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once:true, margin:"-100px" }} style={{ textAlign:'center', marginBottom:'5rem' }}>
            <span style={{ fontSize:'0.85rem', fontWeight:800, letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--primary)' }}>Membresías</span>
            <h2 style={{ fontSize:'clamp(3rem,6vw,4.5rem)', margin:'1rem 0', color:'var(--black)', letterSpacing:'-0.04em' }}>Invierte en ti.</h2>
          </motion.div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem', alignItems: 'center' }}>
            
            {/* Carrusel 3D de Planes */}
            <PricingCarousel conClaseSuelta onSelectPlan={(plan) => plan.esClaseSuelta
              // La clase suelta abre el pago directo al llegar a Mi Membresía
              // (?comprar=clase_suelta). Sin sesión: tras el login regresa ahí.
              ? (user
                  ? irConTransicion('/planes?comprar=clase_suelta')
                  : (localStorage.setItem('befit_redirect_after_auth', '/planes?comprar=clase_suelta'), irConTransicion('/login')))
              : irConTransicion(user ? '/planes' : '/login', undefined, { selectedPlan: { title: `Plan ${plan.title}`, price: plan.price.replace('$','') } })} />

            {/* Panel de Beneficios y Costos Adicionales */}
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once:true, margin:"-50px" }}
              style={{ width: '100%', maxWidth: '900px', margin: '0 auto', position: 'relative' }}>
              
              {/* Aura estática y sutil */}
              <div 
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '100%',
                  height: '100%',
                  background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)',
                  filter: 'blur(80px)',
                  borderRadius: '50%',
                  opacity: 0.15,
                  zIndex: 0,
                  pointerEvents: 'none'
                }} 
              />

              <div style={{
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)',
                border: '1px solid rgba(255, 255, 255, 0.9)',
                borderRadius: '32px',
                padding: '3rem 2.5rem',
                boxShadow: '0 30px 60px rgba(255, 122, 0, 0.05)',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4rem',
                position: 'relative',
                zIndex: 1
              }}>
                <div style={{ flex: '1 1 450px' }}>
                  <h3 style={{ fontSize: '1.8rem', color: 'var(--black)', marginBottom: '2rem', letterSpacing: '-0.02em', fontWeight: 800 }}>Beneficios de tu Membresía</h3>
                  
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column' }}>
                    {[
                      'Acceso a más de 40 clases a la semana',
                      'Rutinas semi personalizadas',
                      'Comunidad exclusiva',
                      '+100 ideas de recetas altas en proteína',
                      'Registro de métricas y medidas',
                      'Seguimiento de evolución',
                      '10 coaches certificadas',
                      'Eventos especiales',
                      'Agua gratis',
                      'Barra de smoothies altos en proteína y sin azúcar'
                    ].map((ben, k) => (
                      <li key={k} style={{ 
                        display: 'flex', 
                        gap: '16px', 
                        alignItems: 'center', 
                        fontSize: '1rem', 
                        color: 'var(--black)', 
                        fontWeight: 500,
                        padding: '16px 0',
                        borderBottom: k !== 9 ? '1px solid rgba(0,0,0,0.06)' : 'none'
                      }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />
                        {ben}
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  
                  <div style={{ 
                    background: 'rgba(255, 255, 255, 0.8)', 
                    borderRadius: '24px', 
                    padding: '2.5rem', 
                    boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
                    border: '1px solid rgba(255,255,255,1)'
                  }}>
                    <h4 style={{ fontSize: '1.1rem', color: 'var(--on-surface-variant)', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800 }}>Costos Adicionales</h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1.2rem', borderBottom: '1px dashed rgba(0,0,0,0.1)' }}>
                        <span style={{ fontWeight: 600, color: 'var(--black)', fontSize: '1.05rem' }}>Clase suelta</span>
                        <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.4rem' }}>${(precios.claseSuelta || 150).toLocaleString('es-MX')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, color: 'var(--black)', fontSize: '1.05rem' }}>Inscripción Anual</span>
                        <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.4rem' }}>${(precios.inscripcion || 500).toLocaleString('es-MX')}</span>
                      </div>
                    </div>
                  </div>
                  
                </div>

              </div>
            </motion.div>

          </div>
        </div>
      </section>


      </Escena>
      <Escena z={9} fondo="#F6EFE8" salida="apilar">
      <ParallaxTestimonials />
      </Escena>

      {/* ── App Download (mockup de teléfono con scroll cinemático) ─── */}
      <Escena z={10} fondo="#3A2A20" entrada="hoja">
      <AppShowcase />
      </Escena>

      <Escena z={11} fondo="#FFF6F0">
      {/* ── FAQ ───────────────────────────────────────────────────── */}
      <section id="faq" style={{ padding:'var(--esp-seccion) 5%', background:'linear-gradient(180deg, #FFF6F0 0%, #FDF1EA 100%)', position:'relative', overflow:'hidden' }}>
        <div style={{ maxWidth:'800px', margin:'0 auto', position:'relative', zIndex:1 }}>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once:true, margin:"-100px" }} style={{ textAlign:'center', marginBottom:'6rem' }}>
            <span style={{ fontSize:'0.85rem', fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--on-surface-variant)' }}>Preguntas frecuentes</span>
            <h2 style={{ fontSize:'clamp(3rem,6vw,4.5rem)', margin:'1.5rem 0', color:'var(--black)', letterSpacing:'-0.04em' }}>Resolvemos tus dudas.</h2>
          </motion.div>
          <motion.div variants={stagger(0.07)} initial="hidden" whileInView="visible" viewport={{ once:true, margin:"-100px" }} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            {FAQ_ITEMS.map((item,i) => (
              <motion.div key={i} variants={fadeUp}>
                <FAQItem q={item.q} a={item.a} open={openFAQ===i} onToggle={() => setOpenFAQ(openFAQ===i?null:i)}/>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      </Escena>
      <Escena z={12} fondo="#FFFFFF" entrada="expandir">
      {/* ── Ubicación ─────────────────────────────────────────────── */}
      <section id="ubicacion" style={{ padding:'var(--esp-seccion) 5%', background:'var(--surface-lowest)', position:'relative', overflow:'hidden' }}>
        <div className="ubicacion-grid">
          <motion.div variants={slideRight} initial="hidden" whileInView="visible" viewport={{ once:true, margin:"-100px" }} style={{ flex:'1 1 400px' }}>
            <span style={{ fontSize:'0.85rem', fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--on-surface-variant)' }}>Encuéntranos</span>
            <h2 style={{ fontSize:'clamp(3rem,6vw,4.5rem)', margin:'1.5rem 0 2.5rem', lineHeight:1.05, color:'var(--black)', letterSpacing:'-0.04em' }}>Ven a<br/><span style={{ color:'var(--primary)', fontFamily:"'Playfair Display', serif", fontStyle:'italic', fontWeight:500 }}>conocernos.</span></h2>
            {/* Datos como lista limpia: ícono en círculo, etiqueta chica, dato y una línea fina. */}
            <div className="contacto-lista">
              {[{icon:<MapPin size={20} color="var(--primary)"/>,label:'Dirección',val:<a href={ESTUDIO.contacto.mapaLink} target="_blank" rel="noopener noreferrer" style={{ color:'inherit', textDecoration:'none' }}>{ESTUDIO.contacto.direccion.map((l,i) => <React.Fragment key={l}>{i > 0 && <br/>}{l}</React.Fragment>)}</a>},{icon:<Phone size={20} color="var(--primary)"/>,label:'Teléfono / WhatsApp',val:<a href={`tel:${ESTUDIO.contacto.telefono.replace(/\s/g,'')}`} style={{ color:'inherit', textDecoration:'none' }}>{ESTUDIO.contacto.telefono}</a>},{icon:<InstagramIcon size={20} color="var(--primary)"/>,label:'Instagram',val:<a href={ESTUDIO.contacto.instagramUrl} target="_blank" rel="noopener noreferrer" style={{ color:'var(--primary)', fontWeight:700, textDecoration:'none' }}>{ESTUDIO.contacto.instagram}</a>}].map(({icon,label,val}) => (
                <div key={label} className="contacto-fila">
                  <div className="contacto-icono">{icon}</div>
                  <div>
                    <div className="contacto-etiqueta">{label}</div>
                    <div className="contacto-dato">{val}</div>
                  </div>
                </div>
              ))}
            </div>
            <motion.a whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} className="vidrio-naranja contacto-cta"
              href={`https://wa.me/${WA_NUMBER}?text=Hola%20Be%20Fit%20Lab%2C%20quisiera%20m%C3%A1s%20informaci%C3%B3n`} target="_blank" rel="noopener noreferrer">
              <MessageCircle size={20}/> Contáctanos por WhatsApp
            </motion.a>
          </motion.div>
          <motion.div variants={slideLeft} initial="hidden" whileInView="visible" viewport={{ once:true, margin:"-100px" }} style={{ flex:'1 1 500px' }}>
            {/* Mapa oficial de Google Maps (embed pb, sin API key, no se bloquea) + botón a Google Maps */}
            <div style={{ position:'relative' }}>
              <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3772.076391246044!2d-98.1957961!3d19.0163552!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85cfc1f60e34723f%3A0xe268a04e8e4ab501!2sBe%20Fit%20Lab!5e0!3m2!1ses!2smx!4v1780353480943!5m2!1ses!2smx"
                width="100%" className="ubicacion-mapa" style={{ border:0, borderRadius:'28px', boxShadow:'0 24px 60px rgba(60,35,20,0.10)', display:'block' }}
                allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title={`${ESTUDIO.nombre} — ${ESTUDIO.ciudad}`}/>
              <motion.a whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }} className="vidrio-naranja"
                href="https://maps.app.goo.gl/RFUhTHGG5cQuVoST8" target="_blank" rel="noopener noreferrer"
                style={{ position:'absolute', bottom:'20px', left:'50%', x:'-50%', display:'inline-flex', alignItems:'center', gap:'8px', padding:'0.85rem 1.6rem', borderRadius:'40px', textDecoration:'none', fontWeight:700, fontSize:'0.95rem', whiteSpace:'nowrap' }}>
                <MapPin size={18}/> Cómo llegar
              </motion.a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer (glass claro, en la línea de la marca) ───────────── */}
      <footer style={{ background:'linear-gradient(180deg, #FFF6F0 0%, #FDF1EA 100%)', padding:'7rem 5% 2.5rem', position:'relative', overflow:'hidden', borderTop:'1px solid rgba(255,145,77,0.14)' }}>
        {/* Blobs decorativos suaves (marca) */}
        <div style={{ position:'absolute', top:'-20%', left:'-8%', width:'46vw', height:'46vw', background:'radial-gradient(circle, rgba(255,145,77,0.12) 0%, transparent 70%)', filter:'blur(40px)', pointerEvents:'none', zIndex:0 }} />
        <div style={{ position:'absolute', bottom:'-30%', right:'-6%', width:'42vw', height:'42vw', background:'radial-gradient(circle, rgba(224,122,156,0.10) 0%, transparent 70%)', filter:'blur(40px)', pointerEvents:'none', zIndex:0 }} />

        <div style={{ maxWidth:'1200px', margin:'0 auto', position:'relative', zIndex:1 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:'4rem', marginBottom:'5rem' }}>
            <div>
              <img src={ESTUDIO.marca.logo} alt={ESTUDIO.nombre} style={{ height:'48px', width:'auto', marginBottom:'22px', display:'block' }}/>
              <p style={{ color:'var(--on-surface-variant)', fontSize:'1rem', lineHeight:1.7, maxWidth:'280px' }}>The glutes specialists. Transformación real a través del movimiento consciente.</p>
              <div style={{ display:'flex', gap:'14px', marginTop:'30px' }}>
                {[{href:'https://instagram.com/befit.lab', icon:<InstagramIcon size={20} color="var(--primary)"/>},{href:`https://wa.me/${WA_NUMBER}`, icon:<MessageCircle size={20} color="var(--primary)"/>}].map((s,i) => (
                  <motion.a key={i} whileHover={{ scale:1.1, y:-2 }} whileTap={{ scale:0.95 }} href={s.href} target="_blank" rel="noopener noreferrer"
                    style={{ width:'48px', height:'48px', background:'rgba(255,255,255,0.6)', border:'1px solid rgba(255,255,255,0.85)', backdropFilter:'blur(14px) saturate(180%)', WebkitBackdropFilter:'blur(14px) saturate(180%)', borderRadius:'16px', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 6px 18px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.7)' }}>{s.icon}</motion.a>
                ))}
              </div>
            </div>
            {[
              { title:'Estudio', items:[['Clases','clases'],['Horarios','horarios'],['El Estudio','estudio'],['Coaches','coaches']] },
              { title:'Explora', items:[['Precios y paquetes','precios'],['Coffee Lab','cafeteria']], extra:[['Iniciar Sesión','/login'],['Crear Cuenta','/registro']] },
              { title:'Legal', links:[['Términos y condiciones','/terminos'],['Política de privacidad','/privacidad']], faq:true },
            ].map((col) => (
              <div key={col.title}>
                <div style={{ fontWeight:800, color:'var(--black)', fontSize:'0.85rem', textTransform:'uppercase', letterSpacing:'0.15em', marginBottom:'22px' }}>{col.title}</div>
                {(col.items||[]).map(([l,id]) => (
                  <motion.button key={l} whileHover={{ x:6, color:'var(--primary)' }} onClick={() => scrollTo(id)} style={{ display:'block', background:'none', border:'none', cursor:'pointer', color:'var(--on-surface-variant)', fontSize:'1rem', padding:'8px 0', fontFamily:'var(--font-body)', textAlign:'left', transition:'color 0.2s' }}>{l}</motion.button>
                ))}
                {(col.extra||[]).map(([l,to]) => (
                  <MotionLink key={l} to={to} whileHover={{ x:6, color:'var(--primary)' }} style={{ display:'block', color:'var(--on-surface-variant)', fontSize:'1rem', padding:'8px 0', textDecoration:'none', transition:'color 0.2s' }}>{l}</MotionLink>
                ))}
                {(col.links||[]).map(([l,to]) => (
                  <MotionLink key={l} to={to} whileHover={{ x:6, color:'var(--primary)' }} style={{ display:'block', color:'var(--on-surface-variant)', fontSize:'1rem', padding:'8px 0', textDecoration:'none', transition:'color 0.2s' }}>{l}</MotionLink>
                ))}
                {col.faq && <motion.button whileHover={{ x:6, color:'var(--primary)' }} onClick={() => scrollTo('faq')} style={{ display:'block', background:'none', border:'none', cursor:'pointer', color:'var(--on-surface-variant)', fontSize:'1rem', padding:'8px 0', fontFamily:'var(--font-body)', textAlign:'left', transition:'color 0.2s' }}>Aviso de cancelación</motion.button>}
              </div>
            ))}
          </div>
          <div style={{ borderTop:'1px solid rgba(0,0,0,0.08)', paddingTop:'2.2rem', display:'flex', flexWrap:'wrap', justifyContent:'space-between', alignItems:'center', gap:'1rem' }}>
            <p style={{ color:'var(--on-surface-variant)', fontSize:'0.88rem', margin:0 }}>© {new Date().getFullYear()} {ESTUDIO.nombre}. Todos los derechos reservados.</p>
            <p style={{ color:'var(--on-surface-variant)', fontSize:'0.88rem', margin:0 }}>Desarrollado por <motion.a href="https://zahirportafolio.pages.dev" target="_blank" rel="noopener noreferrer" whileHover={{ color:'#E68245' }} style={{ color:'var(--primary)', fontWeight:700, textDecoration:'none', transition:'color 0.2s' }}>Zahir Daniel Vidahurrazaga Marín</motion.a></p>
          </div>
        </div>
      </footer>
      </Escena>

      {/* ── WhatsApp flotante ─────────────────────────────────────── */}
      {/* Se esconde con el menú de celular abierto (el menú trae su propio WhatsApp). */}
      <motion.a
        initial={{ scale:0, opacity:0 }}
        animate={menuOpen ? { scale:0.6, opacity:0 } : { scale:1, opacity:1 }}
        transition={menuOpen ? { duration:0.2 } : { ...BOUNCE, delay: origenMenu ? 0.3 : 1.5 }}
        whileHover={{ scale:1.12 }}
        whileTap={{ scale:0.95 }}
        href={`https://wa.me/${WA_NUMBER}?text=Hola%20Be%20Fit%20Lab%2C%20quisiera%20m%C3%A1s%20informaci%C3%B3n`}
        target="_blank" rel="noopener noreferrer"
        style={{ pointerEvents: menuOpen ? 'none' : 'auto', position:'fixed', bottom:'28px', right:'24px', zIndex:999, width:'58px', height:'58px', background:'linear-gradient(135deg, rgba(255,145,77,0.9), rgba(230,130,69,0.92))', backdropFilter:'blur(14px) saturate(180%)', WebkitBackdropFilter:'blur(14px) saturate(180%)', border:'1px solid rgba(255,255,255,0.45)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 10px 28px rgba(255,145,77,0.45), inset 0 1px 0 rgba(255,255,255,0.55)', textDecoration:'none' }}
        aria-label="WhatsApp" className="wa-flotante">
        <MessageCircle size={24} color="white"/>
      </motion.a>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

// Pantallas reales de clienta que rotan dentro del teléfono del showcase.
// (Capturas en /public/screenshots; las mismas del portafolio.)
const APP_SCREENS = [
  { src: '/screenshots/befit-home.png',      Icon: Star,       title: 'Tu membresía, siempre contigo', desc: 'Clases restantes, racha y estatus al abrir la App.' },
  { src: '/screenshots/befit-reservas.png',  Icon: Calendar,   title: 'Reserva en segundos',           desc: 'Aparta tu lugar y recibe recordatorios de cada clase.' },
  { src: '/screenshots/befit-evolucion.png', Icon: TrendingUp, title: 'Mira tu progreso',              desc: 'Metas, evolución y fotos de tu transformación.' },
  { src: '/screenshots/befit-nutricion.png', Icon: Utensils,   title: 'Nutrición a tu medida',         desc: 'Tu plan y recetario personalizados, en un toque.' },
];

function AppShowcase() {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] });
  // El teléfono crece y sube conforme se hace scroll (estilo Apple)
  const scaleRaw = useTransform(scrollYProgress, [0, 0.55], [0.82, 1.12]);
  const yRaw     = useTransform(scrollYProgress, [0, 0.55], [80, -40]);
  const scale = useMotionSpring(scaleRaw, { stiffness: 120, damping: 28, mass: 0.4 });
  const y     = useMotionSpring(yRaw,     { stiffness: 120, damping: 28, mass: 0.4 });

  // El fondo pasa de claro a cacao al entrar y regresa a claro al salir (hacia el FAQ).
  // Los textos usan --sf/--sf2, que cambian junto con el fondo.
  const fondo = useTransform(scrollYProgress, [0, 0.14, 0.86, 1], ['#FDFBF8', '#3A2A20', '#3A2A20', '#FFF6F0']);
  const tinta = useTransform(scrollYProgress, [0, 0.14, 0.86, 1], ['#1A1714', '#FBF6F1', '#FBF6F1', '#1A1714']);
  const tinta2 = useTransform(scrollYProgress, [0, 0.14, 0.86, 1], ['#6B625B', '#BFB3A8', '#BFB3A8', '#6B625B']);

  // Pantallas del teléfono: en computadora las mueve el scroll; en celular rotan solas.
  const escritorio = useEsEscritorio();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    if (!escritorio) return;
    const t = (v - 0.3) / 0.38;
    setActive(Math.max(0, Math.min(APP_SCREENS.length - 1, Math.floor(t * APP_SCREENS.length))));
  });
  useEffect(() => {
    if (paused || escritorio) return undefined;
    const t = setInterval(() => setActive(a => (a + 1) % APP_SCREENS.length), 3200);
    return () => clearInterval(t);
  }, [paused, escritorio]);
  const select = (i) => setActive(i);

  return (
    <motion.section ref={sectionRef} id="agenda-info" style={{ padding:'var(--esp-seccion) 5%', background: fondo, '--sf': tinta, '--sf2': tinta2, position:'relative', overflow:'hidden' }}>
      <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
        style={{ maxWidth:'1200px', margin:'0 auto', display:'flex', flexWrap:'wrap', gap:'5rem', alignItems:'center', justifyContent:'center' }}>
        {/* Texto + features que cambian con la pantalla activa */}
        <motion.div variants={slideRight} initial="hidden" whileInView="visible" viewport={{ once:true, margin:"-100px" }} style={{ flex:'1 1 460px' }}>
          <span style={{ fontSize:'0.85rem', fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--sf2)' }}>{ESTUDIO.nombre} App</span>
          <h2 style={{ fontSize:'clamp(3rem,6vw,4.5rem)', margin:'1.5rem 0', lineHeight:1.05, color:'var(--sf)', letterSpacing:'-0.04em' }}>Todo tu estudio,<br/><span style={{ color:'var(--primary)', fontFamily:"'Playfair Display', serif", fontStyle:'italic', fontWeight:500 }}>en la palma de tu mano.</span></h2>
          <p style={{ fontSize:'1.2rem', color:'var(--sf2)', lineHeight:1.6, marginBottom:'2.5rem', fontWeight:400, maxWidth:'480px' }}>Reserva, entrena y sigue tu evolución desde una sola App, diseñada exclusivamente para nuestras socias.</p>

          {/* Lista de features sincronizada con el carrusel del teléfono */}
          <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'2.5rem' }}>
            {APP_SCREENS.map((s, i) => {
              const on = i === active;
              return (
                <button key={s.src} onClick={() => select(i)} style={{ display:'flex', alignItems:'center', gap:'14px', textAlign:'left', border:'none', cursor:'pointer', borderRadius:'16px', padding:'12px 14px', background: on ? 'rgba(255,255,255,0.08)' : 'transparent', boxShadow: on ? 'inset 0 0 0 1px rgba(255,255,255,0.10)' : 'none', transition:'background 0.3s, box-shadow 0.3s' }}>
                  <div style={{ flexShrink:0, width:'42px', height:'42px', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', background: on ? 'var(--primary)' : 'rgba(255,145,77,0.12)', transition:'background 0.3s' }}>
                    <s.Icon size={20} color={on ? '#fff' : 'var(--primary)'} />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:'1rem', fontWeight:800, color:'var(--sf)' }}>{s.title}</div>
                    <div style={{ fontSize:'0.85rem', color:'var(--sf2)', fontWeight:500, opacity: on ? 1 : 0.7 }}>{s.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div style={{ display:'flex', flexWrap:'wrap', gap:'16px', alignItems:'center' }}>
            <motion.a whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} href={ESTUDIO.tiendas.appStore} target="_blank" rel="noopener noreferrer">
              <img src="/assets/appstore.svg" alt="App Store" style={{ height:'54px', width:'auto', display:'block' }}/>
            </motion.a>
            <motion.a whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} href={ESTUDIO.tiendas.playStore} target="_blank" rel="noopener noreferrer">
              <img src="/assets/googleplay.svg" alt="Disponible en Google Play" style={{ height:'54px', width:'auto', display:'block' }}/>
            </motion.a>
          </div>
        </motion.div>

        {/* Teléfono con carrusel de capturas reales */}
        <div style={{ flex:'1 1 360px', display:'flex', flexDirection:'column', alignItems:'center', gap:'1.5rem', position:'relative', marginTop: escritorio ? 0 : '4.5rem' }}>
          {/* Resplandor de marca detrás del teléfono */}
          <div style={{ position:'absolute', top:'45%', width:'70%', height:'70%', background:'radial-gradient(circle, rgba(255,145,77,0.38) 0%, transparent 70%)', filter:'blur(60px)', pointerEvents:'none', transform:'translateY(-50%)' }} />
          <motion.div style={{ scale, y, willChange:'transform' }}>
            {/* Marco del iPhone */}
            <div style={{ width:'300px', maxWidth:'78vw', aspectRatio:'9 / 19.5', background:'#0D0D0C', borderRadius:'52px', padding:'11px', boxShadow:'0 50px 100px rgba(0,0,0,0.28), 0 0 0 2.5px #232323, inset 0 0 0 2px rgba(255,255,255,0.04)', position:'relative' }}>
              <div style={{ width:'100%', height:'100%', borderRadius:'42px', overflow:'hidden', background:'#fff', position:'relative' }}>
                {/* Dynamic island */}
                <div style={{ position:'absolute', top:'11px', left:'50%', transform:'translateX(-50%)', width:'88px', height:'25px', background:'#000', borderRadius:'20px', zIndex:20 }} />
                <AnimatePresence initial={false}>
                  <motion.img key={APP_SCREENS[active].src} src={APP_SCREENS[active].src} alt={APP_SCREENS[active].title}
                    initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.7, ease:'easeInOut' }}
                    style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
          {/* Puntos de paginación */}
          <div style={{ display:'flex', gap:'8px', zIndex:1 }}>
            {APP_SCREENS.map((s, i) => (
              <button key={s.src} aria-label={s.title} onClick={() => select(i)}
                style={{ width: i === active ? '24px' : '8px', height:'8px', borderRadius:'4px', border:'none', cursor:'pointer', padding:0, background: i === active ? 'var(--primary)' : 'rgba(255,255,255,0.25)', transition:'all 0.3s' }} />
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function ClassCard({ icon, title, desc, tag, bgImage, onClick }) {
  return (
    <motion.div variants={scaleIn} whileHover={{ y:-8, scale:1.02 }} whileTap={{ scale:0.97 }} transition={{ type:'spring', stiffness:350, damping:25 }} onClick={onClick}
      style={{ ...glassDark, borderRadius:'28px', padding:'2rem', cursor:'pointer', position:'relative', overflow:'hidden',
        backgroundImage:bgImage?`linear-gradient(rgba(13,13,12,0.75),rgba(13,13,12,0.9)),url(${bgImage})`:'none', backgroundSize:'cover', backgroundPosition:'center' }}>
      {tag && <div style={{ position:'absolute', top:'16px', right:'16px', background:'var(--primary)', color:'white', fontSize:'0.65rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.08em', padding:'4px 10px', borderRadius:'20px' }}>{tag}</div>}
      <div style={{ marginBottom:'1.5rem' }}>{icon}</div>
      <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.5rem', marginBottom:'0.75rem', color:'white' }}>{title}</h3>
      <p style={{ color:'rgba(255,255,255,0.6)', fontSize:'0.92rem', lineHeight:1.6, marginBottom:'1.5rem' }}>{desc}</p>
      <div style={{ display:'flex', alignItems:'center', gap:'6px', color:'var(--primary)', fontSize:'0.88rem', fontWeight:700 }}>
        Ver horarios <ArrowRight size={16}/>
      </div>
    </motion.div>
  );
}

function PricingCard({ title, price, desc, features, cta, featured, onClick }) {
  return (
    <motion.div variants={scaleIn} whileHover={{ y:-6, scale:1.02 }} transition={{ type:'spring', stiffness:300, damping:25 }}
      style={{ ...(featured?{ background:'rgba(255,139,66,0.12)', backdropFilter:'blur(24px) saturate(180%)', WebkitBackdropFilter:'blur(24px)', border:'1px solid rgba(255,139,66,0.3)', boxShadow:'0 20px 60px rgba(255,139,66,0.15)' }:glassDark), borderRadius:'28px', padding:'2.5rem', position:'relative', display:'flex', flexDirection:'column' }}>
      {featured && <div style={{ position:'absolute', top:'-14px', left:'50%', transform:'translateX(-50%)', background:'var(--primary)', color:'white', fontSize:'0.7rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.08em', padding:'5px 18px', borderRadius:'20px', whiteSpace:'nowrap' }}>Más popular</div>}
      <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.4rem', margin:'0 0 6px', color:'white' }}>{title}</h3>
      <p style={{ fontSize:'0.85rem', color:'rgba(255,255,255,0.4)', margin:'0 0 1.5rem' }}>{desc}</p>
      <div style={{ marginBottom:'1.5rem' }}>
        <span style={{ fontFamily:'var(--font-display)', fontSize:'2.8rem', fontWeight:400, color:'white', lineHeight:1 }}>{price}</span>
        <span style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.3)', marginLeft:'6px' }}>MXN</span>
      </div>
      <ul style={{ listStyle:'none', padding:0, margin:'0 0 2rem', display:'flex', flexDirection:'column', gap:'10px', flex:1 }}>
        {features.map(f => (
          <li key={f} style={{ display:'flex', gap:'10px', alignItems:'flex-start', fontSize:'0.88rem', color:'rgba(255,255,255,0.65)' }}>
            <CheckCircle2 size={16} color="var(--primary)" style={{ flexShrink:0, marginTop:'2px' }}/> {f}
          </li>
        ))}
      </ul>
      <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }} onClick={onClick}
        style={{ width:'100%', padding:'13px', borderRadius:'14px', border:featured?'none':'1px solid rgba(255,255,255,0.2)', background:featured?'var(--primary)':'rgba(255,255,255,0.06)', color:'white', fontWeight:700, fontSize:'0.9rem', cursor:'pointer', fontFamily:'var(--font-body)', transition:'all 0.2s' }}>
        {cta}
      </motion.button>
    </motion.div>
  );
}

function FAQItem({ q, a, open, onToggle, dark }) {
  return (
    <div style={{ ...(dark?glassDark:glass), borderRadius:'16px', overflow:'hidden' }}>
      <motion.button whileTap={{ scale:0.99 }} onClick={onToggle}
        style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'32px 40px', background:dark?'rgba(255,255,255,0.03)':'transparent', border:dark?'1px solid rgba(255,255,255,0.05)':'none', borderRadius:'24px', cursor:'pointer', textAlign:'left', gap:'16px', fontFamily:'var(--font-body)', transition:'all 0.2s' }}>
        <span style={{ fontWeight:700, fontSize:'1.1rem', color:dark?'white':'var(--black)', lineHeight:1.4, letterSpacing:'-0.01em' }}>{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ type:'spring', stiffness:300, damping:25 }}>
          <ChevronDown size={24} color="var(--primary)"/>
        </motion.div>
      </motion.button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:0.34, ease:[0.16,1,0.3,1] }} style={{ overflow:'hidden' }}>
            <motion.div
              initial={{ y:-12, opacity:0 }} animate={{ y:0, opacity:1 }} exit={{ y:-8, opacity:0 }}
              transition={{ duration:0.3, ease:[0.16,1,0.3,1], delay:0.06 }}
              style={{ padding:'0 40px 28px', fontSize:'0.95rem', color:dark?'rgba(255,255,255,0.55)':'#4B5563', lineHeight:1.7 }}>{a}</motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
