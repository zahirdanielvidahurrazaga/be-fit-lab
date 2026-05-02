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
  const { user, role, loading } = useAuth();
  
  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando Seguridad...</div>;
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireRole && role !== requireRole) {
    if (role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (role === 'COACH') return <Navigate to="/coach" replace />;
    return <Navigate to="/portal" replace />;
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
