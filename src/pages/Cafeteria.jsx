import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { Stripe } from '@capacitor-community/stripe';
import { ChevronLeft, ChevronRight, Coffee, Flame, Info, AlertCircle, ShoppingCart, ShoppingBag, CheckCircle2, X, Receipt } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import CafeProductSheet from '../components/CafeProductSheet';
import CafeCartSheet from '../components/CafeCartSheet';
import CafeOrderTracking from '../components/CafeOrderTracking';
import CafeOrderHistory from '../components/CafeOrderHistory';

function Cafeteria() {
  const navigate = useNavigate();
  const { user, cafeProducts } = useAuth();
  const isNative = Capacitor.isNativePlatform();
  const [activeWidgetIndex, setActiveWidgetIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showThanks, setShowThanks] = useState(false);

  // --- Pedido (estilo Uber Eats) ---
  const [optionGroups, setOptionGroups] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null); // ficha/personalización
  const [showCart, setShowCart] = useState(false);
  const [cart, setCart] = useState([]);
  const [confirming, setConfirming] = useState(null);   // { meta } durante la cuenta de 5s
  const [countdown, setCountdown] = useState(5);
  const [processing, setProcessing] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState(null); // seguimiento del pedido
  const [activeOrders, setActiveOrders] = useState([]);          // pedidos en curso del usuario
  const [showHistory, setShowHistory] = useState(false);         // historial de pedidos del usuario

  // Catálogo desde la BD (precios server-side). Solo productos disponibles.
  const available = (cafeProducts || []).filter(p => p.available !== false);
  const coffeeItems = available.filter(p => p.category === 'coffee');
  const smoothieItems = available.filter(p => p.category === 'smoothie');
  const temporadaItems = available.filter(p => p.category === 'temporada');

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.lineTotal, 0);

  useEffect(() => {
    window.scrollTo(0, 0);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    if (new URLSearchParams(window.location.search).get('payment') === 'success') setShowThanks(true);
    const onPaid = () => setShowThanks(true);
    window.addEventListener('cafe-payment-success', onPaid);
    // Cargar grupos de personalización (con sus opciones)
    (async () => {
      const { data } = await supabase.from('cafe_option_groups').select('*, cafe_options(*)').order('sort_order');
      setOptionGroups(data || []);
    })();
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('cafe-payment-success', onPaid);
    };
  }, []);

  // Pedidos en curso del usuario (para el botón "Mi pedido") + realtime
  useEffect(() => {
    if (!user?.id) return;
    const fetchActive = async () => {
      const { data } = await supabase.from('cafe_orders').select('id,status,created_at').eq('user_id', user.id).in('status', ['paid', 'preparing', 'ready']).order('created_at', { ascending: false });
      setActiveOrders(data || []);
    };
    fetchActive();
    const ch = supabase.channel(`my-cafe-orders-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cafe_orders', filter: `user_id=eq.${user.id}` }, fetchActive)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [user?.id]);

  const orderStatusLabel = (s) => s === 'preparing' ? 'Preparándose' : s === 'ready' ? '¡Listo para recoger!' : 'Confirmado';

  // Bloquear el scroll del fondo cuando hay una hoja/overlay abierto
  useEffect(() => {
    const open = selectedProduct || showCart || confirming || processing || showThanks || trackingOrderId || showHistory;
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [selectedProduct, showCart, confirming, processing, showThanks, trackingOrderId, showHistory]);

  const nextWidget = () => setActiveWidgetIndex((prev) => (prev + 1) % 3);
  const prevWidget = () => setActiveWidgetIndex((prev) => (prev - 1 + 3) % 3);

  // Carrito
  const openProduct = (item) => setSelectedProduct(item);
  const addToCart = (line) => { setCart(c => [...c, line]); setSelectedProduct(null); };
  const updateQty = (lineId, delta) => setCart(c => c.map(i => i.lineId === lineId ? { ...i, qty: Math.max(1, i.qty + delta), lineTotal: i.unitPrice * Math.max(1, i.qty + delta) } : i));
  const removeItem = (lineId) => setCart(c => c.filter(i => i.lineId !== lineId));

  // Cuenta regresiva de 5s para cancelar antes de pagar
  const startCheckout = (meta) => { setShowCart(false); setConfirming(meta); setCountdown(5); };
  const cancelCheckout = () => setConfirming(null);
  useEffect(() => {
    if (!confirming) return;
    if (countdown <= 0) { proceedToPayment(confirming); setConfirming(null); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [confirming, countdown]); // eslint-disable-line react-hooks/exhaustive-deps

  const proceedToPayment = async (meta) => {
    if (processing || cart.length === 0) return;
    setProcessing(true);
    try {
      const items = cart.map(i => ({ product_id: i.product_id, quantity: i.qty, option_ids: i.option_ids, notes: i.notes }));
      const body = { items, userEmail: user?.email, userId: user?.id, gift: meta.gift, pickupTime: meta.pickupTime, noStraw: meta.noStraw };

      if (Capacitor.isNativePlatform()) {
        const { data, error } = await supabase.functions.invoke('stripe-cafe-intent', { body });
        if (error) throw new Error(error.message);
        if (!data?.clientSecret) throw new Error('No se recibió el intent de pago');
        try {
          await Stripe.createPaymentSheet({ paymentIntentClientSecret: data.clientSecret, merchantDisplayName: 'Be Fit Lab', enableApplePay: true, applePayMerchantId: 'merchant.com.befitlab.app', countryCode: 'MX' });
        } catch (e) {
          await Stripe.createPaymentSheet({ paymentIntentClientSecret: data.clientSecret, merchantDisplayName: 'Be Fit Lab' });
        }
        const res = await Stripe.presentPaymentSheet();
        if (res?.paymentResult === 'paymentSheetCompleted') {
          // Pedido pagado: notificación verificada (servidor) + push (cliente, camino probado)
          supabase.functions.invoke('stripe-cafe-notify', { body: { paymentIntentId: data.paymentIntentId } });
          const resumen = cart.map(i => `${i.qty}× ${i.name}`).join(', ');
          if (user?.id) supabase.functions.invoke('send-push', { body: { userId: user.id, title: 'Pedido confirmado', body: `${resumen}. ¡Ya lo estamos preparando!`, type: 'payment', skipLog: true } });
          if (meta.gift?.recipient_user_id) supabase.functions.invoke('send-push', { body: { userId: meta.gift.recipient_user_id, title: '¡Te enviaron un regalo!', body: meta.gift.message || `Te regalaron: ${resumen}`, type: 'payment', skipLog: true } });
          setCart([]);
          if (data.orderId) setTrackingOrderId(data.orderId); else setShowThanks(true);
        }
      } else {
        // Web: checkout hospedado (un solo producto por simplicidad en web)
        const { data, error } = await supabase.functions.invoke('stripe-cafe-checkout', { body: { items: cart.map(i => ({ id: i.product_id, quantity: i.qty })), userEmail: user?.email, userId: user?.id } });
        if (error) throw new Error(error.message);
        if (data?.url) window.open(data.url, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.error('Error en el pago:', err);
      alert('No se pudo procesar el pago. Intenta de nuevo.');
    } finally {
      setProcessing(false);
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
      <div style={{ position: 'relative', width: '100%', height: isNative ? '300px' : '400px', backgroundColor: '#2b211c', backgroundImage: 'url("/fotos-hero/IMG_5410.JPG")', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%)', backdropFilter: 'blur(3px)' }}></div>
        
        {/* NAV BUTTON */}
        <div style={{ position: 'absolute', top: isNative ? '40px' : '30px', left: isNative ? '15px' : '30px', zIndex: 10 }}>
          <button
            onClick={() => { if (window.history.length > 1) navigate(-1); else navigate('/'); }}
            className="glass-button"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '0.9rem', color: 'white', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)' }}
          >
            <ChevronLeft size={18} /> Volver
          </button>
        </div>

        {/* MIS PEDIDOS (historial) */}
        <div style={{ position: 'absolute', top: isNative ? '40px' : '30px', right: isNative ? '15px' : '30px', zIndex: 10 }}>
          <button
            onClick={() => setShowHistory(true)}
            className="glass-button"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '0.9rem', color: 'white', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)' }}
          >
            <Receipt size={17} /> Mis pedidos
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
          {coffeeItems.length > 0 && (
          <motion.div variants={itemVariants} style={{ marginBottom: '50px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', borderBottom: '2px solid rgba(0,0,0,0.1)', paddingBottom: '15px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              Ice Coffee
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {coffeeItems.map(item => (
                <div key={item.id} style={{ background: 'white', borderRadius: '20px', padding: '25px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  
                  {/* IMAGE */}
                  {item.image_url && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
                      <img src={item.image_url} alt={item.name} loading="lazy" decoding="async" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', mixBlendMode: 'multiply' }} />
                    </div>
                  )}

                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 8px 0' }}>{item.name}</h3>
                    <p style={{ color: '#6B7280', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>{item.description}</p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '25px' }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>${item.price}</span>
                    <button onClick={() => openProduct(item)} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '30px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                      <ShoppingCart size={16} /> Agregar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
          )}

          {/* CATEGORY: SMOOTHIES */}
          {smoothieItems.length > 0 && (
          <motion.div variants={itemVariants} style={{ marginBottom: '50px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', borderBottom: '2px solid rgba(0,0,0,0.1)', paddingBottom: '15px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              Coffee Lab & Smoothies
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
              {smoothieItems.map(item => (
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
                    <button onClick={() => openProduct(item)} style={{ background: 'black', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '30px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }} onMouseEnter={e => {e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.background = '#222'}} onMouseLeave={e => {e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'black'}}>
                      Comprar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
          )}

          {/* CATEGORY: TEMPORADA */}
          {temporadaItems.length > 0 && (
          <motion.div variants={itemVariants} style={{ marginBottom: '60px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', borderBottom: '2px solid rgba(0,0,0,0.1)', paddingBottom: '15px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              Bebidas de Temporada
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
              {temporadaItems.map(item => (
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
                      <button onClick={() => openProduct(item)} style={{ background: 'linear-gradient(to right, #f97316, #ea580c)', color: 'white', border: 'none', padding: '12px 28px', borderRadius: '30px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(234,88,12,0.3)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                        <ShoppingCart size={18} /> Pedir Ya
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
          )}

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

      {/* BOTÓN FLOTANTE DEL CARRITO (glass) */}
      {cartCount > 0 && !selectedProduct && !showCart && !confirming && (
        <motion.button
          initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          onClick={() => setShowCart(true)}
          style={{ position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom,0px) + 20px)', left: '20px', right: '20px', zIndex: 3500, border: '1px solid rgba(255,255,255,0.45)', cursor: 'pointer', background: 'rgba(255,145,77,0.88)', backdropFilter: 'blur(16px) saturate(160%)', WebkitBackdropFilter: 'blur(16px) saturate(160%)', color: '#fff', borderRadius: '20px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 12px 30px rgba(255,145,77,0.4)' }}>
          <ShoppingCart size={20} color="#fff" />
          <span style={{ background: 'rgba(255,255,255,0.28)', borderRadius: '10px', minWidth: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem' }}>{cartCount}</span>
          <span style={{ flex: 1, textAlign: 'left', fontWeight: 800, fontSize: '1rem' }}>Ver carrito</span>
          <span style={{ fontWeight: 900, fontSize: '1.05rem' }}>${cartTotal}</span>
        </motion.button>
      )}

      {/* FICHA / PERSONALIZACIÓN */}
      <AnimatePresence>
        {selectedProduct && (
          <CafeProductSheet product={selectedProduct} groups={optionGroups} onClose={() => setSelectedProduct(null)} onAdd={addToCart} />
        )}
      </AnimatePresence>

      {/* CARRITO */}
      <AnimatePresence>
        {showCart && (
          <CafeCartSheet cart={cart} products={available} onClose={() => setShowCart(false)} onUpdateQty={updateQty} onRemove={removeItem} onOpenProduct={(p) => { setShowCart(false); setSelectedProduct(p); }} onCheckout={startCheckout} />
        )}
      </AnimatePresence>

      {/* CUENTA REGRESIVA DE CANCELACIÓN (5s) */}
      <AnimatePresence>
        {confirming && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 4500, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>
            <div style={{ position: 'relative', width: '120px', height: '120px', marginBottom: '24px' }}>
              <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
                <motion.circle cx="60" cy="60" r="52" fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 52}
                  initial={{ strokeDashoffset: 0 }} animate={{ strokeDashoffset: 2 * Math.PI * 52 }} transition={{ duration: 5, ease: 'linear' }} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.6rem', fontWeight: 900, color: '#fff', fontFamily: 'var(--font-display)' }}>{countdown}</div>
            </div>
            <h2 style={{ color: '#fff', margin: '0 0 6px', fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>Confirmando tu pedido…</h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', margin: '0 0 28px', fontSize: '0.95rem' }}>¿Te arrepentiste? Aún puedes cancelar.</p>
            <button onClick={cancelCheckout} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.4)', padding: '14px 40px', borderRadius: '16px', fontWeight: 800, fontSize: '1rem', cursor: 'pointer' }}>
              Cancelar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BOTÓN FLOTANTE "MI PEDIDO" (pedido en curso) */}
      {activeOrders.length > 0 && !selectedProduct && !showCart && !confirming && !trackingOrderId && !processing && !showThanks && (
        <motion.button
          initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          onClick={() => setTrackingOrderId(activeOrders[0].id)}
          style={{ position: 'fixed', left: '20px', right: '20px', bottom: cartCount > 0 ? 'calc(env(safe-area-inset-bottom,0px) + 86px)' : 'calc(env(safe-area-inset-bottom,0px) + 20px)', zIndex: 3500, border: '1px solid rgba(255,255,255,0.28)', cursor: 'pointer', background: 'rgba(58,44,36,0.46)', backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)', color: '#fff', borderRadius: '20px', padding: '13px 18px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 12px 34px rgba(43,33,28,0.28), inset 0 1px 0 rgba(255,255,255,0.18)' }}>
          <Coffee size={22} color="#FFC9BC" />
          <span style={{ flex: 1, textAlign: 'left' }}>
            <span style={{ display: 'block', fontSize: '0.7rem', opacity: 0.7, fontWeight: 600 }}>Tu pedido en curso</span>
            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{orderStatusLabel(activeOrders[0].status)}</span>
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.9 }}>Ver ›</span>
        </motion.button>
      )}

      {/* HISTORIAL DE PEDIDOS */}
      <AnimatePresence>
        {showHistory && (
          <CafeOrderHistory
            userId={user?.id}
            onClose={() => setShowHistory(false)}
            onOpenOrder={(id) => { setShowHistory(false); setTrackingOrderId(id); }}
          />
        )}
      </AnimatePresence>

      {/* SEGUIMIENTO DEL PEDIDO (estilo Uber Eats) */}
      <AnimatePresence>
        {trackingOrderId && (
          <CafeOrderTracking orderId={trackingOrderId} onClose={() => setTrackingOrderId(null)} />
        )}
      </AnimatePresence>

      {/* OVERLAY DE CARGA ANTES DEL PAGO */}
      <AnimatePresence>
        {processing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 4700, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
              style={{ width: '54px', height: '54px', borderRadius: '50%', border: '4px solid rgba(255,255,255,0.25)', borderTopColor: '#fff' }} />
            <p style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', margin: 0 }}>Preparando tu pago…</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL "¡GRACIAS!" tras el pago */}
      {showThanks && (
        <div onClick={() => setShowThanks(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <motion.div onClick={(e) => e.stopPropagation()} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 18, stiffness: 220 }}
            style={{ width: 'min(360px, 100%)', background: '#fff', borderRadius: '28px', padding: '34px 26px', textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,0.3)', position: 'relative' }}>
            <button onClick={() => setShowThanks(false)} aria-label="Cerrar" style={{ position: 'absolute', top: '16px', right: '16px', width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={16} color="#1A1C1E" />
            </button>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.15 }}
              style={{ width: '76px', height: '76px', borderRadius: '50%', background: 'linear-gradient(135deg, #FF914D, #E07A9C)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', boxShadow: '0 10px 25px rgba(255,145,77,0.4)' }}>
              <CheckCircle2 size={42} color="#fff" strokeWidth={2.5} />
            </motion.div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', margin: '0 0 8px', color: '#1A1C1E' }}>¡Gracias!</h2>
            <p style={{ margin: '0 0 24px', fontSize: '0.95rem', color: '#6B7280', lineHeight: 1.5 }}>Tu pedido fue procesado. Pásalo a recoger a la cafetería.</p>
            <button onClick={() => setShowThanks(false)} style={{ width: '100%', padding: '15px', borderRadius: '16px', border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 10px 25px rgba(255,145,77,0.35)' }}>
              ¡Listo!
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default Cafeteria;
