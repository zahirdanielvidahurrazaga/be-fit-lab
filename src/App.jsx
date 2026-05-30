import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

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
import { AuthProvider, useAuth } from './context/AuthContext';
import { useLocalNotifications } from './hooks/useLocalNotifications';
import { usePushNotifications } from './hooks/usePushNotifications';
import { AppTour } from './components/AppTour';
import './index.css';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const ProtectedRoute = ({ children, requireRole }) => {
  const { user, role, membershipStatus, loading } = useAuth();
  
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
    return <Navigate to="/portal" replace />;
  }

  // PATRÓN SANTUARIO: Si soy CLIENT pero no tengo plan activo, lo redirijo a la página de planes (o landing web)
  // Solo aplicamos esto si estamos en una ruta que requiere ser cliente (portal, nutricion, etc)
  if (allowedRoles.includes('CLIENT') && role === 'CLIENT' && membershipStatus !== 'ACTIVE') {
    const isNativeApp = Capacitor.isNativePlatform();
    return <Navigate to={isNativeApp ? "/planes" : "/"} replace />;
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

  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
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
          <Route path="/planes" element={<Planes />} />
          <Route path="/privacidad" element={<Privacidad />} />
          <Route path="/terminos" element={<Terminos />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/cafeteria" element={<Cafeteria />} />
          
          {/* Rutas Privadas Clienta */}
          <Route path="/portal" element={<ProtectedRoute requireRole="CLIENT"><Portal /></ProtectedRoute>} />
          <Route path="/nutricion" element={<ProtectedRoute requireRole="CLIENT"><Nutricion /></ProtectedRoute>} />
          <Route path="/evolucion" element={<ProtectedRoute requireRole="CLIENT"><Evolucion /></ProtectedRoute>} />
          <Route path="/mi-cuenta" element={<ProtectedRoute requireRole={['CLIENT', 'COACH']}><MiCuenta /></ProtectedRoute>} />
          <Route path="/ajustes" element={<ProtectedRoute requireRole={['CLIENT', 'COACH']}><Ajustes /></ProtectedRoute>} />
          
          {/* Rutas Privadas Coach */}
          <Route path="/coach" element={<ProtectedRoute requireRole="COACH"><Coach /></ProtectedRoute>} />

          {/* Rutas Privadas Admin */}
          <Route path="/admin" element={<ProtectedRoute requireRole="ADMIN"><Admin /></ProtectedRoute>} />
        </Routes>
        </Suspense>
        <AppTour />
      </Router>
    </AuthProvider>
  );
}

export default App;
