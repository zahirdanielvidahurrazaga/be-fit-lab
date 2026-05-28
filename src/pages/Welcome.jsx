import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

function Welcome() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('splash'); // 'splash' -> 'welcome' -> 'exiting'

  // Forzar modo claro
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  // Splash dura 2.5s, luego pasa a welcome
  useEffect(() => {
    const timer = setTimeout(() => setPhase('welcome'), 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleStart = () => {
    setPhase('exiting');
    setTimeout(() => navigate('/login'), 500);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, width: '100%', height: '100dvh', overflow: 'hidden', backgroundColor: '#050505' }}>

      {/* ===== FONDO: Imagen Ultra-HD (siempre presente, opacity controlada) ===== */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/welcome_bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: phase === 'splash' ? 0 : 1,
        transition: 'opacity 1.2s ease-in-out',
        zIndex: 1
      }}>
        {/* Gradiente oscuro sofisticado */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.25) 35%, rgba(0,0,0,0.55) 65%, rgba(0,0,0,0.85) 100%)'
        }} />
      </div>

      {/* ===== SPLASH: Fondo negro + Logo oficial ===== */}
      <AnimatePresence>
        {phase === 'splash' && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, filter: 'blur(15px)' }}
            transition={{ duration: 1, ease: 'easeInOut' }}
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#ffffff', zIndex: 10
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.9, ease: [0.34, 1.56, 0.64, 1] }}
              style={{ textAlign: 'center' }}
            >
              <img
                src="/logo.png"
                alt="Be Fit Lab"
                style={{ width: '220px', height: 'auto', display: 'block', margin: '0 auto' }}
              />
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '50px', opacity: 1 }}
                transition={{ delay: 1.1, duration: 0.6 }}
                style={{
                  height: '1.5px', margin: '20px auto 0',
                  background: 'linear-gradient(90deg, transparent, rgba(255,145,77,0.6), transparent)',
                  borderRadius: '2px'
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== WELCOME: Textos + botón glassmorphism ===== */}
      <AnimatePresence>
        {phase === 'welcome' && (
          <motion.div
            key="welcome-content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: '0 32px 50px',
              paddingBottom: 'max(50px, env(safe-area-inset-bottom, 50px))',
              zIndex: 5
            }}
          >
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              style={{
                fontFamily: 'var(--font-display)', color: 'rgba(255,255,255,0.6)',
                letterSpacing: '5px', fontSize: '0.85rem', fontWeight: 400, margin: 0,
                textTransform: 'uppercase'
              }}
            >BE FIT LAB</motion.h1>

            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              style={{
                fontFamily: 'var(--font-display)', color: 'white',
                fontSize: '3rem', lineHeight: 1.05, margin: '10px 0', fontWeight: 400
              }}
            >
              Eleva tu<br/>
              <span style={{ color: 'var(--primary)', fontStyle: 'italic' }}>estándar.</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              style={{
                color: 'rgba(255,255,255,0.55)', fontSize: '0.95rem',
                lineHeight: 1.6, margin: '8px 0 28px', fontWeight: 400
              }}
            >
              El espacio de bienestar integral que redefine tu versión más fuerte.
            </motion.p>

            <motion.button
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              onClick={handleStart}
              style={{
                width: '100%', padding: '18px', borderRadius: '50px',
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(255,255,255,0.08)', color: 'white',
                fontSize: '1rem', fontWeight: 600,
                backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                cursor: 'pointer', transition: 'all 0.3s',
                fontFamily: 'var(--font-body)',
                boxShadow: '0 4px 30px rgba(0,0,0,0.1)',
                letterSpacing: '0.5px'
              }}
            >
              Iniciar Sesión
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== EXIT: Fade suave cuando navega a login ===== */}
      <AnimatePresence>
        {phase === 'exiting' && (
          <motion.div
            key="exit-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45 }}
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              zIndex: 20
            }}
          />
        )}
      </AnimatePresence>

    </div>
  );
}

export default Welcome;
