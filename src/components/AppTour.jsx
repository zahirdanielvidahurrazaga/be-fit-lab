import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Wallet, TrendingUp, Calendar, ChevronRight, X, Sparkles } from 'lucide-react';

const TOUR_STEPS = [
  {
    icon: <Sparkles size={40} color="var(--primary)" />,
    title: '¡Te damos la bienvenida!',
    description: 'Prepárate para transformar tu estilo de vida. Te daremos un breve recorrido por tu nueva app Be Fit Lab.',
    selector: null
  },
  {
    icon: <Wallet size={40} color="var(--primary)" />,
    title: 'Tu Membresía',
    description: 'Revisa tu plan actual, cuántas clases te quedan o actualiza tu membresía de manera rápida y segura.',
    selector: '.dashboard-sidebar > div:first-child'
  },
  {
    icon: <TrendingUp size={40} color="var(--primary)" />,
    title: 'Sigue tu Evolución',
    description: 'La pestaña "Metas" calcula tu Score y te premia con Insignias por tu disciplina. ¡Mantén tu fuego continuo!',
    selector: '.ios-bottom-nav a[href="/evolucion"]'
  },
  {
    icon: <Calendar size={40} color="var(--primary)" />,
    title: 'Agenda tus Clases',
    description: 'En "Clases" podrás reservar o cancelar tus sesiones para la semana. ¡Asegura tu lugar con anticipación!',
    selector: '.ios-bottom-nav a[href="/agenda"]'
  }
];

export function AppTour() {
  const { showTour, setShowTour, user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const location = useLocation();

  // Solo mostrar el tour si estamos en una ruta interna (no en login, register o welcome)
  const isInternalRoute = ['/portal', '/evolucion', '/agenda', '/nutricion', '/mi-cuenta'].includes(location.pathname);

  useEffect(() => {
    if (!showTour || !isInternalRoute) return;
    
    const step = TOUR_STEPS[currentStep];
    if (!step.selector) {
      setTargetRect(null);
      return;
    }

    const updateRect = () => {
      const el = document.querySelector(step.selector);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    };

    updateRect();
    
    // Retry finding element if it takes a moment to render
    const timeout = setTimeout(updateRect, 300);
    
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [currentStep, showTour, isInternalRoute, location.pathname]);

  // Evitamos renderizar si no está activo o si no estamos dentro de la app
  if (!showTour || !isInternalRoute) return null;

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setShowTour(false);
    setCurrentStep(0);
    if (user) {
      localStorage.setItem(`befit_tour_seen_${user.id}`, 'true');
    }
  };

  const stepData = TOUR_STEPS[currentStep];

  // Cálculo de posición del tooltip
  const isBottomHalf = targetRect && targetRect.top > window.innerHeight / 2;
  
  // Variantes para el modal dependiendo si hay objetivo o está centrado
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      x: '-50%', // Centrado horizontalmente
      top: targetRect 
        ? (isBottomHalf ? targetRect.top - 20 : targetRect.bottom + 20) 
        : '50%',
      translateY: targetRect 
        ? (isBottomHalf ? '-100%' : '0%') 
        : '-50%',
      left: '50%'
    },
    exit: { opacity: 0, scale: 0.9, y: 20 }
  };

  return (
    <AnimatePresence>
      {showTour && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999998, pointerEvents: 'auto', overflow: 'hidden' }}>
          
          {/* Spotlight Overlay con blur de fallback */}
          <div style={{ position: 'absolute', inset: 0, backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', zIndex: 0 }} />
          
          <motion.div
            initial={false}
            animate={{
              x: targetRect ? targetRect.left - 10 : window.innerWidth / 2,
              y: targetRect ? targetRect.top - 10 : window.innerHeight / 2,
              width: targetRect ? targetRect.width + 20 : 0,
              height: targetRect ? targetRect.height + 20 : 0,
              borderRadius: targetRect ? 24 : 0
            }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.75)',
              pointerEvents: 'none', // Permite que los clics lleguen al overlay transparente
              zIndex: 1
            }}
          />

          <motion.div
            key="tour-card"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: 'spring', damping: 25, stiffness: 300, mass: 0.8 }}
            style={{
              position: 'absolute',
              zIndex: 2,
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '32px', padding: '30px 24px', width: '90%', maxWidth: '340px',
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
              border: '1px solid rgba(255, 255, 255, 1)'
            }}
          >

            {/* Ícono animado */}
            <motion.div 
              initial={{ scale: 0.5, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', delay: 0.1 }}
              style={{
                width: '90px', height: '90px', margin: '0 auto 24px', borderRadius: '50%',
                background: 'rgba(255,139,66,0.1)', border: '2px solid rgba(255,139,66,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 10px 25px rgba(255,139,66,0.2)'
              }}
            >
              {stepData.icon}
            </motion.div>

            {/* Textos */}
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'var(--font-display)', margin: '0 0 12px', color: 'var(--black)' }}>
              {stepData.title}
            </h3>
            <p style={{ fontSize: '0.95rem', color: 'var(--on-surface-variant)', lineHeight: 1.5, margin: '0 0 30px' }}>
              {stepData.description}
            </p>

            {/* Botón de acción */}
            <button 
              onClick={handleNext}
              style={{
                width: '100%', padding: '16px', borderRadius: '20px', border: 'none',
                background: 'var(--primary)', color: 'white', fontWeight: 800, fontSize: '1rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer',
                boxShadow: '0 10px 20px rgba(255,139,66,0.3)', transition: 'transform 0.1s'
              }}
            >
              {currentStep === TOUR_STEPS.length - 1 ? '¡Comenzar!' : 'Siguiente'} 
              {currentStep < TOUR_STEPS.length - 1 && <ChevronRight size={20} />}
            </button>

            {/* Indicadores de progreso */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '24px' }}>
              {TOUR_STEPS.map((_, i) => (
                <div 
                  key={i} 
                  style={{ 
                    width: i === currentStep ? '20px' : '6px', height: '6px', 
                    borderRadius: '3px', background: i === currentStep ? 'var(--primary)' : 'rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease'
                  }} 
                />
              ))}
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
