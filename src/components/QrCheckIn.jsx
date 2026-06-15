import React, { useRef, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { classDateTime } from '../hooks/useLocalNotifications';
import { todayLocalStr } from '../lib/dates';

// Avatar redondo: foto si existe, si no las iniciales.
const Avatar = ({ name, avatar, size = 52, success = true }) => {
  const initials = (name || '??').substring(0, 2).toUpperCase();
  if (avatar) {
    return <img src={avatar} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: success ? 'linear-gradient(135deg, var(--primary), var(--accent))' : 'rgba(255,77,77,0.15)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size > 45 ? '1.1rem' : '0.85rem', fontWeight: 900,
      color: success ? 'white' : '#dc2626',
    }}>{initials}</div>
  );
};

// Lector de QR compartido (Mostrador admin + Recepción). El lector físico teclea
// el id en el input oculto y enfocado. La tarjeta de la última alumna y la lista
// del día PERSISTEN (no se auto-borran) para control en recepción.
export default function QrCheckIn({ sideContent = null }) {
  const { checkInClient, globalClasses } = useAuth();
  const qrInputRef = useRef(null);
  const [scannedQR, setScannedQR] = useState('');

  // El log del día PERSISTE en localStorage (sobrevive cambios de pestaña y
  // recargas) con clave por fecha → se reinicia solo al día siguiente.
  const logKey = `befit_scanlog_${todayLocalStr()}`;
  const readLog = () => { try { return JSON.parse(localStorage.getItem(logKey)) || []; } catch { return []; } };
  const [scanLog, setScanLog] = useState(readLog);
  const [scannedClient, setScannedClient] = useState(() => readLog()[0] || null);
  const [qrMessage, setQrMessage] = useState(() => readLog()[0]?.message || '');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    try { localStorage.setItem(logKey, JSON.stringify(scanLog)); } catch { /* noop */ }
  }, [scanLog, logKey]);

  // Mantener el input enfocado para que el lector siempre escriba ahí.
  useEffect(() => { qrInputRef.current?.focus(); }, []);

  // Próxima clase de hoy (la que se está cobrando/checando). Misma lógica de
  // filtrado que el panel admin: por fecha exacta o por día de semana recurrente.
  const nextClass = useMemo(() => {
    const todayStr = todayLocalStr();
    const dow = new Date(todayStr + 'T12:00:00').getDay();
    const todays = (globalClasses || []).filter(c =>
      c.date === todayStr || (!c.date && (c.day === dow || c.day === String(dow)))
    );
    const withDt = todays
      .map(c => ({ c, dt: classDateTime(todayStr, c.time) }))
      .filter(x => x.dt)
      .sort((a, b) => a.dt - b.dt);
    if (!withDt.length) return null;
    const now = Date.now();
    // La próxima por empezar; con 1h de gracia para una clase en curso.
    const upcoming = withDt.find(x => x.dt.getTime() + 60 * 60 * 1000 >= now);
    return (upcoming || withDt[withDt.length - 1]).c;
  }, [globalClasses]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleQRScan = async (e) => {
    e.preventDefault();
    const code = scannedQR.trim();
    if (code === '') return;

    // Cooldown de 1h por alumna para evitar doble escaneo accidental.
    const lastScanStr = localStorage.getItem(`last_checkin_${code}`);
    if (lastScanStr && (Date.now() - parseInt(lastScanStr)) < 1000 * 60 * 60) {
      showToast('Esta alumna ya registró asistencia hace poco.', 'error');
      setScannedQR('');
      qrInputRef.current?.focus();
      return;
    }

    const result = await checkInClient(code);
    if (result.success) {
      localStorage.setItem(`last_checkin_${code}`, Date.now().toString());
    }
    setQrMessage(result.message);
    setScannedClient(result.clientInfo);
    setScannedQR('');

    if (result.clientInfo) {
      setScanLog(prev => [{
        ...result.clientInfo,
        message: result.message,
        success: result.success,
        scannedAt: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      }, ...prev]);
    } else {
      showToast(result.message || 'Alumna no encontrada.', 'error');
    }

    // Re-enfocar para el siguiente escaneo SIN borrar la tarjeta (persiste).
    qrInputRef.current?.focus();
  };

  return (
    <div>
      {/* PRÓXIMA CLASE — para cuál se está haciendo el check-in */}
      {nextClass && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px',
          background: 'linear-gradient(135deg, var(--primary), var(--accent))', color: 'white',
          borderRadius: '20px', padding: '16px 20px', boxShadow: '0 10px 26px rgba(255,145,77,0.28)'
        }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Clock size={22} color="white" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, opacity: 0.85 }}>Check-in para la clase</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, fontFamily: 'var(--font-display)', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {nextClass.title}
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, opacity: 0.92, marginTop: '2px' }}>
              {nextClass.time}{nextClass.instructor ? ` · ${nextClass.instructor}` : ''}
            </div>
          </div>
        </div>
      )}

      <div className="admin-double-column">

        {/* LECTOR QR — siempre visible */}
        <section style={{ width: '100%' }}>
          <div className="wallet-card" style={{
            background: 'linear-gradient(135deg, #1A1C1E, #2C302E)',
            padding: '40px 20px', textAlign: 'center', position: 'relative', overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '24px', cursor: 'pointer'
          }} onClick={() => qrInputRef.current?.focus()}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: 'var(--accent)', opacity: 0.5, boxShadow: '0 0 15px var(--accent)', animation: 'scanLine 3s infinite linear' }} />
            <div style={{ width: '80px', height: '80px', border: '2px dashed rgba(255,255,255,0.3)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '20px', height: '20px', borderTop: '2px solid var(--accent)', borderLeft: '2px solid var(--accent)', borderTopLeftRadius: '24px' }} />
              <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '20px', height: '20px', borderTop: '2px solid var(--accent)', borderRight: '2px solid var(--accent)', borderTopRightRadius: '24px' }} />
              <div style={{ position: 'absolute', bottom: '-2px', left: '-2px', width: '20px', height: '20px', borderBottom: '2px solid var(--accent)', borderLeft: '2px solid var(--accent)', borderBottomLeftRadius: '24px' }} />
              <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '20px', height: '20px', borderBottom: '2px solid var(--accent)', borderRight: '2px solid var(--accent)', borderBottomRightRadius: '24px' }} />
              <QrCode size={35} color="white" opacity={0.8} />
            </div>
            <h2 style={{ fontSize: '1.4rem', color: 'white', fontFamily: 'var(--font-display)', margin: 0, letterSpacing: '0.05em' }}>Escanear QR</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', margin: '8px 0 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Aproximar código de alumna</p>
            <form onSubmit={handleQRScan} style={{ position: 'absolute', top: '-1000px', left: '-1000px' }}>
              <input ref={qrInputRef} type="text" value={scannedQR} onChange={(e) => setScannedQR(e.target.value)} autoFocus autoComplete="off" />
            </form>
          </div>
        </section>

        {/* COLUMNA DERECHA: última alumna (persistente, con foto) + extra */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%' }}>
          <AnimatePresence mode="wait">
            {scannedClient && (
              <motion.div
                key={scannedClient.id + scanLog.length}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{
                  background: 'white', borderRadius: '24px',
                  boxShadow: '0 10px 30px rgba(34,197,94,0.12)',
                  border: '1px solid rgba(34,197,94,0.2)',
                  padding: '20px', display: 'flex', alignItems: 'center', gap: '16px'
                }}
              >
                <Avatar name={scannedClient.name} avatar={scannedClient.avatar} size={56} success={scannedClient.status === 'ACTIVE'} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--black)', fontFamily: 'var(--font-display)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {scannedClient.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 600, marginTop: '2px' }}>
                    {scannedClient.plan} · {scannedClient.classesRemaining >= 9000 ? '∞' : scannedClient.classesRemaining} clases restantes
                  </div>
                  <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', color: scannedClient.status === 'ACTIVE' ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
                    {scannedClient.status === 'ACTIVE' ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                    {qrMessage}
                  </div>
                </div>
                <div style={{
                  flexShrink: 0, padding: '5px 10px', borderRadius: '10px', fontSize: '0.65rem', fontWeight: 800,
                  background: scannedClient.status === 'ACTIVE' ? 'rgba(34,197,94,0.1)' : 'rgba(255,77,77,0.1)',
                  color: scannedClient.status === 'ACTIVE' ? '#16a34a' : '#dc2626',
                  textTransform: 'uppercase', letterSpacing: '0.05em'
                }}>
                  {scannedClient.status === 'ACTIVE' ? 'Activa' : 'Inactiva'}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {sideContent}
        </section>
      </div>

      {/* LISTA / LOG DE ASISTENCIA DEL DÍA (persistente, con foto) */}
      {scanLog.length > 0 && (
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-display)', margin: 0 }}>Asistencia de hoy</h2>
            <div style={{ background: 'rgba(255,145,77,0.1)', color: 'var(--primary)', borderRadius: '10px', padding: '4px 12px', fontSize: '0.75rem', fontWeight: 800 }}>
              {scanLog.length} {scanLog.length === 1 ? 'alumna' : 'alumnas'}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {scanLog.map((entry, i) => (
              <div key={i} style={{
                background: 'white', borderRadius: '18px', padding: '14px 18px',
                display: 'flex', alignItems: 'center', gap: '14px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)'
              }}>
                <Avatar name={entry.name} avatar={entry.avatar} size={42} success={entry.success} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--black)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {entry.name || 'Desconocido'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)', fontWeight: 600, marginTop: '2px' }}>
                    {entry.plan || 'Sin plan'} · {entry.classesRemaining == null ? '—' : (entry.classesRemaining >= 9000 ? '∞' : entry.classesRemaining)} clases restantes
                  </div>
                </div>
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--on-surface-variant)' }}>{entry.scannedAt}</div>
                  <div style={{
                    marginTop: '4px', fontSize: '0.65rem', fontWeight: 800,
                    padding: '3px 8px', borderRadius: '8px', textTransform: 'uppercase',
                    background: entry.success ? 'rgba(34,197,94,0.1)' : 'rgba(255,77,77,0.1)',
                    color: entry.success ? '#16a34a' : '#dc2626'
                  }}>
                    {entry.success ? 'Check-in ✓' : 'Sin reserva'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            style={{
              position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
              background: toast.type === 'error' ? '#dc2626' : '#16a34a', color: 'white',
              padding: '12px 22px', borderRadius: '14px', fontWeight: 700, fontSize: '0.85rem',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)', zIndex: 9999, maxWidth: '90vw', textAlign: 'center'
            }}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
