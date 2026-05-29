import React, { useState } from 'react';
import { Check, CreditCard, X, Lock, Mail, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { PricingCarousel } from '../components/PricingCarousel';

function Planes() {
  const navigate = useNavigate();
  const { user, activatePlan } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1); // 1 = form, 2 = success

  const handleOpenCheckout = (plan) => {
    setSelectedPlan(plan);
    setCheckoutStep(1);
  };

  const handleSimulatePayment = (e) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simula el tiempo de procesamiento de Stripe (2 segundos)
    setTimeout(async () => {
      if (user) {
        const classCount = selectedPlan.title.includes('FIT') ? 20 : (selectedPlan.title.includes('Premium') ? 30 : 15);
        // activatePlan actualiza el estado local DE INMEDIATO + persiste en BD
        await activatePlan(selectedPlan.title, classCount);
      }
      setIsProcessing(false);
      setCheckoutStep(2); // Mostrar pantalla de éxito
      
      // Redirigir automáticamente después de 2 segundos
      setTimeout(() => {
        if (user) {
          setSelectedPlan(null);
          navigate('/portal');
        } else {
          const planToPass = selectedPlan;
          setSelectedPlan(null);
          navigate('/registro', { state: { purchasedPlan: planToPass } });
        }
      }, 2000);
    }, 2000);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--app-bg)', padding: '4rem 2rem', fontFamily: 'var(--font-body)' }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--black)' }}>
          {user ? 'Mi Membresía' : 'Elige tu Plan BE FIT'}
        </h1>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: '1.1rem' }}>
          {user ? 'Administra tu plan y descubre nuevas opciones.' : 'Membresías diseñadas para transformar tu estilo de vida.'}
        </p>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <PricingCarousel onSelectPlan={(plan) => handleOpenCheckout({ title: `Plan ${plan.title}`, price: plan.price.replace('$', '') })} />
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '4rem' }}>
        <button onClick={() => navigate(-1)} style={{ padding: '0.8rem 2rem', border: '1px solid #1A1C1E', background: 'transparent', borderRadius: '30px', cursor: 'pointer', fontWeight: 600 }}>Volver</button>
      </div>

      {/* STRIPE CHECKOUT MODAL SIMULATION */}
      {selectedPlan && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', width: '100%', maxWidth: '450px',
            overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', animation: 'fadeInUp 0.3s ease'
          }}>
            {checkoutStep === 1 ? (
              <>
                {/* Header del Modal */}
                <div style={{ background: '#F9FAFB', padding: '20px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resumen de compra</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {selectedPlan.title} <span style={{ color: 'var(--primary)' }}>${selectedPlan.price}</span>
                    </div>
                  </div>
                  <button onClick={() => !isProcessing && setSelectedPlan(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                    <X size={24} />
                  </button>
                </div>

                {/* Formulario de Pago */}
                <form onSubmit={handleSimulatePayment} style={{ padding: '25px' }}>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Correo Electrónico</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={18} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input type="email" required defaultValue={user?.email || ''} style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.95rem' }} placeholder="tu@correo.com" />
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Información de la Tarjeta</label>
                    <div style={{ border: '1px solid #D1D5DB', borderRadius: '8px', overflow: 'hidden' }}>
                      <div style={{ position: 'relative', borderBottom: '1px solid #D1D5DB' }}>
                        <CreditCard size={18} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input type="text" required maxLength="16" style={{ width: '100%', padding: '12px 12px 12px 40px', border: 'none', fontSize: '0.95rem', outline: 'none' }} placeholder="Número de Tarjeta" />
                      </div>
                      <div style={{ display: 'flex' }}>
                        <div style={{ flex: 1, borderRight: '1px solid #D1D5DB' }}>
                          <input type="text" required placeholder="MM / AA" maxLength="5" style={{ width: '100%', padding: '12px', border: 'none', fontSize: '0.95rem', outline: 'none' }} />
                        </div>
                        <div style={{ flex: 1, position: 'relative' }}>
                          <Lock size={16} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                          <input type="text" required placeholder="CVC" maxLength="4" style={{ width: '100%', padding: '12px 12px 12px 35px', border: 'none', fontSize: '0.95rem', outline: 'none' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '25px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Nombre en la Tarjeta</label>
                    <div style={{ position: 'relative' }}>
                      <User size={18} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input type="text" required style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.95rem' }} placeholder="Nombre Completo" />
                    </div>
                  </div>

                  <button type="submit" disabled={isProcessing} style={{ 
                    width: '100%', padding: '14px', borderRadius: '8px', border: 'none', 
                    background: isProcessing ? '#9CA3AF' : '#111827', color: 'white', 
                    fontSize: '1rem', fontWeight: 600, cursor: isProcessing ? 'not-allowed' : 'pointer',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease'
                  }}>
                    {isProcessing ? 'Validando con Stripe...' : `Pagar $${selectedPlan.price}`} <Lock size={16} />
                  </button>
                  
                  <div style={{ textAlign: 'center', marginTop: '15px', fontSize: '0.75rem', color: '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                    <Lock size={12} /> Pagos seguros encriptados por Stripe
                  </div>
                </form>
              </>
            ) : (
              /* STEP 2: PANTALLA DE ÉXITO (Patrón Santuario) */
              <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <div style={{ 
                  width: '70px', height: '70px', borderRadius: '50%', 
                  background: 'rgba(34,197,94,0.1)', display: 'flex', 
                  alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
                  animation: 'scaleUp 0.4s ease'
                }}>
                  <Check size={35} color="#22C55E" />
                </div>
                <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', color: '#111827', marginBottom: '0.5rem' }}>
                  ¡Pago Aprobado!
                </h2>
                <p style={{ color: '#6B7280', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                  {user ? 'Activando tu membresía...' : 'Redirigiendo al registro...'}
                </p>
                <div style={{ 
                  display: 'inline-block', padding: '8px 20px', background: 'rgba(255,145,77,0.1)', 
                  borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', marginTop: '10px'
                }}>
                  {selectedPlan.title} · ${selectedPlan.price}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default Planes;
