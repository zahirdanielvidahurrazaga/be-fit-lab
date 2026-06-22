import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Stripe as CapStripe } from '@capacitor-community/stripe';
import { supabase } from './lib/supabase';

// Code-splitting por ruta: cada página se descarga solo cuando se visita.
// Esto reduce drásticamente el JS del primer load (antes todo iba en un bundle).
const Landing = lazy(() => import('./pages/Landing'));
const Agenda = lazy(() => import('./pages/Agenda'));
const Evolucion = lazy(() => import('./pages/Evolucion'));
const Nutricion = lazy(() => import('./pages/Nutricion'));
const Portal = lazy(() => import('./pages/Portal'));
const MiCuenta = lazy(() => import('./pages/MiCuenta'));
const Ajustes = lazy(() => import('./pages/Ajustes'));
const Admin = lazy(() => import('./pages/Admin'));
const Coach = lazy(() => import('./pages/Coach'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Planes = lazy(() => import('./pages/Planes'));
const Privacidad = lazy(() => import('./pages/Privacidad'));
const Terminos = lazy(() => import('./pages/Terminos'));
const Welcome = lazy(() => import('./pages/Welcome'));
const Cafeteria = lazy(() => import('./pages/Cafeteria'));
const Cumpleanos = lazy(() => import('./pages/Cumpleanos'));
const Eventos = lazy(() => import('./pages/Eventos'));
const Barista = lazy(() => import('./pages/Barista'));
const Recepcion = lazy(() => import('./pages/Recepcion'));
const NuevaContrasena = lazy(() => import('./pages/NuevaContrasena'));
import { AuthProvider, useAuth } from './context/AuthContext';
import { hasNutritionAccess } from './lib/plans';
import { useLocalNotifications } from './hooks/useLocalNotifications';
import { usePushNotifications } from './hooks/usePushNotifications';
import { AppTour } from './components/AppTour';
import NotificationSheet from './components/NotificationSheet';
import BadgeUnlockOverlay from './components/BadgeUnlockOverlay';
import './index.css';

// Overlay global de insignia desbloqueada: se muestra en CUALQUIER pantalla
// (antes solo aparecía si la usuaria estaba en Inicio).
const GlobalBadgeOverlay = () => {
  const { badgeQueue, dismissBadge } = useAuth();
  return <BadgeUnlockOverlay badge={badgeQueue[0] || null} onClose={dismissBadge} />;
};

const ScrollToTop = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Procesa los deep links de Supabase Auth en nativo (confirmación de correo y
// recuperación de contraseña): befitlab://auth-callback?flow=...&code=...
// (o tokens en el hash). Establece la sesión y navega según el flujo.
const AuthDeepLinkHandler = () => {
  const navigate = useNavigate();
  React.useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let listener;
    const process = async (url) => {
      if (!url || !url.includes('auth-callback')) return;
      try { await Browser.close(); } catch (e) { /* noop */ }
      try {
        const u = new URL(url);
        const hp = new URLSearchParams(u.hash?.startsWith('#') ? u.hash.slice(1) : '');
        const code = u.searchParams.get('code');
        const access_token = hp.get('access_token');
        const refresh_token = hp.get('refresh_token');
        const flow = u.searchParams.get('flow') || hp.get('type');
        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        } else if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token });
        } else {
          return;
        }
        navigate(flow === 'recovery' ? '/nueva-contrasena' : '/portal', { replace: true });
      } catch (e) { console.error('Auth deep link:', e); }
    };
    CapApp.addListener('appUrlOpen', ({ url }) => process(url)).then(l => { listener = l; });
    // Arranque en frío: la app pudo abrirse directamente desde el enlace.
    CapApp.getLaunchUrl().then(res => { if (res?.url) process(res.url); }).catch(() => {});
    return () => { if (listener) listener.remove(); };
  }, [navigate]);
  return null;
};

const ProtectedRoute = ({ children, requireRole, requireNutrition }) => {
  const { user, role, membershipStatus, plan, loading } = useAuth();
  
  // Si estamos cargando la sesión inicial o el rol, esperar
  if (loading || (user && role === null)) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FDFBF7' }}>
        <div className="loader">Cargando Seguridad...</div>
      </div>
    );
  }
  
  // Si no hay usuario, a login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const allowedRoles = Array.isArray(requireRole) ? requireRole : [requireRole];

  // Si el rol no coincide con el requerido por la ruta
  if (requireRole && !allowedRoles.includes(role)) {
    if (role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (role === 'COACH') return <Navigate to="/coach" replace />;
    if (role === 'BARISTA') return <Navigate to="/barista" replace />;
    if (role === 'RECEPCION') return <Navigate to="/recepcion" replace />;
    return <Navigate to="/portal" replace />;
  }

  // PATRÓN SANTUARIO: Si soy CLIENT pero no tengo plan activo, lo redirijo a la página de planes (o landing web)
  // Solo aplicamos esto si estamos en una ruta que requiere ser cliente (portal, nutricion, etc)
  if (allowedRoles.includes('CLIENT') && role === 'CLIENT' && membershipStatus !== 'ACTIVE') {
    const isNativeApp = Capacitor.isNativePlatform();
    return <Navigate to={isNativeApp ? "/planes" : "/"} replace />;
  }

  // El apartado de Nutrición no está en los dos planes más económicos
  // (Principiante / Inicial). El admin/coach siempre puede entrar.
  if (requireNutrition && role === 'CLIENT' && !hasNutritionAccess(plan)) {
    return <Navigate to="/portal" replace />;
  }

  return children;
};

function App() {
  const isNative = Capacitor.isNativePlatform();
  useLocalNotifications();
  usePushNotifications();

  // Inicializar siempre en light — el dark mode per-usuario se aplica en Ajustes/Portal
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  // Inicializar Stripe nativo (hoja de pago) en la app
  React.useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const pk = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (pk) CapStripe.initialize({ publishableKey: pk }).catch(e => console.error('Stripe init:', e));
  }, []);

  // Deep link de retorno del pago (befitlab://): cierra el navegador in-app
  // y avisa a la cafetería para mostrar el "¡Gracias!".
  React.useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let listener;
    CapApp.addListener('appUrlOpen', async ({ url }) => {
      if (!url || !url.startsWith('befitlab://')) return;
      try { await Browser.close(); } catch (e) {}
      if (url.includes('payment=success')) {
        window.dispatchEvent(new CustomEvent('cafe-payment-success'));
      }
    }).then(l => { listener = l; });
    return () => { if (listener) listener.remove(); };
  }, []);

  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <AuthDeepLinkHandler />
        <Suspense fallback={
          <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FDFBF7' }}>
            <div className="loader">Cargando...</div>
          </div>
        }>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/" element={isNative ? <Navigate to="/welcome" replace /> : <Landing />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/nueva-contrasena" element={<NuevaContrasena />} />
          <Route path="/planes" element={<Planes />} />
          <Route path="/privacidad" element={<Privacidad />} />
          <Route path="/terminos" element={<Terminos />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/cafeteria" element={<Cafeteria />} />
          
          {/* Rutas Privadas Clienta */}
          <Route path="/portal" element={<ProtectedRoute requireRole="CLIENT"><Portal /></ProtectedRoute>} />
          <Route path="/nutricion" element={<ProtectedRoute requireRole="CLIENT" requireNutrition><Nutricion /></ProtectedRoute>} />
          <Route path="/evolucion" element={<ProtectedRoute requireRole="CLIENT"><Evolucion /></ProtectedRoute>} />
          <Route path="/mi-cuenta" element={<ProtectedRoute requireRole={['CLIENT', 'COACH']}><MiCuenta /></ProtectedRoute>} />
          <Route path="/cumpleanos" element={<ProtectedRoute requireRole={['CLIENT', 'COACH', 'ADMIN']}><Cumpleanos /></ProtectedRoute>} />
          <Route path="/eventos" element={<ProtectedRoute requireRole={['CLIENT', 'COACH', 'ADMIN']}><Eventos /></ProtectedRoute>} />
          <Route path="/ajustes" element={<ProtectedRoute requireRole={['CLIENT', 'COACH']}><Ajustes /></ProtectedRoute>} />
          
          {/* Rutas Privadas Coach */}
          <Route path="/coach" element={<ProtectedRoute requireRole="COACH"><Coach /></ProtectedRoute>} />

          {/* Rutas Privadas Admin */}
          <Route path="/admin" element={<ProtectedRoute requireRole="ADMIN"><Admin /></ProtectedRoute>} />

          {/* Barista / Recepción */}
          <Route path="/barista" element={<ProtectedRoute requireRole={['BARISTA', 'ADMIN']}><Barista /></ProtectedRoute>} />
          <Route path="/recepcion" element={<ProtectedRoute requireRole={['RECEPCION', 'ADMIN']}><Recepcion /></ProtectedRoute>} />
        </Routes>
        </Suspense>
        <AppTour />
        <NotificationSheet />
        <GlobalBadgeOverlay />
      </Router>
    </AuthProvider>
  );
}

export default App;
