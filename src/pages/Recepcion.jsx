import React from 'react';
import { QrCode, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import QrCheckIn from '../components/QrCheckIn';

// Pantalla dedicada para el teléfono fijo en recepción. Rol RECEPCION (y ADMIN).
// Solo el lector de QR: la alumna pasa su código, queda fija su info (con foto)
// y se acumula la lista del día.
export default function Recepcion() {
  const { logout, profileName } = useAuth();

  return (
    <div style={{ minHeight: '100vh', background: '#F4EFE9', fontFamily: 'var(--font-body, Inter, sans-serif)' }}>
      {/* HEADER */}
      <header style={{ background: '#fff', borderBottom: '1px solid rgba(43,33,28,0.07)', padding: 'calc(env(safe-area-inset-top,0px) + 16px) 20px 16px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: 'linear-gradient(135deg,#FF914D,#E07A9C)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px rgba(255,145,77,0.35)' }}>
            <QrCode size={24} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#A89A8E', fontWeight: 700 }}>Be Fit Lab · Recepción</p>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontFamily: 'var(--font-display)', color: '#2B211C' }}>Control de acceso</h1>
          </div>
          <button onClick={logout} aria-label="Salir" style={{ width: '42px', height: '42px', borderRadius: '50%', border: 'none', background: 'rgba(186,26,26,0.08)', color: '#ba1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><LogOut size={18} /></button>
        </div>
      </header>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px 40px' }}>
        <QrCheckIn />
      </main>
    </div>
  );
}
