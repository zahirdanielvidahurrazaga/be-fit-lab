import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BadgeUnlockOverlay({ badge, onClose }) {
  if (!badge) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(15px)',
          WebkitBackdropFilter: 'blur(15px)',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
      >
        <motion.div
          initial={{ scale: 0.5, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 15, stiffness: 100, delay: 0.2 }}
          style={{ textAlign: 'center' }}
        >
          <div style={{
            fontSize: '6rem',
            marginBottom: '20px',
            filter: 'drop-shadow(0 0 40px rgba(255,139,66,0.5))'
          }}>
            {badge.icon}
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            color: 'white',
            fontSize: '2.2rem',
            margin: '0 0 10px',
            textShadow: '0 4px 20px rgba(0,0,0,0.5)'
          }}>
            ¡Felicidades!
          </h2>
          <p style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: '1.1rem',
            maxWidth: '300px',
            margin: '0 auto 30px',
            lineHeight: 1.5
          }}>
            Has desbloqueado la insignia <strong style={{ color: 'var(--primary)' }}>{badge.label}</strong>.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            style={{
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              color: 'white',
              border: 'none',
              padding: '16px 40px',
              borderRadius: '20px',
              fontSize: '1.1rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 10px 30px rgba(255,139,66,0.4)',
              fontFamily: 'var(--font-body)'
            }}
          >
            ¡Genial!
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
