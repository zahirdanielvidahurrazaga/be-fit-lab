import React, { useEffect, useState, useMemo } from 'react';
import BarraGlass from '../components/BarraGlass';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { Stripe } from '@capacitor-community/stripe';
import { ShoppingCart, ChevronLeft, ChevronRight, Info, Coffee, X, Receipt, Check, CreditCard, AlertCircle, Plus, Flame, Home, Gift, Star, Search, RotateCcw } from 'lucide-react';
import { supabase, errorDeFuncion } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import CafeProductSheet from '../components/CafeProductSheet';
import CafeCartSheet from '../components/CafeCartSheet';
import CafeOrderHistory from '../components/CafeOrderHistory';
import CafeSplash from '../components/CafeSplash';
import LenteVidrio from '../components/LenteVidrio';
import { CafeMenuSkeleton } from '../components/Skeleton';
import { resolveCafeImage } from '../lib/cafeImage';
import { ESTUDIO } from '../config/estudio';
import { crearIrA } from '../demo/navegacionDemo';

// Los assets locales del catálogo (PNG/WebP con fondo blanco) necesitan multiply
// para integrarse; las fotos subidas desde Admin son JPEG y van con blend normal.
const needsMultiply = (url) => /^\/cafeteria\//.test(url || '') || /\.png(\?|$)/i.test(url || '');

// Stagger de las tarjetas al entrar (se re-dispara al cambiar de pestaña).
const gridStagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } } };
const cardItem = { hidden: { opacity: 0, y: 22, scale: 0.97 }, visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 130, damping: 18 } } };

const CafeImage = ({ src, alt }) => {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div style={{ width: '100%', height: '100%', background: 'var(--c-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '16px' }}>
        <Coffee size={32} color="#DCD4C7" />
      </div>
    );
  }
  
  const isMango = src.includes('mango_matcha');
  // Recorte PNG (sin fondo): contenido y un poco más grande. FOTO real: llena el
  // recuadro (antes salía angosta con bandas crema a los lados).
  const recorte = needsMultiply(src);
  return <img src={src} alt={alt} onError={() => setError(true)} loading="eager" decoding="async"
    style={recorte
      ? { width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'multiply', transform: isMango ? 'scale(1.4)' : 'scale(1.15)' }
      : { width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />;
};

function Cafeteria() {
  const navigate = useNavigate();
  const { user, cafeProducts, cafeProductsLoaded, esDemo} = useAuth();
  // Dentro de la maqueta, navegar a una ruta real sacaría a la prospecta.
  const irA = crearIrA(navigate, esDemo);
  const isNative = Capacitor.isNativePlatform();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const [activeWidgetIndex, setActiveWidgetIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showThanks, setShowThanks] = useState(false);

  // --- Pedido (estilo Uber Eats) ---
  const [optionGroups, setOptionGroups] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null); // ficha/personalización
  const [showCart, setShowCart] = useState(false);
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('befit_cafe_cart')) || []; } catch { return []; }
  });
  const [confirming, setConfirming] = useState(null);   // { meta } durante la cuenta de 5s
  const [countdown, setCountdown] = useState(5);
  const [processing, setProcessing] = useState(false);
  const [activeOrders, setActiveOrders] = useState([]);          // pedidos en curso del usuario
  const [activeTab, setActiveTab] = useState('home');            // home, order, rewards, history
  // Pantalla de entrada de Coffee Lab: completa la 1ª vez en la sesión, rápida después.
  // Al volver de un pago (?payment=) no se muestra, para ver el resultado de inmediato.
  const [splash, setSplash] = useState(() => {
    if (/[?&]payment=/.test(window.location.search)) return null;
    let visto = false;
    try { visto = sessionStorage.getItem('befit_cafe_splash') === '1'; sessionStorage.setItem('befit_cafe_splash', '1'); } catch { /* sin storage: completa */ }
    return visto ? 'rapido' : 'completo';
  });
  // La pestaña del navegador también dice que estás en otra "app".
  useEffect(() => {
    const antes = document.title;
    document.title = `${ESTUDIO.nombreCafeteria} · ${ESTUDIO.nombre}`;
    return () => { document.title = antes; };
  }, []);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);   // pide registrarse/login para comprar
  const [returnedFromPay, setReturnedFromPay] = useState(false); // volvió del checkout web (Stripe)
  const [loyalty, setLoyalty] = useState({ stamps: 0, gifts_available: 0 }); // Starbucks style rewards
  // Portadas de "Novedades", editables desde Admin → Cafetería (tabla cafe_covers).
  // Antes estaban hardcodeadas aquí, lo que obligaba a recompilar la app para
  // cambiar una imagen. Ahora la dueña las cambia sola y se ven al instante.
  // Portadas: se pintan al instante con la última copia guardada; sin copia, se espera
  // a la base (antes salía un segundo el anuncio viejo de respaldo y luego cambiaba).
  const [covers, setCovers] = useState(() => { try { return JSON.parse(localStorage.getItem('befit_cafe_covers')) || []; } catch { return []; } });
  const [coversCargadas, setCoversCargadas] = useState(false);
  const [coverIndex, setCoverIndex] = useState(0);



  // Cargar estado de lealtad
  useEffect(() => {
    if (!user?.id) return;
    const fetchLoyalty = async () => {
      const { data } = await supabase.from('cafe_loyalty').select('*').eq('user_id', user.id).single();
      if (data) setLoyalty(data);
      else setLoyalty({ stamps: 0, gifts_available: 0 });
    };
    fetchLoyalty();
    const ch = supabase.channel(`loyalty-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cafe_loyalty', filter: `user_id=eq.${user.id}` }, fetchLoyalty)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [user?.id]);

  // Precarga las imágenes del catálogo en cuanto llegan los productos, así ya
  // están en caché al abrir la pestaña Menú y aparecen al instante.
  useEffect(() => {
    (cafeProducts || []).forEach(p => {
      const url = resolveCafeImage(p);
      if (url) { const img = new Image(); img.src = url; }
    });
  }, [cafeProducts]);

  // Catálogo desde la BD (precios server-side). Solo productos disponibles.
  const available = (cafeProducts || []).filter(p => p.available !== false).map(p => {
    const url = resolveCafeImage(p);
    return url ? { ...p, image_url: url } : p;
  });
  const coffeeItems = available.filter(p => p.category === 'coffee');
  const smoothieItems = available.filter(p => p.category === 'smoothie');
  const temporadaItems = available.filter(p => p.category === 'temporada');

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.lineTotal, 0);

  // Pestañas por categoría (Especiales/Temporada primero)
  const TABS = [
    { key: 'temporada', label: 'Especiales', items: temporadaItems },
    { key: 'coffee', label: 'Ice Coffee', items: coffeeItems },
    { key: 'smoothie', label: ESTUDIO.nombreCafeteria, items: smoothieItems },
  ];
  const visibleTabs = TABS.filter(t => t.items.length > 0);
  const [activeCat, setActiveCat] = useState('temporada');
  const [busqueda, setBusqueda] = useState('');
  // Si la categoría activa no tiene productos (al cargar), saltar a la primera disponible
  useEffect(() => {
    const keys = visibleTabs.map(t => t.key);
    if (keys.length && !keys.includes(activeCat)) setActiveCat(keys[0]);
  }, [cafeProducts]); // eslint-disable-line react-hooks/exhaustive-deps

  // Portadas: carga + realtime (Admin las cambia y la app abierta se entera).
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('cafe_covers')
        .select('*').eq('active', true)
        .order('sort_order', { ascending: true });
      setCovers(data || []);
      setCoversCargadas(true);
      setCoverIndex(0);
      try { localStorage.setItem('befit_cafe_covers', JSON.stringify(data || [])); } catch { /* sin storage */ }
    };
    load();
    const ch = supabase.channel('public:cafe_covers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cafe_covers' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // Rotación automática cuando hay más de una portada.
  useEffect(() => {
    if (covers.length < 2) return;
    const t = setInterval(() => setCoverIndex(i => (i + 1) % covers.length), 5000);
    return () => clearInterval(t);
  }, [covers.length]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);
    if (new URLSearchParams(window.location.search).get('payment') === 'success') {
      setCart([]);
      window.history.replaceState?.({}, '', '/cafeteria'); // limpiar el ?payment para no repetir
      setReturnedFromPay(true); // abrir el seguimiento cuando cargue la sesión
    }
    const onPaid = () => setShowThanks(true);
    window.addEventListener('cafe-payment-success', onPaid);
    // Cargar grupos de personalización (con sus opciones)
    (async () => {
      const { data } = await supabase.from('cafe_option_groups').select('*, cafe_options(*)').order('sort_order');
      setOptionGroups(data || []);
    })();
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
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

  // "Pide de nuevo": los productos de su último pedido que siguen en el menú.
  const [ultimoPedido, setUltimoPedido] = useState([]);
  useEffect(() => {
    if (!user?.id) return;
    supabase.from('cafe_orders').select('items').eq('user_id', user.id)
      .in('status', ['paid', 'preparing', 'ready', 'completed'])
      .order('created_at', { ascending: false }).limit(1)
      .then(({ data }) => setUltimoPedido(((data?.[0]?.items) || []).map(it => it.name).filter(Boolean)));
  }, [user?.id]);

  const orderStatusLabel = (s) => s === 'preparing' ? 'Preparándose' : s === 'ready' ? '¡Listo para recoger!' : 'Confirmado';

  // Persistir el carrito (sobrevive a navegar a registro/login y a recargas)
  useEffect(() => {
    try { localStorage.setItem('befit_cafe_cart', JSON.stringify(cart)); } catch { /* almacenamiento lleno */ }
  }, [cart]);

  // Reconciliar el carrito con el catálogo: si un producto se eliminó/ocultó,
  // quitarlo del carrito guardado (evita que falle el checkout con datos viejos).
  useEffect(() => {
    if (!cafeProducts || cafeProducts.length === 0) return;
    const okIds = new Set(cafeProducts.filter(p => p.available !== false).map(p => p.id));
    setCart(prev => {
      const next = prev.filter(i => okIds.has(i.product_id));
      return next.length === prev.length ? prev : next;
    });
  }, [cafeProducts]);

  // Al volver autenticado tras registrarse/iniciar sesión, reabrir el carrito para finalizar
  useEffect(() => {
    if (user?.id && localStorage.getItem('befit_cafe_resume') === '1') {
      localStorage.removeItem('befit_cafe_resume');
      if (cart.length > 0) setShowCart(true);
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Al volver del pago web (Stripe), llevar a "Pedidos", igual que el pago en
  // efectivo y el nativo: ahí está el pedido y su seguimiento (CafeOrderHistory).
  // Antes abría un seguimiento que desde el 7-jun ya no se pinta aquí, y el
  // bloqueo de scroll se quedaba puesto con la pantalla vacía.
  // Espera a que la sesión cargue; corre de nuevo cuando user.id esté disponible.
  useEffect(() => {
    if (!returnedFromPay || !user?.id) return;
    setReturnedFromPay(false);
    setActiveTab('history');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [returnedFromPay, user?.id]);

  // Fallback: si tras unos segundos no hay sesión, al menos mostrar el "¡Gracias!"
  useEffect(() => {
    if (!returnedFromPay) return;
    const t = setTimeout(() => { if (!user?.id) { setReturnedFromPay(false); setShowThanks(true); } }, 4500);
    return () => clearTimeout(t);
  }, [returnedFromPay, user?.id]);

  // Bloquear el scroll del fondo cuando hay una hoja/overlay abierto
  useEffect(() => {
    const open = selectedProduct || showCart || confirming || processing || showThanks || showAuthPrompt;
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [selectedProduct, showCart, confirming, processing, showThanks, showAuthPrompt]);

  const nextWidget = () => setActiveWidgetIndex((prev) => (prev + 1) % 3);
  const prevWidget = () => setActiveWidgetIndex((prev) => (prev - 1 + 3) % 3);

  // Carrito
  const openProduct = (item) => setSelectedProduct(item);
  // Al agregar: el número del carrito salta y sube un aviso con la foto y "Ver carrito"
  // (antes se cerraba la ficha sin ninguna señal de que se agregó).
  const [agregado, setAgregado] = useState(null);
  useEffect(() => {
    if (!agregado) return;
    const t = setTimeout(() => setAgregado(null), 2800);
    return () => clearTimeout(t);
  }, [agregado]);
  const addToCart = (line) => {
    setCart(c => [...c, line]);
    setSelectedProduct(null);
    setAgregado({ ...line, t: Date.now() });
    try { navigator.vibrate?.(12); } catch { /* sin vibración */ }
  };
  const updateQty = (lineId, delta) => setCart(c => c.map(i => i.lineId === lineId ? { ...i, qty: Math.max(1, i.qty + delta), lineTotal: i.unitPrice * Math.max(1, i.qty + delta) } : i));
  const removeItem = (lineId) => setCart(c => c.filter(i => i.lineId !== lineId));

  // Cuenta regresiva de 5s para cancelar antes de pagar
  const startCheckout = (meta) => {
    // Para comprar hay que tener cuenta (no requiere membresía). Sin sesión → registrarse.
    if (!user?.id) { setShowCart(false); setShowAuthPrompt(true); return; }
    setShowCart(false); setConfirming(meta); setCountdown(5);
  };
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
      const body = { items, userEmail: user?.email, userId: user?.id, gift: meta.gift, pickupTime: meta.pickupTime, noStraw: meta.noStraw, returnUrl: window.location.origin };

      if (meta.paymentMethod === 'cash') {
        const { data, error } = await supabase.functions.invoke('cash-cafe-checkout', { body });
        if (error || data?.error) throw new Error(await errorDeFuncion(error, data, 'No se pudo registrar el pedido. Intenta de nuevo.'));
        
        const resumen = cart.map(i => `${i.qty}× ${i.name}`).join(', ');
        if (user?.id) supabase.functions.invoke('send-push', { body: { userId: user.id, title: 'Pedido confirmado', body: `${resumen}. ¡Paga en caja al recoger!`, type: 'payment', skipLog: true } });
        if (meta.gift?.recipient_user_id) supabase.functions.invoke('send-push', { body: { userId: meta.gift.recipient_user_id, title: '¡Te enviaron un regalo!', body: meta.gift.message || `Te regalaron: ${resumen}`, type: 'payment', skipLog: true } });
        
        setCart([]);
        setActiveTab('history');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setProcessing(false);
        return;
      }

      if (Capacitor.isNativePlatform()) {
        const { data, error } = await supabase.functions.invoke('stripe-cafe-intent', { body });
        if (error) throw new Error(await errorDeFuncion(error, data, 'No se pudo iniciar el pago. Intenta de nuevo.'));
        if (!data?.clientSecret) throw new Error('No se recibió el intent de pago');
        const isIOS = Capacitor.getPlatform() === 'ios';
        const isAndroid = Capacitor.getPlatform() === 'android';
        try {
          await Stripe.createPaymentSheet({ 
            paymentIntentClientSecret: data.clientSecret, 
            merchantDisplayName: ESTUDIO.nombre, 
            enableApplePay: isIOS, 
            applePayMerchantId: isIOS ? ESTUDIO.tiendas.applePayMerchantId : undefined, 
            enableGooglePay: isAndroid,
            GooglePayIsTesting: false,
            countryCode: 'MX' 
          });
        } catch (e) {
          console.error('Error con Apple/Google Pay:', e);
          await Stripe.createPaymentSheet({ paymentIntentClientSecret: data.clientSecret, merchantDisplayName: ESTUDIO.nombre });
        }
        const res = await Stripe.presentPaymentSheet();
        if (res?.paymentResult === 'paymentSheetCompleted') {
          // Pedido pagado: notificación verificada (servidor) + push (cliente, camino probado)
          supabase.functions.invoke('stripe-cafe-notify', { body: { paymentIntentId: data.paymentIntentId } });
          const resumen = cart.map(i => `${i.qty}× ${i.name}`).join(', ');
          if (user?.id) supabase.functions.invoke('send-push', { body: { userId: user.id, title: 'Pedido confirmado', body: `${resumen}. ¡Ya lo estamos preparando!`, type: 'payment', skipLog: true } });
          if (meta.gift?.recipient_user_id) supabase.functions.invoke('send-push', { body: { userId: meta.gift.recipient_user_id, title: '¡Te enviaron un regalo!', body: meta.gift.message || `Te regalaron: ${resumen}`, type: 'payment', skipLog: true } });
          setCart([]);
          setActiveTab('history');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        // Web: checkout hospedado con personalización completa (mismo carrito que el nativo).
        // Redirigir en la MISMA pestaña: window.open desde un timer lo bloquea el navegador
        // como popup (por eso "no salía el pago"). El success_url regresa a /cafeteria.
        const { data, error } = await supabase.functions.invoke('stripe-cafe-checkout', { body });
        if (error || data?.error) throw new Error(await errorDeFuncion(error, data, 'No se pudo iniciar el pago. Intenta de nuevo.'));
        if (data?.url) {
          // Marca para que al volver de Stripe NO se haga auto-signout (el sessionStorage
          // del tab puede perderse en el viaje cross-dominio). Sobrevive en localStorage.
          localStorage.setItem('befit_payment_return', String(Date.now()));
          window.location.href = data.url;
          return;
        }
      }
    } catch (err) {
      console.error('Error en el pago:', err);
      alert('Error procesando pago: ' + (err.message || 'Error desconocido'));
    } finally {
      setProcessing(false);
    }
  };

  // ── Piezas compartidas de las pestañas (rediseño 4-nov) ───────────────────
  const padTab = isNative ? 'calc(env(safe-area-inset-top, 44px) + 16px) 20px 40px' : '28px 20px 40px';
  const nombreCorto = user?.user_metadata?.full_name ? user.user_metadata.full_name.split(' ')[0] : 'hola';
  const tarjeta = { background: 'var(--c-card)', borderRadius: '22px', boxShadow: '0 8px 24px rgba(0,0,0,0.04)', border: '1px solid var(--c-line)' };
  const tituloTab = { fontFamily: 'var(--c-font)', fontWeight: 800, fontSize: '2.2rem', lineHeight: 1.05, color: 'var(--c-ink)', margin: 0, letterSpacing: '-0.03em' };
  const tituloSeccion = { display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--c-font)', fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em', color: 'var(--c-ink)', margin: '0 0 12px' };
  const carrusel = { display: 'flex', gap: '12px', overflowX: 'auto', margin: '0 -20px 24px', padding: '2px 20px 8px', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' };
  // Regreso a Be Fit Lab con transición: un círculo con los colores del estudio se abre
  // desde el botón, aparece el durazno y, ya en el portal, se desvanece. La capa vive en
  // <body> (fuera de React) para sobrevivir al cambio de pantalla.
  const saliendoRef = React.useRef(false);
  const portadaRef = React.useRef(null); // la foto que el botón de vidrio refracta
  const salirABeFit = (e) => {
    const destino = user ? '/portal' : '/';
    if (saliendoRef.current) return;
    const reducir = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (reducir || typeof document.body.animate !== 'function') { irA(destino); return; }
    saliendoRef.current = true;
    const r = e?.currentTarget?.getBoundingClientRect?.();
    const cx = r ? r.left + r.width / 2 : window.innerWidth - 60;
    const cy = r ? r.top + r.height / 2 : 44;
    const radio = Math.hypot(Math.max(cx, window.innerWidth - cx), Math.max(cy, window.innerHeight - cy));
    const capa = document.createElement('div');
    capa.setAttribute('aria-hidden', 'true');
    capa.style.cssText = 'position:fixed;inset:0;z-index:7000;background:var(--app-bg,#EFE9E4);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;pointer-events:none;';
    const logo = document.createElement('img');
    logo.src = '/favicon_peach.png'; logo.width = 64; logo.height = 64; logo.alt = '';
    const nombre = document.createElement('div');
    nombre.textContent = (ESTUDIO.nombre || '').toUpperCase();
    nombre.style.cssText = 'font-family:Inter,sans-serif;font-weight:700;font-size:12px;letter-spacing:0.32em;color:var(--app-on-surface-variant,#5E5343);';
    capa.append(logo, nombre);
    document.body.appendChild(capa);
    const curva = 'cubic-bezier(0.76, 0, 0.24, 1)';
    capa.animate([{ clipPath: `circle(0px at ${cx}px ${cy}px)` }, { clipPath: `circle(${radio}px at ${cx}px ${cy}px)` }], { duration: 560, easing: curva, fill: 'forwards' });
    logo.animate([{ opacity: 0, transform: 'scale(0.6)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 420, delay: 220, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', fill: 'both' });
    nombre.animate([{ opacity: 0, letterSpacing: '0.6em' }, { opacity: 1, letterSpacing: '0.32em' }], { duration: 480, delay: 300, easing: 'ease-out', fill: 'both' });
    setTimeout(() => {
      irA(destino);
      setTimeout(() => {
        const fuera = capa.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(1.04)' }], { duration: 420, easing: 'ease-out', fill: 'forwards' });
        fuera.onfinish = () => capa.remove();
        setTimeout(() => capa.remove(), 900); // por si onfinish no llega
      }, 280);
    }, 820);
  };

  // Zoom lento de la portada; lo comparten la foto y su copia dentro del botón de vidrio.
  const ANIM_PORTADA = { initial: { opacity: 0, scale: 1.12 }, animate: { opacity: 1, scale: [1.12, 1.02] }, transition: { opacity: { duration: 0.8 }, scale: { duration: 9, ease: 'easeOut' } } };
  const VELO_PORTADA = 'linear-gradient(to top, rgba(18,12,8,0.78) 0%, rgba(18,12,8,0.25) 42%, transparent 64%), linear-gradient(to bottom, rgba(18,12,8,0.25), transparent 26%)';

  // Barra de marca en TODAS las pestañas: Coffee Lab se siente como su propia app,
  // con una salida clara de regreso a Be Fit Lab (antes era solo una flecha).
  const encabezado = (contenido) => (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--c-ink)' }}>
          <svg viewBox="22 24 76 118" width="14" height="22" aria-hidden="true" style={{ display: 'block', marginTop: '-2px' }}>
            <path d="M33 62 L40 130 Q41 137 48 137 L72 137 Q79 137 80 130 L87 62 Z" fill="#C98A55" opacity="0.9" />
            <path d="M33 62 L40 130 Q41 137 48 137 L72 137 Q79 137 80 130 L87 62 M28 62 L92 62 M66 92 L80 30 L92 30" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontFamily: 'var(--c-font)', fontWeight: 800, letterSpacing: '-0.02em', fontSize: '1rem', lineHeight: 1 }}>{ESTUDIO.nombreCafeteria}</span>
        </div>
        <button onClick={salirABeFit} aria-label={`Regresar a ${ESTUDIO.nombre}`}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px 8px 10px', borderRadius: '999px', background: 'var(--c-card)', border: '1px solid var(--c-line)', cursor: 'pointer', color: 'var(--c-ink)', fontFamily: 'var(--c-font)', fontSize: '1rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1, boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          <ChevronLeft size={16} />
          <img src="/favicon_peach.png" alt="" width="16" height="16" />
          {ESTUDIO.nombre}
        </button>
      </div>
      {contenido}
    </div>
  );
  const sellos = (loyalty?.stamps || 0) % 12;
  const faltanSellos = 12 - sellos;
  const pideDeNuevo = useMemo(() => {
    const vistos = new Set();
    return ultimoPedido.map(n => available.find(p => p.name === n)).filter(p => p && !vistos.has(p.id) && vistos.add(p.id));
  }, [ultimoPedido, available]); // eslint-disable-line
  const listaMenu = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (q) return available.filter(p => `${p.name} ${p.description || ''}`.toLowerCase().includes(q));
    return activeCat === 'coffee' ? coffeeItems : activeCat === 'smoothie' ? smoothieItems : temporadaItems;
  }, [busqueda, activeCat, available]); // eslint-disable-line

  const FilaSellos = ({ llenos, chica }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: chica ? '6px' : '10px' }}>
      {Array.from({ length: 12 }).map((_, i) => {
        const lleno = i < llenos;
        const t = chica ? 30 : 42;
        return (
          <motion.div key={i} initial={false} animate={{ scale: lleno ? 1 : 0.94 }}
            style={{ width: t, height: t, justifySelf: 'center', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                     background: lleno ? 'linear-gradient(135deg, #FFB37A, #FF914D)' : (chica ? 'var(--c-soft)' : 'rgba(255,255,255,0.08)'),
                     border: lleno ? 'none' : `1.5px dashed ${chica ? 'var(--c-line)' : 'rgba(247,237,228,0.3)'}`,
                     boxShadow: lleno ? '0 4px 10px rgba(255,145,77,0.35)' : 'none' }}>
            {i === 11 && !lleno
              ? <Gift size={chica ? 14 : 18} color={chica ? 'var(--c-muted)' : 'rgba(247,237,228,0.6)'} />
              : <Coffee size={chica ? 13 : 17} color={lleno ? '#fff' : (chica ? 'var(--c-muted)' : 'rgba(247,237,228,0.45)')} />}
          </motion.div>
        );
      })}
    </div>
  );

  const MiniProducto = ({ p }) => (
    <motion.button type="button" whileTap={{ scale: 0.96 }} onClick={() => openProduct(p)}
      style={{ ...tarjeta, flexShrink: 0, width: '148px', padding: '10px', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', scrollSnapAlign: 'start' }}>
      <div style={{ width: '100%', aspectRatio: '1', borderRadius: '16px', background: 'var(--c-soft)', overflow: 'hidden', boxSizing: 'border-box' }}>
        <CafeImage src={p.image_url} alt={p.name} />
      </div>
      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--c-ink)', margin: '8px 2px 2px', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
      <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--c-accent-ink)', margin: '0 2px' }}>${p.price}</div>
    </motion.button>
  );

  // Menú en LISTA (Zahir prefirió la lista a la cuadrícula grande): foto mediana,
  // nombre, UNA línea de descripción y el precio con el "+" en el mismo renglón.
  const FilaProducto = ({ item }) => (
    <motion.div variants={cardItem} onClick={() => openProduct(item)} whileTap={{ scale: 0.985 }}
      style={{ background: 'var(--c-card)', borderRadius: '22px', border: '1px solid var(--c-line)', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'stretch', gap: '14px' }}>
      <div style={{ width: '92px', height: '92px', borderRadius: '16px', background: 'var(--c-soft)', flexShrink: 0, overflow: 'hidden', boxSizing: 'border-box' }}>
        <CafeImage src={item.image_url} alt={item.name} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, padding: '4px 6px 2px 0' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--c-ink)', lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</h3>
        {item.description && <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--c-muted)', lineHeight: 1.35, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.description}</p>}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
          <span style={{ fontWeight: 800, color: 'var(--c-ink)', fontSize: '1rem' }}>${item.price}</span>
          <span aria-hidden="true" style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--c-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={17} color="var(--c-bg)" strokeWidth={2.6} />
          </span>
        </div>
      </div>
    </motion.div>
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--c-bg)', color: 'var(--c-ink)', fontFamily: 'var(--font-body)', overflowX: 'hidden', paddingBottom: '110px' }}>
      
      <AnimatePresence>
        {agregado && activeTab !== 'cart' && (
          <motion.div key={agregado.t} role="status"
            initial={{ opacity: 0, y: 30, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            style={{ position: 'fixed', left: '16px', right: '16px', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)', zIndex: 3500, maxWidth: '440px', margin: '0 auto',
                     display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 10px 10px 10px', borderRadius: '20px',
                     background: 'var(--c-ink)', color: 'var(--c-bg)', boxShadow: '0 14px 34px rgba(0,0,0,0.25)' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.1)' }}>
              {agregado.image_url && <CafeImage src={agregado.image_url} alt="" />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, opacity: 0.7 }}>Agregado al carrito</div>
              <div style={{ fontWeight: 800, fontSize: '0.98rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {agregado.qty > 1 ? `${agregado.qty}× ` : ''}{agregado.name}
              </div>
            </div>
            <button type="button" onClick={() => { setAgregado(null); setActiveTab('cart'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              style={{ flexShrink: 0, border: 'none', borderRadius: '14px', padding: '10px 14px', background: 'var(--c-accent)', color: '#fff', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' }}>
              Ver carrito
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {splash && <CafeSplash rapido={splash === 'rapido'} onDone={() => setSplash(null)} />}
      </AnimatePresence>


      <AnimatePresence mode="wait">
        
        {/* --- PESTAÑA: HOME --- */}
        {activeTab === 'home' && (
          <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }} style={{ padding: padTab }}>
            {encabezado(<>
              <h1 style={{ fontFamily: 'var(--c-font)', fontWeight: 800, letterSpacing: '-0.03em', fontSize: '2.3rem', color: 'var(--c-ink)', margin: 0, lineHeight: 1.05 }}>
                {getGreeting()},<br /><span style={{ color: 'var(--c-accent-ink)' }}>{nombreCorto}</span>
              </h1>
              <p style={{ color: 'var(--c-muted)', fontSize: '0.95rem', margin: '6px 0 0', fontWeight: 600 }}>¿Qué se te antoja hoy?</p>
            </>)}

            {/* Pedido en curso: lo primero que quiere ver quien ya pidió */}
            {activeOrders.length > 0 && (
              <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={() => setActiveTab('history')}
                style={{ ...tarjeta, width: '100%', display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', marginBottom: '16px', border: '1.5px solid rgba(255,145,77,0.45)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                <span style={{ position: 'relative', width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,145,77,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <motion.span animate={{ scale: [1, 1.35], opacity: [0.6, 0] }} transition={{ repeat: Infinity, duration: 1.8 }}
                    style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(255,145,77,0.35)' }} />
                  <Coffee size={20} color="#FF914D" />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontWeight: 800, color: 'var(--c-ink)', fontSize: '0.98rem' }}>{orderStatusLabel(activeOrders[0].status)}</span>
                  <span style={{ display: 'block', color: 'var(--c-muted)', fontSize: '0.82rem' }}>{activeOrders.length > 1 ? `Tienes ${activeOrders.length} pedidos en curso` : 'Toca para ver tu pedido'}</span>
                </span>
                <ChevronRight size={20} color="var(--c-muted)" />
              </motion.button>
            )}

            {/* PORTADA protagonista (pedido de Zahir 4-nov: Home limpia y muy visual, como
                las referencias de apps de café). Ocupa casi toda la pantalla, la foto
                respira con un zoom lento y el botón va encima. Los sellos viven en
                Recompensas; los recomendados, en el Menú. */}
            {(() => {
              const cover = covers[coverIndex] || (coversCargadas ? null : { image_url: '', eyebrow: '', title: '', cta: '' }) || { image_url: ESTUDIO.portadas.cafeteriaPromo, eyebrow: 'Temporada', title: 'Recién hecho\npara ti', cta: 'Pedir ahora' };
              return (
                <div ref={portadaRef} onClick={() => setActiveTab('order')}
                  style={{ position: 'relative', width: '100%', height: 'clamp(290px, min(calc((100vw - 40px) * 1.25), calc(100dvh - 290px)), 620px)', borderRadius: '30px', overflow: 'hidden', background: 'var(--c-soft)', cursor: 'pointer', marginBottom: '22px', boxShadow: '0 24px 48px rgba(40,24,14,0.18)' }}>
                  <AnimatePresence mode="sync">
                    {cover.image_url && <motion.img key={cover.image_url} src={cover.image_url} alt={cover.title || 'Temporada'} decoding="async" fetchPriority="high"
                      {...ANIM_PORTADA} exit={{ opacity: 0 }}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </AnimatePresence>
                  <div style={{ position: 'absolute', inset: 0, background: VELO_PORTADA }} />

                  {/* Etiqueta arriba */}
                  {cover.eyebrow && (
                    <span style={{ position: 'absolute', top: '16px', left: '16px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '999px', background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(14px) saturate(160%)', WebkitBackdropFilter: 'blur(14px) saturate(160%)', border: '1px solid rgba(255,255,255,0.45)', color: '#fff', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                      ✦ {cover.eyebrow}
                    </span>
                  )}
                  {covers.length > 1 && (
                    <div style={{ position: 'absolute', top: '26px', right: '20px', display: 'flex', gap: '6px' }}>
                      {covers.map((c, i) => (
                        <div key={c.id} onClick={(e) => { e.stopPropagation(); setCoverIndex(i); }}
                          style={{ width: i === coverIndex ? '18px' : '7px', height: '7px', borderRadius: '10px', background: i === coverIndex ? '#fff' : 'rgba(255,255,255,0.5)', transition: 'width 0.3s', cursor: 'pointer' }} />
                      ))}
                    </div>
                  )}

                  {/* Titular + botón encima de la foto */}
                  {cover.image_url && <div style={{ position: 'absolute', left: '20px', right: '20px', bottom: '18px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right' }}>
                    <AnimatePresence mode="wait">
                      <motion.div key={cover.title || cover.image_url}
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        style={{ fontFamily: 'var(--c-font)', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.02, fontSize: 'clamp(1.6rem, 6.6vw, 2rem)', color: '#fff', whiteSpace: 'pre-line', marginBottom: '12px', maxWidth: '80%', textShadow: '0 2px 18px rgba(0,0,0,0.25)' }}>
                        {cover.title || 'Recién hecho para ti'}
                      </motion.div>
                    </AnimatePresence>
                    <LenteVidrio fuenteRef={portadaRef} src={cover.image_url} animImg={ANIM_PORTADA} capaEncima={VELO_PORTADA}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '5px 5px 5px 18px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 8px 22px rgba(0,0,0,0.2)', color: '#fff', fontWeight: 800, fontSize: '0.92rem', textShadow: '0 1px 6px rgba(0,0,0,0.25)' }}>
                      {cover.cta || 'Pedir ahora'}
                      <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ChevronRight size={17} color="#1C1410" />
                      </span>
                    </LenteVidrio>
                  </div>}
                </div>
              );
            })()}

            {/* Pide de nuevo */}
            {pideDeNuevo.length > 0 && (
              <>
                <h2 style={tituloSeccion}><RotateCcw size={17} color="var(--c-accent)" /> Pide de nuevo</h2>
                <div style={carrusel}>{pideDeNuevo.map(p => <MiniProducto key={p.id} p={p} />)}</div>
              </>
            )}

          </motion.div>
        )}

        {/* --- PESTAÑA: MENU --- */}
        {activeTab === 'order' && (
          <motion.div key="order" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }} style={{ padding: padTab }}>
            {encabezado(<h2 style={tituloTab}>Menú</h2>)}

            {/* Buscador */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '16px', background: 'var(--c-card)', border: '1px solid var(--c-line)', marginBottom: '14px' }}>
              <Search size={18} color="var(--c-muted)" />
              <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar en el menú…" aria-label="Buscar en el menú"
                style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: 'var(--c-ink)', fontSize: '0.98rem', fontFamily: 'inherit' }} />
              {busqueda && <button type="button" onClick={() => setBusqueda('')} aria-label="Borrar búsqueda" style={{ border: 'none', background: 'var(--c-soft)', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={14} color="var(--c-muted)" /></button>}
            </label>

            {!cafeProductsLoaded && (cafeProducts || []).length === 0 && <CafeMenuSkeleton />}

            {!busqueda && (
              <div style={{ margin: '0 0 18px', background: 'var(--c-seg)', padding: '4px', borderRadius: '100px', display: 'flex' }}>
                {[{ id: 'temporada', label: 'Especiales' }, { id: 'coffee', label: 'Ice Coffee' }, { id: 'smoothie', label: ESTUDIO.nombreCafeteria }].map(cat => {
                  const active = activeCat === cat.id;
                  return (
                    <button key={cat.id} onClick={() => setActiveCat(cat.id)}
                      style={{ flex: 1, minWidth: 0, padding: '11px 8px', borderRadius: '100px', border: 'none', fontWeight: active ? 800 : 600, fontSize: '0.86rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer', fontFamily: 'inherit',
                               transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)', background: active ? 'var(--c-card)' : 'transparent', color: active ? 'var(--c-ink)' : 'var(--c-muted)',
                               boxShadow: active ? '0 4px 12px rgba(0,0,0,0.08)' : 'none' }}>
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div key={busqueda ? 'busqueda' : activeCat} variants={gridStagger} initial="hidden" animate="visible" exit={{ opacity: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {listaMenu.map(item => <FilaProducto key={item.id} item={item} />)}
                {busqueda && listaMenu.length === 0 && (
                  <p style={{ textAlign: 'center', color: 'var(--c-muted)', padding: '30px 10px' }}>No encontramos “{busqueda}”. Prueba con otra palabra.</p>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}

        {/* --- PESTAÑA: REWARDS (tarjeta de sellos) --- */}
        {activeTab === 'rewards' && (
          <motion.div key="rewards" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }} style={{ padding: padTab }}>
            {encabezado(<h2 style={tituloTab}>Recompensas</h2>)}

            {user ? (
              <>
                {/* Tarjeta de sellos: lo mismo que calcula el sistema (1 sello por
                    compra, regalo cada 12), dicho en claro. Antes se disfrazaba de
                    "puntos" (cada compra = 8.3) y no se entendía. */}
                <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                  style={{ position: 'relative', overflow: 'hidden', borderRadius: '28px', padding: '24px 20px', marginBottom: '16px',
                           background: 'linear-gradient(150deg, #4A3328 0%, #3E2B22 60%, #33231B 100%)', color: '#F7EDE4', boxShadow: '0 16px 34px rgba(30,18,10,0.25)' }}>
                  <img src="/favicon_peach.png" alt="" aria-hidden="true" style={{ position: 'absolute', right: '-40px', top: '-30px', width: '170px', opacity: 0.1, filter: 'grayscale(1) brightness(3)' }} />
                  <div style={{ position: 'relative', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.7 }}>Tarjeta de sellos</div>
                  <div style={{ fontFamily: 'var(--c-font)', fontWeight: 800, letterSpacing: '-0.025em', position: 'relative', fontSize: '1.1rem', color: '#fff', margin: '8px 0 20px', lineHeight: 1.1 }}>
                    {sellos === 0 ? 'Tu primer sello te espera' : faltanSellos === 1 ? '¡Te falta 1 para tu regalo!' : `Te faltan ${faltanSellos} para tu regalo`}
                  </div>
                  <div style={{ position: 'relative' }}><FilaSellos llenos={sellos} /></div>
                  <div style={{ position: 'relative', marginTop: '16px', fontSize: '0.84rem', color: 'rgba(247,237,228,0.75)' }}>
                    1 sello por cada compra · al llegar a 12, tu siguiente bebida va por nuestra cuenta.
                  </div>
                </motion.div>

                <AnimatePresence>
                  {(loyalty?.gifts_available || 0) > 0 && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      style={{ background: 'linear-gradient(135deg, #FF914D, #E07A9C)', borderRadius: '24px', padding: '20px', boxShadow: '0 15px 30px rgba(255,145,77,0.25)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Gift size={26} color="#FF914D" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, color: '#fff', fontSize: '1.1rem', marginBottom: '2px' }}>
                          {loyalty.gifts_available === 1 ? 'Tienes 1 regalo listo' : `Tienes ${loyalty.gifts_available} regalos listos`}
                        </div>
                        <div style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.92)' }}>Muéstrale esta pantalla a tu barista para canjearlo.</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Cómo funciona: llena el hueco bajo la tarjeta y explica el canje sin letra chiquita */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                  style={{ marginTop: '16px', background: 'var(--c-card)', border: '1px solid var(--c-line)', borderRadius: '22px', padding: '18px 18px 6px' }}>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--c-ink)', marginBottom: '12px' }}>Cómo funciona</div>
                  {[
                    { Icono: Coffee, t: 'Pide y paga en la app', d: 'Cada pedido suma 1 sello, sin importar cuántas bebidas lleve.' },
                    { Icono: Star, t: 'Junta 12 sellos', d: 'Se suman solos al pagar; no tienes que enseñar nada en caja.' },
                    { Icono: Gift, t: 'Canjea tu bebida', d: 'Al completar la tarjeta te aparece aquí tu regalo. Enséñaselo a tu barista.' },
                  ].map(({ Icono, t, d }, i, arr) => (
                    <div key={t} style={{ display: 'flex', gap: '12px', paddingBottom: '14px', marginBottom: i < arr.length - 1 ? '14px' : 0, borderBottom: i < arr.length - 1 ? '1px solid var(--c-line)' : 'none' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'var(--c-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icono size={18} color="var(--c-accent-ink)" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--c-ink)' }}>{t}</div>
                        <div style={{ fontSize: '0.84rem', color: 'var(--c-muted)', lineHeight: 1.45, marginTop: '2px' }}>{d}</div>
                      </div>
                    </div>
                  ))}
                </motion.div>

                <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={() => { setActiveTab('history'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  style={{ marginTop: '12px', width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 18px', background: 'var(--c-card)', border: '1px solid var(--c-line)', borderRadius: '18px', cursor: 'pointer', textAlign: 'left' }}>
                  <Receipt size={20} color="var(--c-accent-ink)" />
                  <span style={{ flex: 1, fontWeight: 700, fontSize: '0.95rem', color: 'var(--c-ink)' }}>Mis pedidos</span>
                  <ChevronRight size={18} color="var(--c-muted)" />
                </motion.button>
                {/* espacio para que la barra flotante no tape lo último */}
                <div style={{ height: '72px' }} />
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '36px 26px', background: 'linear-gradient(135deg, #1A1C1E 0%, #0F1011 100%)', borderRadius: '28px', boxShadow: '0 30px 60px rgba(0,0,0,0.15)' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #FF914D, #E07A9C)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <Coffee size={30} color="#fff" strokeWidth={2.5} />
                </div>
                <h3 style={{ fontFamily: 'var(--c-font)', fontWeight: 800, letterSpacing: '-0.025em', fontSize: '1.25rem', color: '#fff', margin: '0 0 10px' }}>{ESTUDIO.nombreCafeteria} Rewards</h3>
                <p style={{ color: 'rgba(255,255,255,0.65)', margin: '0 auto 24px', fontSize: '0.92rem', maxWidth: '280px', lineHeight: 1.5 }}>Crea tu cuenta y junta sellos: cada 12 compras, una bebida de regalo.</p>
                <button onClick={() => { localStorage.setItem('befit_redirect_after_auth', '/cafeteria'); irA('/registro'); }} style={{ padding: '14px 32px', borderRadius: '100px', background: '#FF914D', color: '#fff', fontWeight: 800, fontSize: '1rem', border: 'none', cursor: 'pointer' }}>
                  Crear cuenta
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* --- PESTAÑA: HISTORY --- */}
        {activeTab === 'history' && (
          <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
            <CafeOrderHistory
              userId={user?.id}
              onClose={() => setActiveTab('home')}
              onOpenOrder={() => {}} 
            />
          </motion.div>
        )}

        {/* --- PESTAÑA: CART --- */}
        {activeTab === 'cart' && (
          <motion.div key="cart" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }} style={{ padding: padTab }}>
            {encabezado(<h2 style={tituloTab}>Tu carrito</h2>)}
            <CafeCartSheet onVerMenu={() => setActiveTab('order')} cart={cart} products={available} onUpdateQty={updateQty} onRemove={removeItem} onOpenProduct={(p) => { setActiveTab('order'); setSelectedProduct(p); }} onCheckout={startCheckout} />
          </motion.div>
        )}

      </AnimatePresence>

      {/* NAVEGACIÓN INFERIOR (Estilo App Nativa) */}
      <BarraGlass grupo="cafeteria"
        items={[
          { id: 'home', label: 'Inicio', Icono: Home, activo: activeTab === 'home', onClick: () => { setActiveTab('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
          { id: 'order', label: 'Menú', Icono: Coffee, activo: activeTab === 'order', onClick: () => { setActiveTab('order'); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
          { id: 'cart', label: cartCount > 0 ? `Carrito (${cartCount})` : 'Carrito', Icono: ShoppingCart, badge: cartCount || null, activo: activeTab === 'cart', onClick: () => { setActiveTab('cart'); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
          { id: 'rewards', label: 'Recompensas', Icono: Gift, activo: activeTab === 'rewards', onClick: () => { setActiveTab('rewards'); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
        ]} />


      {/* FICHA / PERSONALIZACIÓN */}
      <AnimatePresence>
        {selectedProduct && (
          <CafeProductSheet product={selectedProduct} groups={optionGroups} onClose={() => setSelectedProduct(null)} onAdd={addToCart} />
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
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.6rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--c-font)' }}>{countdown}</div>
            </div>
            <h2 style={{ fontFamily: 'var(--c-font)', fontWeight: 800, letterSpacing: '-0.025em', color: '#fff', margin: '0 0 6px', fontSize: '1.3rem' }}>Confirmando tu pedido…</h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', margin: '0 0 28px', fontSize: '0.95rem' }}>¿Te arrepentiste? Aún puedes cancelar.</p>
            <button onClick={cancelCheckout} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.4)', padding: '14px 40px', borderRadius: '16px', fontWeight: 800, fontSize: '1rem', cursor: 'pointer' }}>
              Cancelar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SE REQUIERE ELIMINAR ESTO PORQUE AHORA ESTA EN EL TAB */}


      {/* PROMPT: crear cuenta para comprar (sin requerir membresía) */}
      <AnimatePresence>
        {showAuthPrompt && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAuthPrompt(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 4600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <motion.div onClick={(e) => e.stopPropagation()} initial={{ scale: 0.85, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: 'spring', damping: 20, stiffness: 240 }}
              style={{ width: 'min(360px, 100%)', background: 'var(--c-card)', borderRadius: '28px', padding: '34px 26px', textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,0.3)', position: 'relative' }}>
              <button onClick={() => setShowAuthPrompt(false)} aria-label="Cerrar" style={{ position: 'absolute', top: '16px', right: '16px', width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={16} color="#1A1C1E" />
              </button>
              <div style={{ width: '76px', height: '76px', borderRadius: '50%', background: 'linear-gradient(135deg, #FF914D, #E07A9C)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', boxShadow: '0 10px 25px rgba(255,145,77,0.4)' }}>
                <Coffee size={38} color="#fff" strokeWidth={2.2} />
              </div>
              <h2 style={{ fontFamily: 'var(--c-font)', fontWeight: 800, letterSpacing: '-0.025em', fontSize: '1.3rem', margin: '0 0 8px', color: '#1A1C1E' }}>Crea tu cuenta para pedir</h2>
              <p style={{ margin: '0 0 24px', fontSize: '0.95rem', color: '#6B7280', lineHeight: 1.5 }}>Es gratis y rápido — no necesitas membresía. Así puedes seguir tu pedido en vivo y recibir avisos cuando esté listo.</p>
              <button onClick={() => { localStorage.setItem('befit_redirect_after_auth', '/cafeteria'); localStorage.setItem('befit_cafe_resume', '1'); irA('/registro'); }} style={{ width: '100%', padding: '15px', borderRadius: '16px', border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 10px 25px rgba(255,145,77,0.35)', marginBottom: '10px' }}>
                Registrarme
              </button>
              <button onClick={() => { localStorage.setItem('befit_redirect_after_auth', '/cafeteria'); localStorage.setItem('befit_cafe_resume', '1'); irA('/login'); }} style={{ width: '100%', padding: '13px', borderRadius: '16px', border: '1.5px solid rgba(0,0,0,0.12)', background: 'var(--c-card)', color: '#1A1C1E', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}>
                Ya tengo cuenta
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SE REQUIERE ELIMINAR ESTO PORQUE AHORA ESTA EN EL TAB */}

      {/* SE REQUIERE ELIMINAR ESTO PORQUE AHORA ESTA EN EL TAB */}

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
            style={{ width: 'min(360px, 100%)', background: 'var(--c-card)', borderRadius: '28px', padding: '34px 26px', textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,0.3)', position: 'relative' }}>
            <button onClick={() => setShowThanks(false)} aria-label="Cerrar" style={{ position: 'absolute', top: '16px', right: '16px', width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={16} color="#1A1C1E" />
            </button>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.15 }}
              style={{ width: '76px', height: '76px', borderRadius: '50%', background: 'linear-gradient(135deg, #FF914D, #E07A9C)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', boxShadow: '0 10px 25px rgba(255,145,77,0.4)' }}>
              <CheckCircle2 size={42} color="#fff" strokeWidth={2.5} />
            </motion.div>
            <h2 style={{ fontFamily: 'var(--c-font)', fontWeight: 800, letterSpacing: '-0.025em', fontSize: '1.7rem', margin: '0 0 8px', color: '#1A1C1E' }}>¡Gracias!</h2>
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
