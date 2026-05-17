import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import Landing from './pages/Landing';
import Agenda from './pages/Agenda';
import Evolucion from './pages/Evolucion';
import Nutricion from './pages/Nutricion';
import Portal from './pages/Portal';
import MiCuenta from './pages/MiCuenta';
import Ajustes from './pages/Ajustes';
import Admin from './pages/Admin';
import Coach from './pages/Coach';
import Login from './pages/Login';
import Register from './pages/Register';
import Planes from './pages/Planes';
import Privacidad from './pages/Privacidad';
import Terminos from './pages/Terminos';
import { AuthProvider, useAuth } from './context/AuthContext';
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

  // Si el rol no coincide con el requerido por la ruta
  if (requireRole && role !== requireRole) {
    if (role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (role === 'COACH') return <Navigate to="/coach" replace />;
    return <Navigate to="/portal" replace />;
  }

  // PATRÓN SANTUARIO: Si soy CLIENT pero no tengo plan activo, me quedo en la Landing (donde está el banner)
  // Solo aplicamos esto si estamos en una ruta que requiere ser cliente (portal, nutricion, etc)
  if (requireRole === 'CLIENT' && role === 'CLIENT' && membershipStatus !== 'ACTIVE') {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const isNative = Capacitor.isNativePlatform() || localStorage.getItem('simulateNative') === 'true';

  // Inicializar Modo Oscuro desde LocalStorage
  React.useEffect(() => {
    const savedDark = localStorage.getItem('befit_darkmode');
    if (savedDark === 'true') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/" element={isNative ? <Navigate to="/login" replace /> : <Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={isNative ? <Navigate to="/login" replace /> : <Register />} />
          <Route path="/planes" element={isNative ? <Navigate to="/login" replace /> : <Planes />} />
          <Route path="/privacidad" element={<Privacidad />} />
          <Route path="/terminos" element={<Terminos />} />
          <Route path="/agenda" element={<Agenda />} />
          
          {/* Rutas Privadas Clienta */}
          <Route path="/portal" element={<ProtectedRoute requireRole="CLIENT"><Portal /></ProtectedRoute>} />
          <Route path="/nutricion" element={<ProtectedRoute requireRole="CLIENT"><Nutricion /></ProtectedRoute>} />
          <Route path="/evolucion" element={<ProtectedRoute requireRole="CLIENT"><Evolucion /></ProtectedRoute>} />
          <Route path="/mi-cuenta" element={<ProtectedRoute requireRole="CLIENT"><MiCuenta /></ProtectedRoute>} />
          <Route path="/ajustes" element={<ProtectedRoute requireRole="CLIENT"><Ajustes /></ProtectedRoute>} />
          
          {/* Rutas Privadas Coach */}
          <Route path="/coach" element={<ProtectedRoute requireRole="COACH"><Coach /></ProtectedRoute>} />

          {/* Rutas Privadas Admin */}
          <Route path="/admin" element={<ProtectedRoute requireRole="ADMIN"><Admin /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
