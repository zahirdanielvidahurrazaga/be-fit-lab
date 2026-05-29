import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { User, Wallet, TrendingUp, Calendar, ChevronRight, X, Sparkles } from 'lucide-react';

const TOUR_STEPS = [
  {
    icon: <Sparkles size={40} color="var(--primary)" />,
    title: '¡Te damos la bienvenida!',
    description: 'Prepárate para transformar tu estilo de vida. Te daremos un breve recorrido por tu nueva app Be Fit Lab.',
  },
  {
    icon: <User size={40} color="var(--primary)" />,
    title: 'Tu Perfil y Portal',
    description: 'En la pestaña "Yo" encontrarás tu información personal, acceso a tus compras y opciones para configurar tu cuenta.',
  },
  {
    icon: <Wallet size={40} color="var(--primary)" />,
    title: 'Membresía a un toque',
    description: 'Revisa tu plan actual, cuántas clases te quedan o actualiza tu membresía de manera rápida y segura.',
  },
  {
    icon: <TrendingUp size={40} color="var(--primary)" />,
    title: 'Sigue tu Evolución',
    description: 'La pestaña "Metas" calcula tu Score y te premia con Insignias por tu disciplina. ¡Mantén tu fuego continuo!',
  },
  {
    icon: <Calendar size={40} color="var(--primary)" />,
    title: 'Agenda tus Clases',
    description: 'En "Clases" podrás reservar o cancelar tus sesiones para la semana. ¡Asegura tu lugar con anticipación!',
  }
];

export function AppTour() {
  const { showTour, setShowTour, user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);

  if (!showTour) return null;

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

  return (
    <AnimatePresence>
      {showTour && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 999999,
            background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(15px)', WebkitBackdropFilter: 'blur(15px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
          }}
        >
          <motion.div
            key={currentStep}
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: -20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              background: 'rgba(255, 255, 255, 0.85)',
              borderRadius: '32px', padding: '40px 30px', width: '100%', maxWidth: '360px',
              textAlign: 'center', position: 'relative',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
              border: '1px solid rgba(255, 255, 255, 0.5)'
            }}
          >
            {/* Botón de cerrar / omitir */}
            <button 
              onClick={handleClose}
              style={{ 
                position: 'absolute', top: '15px', right: '15px', 
                background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '50%', 
                width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' 
              }}
            >
              <X size={18} color="var(--on-surface-variant)" />
            </button>

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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
