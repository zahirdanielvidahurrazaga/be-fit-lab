import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Agenda from './pages/Agenda';
import Evolucion from './pages/Evolucion';
import Nutricion from './pages/Nutricion';
import Portal from './pages/Portal';
import Admin from './pages/Admin';
import Coach from './pages/Coach';
import Login from './pages/Login';
import Register from './pages/Register';
import Planes from './pages/Planes';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

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
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/planes" element={<Planes />} />
          <Route path="/agenda" element={<Agenda />} />
          
          {/* Rutas Privadas Clienta */}
          <Route path="/portal" element={<ProtectedRoute requireRole="CLIENT"><Portal /></ProtectedRoute>} />
          <Route path="/nutricion" element={<ProtectedRoute requireRole="CLIENT"><Nutricion /></ProtectedRoute>} />
          <Route path="/evolucion" element={<ProtectedRoute requireRole="CLIENT"><Evolucion /></ProtectedRoute>} />
          
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
