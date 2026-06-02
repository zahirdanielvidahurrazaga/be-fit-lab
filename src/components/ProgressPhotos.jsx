import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Plus, Sparkles, Lock, Trash2, X, Check, CalendarClock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { compressCafeImage } from '../lib/cafeImage';

const PRIMARY = '#FF914D';
const SIX_WEEKS = 42 * 24 * 60 * 60 * 1000;
const ANGLES = [
  { key: 'front', label: 'Frente', phrase: 'Tu mejor versión te espera' },
  { key: 'side', label: 'Perfil', phrase: 'Constancia, no perfección' },
  { key: 'back', label: 'Espalda', phrase: 'Hoy más fuerte que ayer' },
];

// Tarjeta con flip: portada (frase aesthetic) → al tocar revela la foto.
function FlipCard({ label, phrase, url }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div onClick={() => setFlipped(f => !f)} style={{ perspective: '1100px', cursor: 'pointer', aspectRatio: '3 / 4' }}>
      <motion.div animate={{ rotateY: flipped ? 180 : 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d' }}>
        {/* Portada (frase) */}
        <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', borderRadius: '18px', overflow: 'hidden', background: 'linear-gradient(155deg, #2D2928 0%, #4A4544 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '14px' }}>
          <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '90px', height: '90px', background: 'rgba(255,145,77,0.18)', borderRadius: '50%', filter: 'blur(26px)' }} />
          <span style={{ position: 'relative', fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{label}</span>
          <p style={{ position: 'relative', fontFamily: "'Caveat', cursive", fontSize: '1.4rem', lineHeight: 1.2, color: '#fff', margin: 0, fontWeight: 600 }}>"{phrase}"</p>
          <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.64rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}><Lock size={11} /> Toca para ver</span>
        </div>
        {/* Foto (reverso) */}
        <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)', borderRadius: '18px', overflow: 'hidden', background: '#1A1C1E' }}>
          {url ? <img src={url} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)' }}><Camera size={28} /></div>}
          <span style={{ position: 'absolute', bottom: '10px', left: '10px', fontSize: '0.66rem', fontWeight: 800, color: '#fff', background: 'rgba(0,0,0,0.5)', padding: '3px 9px', borderRadius: '8px', backdropFilter: 'blur(6px)' }}>{label}</span>
        </div>
      </motion.div>
    </div>
  );
}

// Hoja para subir las 3 fotos
function UploadSheet({ userId, onClose, onSaved }) {
  const [files, setFiles] = useState({});      // {front, side, back} → File
  const [previews, setPreviews] = useState({}); // → objectURL
  const [saving, setSaving] = useState(false);
  const refs = { front: useRef(), side: useRef(), back: useRef() };

  const pick = (key, e) => {
    const f = e.target.files?.[0]; e.target.value = ''; if (!f) return;
    setFiles(p => ({ ...p, [key]: f }));
    setPreviews(p => ({ ...p, [key]: URL.createObjectURL(f) }));
  };
  const ready = ANGLES.every(a => files[a.key]);

  const save = async () => {
    if (!ready || saving) return;
    setSaving(true);
    try {
      const ts = Date.now();
      const paths = {};
      for (const a of ANGLES) {
        const blob = await compressCafeImage(files[a.key], 1280, 0.82);
        const path = `${userId}/${ts}/${a.key}.jpg`;
        const { error } = await supabase.storage.from('progress-photos').upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
        if (error) throw error;
        paths[a.key] = path;
      }
      const { error } = await supabase.from('progress_photos').insert({ user_id: userId, front_path: paths.front, side_path: paths.side, back_path: paths.back });
      if (error) throw error;
      onSaved();
    } catch (err) {
      alert('No se pudieron subir las fotos: ' + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 5200 }} />
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 32, stiffness: 320 }}
        style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 5201, maxHeight: '92vh', background: 'var(--app-surface-solid, #fff)', borderTopLeftRadius: '28px', borderTopRightRadius: '28px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 10px' }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--on-surface)' }}>Fotos de progreso</h2>
          <button onClick={onClose} style={{ width: '34px', height: '34px', borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={18} color="var(--on-surface)" /></button>
        </div>
        <p style={{ margin: '0 20px 14px', fontSize: '0.85rem', color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>Sube tus 3 fotos: de frente, de perfil y de espalda. Quedan privadas (ocultas detrás de cada tarjeta).</p>
        <div style={{ overflowY: 'auto', padding: '0 20px calc(env(safe-area-inset-bottom,0px) + 16px)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '18px' }}>
            {ANGLES.map(a => (
              <label key={a.key} style={{ aspectRatio: '3 / 4', borderRadius: '14px', overflow: 'hidden', cursor: 'pointer', position: 'relative', background: previews[a.key] ? '#000' : 'rgba(255,145,77,0.08)', border: previews[a.key] ? 'none' : '1.5px dashed rgba(255,145,77,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                {previews[a.key]
                  ? <><img src={previews[a.key]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /><span style={{ position: 'absolute', top: '6px', right: '6px', width: '22px', height: '22px', borderRadius: '50%', background: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={13} color="#fff" /></span></>
                  : <><Camera size={22} color={PRIMARY} /><span style={{ fontSize: '0.72rem', fontWeight: 700, color: PRIMARY }}>{a.label}</span></>}
                <span style={{ position: 'absolute', bottom: '6px', left: '6px', fontSize: '0.64rem', fontWeight: 800, color: '#fff', background: 'rgba(0,0,0,0.45)', padding: '2px 7px', borderRadius: '6px' }}>{previews[a.key] ? a.label : ''}</span>
                <input ref={refs[a.key]} type="file" accept="image/*" onChange={e => pick(a.key, e)} style={{ display: 'none' }} />
              </label>
            ))}
          </div>
          <button onClick={save} disabled={!ready || saving} style={{ width: '100%', padding: '14px', borderRadius: '16px', border: 'none', background: ready ? PRIMARY : 'rgba(0,0,0,0.1)', color: '#fff', fontWeight: 800, fontSize: '1rem', cursor: ready ? 'pointer' : 'default', boxShadow: ready ? '0 10px 24px rgba(255,145,77,0.35)' : 'none' }}>
            {saving ? 'Subiendo…' : ready ? 'Guardar mis fotos' : 'Selecciona las 3 fotos'}
          </button>
        </div>
      </motion.div>
    </>
  );
}

export default function ProgressPhotos({ userId }) {
  const [sessions, setSessions] = useState(null);
  const [showUpload, setShowUpload] = useState(false);

  const load = async () => {
    if (!userId) return;
    const { data } = await supabase.from('progress_photos').select('*').eq('user_id', userId).order('taken_at', { ascending: false });
    const withUrls = await Promise.all((data || []).map(async (s) => {
      const sign = async (p) => p ? (await supabase.storage.from('progress-photos').createSignedUrl(p, 3600)).data?.signedUrl : null;
      const [front, side, back] = await Promise.all([sign(s.front_path), sign(s.side_path), sign(s.back_path)]);
      return { ...s, urls: { front, side, back } };
    }));
    setSessions(withUrls);
  };
  useEffect(() => { load(); }, [userId]);

  const nextDue = useMemo(() => {
    if (!sessions?.length) return { due: true, days: 0 };
    const last = new Date(sessions[0].taken_at).getTime();
    const diff = last + SIX_WEEKS - Date.now();
    return { due: diff <= 0, days: Math.ceil(diff / 86400000) };
  }, [sessions]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Cadencia 6 semanas */}
      <div style={{ background: nextDue.due ? 'linear-gradient(135deg, #FF914D, #E07A9C)' : 'var(--app-surface-solid, #fff)', borderRadius: '22px', padding: '18px', border: nextDue.due ? 'none' : '1px solid var(--border-subtle, rgba(0,0,0,0.05))', display: 'flex', alignItems: 'center', gap: '14px', color: nextDue.due ? '#fff' : 'var(--on-surface)' }}>
        <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: nextDue.due ? 'rgba(255,255,255,0.22)' : 'rgba(255,145,77,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {nextDue.due ? <Sparkles size={22} color="#fff" /> : <CalendarClock size={22} color={PRIMARY} />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>{nextDue.due ? '¡Es momento de tus fotos!' : 'Tu progreso visual'}</div>
          <div style={{ fontSize: '0.82rem', opacity: nextDue.due ? 0.9 : 0.7 }}>{!sessions?.length ? 'Sube tus primeras 3 fotos para empezar' : nextDue.due ? 'Han pasado 6 semanas — toca una nueva sesión' : `Próxima sesión en ${nextDue.days} ${nextDue.days === 1 ? 'día' : 'días'}`}</div>
        </div>
      </div>

      <button onClick={() => setShowUpload(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '14px', borderRadius: '16px', border: 'none', background: PRIMARY, color: '#fff', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 10px 24px rgba(255,145,77,0.35)' }}>
        <Plus size={18} /> Subir fotos de progreso
      </button>

      {sessions === null ? (
        <p style={{ textAlign: 'center', color: 'var(--on-surface-variant)', padding: '30px 0' }}>Cargando…</p>
      ) : sessions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--on-surface-variant)' }}>
          <Camera size={32} style={{ opacity: 0.3, marginBottom: '10px' }} />
          <p style={{ margin: 0, fontSize: '0.9rem' }}>Aún no tienes fotos. Cada 6 semanas sube 3 para ver tu evolución 💪</p>
        </div>
      ) : (
        sessions.map((s, i) => (
          <div key={s.id}>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--on-surface-variant)', marginBottom: '10px' }}>
              {i === 0 ? 'Más reciente · ' : ''}{new Date(s.taken_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {ANGLES.map(a => <FlipCard key={a.key} label={a.label} phrase={a.phrase} url={s.urls[a.key]} />)}
            </div>
          </div>
        ))
      )}

      <AnimatePresence>
        {showUpload && <UploadSheet userId={userId} onClose={() => setShowUpload(false)} onSaved={() => { setShowUpload(false); load(); }} />}
      </AnimatePresence>
    </div>
  );
}
