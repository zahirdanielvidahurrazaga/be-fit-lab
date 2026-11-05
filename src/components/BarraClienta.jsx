import React from 'react';
import { useLocation } from 'react-router-dom';
import { User, TrendingUp, QrCode, Utensils, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { hasNutritionAccess } from '../lib/plans';
import { moduloActivo } from '../config/estudio';
import BarraGlass from './BarraGlass';

// Barra de la CLIENTA: UNA sola para todas sus pantallas (montada en App.jsx),
// así la burbuja del activo se desliza al cambiar de sección. Solo íconos.
// El QR no navega: avisa con un evento y cada pantalla abre su pase (PaseQR).

export const EVENTO_QR = 'befit:abrir-qr';
const RUTAS = ['/portal', '/evolucion', '/nutricion', '/agenda'];

export default function BarraClienta() {
  const { user, role, plan, avatarUrl } = useAuth();
  const { pathname } = useLocation();
  if (!user || role !== 'CLIENT' || !RUTAS.includes(pathname)) return null;

  const items = [
    { id: 'inicio', to: '/portal', label: 'Inicio', Icono: User, avatarUrl: avatarUrl || null },
    { id: 'progreso', to: '/evolucion', label: 'Progreso', Icono: TrendingUp },
    moduloActivo('nutricion') && hasNutritionAccess(plan) && { id: 'comida', to: '/nutricion', label: 'Comida', Icono: Utensils },
    { id: 'clases', to: '/agenda', label: 'Clases', Icono: Calendar },
  ].filter(Boolean).map(it => ({ ...it, activo: pathname === it.to }));

  return (
    <BarraGlass grupo="clienta" items={items}
      centro={{ label: 'Mi pase QR', Icono: QrCode, onClick: () => window.dispatchEvent(new CustomEvent(EVENTO_QR)) }} />
  );
}
