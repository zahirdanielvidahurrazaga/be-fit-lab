import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Cake, Crown, UserX, UserCheck, Shield, Coffee, Dumbbell, ChevronDown, ChevronLeft, ChevronRight, Phone, QrCode, Trash2, CalendarPlus, Plus, Minus, X, Check, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { todayLocalStr } from '../lib/dates';
import { isPlanExpired, formatPlanDate } from '../lib/membership';
import { uploadAvatar } from '../lib/avatar';

const DAYS_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const isUnlimitedClient = (u) => (u.classes_remaining ?? 0) >= 9000 || ['Plan Premium', 'Premium'].includes(u.membership_plan);

// "7:00 AM" → minutos desde medianoche (para ordenar bien; el orden alfabético rompe con AM/PM).
const timeToMin = (t = '') => {
  const m = String(t).match(/(\d{1,2}):(\d{2})\s*(a|p)\.?\s*m/i);
  if (!m) return 0;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const pm = m[3].toLowerCase() === 'p';
  if (pm && h !== 12) h += 12;
  if (!pm && h === 12) h = 0;
  return h * 60 + min;
};

// Etiqueta legible de una clase del horario (fechada o recurrente semanal).
const classLabel = (c) => {
  if (c.date) {
    const dow = new Date(c.date + 'T12:00:00').getDay();
    const [, mo, d] = c.date.split('-');
    return `${DAYS_SHORT[dow]} ${parseInt(d, 10)} ${MESES_SHORT[parseInt(mo, 10) - 1]}`;
  }
  return `Cada ${DAYS_FULL[c.day] ?? '—'}`;
};

// Traduce los errores que lanza admin_book_class a algo entendible para la dueña.
const bookErrMsg = (raw = '') => {
  const m = String(raw).toUpperCase();
  if (m.includes('SIN_CLASES')) return 'La clienta no tiene clases disponibles. Súmale clases arriba y vuelve a intentar.';
  if (m.includes('SIN_CUPO')) return 'Esa clase ya no tiene cupo.';
  if (m.includes('YA_RESERVADA')) return 'La clienta ya estaba reservada en esa clase.';
  if (m.includes('NO_AUTORIZADO')) return 'No tienes permiso para reservar clases.';
  if (m.includes('CLASE_NO_EXISTE')) return 'Esa clase ya no existe.';
  if (m.includes('CLIENTA_NO_EXISTE')) return 'No se encontró a la clienta.';
  return 'No se pudo reservar: ' + raw;
};

const PRIMARY = '#FF914D';
const INK = '#1A1C1E';

const ROLES = [
  { value: 'CLIENT', label: 'Clienta', Icon: Dumbbell },
  { value: 'COACH', label: 'Coach', Icon: Crown },
  { value: 'BARISTA', label: 'Barista', Icon: Coffee },
  { value: 'RECEPCION', label: 'Recepción', Icon: QrCode },
  { value: 'ADMIN', label: 'Admin', Icon: Shield },
];
const roleMeta = (r) => ROLES.find(x => x.value === r) || ROLES[0];

const fmtBday = (d) => {
  if (!d) return null;
  const [, m, day] = d.split('-');
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${parseInt(day, 10)} ${meses[parseInt(m, 10) - 1]}`;
};

const FILTERS = [['all', 'Todas'], ['active', 'Activas'], ['inactive', 'Sin plan'], ['staff', 'Staff']];

// Liquid glass pill
function Pill({ active, onClick, children }) {
  return (
    <motion.button onClick={onClick} whileTap={{ scale: 0.95 }}
      style={{ padding: '8px 15px', borderRadius: '999px', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', whiteSpace: 'nowrap', flexShrink: 0,
        border: active ? '1px solid rgba(255,255,255,0.5)' : '1px solid rgba(255,255,255,0.55)',
        background: active ? 'linear-gradient(135deg, #FF914D, #E68245)' : 'rgba(255,255,255,0.55)',
        color: active ? '#fff' : 'var(--on-surface-variant)',
        backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        boxShadow: active ? '0 8px 20px rgba(255,145,77,0.35)' : '0 2px 10px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.7)' }}>
      {children}
    </motion.button>
  );
}

function ClientCard({ u, onRole, onBaja, onReactivar, onDelete, onManage, busy, currentUserId }) {
  const [openRole, setOpenRole] = useState(false);
  const rm = roleMeta(u.role);
  const active = u.membership_status === 'ACTIVE';
  const isClient = u.role === 'CLIENT';
  const canDelete = u.id !== currentUserId; // no permitir auto-eliminarse
  return (
    <div style={{ background: '#fff', borderRadius: '18px', border: '1px solid rgba(0,0,0,0.05)', padding: '14px' }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        {u.avatar_url
          ? <img src={u.avatar_url} alt="" style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          : <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,145,77,0.14)', color: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>{(u.full_name || u.email || '?').charAt(0).toUpperCase()}</div>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, color: INK, fontSize: '0.96rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.full_name || 'Sin nombre'}</div>
          <div style={{ fontSize: '0.77rem', color: 'var(--on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
        </div>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button onClick={() => setOpenRole(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: u.role === 'CLIENT' ? 'rgba(0,0,0,0.05)' : 'rgba(255,145,77,0.12)', color: u.role === 'CLIENT' ? 'var(--on-surface-variant)' : PRIMARY, border: 'none', borderRadius: '10px', padding: '7px 10px', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer' }}>
            <rm.Icon size={13} /> {rm.label} <ChevronDown size={12} />
          </button>
          {openRole && (
            <>
              <div onClick={() => setOpenRole(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
              <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 11, background: 'white', borderRadius: '12px', boxShadow: '0 12px 30px rgba(0,0,0,0.18)', border: '1px solid rgba(0,0,0,0.05)', overflow: 'hidden', minWidth: '150px' }}>
                {ROLES.map(r => (
                  <button key={r.value} onClick={() => { setOpenRole(false); if (r.value !== u.role) onRole(u, r.value); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 12px', border: 'none', background: r.value === u.role ? 'rgba(255,145,77,0.08)' : 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', color: r.value === u.role ? PRIMARY : INK, textAlign: 'left' }}>
                    <r.Icon size={15} /> {r.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
        {isClient && (
          <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '4px 9px', borderRadius: '8px', background: active ? 'rgba(34,197,94,0.12)' : 'rgba(0,0,0,0.05)', color: active ? '#16A34A' : 'var(--on-surface-variant)' }}>
            {active ? (u.membership_plan || 'Activa') : 'Sin plan'}
          </span>
        )}
        {isClient && active && u.classes_remaining != null && (
          <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '4px 9px', borderRadius: '8px', background: 'rgba(255,145,77,0.12)', color: PRIMARY }}>{u.classes_remaining} clases</span>
        )}
        {isClient && active && u.plan_expires_at && (
          isPlanExpired(u.plan_expires_at)
            ? <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '4px 9px', borderRadius: '8px', background: 'rgba(239,68,68,0.12)', color: '#EF4444' }}>Vencido {formatPlanDate(u.plan_expires_at, true)}</span>
            : <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '4px 9px', borderRadius: '8px', background: 'rgba(59,130,246,0.10)', color: '#2563EB' }}>Vence {formatPlanDate(u.plan_expires_at, true)}</span>
        )}
        {u.birth_date && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 700, padding: '4px 9px', borderRadius: '8px', background: 'rgba(224,122,156,0.12)', color: '#E07A9C' }}><Cake size={12} /> {fmtBday(u.birth_date)}</span>
        )}
        {u.phone && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 700, padding: '4px 9px', borderRadius: '8px', background: 'rgba(0,0,0,0.05)', color: 'var(--on-surface-variant)' }}><Phone size={11} /> {u.phone}</span>
        )}
      </div>

      {(isClient || canDelete) && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
          {isClient && (
            <button disabled={busy} onClick={() => onManage(u)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,145,77,0.12)', color: PRIMARY, border: 'none', borderRadius: '10px', padding: '8px 12px', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>
              <CalendarPlus size={14} /> Clases
            </button>
          )}
          {isClient && (active ? (
            <button disabled={busy} onClick={() => onBaja(u)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(186,26,26,0.08)', color: '#ba1a1a', border: 'none', borderRadius: '10px', padding: '8px 12px', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>
              <UserX size={14} /> Dar de baja
            </button>
          ) : (
            <button disabled={busy} onClick={() => onReactivar(u)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(34,197,94,0.1)', color: '#16A34A', border: 'none', borderRadius: '10px', padding: '8px 12px', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>
              <UserCheck size={14} /> Reactivar plan
            </button>
          ))}
          {canDelete && (
            <button disabled={busy} onClick={() => onDelete(u)} title="Eliminar definitivamente" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(186,26,26,0.08)', color: '#ba1a1a', border: 'none', borderRadius: '10px', padding: '8px 12px', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', marginLeft: 'auto' }}>
              <Trash2 size={14} /> Eliminar
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Modal para gestionar las clases de UNA clienta:
//  1) ajustar sus clases disponibles (classes_remaining) y
//  2) reservarla / quitarla en clases del horario.
function ManageClassesModal({ client, onClose, patch, applyLocal }) {
  const { globalClasses, fetchGlobalClasses, fetchAllUsers } = useAuth();
  const unlimited = isUnlimitedClient(client);
  const [credits, setCredits] = useState(client.classes_remaining ?? 0);
  const [savingCredits, setSavingCredits] = useState(false);

  // Foto de perfil de la clienta (la dueña puede ponérsela desde admin).
  const [avatar, setAvatar] = useState(client.avatar_url || null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const photoInputRef = useRef(null);

  const onPickPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permitir re-elegir el mismo archivo
    if (!file) return;
    setPhotoBusy(true);
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const { url, error } = await uploadAvatar(client.id, dataUrl);
      if (error || !url) { alert('No se pudo subir la foto. Intenta de nuevo.'); return; }
      await patch(client.id, { avatar_url: url });
      applyLocal?.(client.id, { avatar_url: url });
      setAvatar(url);
    } catch (_) {
      alert('No se pudo procesar la imagen.');
    } finally {
      setPhotoBusy(false);
    }
  };
  const [reserved, setReserved] = useState(null); // Set de class_id (null = cargando)
  const [busyId, setBusyId] = useState(null);

  // Edición de la fecha de vencimiento de la membresía (admin).
  const toDateInput = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const [expiryInput, setExpiryInput] = useState(toDateInput(client.plan_expires_at));
  const [savedExpiry, setSavedExpiry] = useState(toDateInput(client.plan_expires_at));
  const [savingExpiry, setSavingExpiry] = useState(false);
  const [expirySaved, setExpirySaved] = useState(false);

  const saveExpiry = async () => {
    setSavingExpiry(true); setExpirySaved(false);
    // Guardamos al final del día (23:59 local) para que "vence el X" abarque todo ese día.
    const iso = expiryInput ? new Date(expiryInput + 'T23:59:59').toISOString() : null;
    await patch(client.id, { plan_expires_at: iso });
    applyLocal?.(client.id, { plan_expires_at: iso });
    setSavedExpiry(expiryInput);
    setSavingExpiry(false); setExpirySaved(true);
    setTimeout(() => setExpirySaved(false), 2500);
  };

  // Reservas actuales de la clienta (para marcar "Reservada" y permitir quitar).
  useEffect(() => {
    let alive = true;
    supabase.from('reservations').select('class_id').eq('user_id', client.id)
      .then(({ data }) => { if (alive) setReserved(new Set((data || []).map(r => r.class_id))); });
    return () => { alive = false; };
  }, [client.id]);

  const today = todayLocalStr();
  const [selectedDate, setSelectedDate] = useState(null); // día visible en "Reservar"

  // Días futuros que tienen al menos una clase (para navegar con ◀ ▶, sin scrollear todo el mes).
  const datesWithClasses = useMemo(() => {
    const set = new Set((globalClasses || []).filter(c => c.date && c.date >= today).map(c => c.date));
    return [...set].sort();
  }, [globalClasses, today]);

  const effectiveDate = selectedDate || datesWithClasses[0] || today;
  const dateIdx = datesWithClasses.indexOf(effectiveDate);

  // Clases SOLO del día visible (fechadas en ese día + recurrentes que caen ese día de la semana).
  const dayClasses = useMemo(() => {
    const dow = new Date(effectiveDate + 'T12:00:00').getDay();
    return (globalClasses || [])
      .filter(c => c.date === effectiveDate || (!c.date && c.day === dow))
      .sort((a, b) => timeToMin(a.time) - timeToMin(b.time));
  }, [globalClasses, effectiveDate]);

  const goPrevDate = () => { if (dateIdx > 0) setSelectedDate(datesWithClasses[dateIdx - 1]); };
  const goNextDate = () => { if (dateIdx >= 0 && dateIdx < datesWithClasses.length - 1) setSelectedDate(datesWithClasses[dateIdx + 1]); };
  const dateTitle = new Date(effectiveDate + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  // Fija el saldo de clases (escribe a DB y refleja en la lista de fondo).
  const applyCredits = async (newVal) => {
    const val = Math.max(0, parseInt(newVal, 10) || 0);
    setCredits(val);
    setSavingCredits(true);
    await patch(client.id, { classes_remaining: val });
    setSavingCredits(false);
  };

  const book = async (c) => {
    setBusyId(c.id);
    const { error } = await supabase.rpc('admin_book_class', { p_user_id: client.id, p_class_id: c.id });
    if (error) {
      alert(bookErrMsg(error.message));
    } else {
      setReserved(prev => new Set(prev).add(c.id));
      if (!unlimited) {
        const nv = Math.max(0, (parseInt(credits, 10) || 0) - 1);
        setCredits(nv);
        applyLocal(client.id, { classes_remaining: nv }); // refleja en la tarjeta de fondo (sin re-escribir DB)
      }
      fetchGlobalClasses?.();
      fetchAllUsers?.();
    }
    setBusyId(null);
  };

  const unbook = async (c) => {
    setBusyId(c.id);
    const { error } = await supabase.rpc('admin_cancel_class', { p_user_id: client.id, p_class_id: c.id });
    if (error) {
      alert('No se pudo quitar la reserva: ' + error.message);
    } else {
      setReserved(prev => { const n = new Set(prev); n.delete(c.id); return n; });
      if (!unlimited) {
        const nv = (parseInt(credits, 10) || 0) + 1;
        setCredits(nv);
        applyLocal(client.id, { classes_remaining: nv });
      }
      fetchGlobalClasses?.();
      fetchAllUsers?.();
    }
    setBusyId(null);
  };

  const noClasses = !unlimited && (parseInt(credits, 10) || 0) <= 0;
  const quickBtn = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', border: 'none', borderRadius: '10px', padding: '8px 12px', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', background: 'rgba(255,145,77,0.12)', color: PRIMARY };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 'env(safe-area-inset-top) 0 0' }}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--app-surface-solid, #fff)', width: '100%', maxWidth: '560px', maxHeight: '90vh', borderRadius: '24px 24px 0 0', display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '18px 18px 14px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          {/* Avatar con botón de cámara para ponerle/cambiar la foto a la clienta */}
          <button
            type="button"
            onClick={() => !photoBusy && photoInputRef.current?.click()}
            title="Cambiar foto de perfil"
            style={{ position: 'relative', width: '48px', height: '48px', flexShrink: 0, border: 'none', background: 'transparent', padding: 0, cursor: photoBusy ? 'default' : 'pointer', borderRadius: '50%' }}
          >
            {avatar
              ? <img src={avatar} alt="" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
              : <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,145,77,0.14)', color: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{(client.full_name || client.email || '?').charAt(0).toUpperCase()}</div>}
            <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '20px', height: '20px', borderRadius: '50%', background: PRIMARY, border: '2px solid var(--app-surface-solid, #fff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {photoBusy
                ? <div style={{ width: '9px', height: '9px', border: '2px solid rgba(255,255,255,0.5)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                : <Camera size={11} color="#fff" />}
            </div>
            <input ref={photoInputRef} type="file" accept="image/*" onChange={onPickPhoto} style={{ display: 'none' }} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, color: INK, fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.full_name || 'Sin nombre'}</div>
            <div style={{ fontSize: '0.76rem', color: 'var(--on-surface-variant)' }}>{client.membership_plan || 'Sin plan'}</div>
            {client.plan_expires_at && (
              <div style={{ fontSize: '0.72rem', fontWeight: 700, marginTop: '2px', color: isPlanExpired(client.plan_expires_at) ? '#EF4444' : 'var(--on-surface-variant)' }}>
                {isPlanExpired(client.plan_expires_at)
                  ? `Venció el ${formatPlanDate(client.plan_expires_at, true)}`
                  : `${client.plan_started_at ? `Pagó ${formatPlanDate(client.plan_started_at, true)} · ` : ''}Vence ${formatPlanDate(client.plan_expires_at, true)}`}
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={18} color={INK} /></button>
        </div>

        <div style={{ overflowY: 'auto', padding: '18px' }}>
          {/* SECCIÓN 1 — Clases disponibles */}
          <h3 style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--on-surface-variant)', margin: '0 0 10px' }}>Clases disponibles</h3>
          {unlimited ? (
            <div style={{ background: 'rgba(255,145,77,0.08)', borderRadius: '14px', padding: '16px', textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: PRIMARY }}>∞</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>Plan ilimitado — no necesita clases sueltas</div>
            </div>
          ) : (
            <div style={{ background: 'rgba(0,0,0,0.025)', borderRadius: '14px', padding: '14px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '12px' }}>
                <button disabled={savingCredits || credits <= 0} onClick={() => applyCredits(credits - 1)} style={{ ...quickBtn, width: '40px', height: '40px', opacity: credits <= 0 ? 0.4 : 1 }}><Minus size={18} /></button>
                <div style={{ minWidth: '64px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: INK, lineHeight: 1 }}>{credits}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', fontWeight: 700 }}>clases</div>
                </div>
                <button disabled={savingCredits} onClick={() => applyCredits(credits + 1)} style={{ ...quickBtn, width: '40px', height: '40px' }}><Plus size={18} /></button>
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {[4, 8, 12].map(n => (
                  <button key={n} disabled={savingCredits} onClick={() => applyCredits(credits + n)} style={quickBtn}>+{n}</button>
                ))}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--on-surface-variant)', textAlign: 'center', marginTop: '10px' }}>Se guarda al instante.</div>
            </div>
          )}

          {/* SECCIÓN — Vencimiento de la membresía (editable por admin) */}
          <h3 style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--on-surface-variant)', margin: '0 0 10px' }}>Vencimiento de la membresía</h3>
          <div style={{ background: 'rgba(0,0,0,0.025)', borderRadius: '14px', padding: '14px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="date"
                value={expiryInput}
                onChange={(e) => setExpiryInput(e.target.value)}
                style={{ flex: 1, padding: '11px 12px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.12)', fontSize: '0.9rem', color: INK, background: '#fff', fontFamily: 'inherit', WebkitAppearance: 'none', appearance: 'none' }}
              />
              <button onClick={saveExpiry} disabled={savingExpiry || expiryInput === savedExpiry} style={{ ...quickBtn, padding: '11px 16px', opacity: (savingExpiry || expiryInput === savedExpiry) ? 0.45 : 1 }}>
                {savingExpiry ? '…' : 'Guardar'}
              </button>
            </div>
            <div style={{ fontSize: '0.74rem', color: expirySaved ? '#16A34A' : 'var(--on-surface-variant)', marginTop: '10px', fontWeight: expirySaved ? 700 : 400, lineHeight: 1.45 }}>
              {expirySaved
                ? '✓ Fecha de vencimiento actualizada'
                : 'Cambia la fecha en que se le vence la membresía a la clienta. Vacío = sin vencimiento.'}
            </div>
          </div>

          {/* SECCIÓN 2 — Reservar en una clase */}
          <h3 style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--on-surface-variant)', margin: '0 0 10px' }}>Reservar en una clase</h3>
          {noClasses && (
            <div style={{ background: 'rgba(186,26,26,0.07)', color: '#ba1a1a', borderRadius: '12px', padding: '10px 12px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '12px' }}>
              La clienta no tiene clases disponibles. Súmale clases arriba para poder reservarla.
            </div>
          )}
          {reserved === null ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--on-surface-variant)' }}>Cargando horario…</div>
          ) : datesWithClasses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--on-surface-variant)', fontSize: '0.88rem' }}>No hay clases próximas en el horario.</div>
          ) : (
            <>
              {/* Navegador de día: ◀ [viernes 27 de junio] ▶ — solo entre días con clases */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <button onClick={goPrevDate} disabled={dateIdx <= 0} style={{ background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: dateIdx <= 0 ? 'default' : 'pointer', opacity: dateIdx <= 0 ? 0.35 : 1, flexShrink: 0 }}><ChevronLeft size={18} color={INK} /></button>
                <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
                  <div style={{ fontWeight: 800, color: INK, fontSize: '0.92rem', textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dateTitle}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--on-surface-variant)', fontWeight: 700 }}>{dayClasses.length} {dayClasses.length === 1 ? 'clase' : 'clases'}</div>
                </div>
                <button onClick={goNextDate} disabled={dateIdx < 0 || dateIdx >= datesWithClasses.length - 1} style={{ background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (dateIdx < 0 || dateIdx >= datesWithClasses.length - 1) ? 'default' : 'pointer', opacity: (dateIdx < 0 || dateIdx >= datesWithClasses.length - 1) ? 0.35 : 1, flexShrink: 0 }}><ChevronRight size={18} color={INK} /></button>
              </div>

              {dayClasses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--on-surface-variant)', fontSize: '0.86rem' }}>Sin clases este día.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {dayClasses.map(c => {
                    const isReserved = reserved.has(c.id);
                    const full = (c.spots ?? 0) <= 0;
                    const busyThis = busyId === c.id;
                    return (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderLeft: `4px solid ${c.category_color || PRIMARY}`, borderRadius: '14px', padding: '10px 12px', opacity: full && !isReserved ? 0.7 : 1 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 800, color: INK, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                          <div style={{ fontSize: '0.74rem', color: full ? '#ba1a1a' : 'var(--on-surface-variant)', fontWeight: 600 }}>
                            {c.time}{c.instructor ? ` · ${c.instructor}` : ''} · {full ? 'Sin cupos' : `${c.spots} cupos`}
                          </div>
                        </div>
                        {isReserved ? (
                          <button disabled={busyThis} onClick={() => unbook(c)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(34,197,94,0.12)', color: '#16A34A', border: 'none', borderRadius: '10px', padding: '8px 11px', fontWeight: 800, fontSize: '0.76rem', cursor: 'pointer', flexShrink: 0 }}>
                            <Check size={14} /> {busyThis ? '…' : 'Reservada'}
                          </button>
                        ) : (
                          <button disabled={busyThis || full || noClasses} onClick={() => book(c)} title={full ? 'Sin cupos' : (noClasses ? 'Sin clases disponibles' : 'Reservar')} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: full ? 'rgba(186,26,26,0.1)' : PRIMARY, color: full ? '#ba1a1a' : '#fff', border: 'none', borderRadius: '10px', padding: '8px 11px', fontWeight: 800, fontSize: '0.76rem', cursor: (full || noClasses) ? 'not-allowed' : 'pointer', opacity: (full || noClasses) && !full ? 0.45 : 1, flexShrink: 0 }}>
                            {busyThis ? '…' : (full ? 'Lleno' : 'Reservar')}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AdminClientas() {
  const { user, fetchAllUsers, allPlans } = useAuth();
  const [users, setUsers] = useState(null); // TODOS los usuarios (no solo clientas)
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [busy, setBusy] = useState(false);
  const [managing, setManaging] = useState(null); // clienta cuyo modal de clases está abierto

  // Actualiza SOLO la lista de fondo (sin escribir a DB). Lo usa el modal tras
  // reservar/cancelar, donde la RPC ya tocó la DB y solo falta reflejarlo aquí.
  const applyLocal = (id, updates) => setUsers(prev => (prev || []).map(u => u.id === id ? { ...u, ...updates } : u));

  const plans = useMemo(() => {
    // Siempre mostramos todos los planes del catálogo (en su orden), aunque aún
    // nadie los tenga, para poder filtrar por planes nuevos como "Principiante".
    const canonical = (allPlans || []).map(p => p.name);
    const inUse = new Set();
    (users || []).forEach(u => { if (u.role === 'CLIENT' && u.membership_status === 'ACTIVE' && u.membership_plan) inUse.add(u.membership_plan); });
    // Añadimos al final cualquier plan en uso que no esté en el catálogo (legacy).
    const extras = [...inUse].filter(p => !canonical.includes(p));
    return [...canonical, ...extras];
  }, [users, allPlans]);

  const load = async () => {
    const { data } = await supabase.from('users')
      .select('id, full_name, email, role, membership_status, membership_plan, classes_remaining, plan_started_at, plan_expires_at, birth_date, phone, avatar_url, created_at')
      .order('full_name', { ascending: true });
    setUsers(data || []);
  };
  useEffect(() => { load(); }, []);

  const patch = async (id, updates) => {
    setBusy(true);
    setUsers(prev => (prev || []).map(u => u.id === id ? { ...u, ...updates } : u)); // optimista
    const { error } = await supabase.from('users').update(updates).eq('id', id);
    if (error) { alert('No se pudo actualizar: ' + error.message); await load(); }
    fetchAllUsers?.(); // mantener el contexto al día (clientas)
    setBusy(false);
  };

  const onRole = (u, role) => { if (confirm(`¿Cambiar a "${u.full_name || u.email}" al rol de ${roleMeta(role).label}?`)) patch(u.id, { role }); };
  const onBaja = (u) => { if (confirm(`¿Dar de baja la membresía de "${u.full_name || u.email}"?`)) patch(u.id, { membership_status: 'INACTIVE', classes_remaining: 0, plan_expires_at: null, membership_renewal: 'active' }); };
  const onReactivar = (u) => {
    if (!confirm(`¿Reactivar la membresía de "${u.full_name || u.email}"? Vencerá en un mes.`)) return;
    // Reactivar = nuevo periodo: pago = hoy, vence = +1 mes (regla automática).
    const started = new Date();
    const expires = new Date(started); expires.setMonth(expires.getMonth() + 1);
    patch(u.id, { membership_status: 'ACTIVE', plan_started_at: started.toISOString(), plan_expires_at: expires.toISOString(), membership_renewal: 'active' });
  };

  // Eliminación DEFINITIVA (cuenta + datos). Doble confirmación por ser destructivo.
  const onDelete = async (u) => {
    const quien = u.full_name || u.email;
    if (u.id === user?.id) { alert('No puedes eliminar tu propia cuenta.'); return; }

    // Historial de la cuenta: borrar una cuenta con ventas deja esos cobros
    // "huérfanos" en el dashboard (pasó con cuentas duplicadas: se cobró en
    // una, se borró, y el plan "desapareció"). Enseñarlo ANTES de confirmar.
    let historial = '';
    try {
      const [{ count: nVentas }, { count: nReservas }] = await Promise.all([
        supabase.from('sales').select('id', { count: 'exact', head: true }).eq('user_id', u.id),
        supabase.from('reservations').select('id', { count: 'exact', head: true }).eq('user_id', u.id),
      ]);
      if (nVentas || nReservas) {
        historial = `\n\nOJO: esta cuenta tiene ${nVentas || 0} cobro(s) registrado(s) y ${nReservas || 0} reserva(s).`
          + `\nSi es una cuenta duplicada, revisa en Auditoría cuál usa la clienta antes de borrar.`
          + `\nSi solo quieres quitarle el acceso, mejor usa "Dar de baja".`;
      }
    } catch (e) { /* sin bloqueo: si falla el conteo, se confirma igual */ }

    if (!confirm(`¿ELIMINAR para siempre a "${quien}"?\n\nSe borrará su cuenta, reservas, fotos, métricas y datos. Esta acción NO se puede deshacer.${historial}`)) return;
    if (!confirm(`Última confirmación: eliminar definitivamente a ${quien}.`)) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke('admin-delete-client', { body: { userId: u.id } });
    setBusy(false);
    if (error || data?.error) {
      let motivo = data?.error;
      if (!motivo && error?.context && typeof error.context.json === 'function') {
        try { motivo = (await error.context.json())?.error; } catch (_) { /* cuerpo no-JSON */ }
      }
      alert(motivo || error?.message || 'No se pudo eliminar.');
      return;
    }
    setUsers(prev => (prev || []).filter(x => x.id !== u.id)); // quitar de la lista
    fetchAllUsers?.();
    if (data?.warning) alert(data.warning);
  };

  const list = useMemo(() => {
    let arr = users || [];
    if (filter === 'active') arr = arr.filter(u => u.membership_status === 'ACTIVE' && u.role === 'CLIENT');
    else if (filter === 'inactive') arr = arr.filter(u => u.membership_status !== 'ACTIVE' && u.role === 'CLIENT');
    else if (filter === 'staff') arr = arr.filter(u => ['COACH', 'BARISTA', 'RECEPCION', 'ADMIN'].includes(u.role));
    if (planFilter !== 'all') arr = arr.filter(u => (u.membership_plan || '') === planFilter && u.membership_status === 'ACTIVE');
    const s = q.trim().toLowerCase();
    if (s) arr = arr.filter(u => (u.full_name || '').toLowerCase().includes(s) || (u.email || '').toLowerCase().includes(s));
    return arr;
  }, [users, filter, planFilter, q]);

  const counts = useMemo(() => {
    const all = users || [];
    const clients = all.filter(u => u.role === 'CLIENT');
    return {
      total: all.length,
      active: clients.filter(u => u.membership_status === 'ACTIVE').length,
      clients: clients.length,
      staff: all.filter(u => ['COACH', 'BARISTA', 'RECEPCION', 'ADMIN'].includes(u.role)).length,
    };
  }, [users]);

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
        <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', margin: 0, color: INK }}>Clientas & Staff</h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>{counts.clients} clientas · {counts.active} activas · {counts.staff} staff</span>
      </div>

      <div style={{ position: 'relative', marginBottom: '12px' }}>
        <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)' }} />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nombre o correo…"
          style={{ width: '100%', padding: '12px 14px 12px 42px', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.1)', background: 'white', fontSize: '0.92rem', boxSizing: 'border-box' }} />
      </div>

      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px', marginBottom: plans.length ? '10px' : '18px' }}>
        {FILTERS.map(([id, label]) => (
          <Pill key={id} active={filter === id} onClick={() => setFilter(id)}>{label}</Pill>
        ))}
      </div>
      {plans.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '18px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0, marginRight: '2px' }}>Membresía:</span>
          <Pill active={planFilter === 'all'} onClick={() => setPlanFilter('all')}>Todas</Pill>
          {plans.map(p => <Pill key={p} active={planFilter === p} onClick={() => setPlanFilter(p)}>{p}</Pill>)}
        </div>
      )}

      {users === null ? (
        <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--on-surface-variant)' }}>Cargando…</div>
      ) : list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--on-surface-variant)' }}>
          <UserX size={34} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <p style={{ margin: 0, fontWeight: 700, color: INK }}>Sin resultados</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
          {list.map(u => (
            <ClientCard key={u.id} u={u} onRole={onRole} onBaja={onBaja} onReactivar={onReactivar} onDelete={onDelete} onManage={setManaging} busy={busy} currentUserId={user?.id} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {managing && (
          <ManageClassesModal
            key={managing.id}
            client={(users || []).find(u => u.id === managing.id) || managing}
            onClose={() => setManaging(null)}
            patch={patch}
            applyLocal={applyLocal}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
