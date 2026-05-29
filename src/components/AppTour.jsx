import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Wallet, TrendingUp, Calendar, ChevronRight, X, Sparkles, Play } from 'lucide-react';

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
    title: 'Tu Semana',
    description: 'Aquí verás un resumen rápido de tu actividad: calorías quemadas, clases asistidas y puntos acumulados.',
    selector: '#tour-tu-semana'
  },
  {
    icon: <Calendar size={40} color="var(--primary)" />,
    title: 'Próximas Clases',
    description: 'Haz click en "Ver todo" o "Agendar ahora" para ir a la agenda y asegurar tu lugar en tu primera clase.',
    selector: '#tour-proximas-clases .tour-agendar-btn',
    requireClick: true,
    advanceOnPath: '/agenda'
  },
  {
    icon: <Calendar size={40} color="var(--primary)" />,
    title: 'Elige un Día',
    description: 'Selecciona cualquier día en el calendario que tenga clases disponibles (el punto verde) para ver los horarios.',
    selector: '.tour-calendar-day', // will select the first available day
    requireClick: true,
    advanceOnEvent: 'click',
    targetSelector: '.tour-calendar-day'
  },
  {
    icon: <Play size={40} color="var(--primary)" />,
    title: 'Reserva tu Lugar',
    description: 'Finalmente, haz click en una clase para ver sus detalles, conocer a tu coach y confirmar tu asistencia.',
    selector: '.tour-class-card',
    requireClick: true,
    advanceOnEvent: 'click',
    targetSelector: '.tour-class-card'
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
    if (!step || !step.selector) {
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

    const el = document.querySelector(step.selector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    updateRect();
    
    // Retry finding element if it takes a moment to render or scroll
    const timeout = setTimeout(updateRect, 300);
    
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [currentStep, showTour, isInternalRoute, location.pathname]);

  useEffect(() => {
    if (!showTour) return;
    const step = TOUR_STEPS[currentStep];
    if (!step) return;

    if (step.advanceOnPath && location.pathname === step.advanceOnPath) {
       setCurrentStep(prev => prev + 1);
    }
  }, [location.pathname, showTour, currentStep]);

  useEffect(() => {
    if (!showTour) return;
    const step = TOUR_STEPS[currentStep];
    if (!step) return;
    
    const handleClick = (e) => {
      // Allow clicks inside the tour modal itself
      if (e.target.closest('#tour-modal-card')) return;

      // Allow clicks on the target if interaction is required
      if (step.requireClick && step.targetSelector) {
        const el = e.target.closest(step.targetSelector);
        if (el) {
          if (step.advanceOnEvent === 'click') {
            setTimeout(() => {
              if (currentStep < TOUR_STEPS.length - 1) {
                setCurrentStep(prev => prev + 1);
              } else {
                setShowTour(false);
                setCurrentStep(0);
                if (user) localStorage.setItem(`befit_tour_seen_${user.id}`, 'true');
              }
            }, 150);
          }
          return; // Let the click happen!
        }
      }

      // If we reach here, the click is outside allowed areas. Block it!
      e.stopPropagation();
      e.preventDefault();
    };

    // Use capture phase to intercept clicks before they reach elements
    document.addEventListener('click', handleClick, true); 
    return () => document.removeEventListener('click', handleClick, true);
  }, [currentStep, showTour, user, setShowTour]);

  const stepData = TOUR_STEPS[currentStep];
  
  // Evitamos renderizar si no está activo, si no estamos dentro de la app, o si el paso es inválido
  if (!showTour || !isInternalRoute || !stepData) return null;

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
        <div style={{ position: 'fixed', inset: 0, zIndex: 999998, pointerEvents: 'none', overflow: 'hidden' }}>
          
          {/* Fondo oscuro simple, sin blur para mejor legibilidad */}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.1)', zIndex: 0 }} />
          
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
            id="tour-modal-card"
            key="tour-card"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: 'spring', damping: 25, stiffness: 300, mass: 0.8 }}
            style={{
              position: 'absolute',
              zIndex: 2,
              pointerEvents: 'auto',
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

            {/* Botón de acción u oculto si es interactivo */}
            {!stepData.requireClick && (
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
            )}

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
