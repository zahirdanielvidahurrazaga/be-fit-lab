import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Plus, Sparkles, Lock, X, Check, CalendarClock, Info, Image as ImageIcon, RotateCcw, ChevronLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { compressCafeImage } from '../lib/cafeImage';

const PRIMARY = '#FF914D';
const SIX_WEEKS = 42 * 24 * 60 * 60 * 1000;

// ───────────────────── Siluetas guía (avatar) por ángulo ─────────────────────
// Figura humana semitransparente que orienta a la clienta sobre cómo pararse.
// Respira sutilmente (motion) para que se note que es una guía.
function PoseGuide({ angle }) {
  const stroke = 'rgba(255,255,255,0.9)';
  const sw = 12;
  const line = { fill: 'none', stroke, strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round' };

  // Vista frontal: brazos ligeramente separados, piernas a la anchura de cadera
  const Front = (
    <g {...line}>
      <circle cx="60" cy="34" r="18" fill={stroke} stroke="none" />
      <line x1="60" y1="54" x2="60" y2="152" />
      <line x1="36" y1="68" x2="84" y2="68" />
      <line x1="36" y1="68" x2="24" y2="148" />
      <line x1="84" y1="68" x2="96" y2="148" />
      <line x1="60" y1="152" x2="44" y2="256" />
      <line x1="60" y1="152" x2="76" y2="256" />
    </g>
  );

  // Perfil (de lado): un solo brazo visible, "nariz" apuntando hacia el lado
  const Side = (
    <g {...line}>
      <circle cx="62" cy="34" r="17" fill={stroke} stroke="none" />
      <path d="M47 28 L33 34 L47 40 Z" fill={stroke} stroke="none" />
      <line x1="62" y1="52" x2="59" y2="152" />
      <line x1="61" y1="70" x2="57" y2="138" />
      <line x1="59" y1="152" x2="52" y2="256" />
      <line x1="59" y1="152" x2="66" y2="254" />
    </g>
  );

  const content = angle === 'front' ? Front
    : angle === 'left' ? Side
    : <g transform="translate(120,0) scale(-1,1)">{Side}</g>; // derecho = espejo

  return (
    <motion.svg viewBox="0 0 120 280" preserveAspectRatio="xMidYMid meet"
      animate={{ opacity: [0.45, 0.8, 0.45], scale: [1, 1.015, 1] }}
      transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
      style={{ width: '60%', height: '90%', filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.5))' }}>
      {content}
    </motion.svg>
  );
}

// Los 3 ángulos. `col` mapea a la columna existente de la tabla.
const ANGLES = [
  { key: 'front', col: 'front_path', label: 'Frente', title: 'Vista Frontal', phrase: 'Tu mejor versión te espera', hint: 'Brazos relajados a los costados, mirando al frente.' },
  { key: 'left', col: 'side_path', label: 'Perfil izq.', title: 'Perfil Izquierdo', phrase: 'Constancia, no perfección', hint: 'Gira 90° a tu izquierda, brazos relajados.' },
  { key: 'right', col: 'back_path', label: 'Perfil der.', title: 'Perfil Derecho', phrase: 'Hoy más fuerte que ayer', hint: 'Gira 90° a tu derecha, brazos relajados.' },
];

const glass = {
  background: 'var(--glass-bg, rgba(255,255,255,0.55))',
  backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid var(--glass-border, rgba(255,255,255,0.65))',
  boxShadow: '0 8px 28px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.4)',
};

// ───────────────────────── Tarjeta con flip ─────────────────────────
function FlipCard({ label, phrase, url }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div onClick={() => setFlipped(f => !f)} style={{ perspective: '1100px', cursor: 'pointer', aspectRatio: '3 / 4' }}>
      <motion.div animate={{ rotateY: flipped ? 180 : 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d' }}>
        {/* Portada (frase aesthetic) */}
        <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', borderRadius: '18px', overflow: 'hidden', background: 'linear-gradient(155deg, #2D2928 0%, #4A4544 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '14px' }}>
          <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '90px', height: '90px', background: 'rgba(255,145,77,0.18)', borderRadius: '50%', filter: 'blur(26px)' }} />
          <span style={{ position: 'relative', fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{label}</span>
          <p style={{ position: 'relative', fontFamily: "'Caveat', cursive", fontSize: '1.4rem', lineHeight: 1.2, color: '#fff', margin: 0, fontWeight: 600 }}>"{phrase}"</p>
          <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.64rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}><Lock size={11} /> Toca para ver</span>
        </div>
        {/* Reverso (foto) */}
        <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)', borderRadius: '18px', overflow: 'hidden', background: '#1A1C1E' }}>
          {url ? <img src={url} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)' }}><Camera size={28} /></div>}
          <span style={{ position: 'absolute', bottom: '10px', left: '10px', fontSize: '0.66rem', fontWeight: 800, color: '#fff', background: 'rgba(0,0,0,0.5)', padding: '3px 9px', borderRadius: '8px', backdropFilter: 'blur(6px)' }}>{label}</span>
        </div>
      </motion.div>
    </div>
  );
}

// ───────────────────── Wizard de captura paso a paso ─────────────────────
function CaptureWizard({ userId, onClose, onSaved }) {
  const [step, setStep] = useState(0);              // 0,1,2 = captura · 3 = review
  const [shots, setShots] = useState({});           // key -> { blob, url }
  const [camActive, setCamActive] = useState(false);
  const [camError, setCamError] = useState(false);
  const [saving, setSaving] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileRef = useRef(null);

  const isReview = step >= ANGLES.length;
  const cur = ANGLES[step] || ANGLES[0];

  const stopCam = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setCamActive(false);
  };
  const startCam = async () => {
    setCamError(false);
    stopCam();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1080 }, height: { ideal: 1440 } }, audio: false });
      streamRef.current = stream;
      setCamActive(true);
      // esperar a que el <video> exista
      setTimeout(() => { if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => {}); } }, 50);
    } catch (e) { setCamError(true); setCamActive(false); }
  };

  // Al entrar a un paso de captura sin foto, abrir la cámara
  useEffect(() => {
    if (!isReview && !shots[cur.key]) startCam(); else stopCam();
    return () => { stopCam(); };
    // eslint-disable-next-line
  }, [step]);

  const capture = () => {
    const v = videoRef.current; if (!v || !v.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth; canvas.height = v.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.translate(canvas.width, 0); ctx.scale(-1, 1); // des-espejar el selfie
    ctx.drawImage(v, 0, 0);
    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      setShots(s => ({ ...s, [cur.key]: { blob, url } }));
      stopCam();
    }, 'image/jpeg', 0.9);
  };
  const pickGallery = (e) => {
    const f = e.target.files?.[0]; e.target.value = ''; if (!f) return;
    setShots(s => ({ ...s, [cur.key]: { blob: f, url: URL.createObjectURL(f) } }));
    stopCam();
  };
  const retake = () => { setShots(s => { const n = { ...s }; delete n[cur.key]; return n; }); startCam(); };

  const save = async () => {
    setSaving(true);
    try {
      const ts = Date.now();
      const cols = {};
      for (const a of ANGLES) {
        const blob = await compressCafeImage(shots[a.key].blob, 1280, 0.82);
        const path = `${userId}/${ts}/${a.key}.jpg`;
        const { error } = await supabase.storage.from('progress-photos').upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
        if (error) throw error;
        cols[a.col] = path;
      }
      const { error } = await supabase.from('progress_photos').insert({ user_id: userId, ...cols });
      if (error) throw error;
      onSaved();
    } catch (e) { alert('No se pudieron subir las fotos: ' + (e.message || e)); }
    finally { setSaving(false); }
  };

  const shot = shots[cur.key];
  const progressPct = (isReview ? ANGLES.length : step) / ANGLES.length * 100;

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 5200 }} />
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 32, stiffness: 320 }}
        style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 5201, height: '94vh', background: 'var(--app-surface-solid, #fff)', borderTopLeftRadius: '28px', borderTopRightRadius: '28px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Cabecera + progreso */}
        <div style={{ padding: '16px 20px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <button onClick={onClose} style={{ width: '34px', height: '34px', borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={18} color="var(--on-surface)" /></button>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--on-surface)' }}>{isReview ? 'Revisa tus fotos' : `Paso ${step + 1} de ${ANGLES.length}: ${cur.title}`}</span>
            <div style={{ width: '34px' }} />
          </div>
          <div style={{ height: '6px', background: 'rgba(0,0,0,0.07)', borderRadius: '4px', overflow: 'hidden' }}>
            <motion.div animate={{ width: `${progressPct}%` }} transition={{ type: 'spring', stiffness: 120, damping: 18 }} style={{ height: '100%', background: 'linear-gradient(90deg, #FF914D, #FFB37A)', borderRadius: '4px' }} />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px calc(env(safe-area-inset-bottom,0px) + 16px)', display: 'flex', flexDirection: 'column' }}>

          {!isReview ? (
            <>
              {/* Área de cámara / foto */}
              <div style={{ position: 'relative', width: '100%', aspectRatio: '3 / 4', borderRadius: '22px', overflow: 'hidden', background: '#101010', marginBottom: '12px' }}>
                {shot ? (
                  <img src={shot.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : camActive ? (
                  <>
                    <video ref={videoRef} playsInline muted autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                    {/* Silueta guía (avatar) que orienta la pose del ángulo actual.
                        👉 Si más adelante quieres usar tus propias siluetas/Lottie,
                        reemplaza <PoseGuide/> por tu animación para `cur.key`. */}
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                      <PoseGuide angle={cur.key} />
                    </div>
                    <span style={{ position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.74rem', fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.45)', padding: '5px 12px', borderRadius: '999px', backdropFilter: 'blur(6px)', whiteSpace: 'nowrap' }}>
                      Acomódate dentro de la silueta · {cur.label}
                    </span>
                  </>
                ) : (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'rgba(255,255,255,0.7)', padding: '20px', textAlign: 'center' }}>
                    <Camera size={34} />
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>{camError ? 'No pudimos abrir la cámara. Sube la foto desde tu galería.' : 'Preparando cámara…'}</p>
                  </div>
                )}
              </div>

              {/* Texto de ayuda */}
              {!shot && (
                <div style={{ ...glass, borderRadius: '14px', padding: '11px 14px', marginBottom: '14px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <Info size={16} color={PRIMARY} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--on-surface-variant)', lineHeight: 1.45 }}>
                    Como es de cuerpo completo, pídele a alguien que te tome la foto o <strong style={{ color: 'var(--on-surface)' }}>apoya el teléfono y acomódate dentro de la silueta.</strong> {cur.hint}
                  </p>
                </div>
              )}

              {/* Controles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
                {shot ? (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={retake} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', padding: '14px', borderRadius: '15px', ...glass, color: 'var(--on-surface)', fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer' }}><RotateCcw size={16} /> Repetir</button>
                    <button onClick={() => setStep(step + 1)} style={{ flex: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', padding: '14px', borderRadius: '15px', border: 'none', background: PRIMARY, color: '#fff', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 10px 24px rgba(255,145,77,0.35)' }}>{step < ANGLES.length - 1 ? 'Siguiente' : 'Revisar'} <Check size={17} /></button>
                  </div>
                ) : (
                  <>
                    <button onClick={capture} disabled={!camActive} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '15px', borderRadius: '16px', border: 'none', background: camActive ? PRIMARY : 'rgba(0,0,0,0.1)', color: '#fff', fontWeight: 800, fontSize: '1rem', cursor: camActive ? 'pointer' : 'default', boxShadow: camActive ? '0 10px 24px rgba(255,145,77,0.35)' : 'none' }}>
                      <Camera size={18} /> Capturar foto
                    </button>
                    <button onClick={() => fileRef.current?.click()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', padding: '13px', borderRadius: '15px', ...glass, color: 'var(--on-surface)', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' }}><ImageIcon size={16} /> Subir desde galería</button>
                    <input ref={fileRef} type="file" accept="image/*" onChange={pickGallery} style={{ display: 'none' }} />
                  </>
                )}
                {step > 0 && !shot && (
                  <button onClick={() => setStep(step - 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)', fontWeight: 700, fontSize: '0.84rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '4px' }}><ChevronLeft size={15} /> Paso anterior</button>
                )}
              </div>
            </>
          ) : (
            /* ─── Estado final: review de las 3 fotos ─── */
            <>
              <p style={{ margin: '6px 0 14px', fontSize: '0.86rem', color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>¡Listo! Revisa tus 3 fotos y guarda tu sesión. Quedarán privadas detrás de cada tarjeta.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '18px' }}>
                {ANGLES.map((a, i) => (
                  <div key={a.key} style={{ position: 'relative', aspectRatio: '3 / 4', borderRadius: '14px', overflow: 'hidden', background: '#000' }}>
                    {shots[a.key] ? <img src={shots[a.key].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                    <button onClick={() => setStep(i)} style={{ position: 'absolute', top: '6px', right: '6px', width: '24px', height: '24px', borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.55)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><RotateCcw size={13} /></button>
                    <span style={{ position: 'absolute', bottom: '6px', left: '6px', fontSize: '0.62rem', fontWeight: 800, color: '#fff', background: 'rgba(0,0,0,0.5)', padding: '2px 7px', borderRadius: '6px' }}>{a.label}</span>
                  </div>
                ))}
              </div>
              <button onClick={save} disabled={saving} style={{ marginTop: 'auto', width: '100%', padding: '15px', borderRadius: '16px', border: 'none', background: PRIMARY, color: '#fff', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 10px 24px rgba(255,145,77,0.35)' }}>
                {saving ? 'Guardando…' : 'Guardar mi sesión de fotos'}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </>
  );
}

// ───────────────────────── Componente principal ─────────────────────────
export default function ProgressPhotos({ userId }) {
  const [sessions, setSessions] = useState(null);
  const [showWizard, setShowWizard] = useState(false);

  const load = async () => {
    if (!userId) return;
    const { data } = await supabase.from('progress_photos').select('*').eq('user_id', userId).order('taken_at', { ascending: false });
    const withUrls = await Promise.all((data || []).map(async (s) => {
      const sign = async (p) => p ? (await supabase.storage.from('progress-photos').createSignedUrl(p, 3600)).data?.signedUrl : null;
      const [front, left, right] = await Promise.all([sign(s.front_path), sign(s.side_path), sign(s.back_path)]);
      return { ...s, urls: { front, left, right } };
    }));
    setSessions(withUrls);
  };
  useEffect(() => { load(); }, [userId]);

  const nextDue = useMemo(() => {
    if (!sessions?.length) return { due: true, days: 0 };
    const diff = new Date(sessions[0].taken_at).getTime() + SIX_WEEKS - Date.now();
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
          <div style={{ fontSize: '0.82rem', opacity: nextDue.due ? 0.9 : 0.7 }}>{!sessions?.length ? 'Toma tus primeras 3 fotos para empezar' : nextDue.due ? 'Han pasado 6 semanas — toca una nueva sesión' : `Próxima sesión en ${nextDue.days} ${nextDue.days === 1 ? 'día' : 'días'}`}</div>
        </div>
      </div>

      <button onClick={() => setShowWizard(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '14px', borderRadius: '16px', border: 'none', background: PRIMARY, color: '#fff', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 10px 24px rgba(255,145,77,0.35)' }}>
        <Plus size={18} /> Nueva sesión de fotos
      </button>

      {sessions === null ? (
        <p style={{ textAlign: 'center', color: 'var(--on-surface-variant)', padding: '30px 0' }}>Cargando…</p>
      ) : sessions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--on-surface-variant)' }}>
          <Camera size={32} style={{ opacity: 0.3, marginBottom: '10px' }} />
          <p style={{ margin: 0, fontSize: '0.9rem' }}>Aún no tienes fotos. Cada 6 semanas toma 3 (frente y perfiles) para ver tu evolución 💪</p>
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
        {showWizard && <CaptureWizard userId={userId} onClose={() => setShowWizard(false)} onSaved={() => { setShowWizard(false); load(); }} />}
      </AnimatePresence>
    </div>
  );
}
