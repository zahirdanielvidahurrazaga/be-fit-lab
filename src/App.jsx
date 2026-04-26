import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Agenda from './pages/Agenda';
import Evolucion from './pages/Evolucion';
import Nutricion from './pages/Nutricion';
import Portal from './pages/Portal';
import Admin from './pages/Admin';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/nutricion" element={<Nutricion />} />
        <Route path="/evolucion" element={<Evolucion />} />
        <Route path="/portal" element={<Portal />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}

export default App;
