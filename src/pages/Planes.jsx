import React, { useState, useEffect, useRef } from 'react';
import { Check, X, Calendar, Wallet, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { PricingCarousel } from '../components/PricingCarousel';
import { motion } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { Stripe } from '@capacitor-community/stripe';

function Planes() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshUserData, plan, classesRemaining, membershipStatus } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1); // 1 = confirm, 2 = waiting, 3 = success
  const [paymentError, setPaymentError] = useState(null);
  const [showCarousel, setShowCarousel] = useState(false);
  const [returningFromPayment, setReturningFromPayment] = useState(false);

  // Si no tiene plan activo, mostrar el carrusel directamente
  const showingCarousel = showCarousel || !membershipStatus || membershipStatus !== 'ACTIVE';
  const realtimeChannelRef = useRef(null);
  const pollIntervalRef = useRef(null);

  const handleOpenCheckout = (plan) => {
    setSelectedPlan(plan);
    setCheckoutStep(1);
    setPaymentError(null);
  };

  const closeModal = () => {
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setSelectedPlan(null);
    setIsProcessing(false);
    setPaymentError(null);
    setReturningFromPayment(false);
  };

  // Suscripción Realtime: detecta cuando el webhook de Stripe activa el plan
  const startWatchingPayment = () => {
    if (!user) return;
    if (realtimeChannelRef.current) supabase.removeChannel(realtimeChannelRef.current);
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    const channel = supabase
      .channel(`payment-watch-${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'users',
        filter: `id=eq.${user.id}`,
      }, async (payload) => {
        if (payload.new.membership_status === 'ACTIVE') {
          supabase.removeChannel(channel);
          realtimeChannelRef.current = null;
          await refreshUserData();
          setIsProcessing(false);
          setCheckoutStep(3);
          setTimeout(() => {
            closeModal();
            navigate('/portal');
          }, 2500);
        }
      })
      .subscribe();

    realtimeChannelRef.current = channel;

    // Fallback: verificar cada 3s por si Realtime no captura el evento a tiempo
    pollIntervalRef.current = setInterval(async () => {
      const { data } = await supabase
        .from('users')
        .select('membership_status')
        .eq('id', user.id)
        .single();
      if (data?.membership_status === 'ACTIVE') {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
        await refreshUserData();
        setIsProcessing(false);
        setCheckoutStep(3);
        setTimeout(() => { closeModal(); navigate('/portal'); }, 2500);
      }
    }, 3000);
  };

  const handleStripeCheckout = async () => {
    if (!user) return;
    setIsProcessing(true);
    setPaymentError(null);

    try {
      // ── NATIVO: hoja de pago DENTRO de la app (igual que la cafetería) ──────
      // La membresía es una suscripción: stripe-membership-intent crea la sub en
      // estado incompleto y devuelve el clientSecret de la 1ª factura para la hoja.
      if (Capacitor.isNativePlatform()) {
        const { data, error } = await supabase.functions.invoke('stripe-membership-intent', {
          body: { planTitle: selectedPlan.title, userId: user.id, userEmail: user.email },
        });
        if (error) throw new Error(error.message);
        if (!data?.clientSecret) throw new Error('No se recibió el intent de pago');

        // Presentar la hoja nativa (con Apple Pay si está configurado; si no, tarjeta)
        try {
          await Stripe.createPaymentSheet({
            paymentIntentClientSecret: data.clientSecret,
            merchantDisplayName: 'Be Fit Lab',
            enableApplePay: true,
            applePayMerchantId: 'merchant.com.befitlab.app',
            countryCode: 'MX',
          });
        } catch (e) {
          await Stripe.createPaymentSheet({
            paymentIntentClientSecret: data.clientSecret,
            merchantDisplayName: 'Be Fit Lab',
          });
        }
        const res = await Stripe.presentPaymentSheet();

        if (res?.paymentResult === 'paymentSheetCompleted') {
          // Pagado: activar el plan en el servidor; la UI reacciona por Realtime/polling
          startWatchingPayment();
          setReturningFromPayment(true);
          setCheckoutStep(2);
          setIsProcessing(false);
          await supabase.functions.invoke('stripe-membership-notify', {
            body: { paymentIntentId: data.paymentIntentId, subscriptionId: data.subscriptionId },
          });
        } else {
          // Cancelado o fallido: volver al paso 1 (sin error si solo canceló)
          setIsProcessing(false);
          if (res?.paymentResult && res.paymentResult !== 'paymentSheetCanceled') {
            setPaymentError('No se pudo completar el pago. Intenta de nuevo.');
          }
        }
        return;
      }

      // ── WEB: Checkout hospedado (redirige en la misma pestaña) ──────────────
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          planTitle: selectedPlan.title,
          userId: user.id,
          userEmail: user.email,
          returnUrl: window.location.origin,
        },
      });
      if (error) throw new Error(error.message);
      if (!data?.url) throw new Error('No se recibió URL de pago');

      // Escuchar con Realtime mientras el usuario paga
      startWatchingPayment();
      setCheckoutStep(2);
      setIsProcessing(false);

      localStorage.setItem('befit_payment_return', Date.now().toString());
      // Guardar el plan elegido: al volver de Stripe la pestaña se re-monta y
      // selectedPlan se pierde; lo restauramos para mostrar título/precio correctos.
      localStorage.setItem('befit_pending_plan', JSON.stringify(selectedPlan));
      window.location.href = data.url;
    } catch (err) {
      console.error('Error iniciando pago:', err);
      setPaymentError(err.message || 'Error al conectar con Stripe. Intenta de nuevo.');
      setIsProcessing(false);
    }
  };

  // Auto-abrir checkout si viene plan pre-seleccionado desde la landing
  useEffect(() => {
    if (location.state?.selectedPlan) {
      handleOpenCheckout(location.state.selectedPlan);
      window.history.replaceState({}, '');
    }
  }, []);

  // Retorno desde Stripe Checkout (success_url/cancel_url = /planes?payment=...)
  // Sin esto, la pestaña que vuelve de Stripe se quedaba en la pantalla de planes.
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(location.search);
    const pay = params.get('payment');
    if (!pay) return;

    // Limpiar el query para que no se reprocese al refrescar
    navigate(location.pathname, { replace: true, state: location.state });

    // Restaurar el plan que el usuario eligió antes de ir a Stripe (la pestaña se
    // re-montó al volver). Fallback genérico si por algo no estuviera guardado.
    let pendingPlan = null;
    try {
      const raw = localStorage.getItem('befit_pending_plan');
      if (raw) pendingPlan = JSON.parse(raw);
    } catch { /* ignore */ }
    localStorage.removeItem('befit_pending_plan');
    const fallbackPlan = pendingPlan || { title: plan || 'Tu membresía', price: '' };

    if (pay === 'success') {
      // Mostrar el modal en estado "confirmando" y vigilar la activación → portal
      setReturningFromPayment(true);
      setSelectedPlan(prev => prev || fallbackPlan);
      setCheckoutStep(2);
      refreshUserData?.();
      startWatchingPayment();
    } else if (pay === 'cancel') {
      // Reabrir el modal en el paso de confirmación para que el aviso sea visible
      // (al volver de Stripe el modal estaba cerrado y el mensaje no se mostraba).
      setReturningFromPayment(false);
      setSelectedPlan(prev => prev || fallbackPlan);
      setCheckoutStep(1);
      setPaymentError('El pago se canceló. Puedes intentarlo de nuevo cuando quieras.');
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (realtimeChannelRef.current) supabase.removeChannel(realtimeChannelRef.current);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

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

      {user && (
        <div style={{ maxWidth: '500px', margin: '0 auto 3rem', width: '100%' }}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ 
              padding: '24px', borderRadius: '32px',
              background: 'var(--app-surface-solid)',
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.06)',
              position: 'relative', overflow: 'hidden'
            }}
          >
            <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(255,145,77,0.15) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}></div>
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Membresía Actual</span>
                  </div>
                  <h2 style={{ fontSize: '1.6rem', color: 'var(--black)', margin: 0, fontFamily: 'var(--font-display)', lineHeight: 1.1 }}>
                    {plan ? plan.replace('Plan ', '') : 'Sin Plan'}
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: plan ? '#22C55E' : '#EF4444' }}></div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>{plan ? 'Suscripción Activa' : 'Inactiva'}</span>
                  </div>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary)', fontFamily: 'var(--font-display)', lineHeight: 0.9 }}>
                    {classesRemaining >= 9000 ? '∞' : classesRemaining}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>
                    Clases Restantes
                  </div>
                </div>
              </div>

              <div style={{ background: 'var(--surface-low)', borderRadius: '16px', padding: '16px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ background: 'rgba(255,145,77,0.1)', padding: '8px', borderRadius: '10px' }}>
                    <Calendar size={18} color="var(--primary)" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--black)' }}>Pago Recurrente Stripe</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 500 }}>Tu plan se renueva automáticamente cada mes.</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <button 
                onClick={() => setShowCarousel(true)}
                style={{ 
                  width: '100%', padding: '14px', borderRadius: '16px', 
                  background: 'var(--app-surface-solid)', color: 'var(--black)', 
                  border: '1px solid var(--border-subtle)', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer',
                  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.02)', transition: 'all 0.2s', marginTop: '16px'
                }}
              >
                <Wallet size={18} color="var(--primary)" /> Renovar o Cambiar Plan
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {(!user || showingCarousel) && (
        <div style={{ marginTop: '2rem' }}>
          <PricingCarousel onSelectPlan={(plan) => handleOpenCheckout({ title: `Plan ${plan.title}`, price: plan.price.replace('$', '') })} />
        </div>
      )}
      
      <div style={{ textAlign: 'center', marginTop: '4rem' }}>
        <button onClick={() => navigate(-1)} style={{ padding: '0.8rem 2rem', border: '1px solid var(--on-surface-variant)', background: 'transparent', color: 'var(--on-surface)', borderRadius: '30px', cursor: 'pointer', fontWeight: 600 }}>Volver</button>
      </div>

      {/* STRIPE CHECKOUT MODAL */}
      {selectedPlan && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              background: 'var(--app-surface-solid)', borderRadius: '24px', width: '100%', maxWidth: '420px',
              overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.25)'
            }}
          >
            {/* ── Paso 1: Confirmar compra ── */}
            {checkoutStep === 1 && (
              <>
                <div style={{ background: 'var(--surface-low)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--divider)' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Resumen de compra</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--on-surface)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {selectedPlan.title}
                      <span style={{ color: 'var(--primary)' }}>${selectedPlan.price}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-muted)', fontWeight: 500 }}>/mes</span>
                    </div>
                  </div>
                  <button onClick={closeModal} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--on-surface-muted)', padding: '4px' }}>
                    <X size={22} />
                  </button>
                </div>

                <div style={{ padding: '24px' }}>
                  {/* Detalle del plan */}
                  <div style={{ background: 'var(--surface-low)', borderRadius: '14px', padding: '16px', marginBottom: '20px', border: '1px solid rgba(255,139,66,0.15)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,139,66,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Calendar size={18} color="var(--primary)" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--on-surface)' }}>Suscripción mensual</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--on-surface-muted)' }}>Se renueva automáticamente cada mes</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>
                      Al hacer clic en "Ir a pagar" serás redirigida a la página segura de <strong>Stripe</strong> para ingresar tu tarjeta. El pago está encriptado y seguro.
                    </div>
                  </div>

                  {paymentError && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', background: '#FEF2F2', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', border: '1px solid #FECACA' }}>
                      <AlertCircle size={16} color="#EF4444" style={{ flexShrink: 0, marginTop: '1px' }} />
                      <span style={{ fontSize: '0.82rem', color: '#DC2626', fontWeight: 500 }}>{paymentError}</span>
                    </div>
                  )}

                  <button
                    onClick={handleStripeCheckout}
                    disabled={isProcessing}
                    style={{
                      width: '100%', padding: '15px', borderRadius: '12px', border: 'none',
                      background: isProcessing ? '#9CA3AF' : 'linear-gradient(135deg, var(--primary), #FFB085)',
                      color: 'white', fontSize: '1rem', fontWeight: 800,
                      cursor: isProcessing ? 'not-allowed' : 'pointer',
                      display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                      boxShadow: isProcessing ? 'none' : '0 8px 20px rgba(255,139,66,0.35)',
                      transition: 'all 0.2s',
                    }}
                  >
                    {isProcessing
                      ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Conectando con Stripe...</>
                      : <><Wallet size={18} /> Ir a pagar ${selectedPlan.price}</>
                    }
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.73rem', color: 'var(--on-surface-muted)' }}>
                    Pago seguro procesado por Stripe · Cancela cuando quieras
                  </div>
                </div>
              </>
            )}

            {/* ── Paso 2: Esperando confirmación ── */}
            {checkoutStep === 2 && (
              <div style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(255,139,66,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                  <Loader2 size={34} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
                <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', color: 'var(--on-surface)', marginBottom: '0.6rem' }}>
                  {returningFromPayment ? 'Confirmando tu pago' : 'Esperando tu pago'}
                </h2>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                  {returningFromPayment
                    ? 'Estamos activando tu membresía. En un momento te llevamos a tu portal.'
                    : 'Completa el pago en la ventana de Stripe que se abrió. Tu membresía se activará automáticamente al confirmar.'}
                </p>
                <button
                  onClick={closeModal}
                  style={{ padding: '10px 24px', borderRadius: '100px', border: '1px solid var(--border-subtle)', background: 'var(--app-surface-solid)', color: 'var(--on-surface-variant)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancelar
                </button>
              </div>
            )}

            {/* ── Paso 3: Éxito ── */}
            {checkoutStep === 3 && (
              <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}
                >
                  <Check size={36} color="#22C55E" />
                </motion.div>
                <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', color: 'var(--on-surface)', marginBottom: '0.5rem' }}>
                  ¡Pago Aprobado!
                </h2>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.95rem', marginBottom: '1rem' }}>
                  Activando tu membresía...
                </p>
                <div style={{ display: 'inline-block', padding: '8px 20px', background: 'rgba(255,139,66,0.1)', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                  {selectedPlan.title} · ${selectedPlan.price}/mes
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}

    </div>
  );
}

export default Planes;
