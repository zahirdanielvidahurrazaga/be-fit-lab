import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { ChevronLeft, ChevronRight, Coffee, Flame, Info, AlertCircle, ShoppingCart } from 'lucide-react';

const ICE_COFFEE = [
  { id: 'c1', name: 'Iced Americano', description: 'Espresso con hielo y agua', price: 30, paymentUrl: '#', image: '/cafeteria/iced_americano_plain_v2_1780028321924.png' },
  { id: 'c2', name: 'Iced Latte', description: 'Espresso con hielo y leche', price: 45, paymentUrl: '#', image: '/cafeteria/iced_latte_plain_1780028143088.png' },
  { id: 'c3', name: 'Ice Chocolate', description: 'Mezcla de chocolate de la casa con hielo', price: 45, paymentUrl: '#', image: '/cafeteria/ice_chocolate_plain_1780028154536.png' },
  { id: 'c4', name: 'Vainilla Latte', description: 'Espresso, Vainilla, leche y hielos', price: 45, paymentUrl: '#', image: '/cafeteria/vainilla_latte_plain_1780028168845.png' },
];

const SMOOTHIES = [
  { id: 's1', name: 'Mango Proteín', cals: 220, protein: 26, description: 'Promedio: 220 calorías, 25 g de proteína', price: 100, paymentUrl: '#' },
  { id: 's2', name: 'Horchata Proteín', cals: 218, protein: 26, description: 'Promedio: 220 calorías, 25 g de proteína', price: 100, paymentUrl: '#' },
  { id: 's3', name: 'Arroz con Leche', cals: 218, protein: 26, description: 'Promedio: 220 calorías, 25 g de proteína', price: 100, paymentUrl: '#' },
  { id: 's4', name: 'Banana Maní', cals: 290, protein: 30, description: 'Promedio: 220 calorías, 25 g de proteína', price: 100, paymentUrl: '#' },
  { id: 's5', name: 'CHAI Frambuesa', cals: 220, protein: 26, description: 'Promedio: 220 calorías, 25 g de proteína', price: 100, paymentUrl: '#' },
  { id: 's6', name: 'CHOCO BANANA', cals: 250, protein: 26, description: 'Promedio: 220 calorías, 25 g de proteína', price: 100, paymentUrl: '#' },
  { id: 's7', name: 'Dubai Proteín', cals: 250, protein: 26, description: 'Promedio: 220 calorías, 25 g de proteína', price: 100, paymentUrl: '#' },
  { id: 's8', name: 'Mazapan', cals: 70, protein: 4, description: 'Promedio: 220 calorías, 25 g de proteína', price: 100, paymentUrl: '#' },
  { id: 's9', name: 'Fit-colada', cals: null, protein: null, description: 'Coco rayado, agua de coco, pulpa de piña', price: 100, paymentUrl: '#' },
];

const TEMPORADA = [
  { id: 't1', name: 'Mango-Matcha', description: 'Leche de tu preferencia, pulpa de mango, matcha (Pídelo también con proteína)', cals: 70, protein: 4, price: 60, paymentUrl: '#' },
];

function Cafeteria() {
  const navigate = useNavigate();
  const isNative = Capacitor.isNativePlatform();
  const [activeWidgetIndex, setActiveWidgetIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    window.scrollTo(0, 0);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const nextWidget = () => setActiveWidgetIndex((prev) => (prev + 1) % 3);
  const prevWidget = () => setActiveWidgetIndex((prev) => (prev - 1 + 3) % 3);

  const handleBuy = (item) => {
    if (item.paymentUrl && item.paymentUrl !== '#') {
      window.location.href = item.paymentUrl;
    } else {
      alert('¡Próximamente! Esperando enlace de pago para ' + item.name);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FDFBF7', color: '#1A1C1E', fontFamily: 'var(--font-body)', overflowX: 'hidden' }}>
      
      {/* HERO SECTION */}
      <div style={{ position: 'relative', width: '100%', height: isNative ? '300px' : '400px', background: 'url("/fotos-hero/IMG_5410.JPG")', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%)', backdropFilter: 'blur(3px)' }}></div>
        
        {/* NAV BUTTON */}
        <div style={{ position: 'absolute', top: isNative ? '40px' : '30px', left: isNative ? '15px' : '30px', zIndex: 10 }}>
          <button 
            onClick={() => navigate('/')} 
            className="glass-button" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '0.9rem', color: 'white', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)' }}
          >
            <ChevronLeft size={18} /> Volver
          </button>
        </div>

        {/* TITLE / LOGO */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', textAlign: 'center', zIndex: 1, pointerEvents: 'none', display: 'flex', justifyContent: 'center' }}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <img 
              src="/cafeteria/logo.png" 
              alt="Cafeteria Logo" 
              style={{ width: '90%', maxWidth: '600px', height: 'auto', filter: 'brightness(0) invert(1)', objectFit: 'contain' }} 
            />
          </motion.div>
        </div>
      </div>

      {/* MENU CONTAINER */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: isNative ? '30px 20px' : '60px 40px' }}>
        
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          
          {/* CATEGORY: ICE COFFEE */}
          <motion.div variants={itemVariants} style={{ marginBottom: '50px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', borderBottom: '2px solid rgba(0,0,0,0.1)', paddingBottom: '15px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              Ice Coffee
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {ICE_COFFEE.map(item => (
                <div key={item.id} style={{ background: 'white', borderRadius: '20px', padding: '25px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  
                  {/* IMAGE */}
                  {item.image && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
                      <img src={item.image} alt={item.name} style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', mixBlendMode: 'multiply' }} />
                    </div>
                  )}

                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 8px 0' }}>{item.name}</h3>
                    <p style={{ color: '#6B7280', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>{item.description}</p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '25px' }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>${item.price}</span>
                    <button onClick={() => handleBuy(item)} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '30px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                      <ShoppingCart size={16} /> Agregar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* CATEGORY: SMOOTHIES */}
          <motion.div variants={itemVariants} style={{ marginBottom: '50px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', borderBottom: '2px solid rgba(0,0,0,0.1)', paddingBottom: '15px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              Coffee Lab & Smoothies
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
              {SMOOTHIES.map(item => (
                <div key={item.id} style={{ background: 'linear-gradient(145deg, #ffffff, #fdfbf7)', borderRadius: '24px', padding: '25px', boxShadow: '0 15px 35px rgba(0,0,0,0.06)', border: '1px solid rgba(255,145,77,0.15)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
                  
                  {/* Decorative blob */}
                  <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'rgba(255,145,77,0.05)', borderRadius: '50%', zIndex: 0 }}></div>
                  
                  <div style={{ zIndex: 1 }}>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 5px 0' }}>{item.name}</h3>
                    <p style={{ color: '#6B7280', fontSize: '0.85rem', margin: '0 0 15px 0', lineHeight: 1.4 }}>{item.description}</p>
                    
                    {(item.cals || item.protein) && (
                      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                        {item.cals && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.04)', padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
                            <Flame size={14} color="#EF4444" /> {item.cals} cals
                          </span>
                        )}
                        {item.protein && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,145,77,0.1)', padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, color: '#D97706' }}>
                            {item.protein}g Proteína
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', zIndex: 1 }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>${item.price}</span>
                    <button onClick={() => handleBuy(item)} style={{ background: 'black', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '30px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }} onMouseEnter={e => {e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.background = '#222'}} onMouseLeave={e => {e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'black'}}>
                      Comprar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* CATEGORY: TEMPORADA */}
          <motion.div variants={itemVariants} style={{ marginBottom: '60px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', borderBottom: '2px solid rgba(0,0,0,0.1)', paddingBottom: '15px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              Bebidas de Temporada
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
              {TEMPORADA.map(item => (
                <div key={item.id} style={{ background: 'linear-gradient(135deg, #FFD194 0%, #70E1F5 100%)', padding: '2px', borderRadius: '26px' }}>
                  <div style={{ background: 'white', borderRadius: '24px', padding: '30px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 10px 0' }}>{item.name}</h3>
                    <p style={{ color: '#4B5563', fontSize: '0.95rem', margin: '0 0 20px 0', lineHeight: 1.5 }}>{item.description}</p>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.04)', padding: '5px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>
                        <Flame size={14} color="#EF4444" /> {item.cals} cals
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,145,77,0.1)', padding: '5px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700, color: '#D97706' }}>
                        {item.protein}g Proteína
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                      <span style={{ fontSize: '1.6rem', fontWeight: 800 }}>${item.price}</span>
                      <button onClick={() => handleBuy(item)} style={{ background: 'linear-gradient(to right, #f97316, #ea580c)', color: 'white', border: 'none', padding: '12px 28px', borderRadius: '30px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(234,88,12,0.3)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                        <ShoppingCart size={18} /> Pedir Ya
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* INFORMACIÓN EXTRA WIDGETS CAROUSEL (Estilo Precios) */}
          <motion.div variants={itemVariants} style={{ position: 'relative', width: '100%', maxWidth: '1000px', margin: '60px auto 40px', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            
            {/* Flechas de navegación */}
            <button onClick={prevWidget} style={{ position: 'absolute', left: isMobile ? '5px' : '10px', zIndex: 20, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.9)', borderRadius: '50%', width: isMobile ? '40px' : '56px', height: isMobile ? '40px' : '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(10px)', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', transition: 'all 0.2s' }}>
              <ChevronLeft size={isMobile ? 24 : 28} color="var(--primary)" />
            </button>
            
            <button onClick={nextWidget} style={{ position: 'absolute', right: isMobile ? '5px' : '10px', zIndex: 20, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.9)', borderRadius: '50%', width: isMobile ? '40px' : '56px', height: isMobile ? '40px' : '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(10px)', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', transition: 'all 0.2s' }}>
              <ChevronRight size={isMobile ? 24 : 28} color="var(--primary)" />
            </button>

            <div style={{ position: 'relative', width: isMobile ? '320px' : '360px', height: '100%', perspective: isMobile ? 'none' : '1200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {[
                {
                  id: 'w1',
                  content: (
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(145deg, #ffffff, #fcfaf8)', padding: '30px', borderRadius: '32px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', border: '1px solid rgba(255,145,77,0.15)', boxShadow: 'inset 0 0 20px rgba(255,255,255,0.5)' }}>
                      <div style={{ position: 'absolute', top: -30, right: -30, opacity: 0.03, color: 'var(--primary)' }}><Coffee size={150} /></div>
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', marginBottom: '20px', zIndex: 1, position: 'relative', color: '#1A1C1E' }}>
                        <Info size={20} color="var(--primary)" /> ¿Cuánta proteína necesitas?
                      </h3>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, zIndex: 1, position: 'relative', display: 'flex', flexDirection: 'column', gap: '12px', color: '#4B5563' }}>
                        <li style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '8px' }}>
                          <span>Sedentario</span>
                          <strong style={{ color: '#1A1C1E' }}>0.8 a 1.0 g/kg</strong>
                        </li>
                        <li style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '8px' }}>
                          <span>Activo / Deportista</span>
                          <strong style={{ color: '#1A1C1E' }}>1.2 a 2.0 g/kg</strong>
                        </li>
                        <li style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px' }}>
                          <span>Adulto mayor</span>
                          <strong style={{ color: '#1A1C1E' }}>1.2 a 1.5 g/kg</strong>
                        </li>
                      </ul>
                      <p style={{ fontSize: '0.8rem', color: '#9CA3AF', marginTop: '15px', fontStyle: 'italic', zIndex: 1, position: 'relative' }}>* Para evitar pérdida ósea</p>
                    </div>
                  )
                },
                {
                  id: 'w2',
                  content: (
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(145deg, #ffffff, #fcfaf8)', padding: '30px', borderRadius: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', border: '1px solid rgba(255,145,77,0.15)', boxShadow: 'inset 0 0 20px rgba(255,255,255,0.5)' }}>
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', marginBottom: '20px', color: '#1A1C1E' }}>
                        Beneficios
                      </h3>
                      <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '15px', color: '#4B5563', lineHeight: 1.5, fontWeight: 500 }}>
                        <li>Snack inteligente</li>
                        <li>Control de ansiedad</li>
                        <li>Recuperación post-entrenamiento</li>
                        <li>Mejora la composición corporal</li>
                        <li>Boost de energía para tu entreno</li>
                      </ul>
                    </div>
                  )
                },
                {
                  id: 'w3',
                  content: (
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #FFF3E5, #FFE4CC)', padding: '30px', borderRadius: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', border: '1px solid rgba(255,145,77,0.3)', boxShadow: 'inset 0 0 20px rgba(255,255,255,0.5)' }}>
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', marginBottom: '15px', color: 'var(--primary)' }}>
                        <AlertCircle size={22} /> Aviso Importante
                      </h3>
                      <p style={{ fontSize: '1.1rem', lineHeight: 1.6, margin: 0, fontWeight: 600, color: '#1A1C1E' }}>
                        Ordena tu bebida <strong>antes de entrenar</strong> y evita filas al terminar. 
                      </p>
                      <div style={{ marginTop: '30px', padding: '15px', background: 'white', borderRadius: '16px', fontSize: '1rem', textAlign: 'center', fontWeight: 800, color: 'var(--primary)', boxShadow: '0 4px 15px rgba(255,145,77,0.15)' }}>
                        ¡Tu bebida te estará esperando!
                      </div>
                    </div>
                  )
                }
              ].map((widget, index) => {
                let offset = (index - activeWidgetIndex) % 3;
                if (offset < -1) offset += 3;
                if (offset > 1) offset -= 3;
                
                if (Math.abs(offset) > 1) return null;

                const isActive = offset === 0;
                const x = offset * (isMobile ? 300 : 220); 
                const scale = isActive ? 1 : (isMobile ? 0.95 : 0.85);
                const zIndex = isActive ? 10 : 5;
                const opacity = isActive ? 1 : (isMobile ? 0 : 0.7);
                
                return (
                  <motion.div
                    key={widget.id}
                    animate={{ x, scale, zIndex, opacity }}
                    transition={{ type: 'spring', stiffness: 250, damping: 25 }}
                    style={{
                      position: 'absolute',
                      width: '100%',
                      height: '350px',
                      borderRadius: '32px',
                      boxShadow: isActive ? '0 20px 50px rgba(0,0,0,0.1)' : '0 10px 30px rgba(0,0,0,0.05)',
                      display: 'flex',
                      overflow: 'hidden',
                      cursor: isActive ? 'default' : 'pointer',
                      border: '1px solid rgba(255,255,255,0.8)',
                      pointerEvents: 'auto',
                      WebkitFontSmoothing: 'antialiased',
                      transformStyle: 'preserve-3d'
                    }}
                    onClick={() => {
                      if (!isActive) {
                         if (offset === 1) nextWidget();
                         if (offset === -1) prevWidget();
                      }
                    }}
                  >
                    {widget.content}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}

export default Cafeteria;
