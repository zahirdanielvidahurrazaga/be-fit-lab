import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

// ─────────────────────────────────────────────────────────────────────────────
// APLICACIÓN DEL DESPLIEGUE DE MAQUETAS
//
// Entrada SEPARADA de App.jsx a propósito. Bastaba con partir el árbol de rutas
// para que las pantallas del estudio cliente fueran inalcanzables, pero seguían
// COMPILÁNDOSE: los `lazy(() => import(...))` de App.jsx corren al cargar el
// módulo, aunque la rama que los usa esté muerta, así que Rollup conservaba los
// chunks de Landing, Admin y todo lo demás. Con una entrada propia, esos
// archivos ni existen en este despliegue.
//
// Aquí no va AuthProvider: la maqueta sirve su propio contexto (DemoProvider) y
// el índice no necesita sesión. Sin proveedor de auth, este despliegue no puede
// autenticar a nadie ni por accidente.
// ─────────────────────────────────────────────────────────────────────────────

const IndiceDemos = lazy(() => import('./pages/IndiceDemos'));
const Demo = lazy(() => import('./pages/Demo'));

export default function AppDemos() {
  return (
    <Router>
      <Suspense fallback={
        <div style={{
          height: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: '#12161A', color: '#8E9BA8',
          fontFamily: "'Avenir Next', system-ui, sans-serif",
        }}>
          Cargando…
        </div>
      }>
        <Routes>
          <Route path="/" element={<IndiceDemos />} />
          <Route path="/demo/:estudio" element={<Demo />} />
          {/* Cualquier otra dirección regresa al índice: si una prospecta borra
              el path del link, aterriza en algo tuyo y no en otra marca. */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
