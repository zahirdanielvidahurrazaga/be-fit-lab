import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, CalendarDays, MapPin, Sparkles, Share2, Check, Ticket, ImagePlus, Loader2, X, Tag, Users, QrCode, Lock, CheckCircle2 } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { Capacitor } from '@capacitor/core';
import { Stripe } from '@capacitor-community/stripe';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { uploadImage } from '../lib/cafeImage';

const PRIMARY = '#FF914D';
// Liquid glass (theme-aware vía --glass-bg/--glass-border de index.css)
const glass = {
  background: 'var(--glass-bg)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid var(--glass-border)',
  boxShadow: '0 8px 28px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.4)',
};
const fmtFull = (iso) => new Date(iso).toLocaleString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
const isPast = (iso) => iso && new Date(iso).getTime() < Date.now() - 3 * 3600000;

// Unidad con número que "rueda" al cambiar (igual que el de Cumpleaños)
function CdUnit({ value, label }) {
  return (
    <div style={{ textAlign: 'center', flex: 1, minWidth: 0 }}>
      <div style={{ position: 'relative', height: '2.5rem', overflow: 'hidden' }}>
        <AnimatePresence initial={false}>
          <motion.div key={value}
            initial={{ y: '100%', opacity: 0 }} animate={{ y: '0%', opacity: 1 }} exit={{ y: '-100%', opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.9rem', fontWeight: 800, color: '#fff', lineHeight: 1, fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums' }}>
            {String(value).padStart(2, '0')}
          </motion.div>
        </AnimatePresence>
      </div>
      <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '6px' }}>{label}</div>
    </div>
  );
}
function Countdown({ date }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const diff = Math.max(0, new Date(date).getTime() - now);
  const d = Math.floor(diff / 86400000), h = Math.floor(diff / 3600000) % 24, m = Math.floor(diff / 60000) % 60, s = Math.floor(diff / 1000) % 60;
  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
      <CdUnit value={d} label="días" /><CdUnit value={h} label="hrs" /><CdUnit value={m} label="min" /><CdUnit value={s} label="seg" />
    </div>
  );
}

function Lightbox({ src, onClose }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 6000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <img src={src} alt="" style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '12px' }} />
      <button onClick={onClose} style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top,0px) + 14px)', right: '16px', width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.15)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={20} /></button>
    </motion.div>
  );
}

function EventDetail({ ev, user, registered, onReg, processing, onBack }) {
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [attended, setAttended] = useState(false); // hizo check-in en este evento
  const [showQR, setShowQR] = useState(false);
  const fileRef = useRef(null);
  const past = isPast(ev.event_date);

  // Estado de asistencia propia (para el QR y para habilitar subir fotos), en vivo
  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    (async () => {
      const { data } = await supabase.from('event_registrations').select('checked_in').eq('event_id', ev.id).eq('user_id', user.id).maybeSingle();
      if (active) setAttended(!!data?.checked_in);
    })();
    const ch = supabase.channel(`evreg-${ev.id}-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_registrations', filter: `user_id=eq.${user.id}` },
        (payload) => { if (payload.new?.event_id === ev.id) setAttended(!!payload.new.checked_in); })
      .subscribe();
    return () => { active = false; supabase.removeChannel(ch); };
  }, [ev.id, user?.id]);

  const loadPhotos = async () => {
    const { data } = await supabase.from('event_photos').select('*').eq('event_id', ev.id).order('created_at', { ascending: false });
    setPhotos(data || []);
  };
  useEffect(() => { loadPhotos(); }, [ev.id]);

  const pickPhotos = async (e) => {
    const files = Array.from(e.target.files || []); e.target.value = '';
    if (!files.length || !user?.id) return;
    setUploading(true);
    for (const f of files) {
      const { url, error } = await uploadImage(f, { bucket: 'event-gallery', folder: ev.id });
      if (!error && url) await supabase.from('event_photos').insert({ event_id: ev.id, user_id: user.id, image_url: url });
    }
    setUploading(false); loadPhotos();
  };
  const delPhoto = async (p) => { if (confirm('¿Eliminar esta foto?')) { await supabase.from('event_photos').delete().eq('id', p.id); loadPhotos(); } };

  const share = async () => {
    const text = `¡No te pierdas "${ev.title}" en Be Fit Lab!${ev.event_date ? ' ' + fmtFull(ev.event_date) : ''}`;
    if (navigator.share) { try { await navigator.share({ title: ev.title, text }); } catch (_) {} }
    else window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }}>
      {/* Flyer */}
      {ev.image_url
        ? <img src={ev.image_url} alt={ev.title} onClick={() => setLightbox(ev.image_url)} style={{ width: '100%', borderRadius: '22px', display: 'block', cursor: 'zoom-in', boxShadow: '0 16px 40px rgba(0,0,0,0.12)' }} />
        : <div style={{ height: '180px', borderRadius: '22px', background: 'linear-gradient(135deg, #FF914D, #E07A9C)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sparkles size={48} color="rgba(255,255,255,0.7)" /></div>}

      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', color: 'var(--on-surface)', margin: '18px 0 10px', lineHeight: 1.15 }}>{ev.title}</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
        {ev.event_date && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}><CalendarDays size={15} color={PRIMARY} /> {fmtFull(ev.event_date)}</span>}
        {ev.location && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}><MapPin size={15} color={PRIMARY} /> {ev.location}</span>}
        {ev.price != null && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: PRIMARY, fontWeight: 800 }}><Tag size={15} /> {ev.price === 0 ? 'Gratis' : `$${ev.price}`}</span>}
      </div>
      {ev.description && <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.95rem', lineHeight: 1.6, margin: '0 0 14px' }}>{ev.description}</p>}

      {/* Cupo */}
      {ev.registration_open && !past && ev.capacity != null && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: (ev.registered_count ?? 0) >= ev.capacity ? '#ba1a1a' : 'var(--on-surface-variant)', marginBottom: '14px' }}>
          <Users size={14} color={PRIMARY} /> {Math.max(0, ev.capacity - (ev.registered_count ?? 0))} de {ev.capacity} lugares disponibles
        </div>
      )}

      {/* Acciones */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '26px' }}>
        {ev.registration_open && !past && (() => {
          const isPaid = ev.price != null && ev.price > 0;
          const full = ev.capacity != null && (ev.registered_count ?? 0) >= ev.capacity && !registered;
          let content, bg = PRIMARY, color = '#fff', disabled = false;
          if (registered) { content = <><Check size={18} /> {isPaid ? 'Inscrita ✓' : 'Inscrita · Cancelar'}</>; bg = 'rgba(34,197,94,0.12)'; color = '#16A34A'; disabled = isPaid; }
          else if (processing) { content = <><Loader2 size={18} /> Procesando…</>; disabled = true; }
          else if (full) { content = 'Agotado'; bg = 'rgba(0,0,0,0.06)'; color = 'var(--on-surface-variant)'; disabled = true; }
          else if (isPaid) { content = <><Ticket size={18} /> Pagar ${ev.price} e inscribirme</>; }
          else { content = <><Ticket size={18} /> Inscribirme</>; }
          return (
            <button onClick={() => !disabled && onReg(ev)} disabled={disabled} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderRadius: '15px', border: 'none', cursor: disabled ? 'default' : 'pointer', fontWeight: 800, fontSize: '0.95rem', background: bg, color, boxShadow: bg === PRIMARY ? '0 10px 24px rgba(255,145,77,0.35)' : 'none' }}>
              {content}
            </button>
          );
        })()}
        <button onClick={share} style={{ flex: ev.registration_open && !past ? '0 0 auto' : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px 18px', borderRadius: '15px', ...glass, color: 'var(--on-surface)', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}>
          <Share2 size={18} /> {!(ev.registration_open && !past) && 'Compartir'}
        </button>
      </div>

      {/* Mi QR para check-in / estado de asistencia */}
      {registered && (
        <div style={{ marginBottom: '22px' }}>
          {attended ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px', borderRadius: '14px', background: 'rgba(34,197,94,0.1)', color: '#16A34A', fontWeight: 700, fontSize: '0.9rem' }}>
              <CheckCircle2 size={18} /> ¡Asististe a este evento!
            </div>
          ) : !past ? (
            <button onClick={() => setShowQR(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '13px', borderRadius: '14px', ...glass, color: 'var(--on-surface)', fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer' }}>
              <QrCode size={18} color={PRIMARY} /> Mostrar mi QR para check-in
            </button>
          ) : null}
        </div>
      )}

      {/* Galería compartida */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--on-surface)' }}>Galería {photos.length > 0 && <span style={{ color: 'var(--on-surface-variant)', fontWeight: 500, fontSize: '0.9rem' }}>· {photos.length}</span>}</h3>
        {attended && (
          <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,145,77,0.22)', backdropFilter: 'blur(14px) saturate(180%)', WebkitBackdropFilter: 'blur(14px) saturate(180%)', color: PRIMARY, border: '1px solid rgba(255,255,255,0.4)', borderRadius: '11px', padding: '8px 13px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)' }}>
            {uploading ? <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} style={{ display: 'flex' }}><Loader2 size={15} /></motion.span> : <ImagePlus size={15} />} Subir fotos
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={pickPhotos} style={{ display: 'none' }} />
      </div>
      {!attended && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 13px', borderRadius: '12px', background: 'rgba(0,0,0,0.04)', color: 'var(--on-surface-variant)', fontSize: '0.82rem', marginBottom: '12px' }}>
          <Lock size={14} /> {registered ? 'Podrás subir fotos después de tu check-in en el evento.' : 'Solo las asistentes al evento pueden subir fotos.'}
        </div>
      )}
      {photos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '34px 20px', color: 'var(--on-surface-variant)', ...glass, borderRadius: '18px' }}>
          <ImagePlus size={28} style={{ opacity: 0.3, marginBottom: '8px' }} />
          <p style={{ margin: 0, fontSize: '0.9rem' }}>Sé la primera en compartir fotos de este evento 📸</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
          {photos.map(p => (
            <div key={p.id} style={{ position: 'relative', paddingBottom: '100%', borderRadius: '12px', overflow: 'hidden', cursor: 'zoom-in' }}>
              <img src={p.image_url} alt="" loading="lazy" onClick={() => setLightbox(p.image_url)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              {(p.user_id === user?.id) && <button onClick={() => delPhoto(p)} style={{ position: 'absolute', top: '5px', right: '5px', width: '24px', height: '24px', borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.5)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={13} /></button>}
            </div>
          ))}
        </div>
      )}

      {/* Modal QR para check-in */}
      <AnimatePresence>
        {showQR && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowQR(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 6000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <motion.div onClick={e => e.stopPropagation()} initial={{ scale: 0.9, opacity: 0, y: 18 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0 }} transition={{ type: 'spring', damping: 22, stiffness: 240 }}
              style={{ width: 'min(340px, 100%)', background: '#fff', borderRadius: '26px', padding: '28px 24px', textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }}>
              <h2 style={{ margin: '0 0 6px', fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: '#1A1C1E' }}>Tu código de entrada</h2>
              <p style={{ margin: '0 0 18px', fontSize: '0.86rem', color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>Muéstralo en la entrada de <strong>{ev.title}</strong> para tu check-in.</p>
              <div style={{ background: '#fff', padding: '14px', borderRadius: '18px', display: 'inline-block', boxShadow: '0 6px 20px rgba(0,0,0,0.1)', border: '1px solid rgba(0,0,0,0.06)' }}>
                <QRCodeCanvas value={user?.id || 'befit'} size={200} level="M" />
              </div>
              <button onClick={() => setShowQR(false)} style={{ width: '100%', marginTop: '20px', padding: '13px', borderRadius: '14px', border: 'none', background: 'rgba(0,0,0,0.06)', color: '#1A1C1E', fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer' }}>Cerrar</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}</AnimatePresence>
    </motion.div>
  );
}

function EventCard({ ev, registered, onOpen }) {
  const d = ev.event_date ? new Date(ev.event_date) : null;
  const past = isPast(ev.event_date);
  return (
    <motion.div onClick={() => onOpen(ev)} whileTap={{ scale: 0.98 }} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      style={{ ...glass, borderRadius: '22px', overflow: 'hidden', cursor: 'pointer', opacity: past ? 0.7 : 1 }}>
      <div style={{ position: 'relative', height: '150px', background: ev.image_url ? `#eee url('${ev.image_url}') center/cover` : 'linear-gradient(135deg, #FF914D, #E07A9C)' }}>
        {!ev.image_url && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sparkles size={36} color="rgba(255,255,255,0.6)" /></div>}
        {d && <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', borderRadius: '12px', padding: '5px 11px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 800, color: PRIMARY, textTransform: 'uppercase' }}>{d.toLocaleDateString('es-MX', { month: 'short' })}</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1A1C1E', lineHeight: 1, fontFamily: 'var(--font-display)' }}>{d.getDate()}</div>
        </div>}
        {registered && <span style={{ position: 'absolute', top: '12px', right: '12px', background: '#16A34A', color: '#fff', fontSize: '0.64rem', fontWeight: 800, padding: '4px 9px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}><Check size={11} /> Inscrita</span>}
        {past && !registered && <span style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '0.64rem', fontWeight: 700, padding: '4px 9px', borderRadius: '8px' }}>Finalizado</span>}
      </div>
      <div style={{ padding: '14px 16px' }}>
        <h3 style={{ margin: '0 0 5px', fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--on-surface)', lineHeight: 1.2 }}>{ev.title}</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {d && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}><CalendarDays size={13} color={PRIMARY} /> {d.toLocaleString('es-MX', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
          {ev.location && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}><MapPin size={13} color={PRIMARY} /> {ev.location}</span>}
          {ev.price != null && <span style={{ fontSize: '0.72rem', fontWeight: 800, color: PRIMARY, background: 'rgba(255,145,77,0.12)', padding: '3px 9px', borderRadius: '8px' }}>{ev.price === 0 ? 'Gratis' : `$${ev.price}`}</span>}
          {ev.registration_open && !past && (
            ev.capacity != null && (ev.registered_count ?? 0) >= ev.capacity
              ? <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ba1a1a', background: 'rgba(186,26,26,0.1)', padding: '3px 9px', borderRadius: '8px' }}>Agotado</span>
              : <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#16A34A', background: 'rgba(34,197,94,0.1)', padding: '3px 9px', borderRadius: '8px' }}>Inscripción abierta</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function Eventos() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState(null);
  const [regs, setRegs] = useState(new Set());
  const [selected, setSelected] = useState(null);
  const [processing, setProcessing] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  const load = async () => {
    const { data } = await supabase.from('events').select('*').order('event_date', { ascending: true, nullsFirst: false });
    setEvents(data || []);
  };
  const loadRegs = async () => {
    if (!user?.id) return;
    const { data } = await supabase.from('event_registrations').select('event_id').eq('user_id', user.id);
    setRegs(new Set((data || []).map(r => r.event_id)));
  };
  useEffect(() => { window.scrollTo(0, 0); load(); }, []);
  useEffect(() => { loadRegs(); }, [user?.id]);

  // Regreso de pago web (Stripe) → recargar inscripciones (el webhook ya inscribió)
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('payment') === 'success') {
      window.history.replaceState?.({}, '', '/eventos');
      setTimeout(() => { loadRegs(); load(); }, 1600);
      setTimeout(() => alert('¡Pago recibido! Ya estás inscrita 🎉'), 400);
    }
  }, []); // eslint-disable-line

  const payError = (msg) => {
    if (String(msg).includes('EVENT_FULL')) alert('¡Cupo lleno! Ya no hay lugares.');
    else if (String(msg).includes('YA_INSCRITA')) { loadRegs(); }
    else alert('No se pudo procesar: ' + msg);
  };

  const payForEvent = async (ev) => {
    if (processing || !user?.id) return;
    setProcessing(true);
    try {
      if (isNative) {
        const { data, error } = await supabase.functions.invoke('stripe-event-intent', { body: { eventId: ev.id, userId: user.id, userEmail: user.email } });
        if (error || data?.error) { payError(data?.error || error.message); return; }
        try { await Stripe.createPaymentSheet({ paymentIntentClientSecret: data.clientSecret, merchantDisplayName: 'Be Fit Lab', enableApplePay: true, applePayMerchantId: 'merchant.com.befitlab.app', countryCode: 'MX' }); }
        catch (e) { await Stripe.createPaymentSheet({ paymentIntentClientSecret: data.clientSecret, merchantDisplayName: 'Be Fit Lab' }); }
        const res = await Stripe.presentPaymentSheet();
        if (res?.paymentResult === 'paymentSheetCompleted') {
          await supabase.functions.invoke('stripe-event-notify', { body: { paymentIntentId: data.paymentIntentId } });
          setRegs(s => new Set(s).add(ev.id));
          setTimeout(load, 900);
        }
      } else {
        localStorage.setItem('befit_payment_return', String(Date.now()));
        const { data, error } = await supabase.functions.invoke('stripe-event-checkout', { body: { eventId: ev.id, userId: user.id, userEmail: user.email, returnUrl: window.location.origin } });
        if (error || data?.error) { payError(data?.error || error.message); return; }
        if (data?.url) { window.location.href = data.url; return; }
      }
    } catch (err) { console.error(err); alert('No se pudo procesar el pago.'); }
    finally { setProcessing(false); }
  };

  // gratis → insert directo (trigger valida cupo) · pago → PaymentSheet/checkout · ya inscrita gratis → cancelar
  const handleReg = (ev) => {
    if (!user?.id) return;
    const isPaid = ev.price != null && ev.price > 0;
    if (regs.has(ev.id)) {
      if (isPaid) return; // pago: no se cancela (sin reembolso automático)
      (async () => {
        await supabase.from('event_registrations').delete().eq('event_id', ev.id).eq('user_id', user.id);
        setRegs(s => { const n = new Set(s); n.delete(ev.id); return n; }); load();
      })();
      return;
    }
    if (isPaid) { payForEvent(ev); return; }
    (async () => {
      const { error } = await supabase.from('event_registrations').insert({ event_id: ev.id, user_id: user.id });
      if (error) { payError(error.message); return; }
      setRegs(s => new Set(s).add(ev.id)); load();
    })();
  };

  const { upcoming, past, next } = useMemo(() => {
    const up = [], pa = [];
    (events || []).forEach(e => (isPast(e.event_date) ? pa : up).push(e));
    pa.reverse();
    const next = up.find(e => e.event_date);
    return { upcoming: up, past: pa, next };
  }, [events]);

  const selectedLive = selected ? (events || []).find(e => e.id === selected.id) || selected : null;

  return (
    <div className="mobile-app-container" style={{ background: 'var(--app-bg)', minHeight: '100vh' }}>
      <header className="ios-header" style={{ background: 'transparent', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => { if (selected) setSelected(null); else if (window.history.length > 1) navigate(-1); else navigate('/portal'); }} aria-label="Volver"
          style={{ width: '40px', height: '40px', borderRadius: '50%', ...glass, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, color: 'var(--on-surface)' }}>
          <ChevronLeft size={20} />
        </button>
        <div>
          <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: '0 0 2px', fontWeight: 600 }}>Comunidad</p>
          <h1 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', margin: 0, lineHeight: 1.1, color: 'var(--on-surface)' }}>Eventos</h1>
        </div>
      </header>

      <main style={{ padding: '10px 18px calc(env(safe-area-inset-bottom,0px) + 120px)', maxWidth: '640px', margin: '0 auto' }}>
        <AnimatePresence mode="wait">
          {selectedLive ? (
            <EventDetail key="detail" ev={selectedLive} user={user} registered={regs.has(selectedLive.id)} onReg={handleReg} processing={processing} onBack={() => setSelected(null)} />
          ) : events === null ? (
            <p key="load" style={{ textAlign: 'center', color: 'var(--on-surface-variant)', padding: '50px 0' }}>Cargando…</p>
          ) : upcoming.length === 0 && past.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--on-surface-variant)' }}>
              <div style={{ width: '76px', height: '76px', borderRadius: '24px', background: 'linear-gradient(135deg, rgba(255,145,77,0.15), rgba(224,122,156,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}><Sparkles size={36} color={PRIMARY} /></div>
              <h3 style={{ margin: '0 0 6px', fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--on-surface)' }}>Pronto, algo especial</h3>
              <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>Aquí anunciaremos nuestros próximos eventos<br />y experiencias de la tribu. 💛</p>
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {next && (
                <div style={{ background: 'linear-gradient(135deg, #2D2928 0%, #4A4544 100%)', borderRadius: '24px', padding: '22px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', background: 'rgba(255,145,77,0.2)', borderRadius: '50%', filter: 'blur(34px)' }} />
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '6px' }}><Sparkles size={14} color={PRIMARY} /><span style={{ fontSize: '0.64rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Próximo evento</span></div>
                    <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', margin: '0 0 16px', lineHeight: 1.1, color: '#fff' }}>{next.title}</h2>
                    <Countdown date={next.event_date} />
                  </div>
                </div>
              )}
              {upcoming.length > 0 && <div style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--on-surface-variant)', marginTop: '4px' }}>Próximos</div>}
              {upcoming.map(ev => <EventCard key={ev.id} ev={ev} registered={regs.has(ev.id)} onOpen={setSelected} />)}
              {past.length > 0 && <div style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--on-surface-variant)', marginTop: '12px' }}>Anteriores</div>}
              {past.map(ev => <EventCard key={ev.id} ev={ev} registered={regs.has(ev.id)} onOpen={setSelected} />)}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
