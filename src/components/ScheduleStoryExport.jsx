import React, { useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Download, X, CalendarRange, CalendarDays } from 'lucide-react';
import { toPng } from 'html-to-image';
import { Capacitor } from '@capacitor/core';

// ─────────────────────────────────────────────────────────────────────────────
// Generador de "Horarios" para Instagram Stories (formato 1080×1920).
// Reutilizable en Coach y Admin. Comparte vía Web Share API (menú nativo en
// celular) con descarga de PNG como fallback en escritorio.
// ─────────────────────────────────────────────────────────────────────────────

const DOW_LABELS = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB']; // index = getDay()
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const parseTime = (t) => {
  const m = (t || '').match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!m) return 0;
  let h = +m[1]; const min = +m[2]; const ap = (m[3] || '').toUpperCase();
  if (ap === 'PM' && h !== 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return h * 60 + min;
};

function buildWeek(classes, refDateStr) {
  const ref = new Date(refDateStr + 'T12:00:00');
  const offset = ref.getDay() === 0 ? 6 : ref.getDay() - 1; // semana inicia lunes
  const monday = new Date(ref); monday.setDate(ref.getDate() - offset);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const jsDow = d.getDay();
    const dayClasses = (classes || [])
      .filter(c => c.date === dateStr || (c.date == null && c.day === jsDow))
      .sort((a, b) => parseTime(a.time) - parseTime(b.time));
    return { dateStr, jsDow, label: DOW_LABELS[jsDow], dayNum: d.getDate(), classes: dayClasses };
  });
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
  return { monday, sunday, days };
}

// Helpers de presentación de una clase dentro de una celda
const ClassCell = ({ c }) => {
  if (!c) return <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 30, fontWeight: 700 }}>–</span>;
  return (
    <div style={{ lineHeight: 1.1 }}>
      <div style={{ fontSize: 27, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)' }}>{c.instructor}</div>
      <div style={{ fontSize: 19, fontWeight: 800, color: '#FF914D', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 3 }}>{c.title}</div>
    </div>
  );
};

// ── La tarjeta (1080×1920) que se captura ──────────────────────────────────
const StoryCard = React.forwardRef(({ mode, week, dayData, rangeLabel }, ref) => {
  const weekdays = week.days.slice(0, 5);
  const weekend = week.days.slice(5, 7);
  const weekdayTimes = [...new Set(weekdays.flatMap(d => d.classes.map(c => c.time)))]
    .sort((a, b) => parseTime(a) - parseTime(b));
  const weekendTimes = [...new Set(weekend.flatMap(d => d.classes.map(c => c.time)))]
    .sort((a, b) => parseTime(a) - parseTime(b));

  return (
    <div ref={ref} style={{
      width: 1080, height: 1920, background: 'linear-gradient(165deg, #16181A 0%, #2D2928 100%)',
      padding: '90px 70px', boxSizing: 'border-box', position: 'relative', overflow: 'hidden',
      fontFamily: 'var(--font-body)', display: 'flex', flexDirection: 'column'
    }}>
      {/* Glow de marca */}
      <div style={{ position: 'absolute', top: -200, right: -150, width: 700, height: 700, background: 'radial-gradient(circle, rgba(255,145,77,0.22) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -250, left: -150, width: 650, height: 650, background: 'radial-gradient(circle, rgba(224,122,156,0.14) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ position: 'relative', textAlign: 'center', marginBottom: 50 }}>
        <img src="/logo2.png" alt="" crossOrigin="anonymous" style={{ height: 90, objectFit: 'contain', marginBottom: 24, filter: 'brightness(0) invert(1)' }} />
        <div style={{ fontSize: 120, fontWeight: 900, color: '#fff', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 0.9 }}>HORARIOS</div>
        <div style={{ fontSize: 36, fontWeight: 800, color: '#FF914D', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 18 }}>{rangeLabel}</div>
      </div>

      {/* Contenido */}
      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
        {mode === 'day' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22, marginTop: 20 }}>
            {dayData.classes.length > 0 ? dayData.classes.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 30, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 28, padding: '28px 34px' }}>
                <div style={{ minWidth: 200, fontSize: 46, fontWeight: 900, color: '#FF914D', fontFamily: 'var(--font-display)' }}>{c.time}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 40, fontWeight: 900, color: '#fff', fontFamily: 'var(--font-display)' }}>{c.title}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>{c.instructor}</div>
                </div>
              </div>
            )) : (
              <div style={{ textAlign: 'center', padding: 80, fontSize: 34, color: 'rgba(255,255,255,0.4)' }}>No hay clases programadas este día.</div>
            )}
          </div>
        ) : (
          <>
            {/* Grid entre semana */}
            <div style={{ display: 'grid', gridTemplateColumns: '150px repeat(5, 1fr)', gap: '0 14px' }}>
              {/* fila de encabezados */}
              <div />
              {weekdays.map(d => (
                <div key={d.dateStr} style={{ textAlign: 'center', paddingBottom: 18 }}>
                  <div style={{ fontSize: 32, fontWeight: 900, color: '#FF914D', letterSpacing: '0.06em' }}>{d.label}</div>
                  <div style={{ fontSize: 30, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>{d.dayNum}</div>
                </div>
              ))}
              {/* filas por horario */}
              {weekdayTimes.map((time, ri) => (
                <React.Fragment key={time}>
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: 30, fontWeight: 900, color: '#fff', fontFamily: 'var(--font-display)', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '20px 0' }}>{time}</div>
                  {weekdays.map(d => (
                    <div key={d.dateStr + time} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '20px 6px' }}>
                      <ClassCell c={d.classes.find(c => c.time === time)} />
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>

            {/* Fin de semana */}
            {weekendTimes.length > 0 && (
              <div style={{ marginTop: 50 }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 120, marginBottom: 20 }}>
                  {weekend.map(d => (
                    <div key={d.dateStr} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 32, fontWeight: 900, color: '#FF914D', letterSpacing: '0.06em' }}>{d.label}</div>
                      <div style={{ fontSize: 30, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>{d.dayNum}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr 1fr', gap: '0 14px' }}>
                  {weekendTimes.map(time => (
                    <React.Fragment key={'we' + time}>
                      <div style={{ display: 'flex', alignItems: 'center', fontSize: 30, fontWeight: 900, color: '#fff', fontFamily: 'var(--font-display)', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '18px 0' }}>{time}</div>
                      {weekend.map(d => (
                        <div key={d.dateStr + time} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '18px 6px' }}>
                          <ClassCell c={d.classes.find(c => c.time === time)} />
                        </div>
                      ))}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ position: 'relative', textAlign: 'center', marginTop: 40 }}>
        <div style={{ fontSize: 40, fontWeight: 900, color: '#fff', letterSpacing: '0.18em', fontFamily: 'var(--font-display)' }}>BE FIT LAB</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#FF914D', marginTop: 6 }}>@befit.lab</div>
      </div>
    </div>
  );
});

export default function ScheduleStoryExport({ classes, selectedDateStr, buttonStyle, buttonLabel = 'Compartir horarios' }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('week'); // 'week' | 'day'
  const [busy, setBusy] = useState(false);
  const cardRef = useRef(null);

  const refDate = selectedDateStr || new Date().toISOString().split('T')[0];
  const week = useMemo(() => buildWeek(classes, refDate), [classes, refDate]);
  const dayData = useMemo(() => week.days.find(d => d.dateStr === refDate) || week.days[0], [week, refDate]);

  const rangeLabel = useMemo(() => {
    if (mode === 'day') {
      const d = new Date(refDate + 'T12:00:00');
      return `${DOW_LABELS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`.toUpperCase();
    }
    const m = week.monday, s = week.sunday;
    return m.getMonth() === s.getMonth()
      ? `DEL ${m.getDate()} AL ${s.getDate()} DE ${MONTHS[m.getMonth()]}`.toUpperCase()
      : `DEL ${m.getDate()} ${MONTHS[m.getMonth()].slice(0, 3)} AL ${s.getDate()} ${MONTHS[s.getMonth()].slice(0, 3)}`.toUpperCase();
  }, [mode, refDate, week]);

  const handleShare = async () => {
    if (!cardRef.current) return;
    setBusy(true);
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 1, width: 1080, height: 1920 });
      const filename = `horarios-befitlab-${refDate}.png`;

      // ── App nativa (iOS/Android): escribir el PNG y abrir el share sheet del sistema ──
      if (Capacitor.isNativePlatform()) {
        try {
          const { Filesystem, Directory } = await import('@capacitor/filesystem');
          const { Share } = await import('@capacitor/share');
          const base64 = dataUrl.split(',')[1];
          await Filesystem.writeFile({ path: filename, data: base64, directory: Directory.Cache });
          const { uri } = await Filesystem.getUri({ path: filename, directory: Directory.Cache });
          await Share.share({ title: 'Horarios Be Fit Lab', text: 'Horarios de la semana', files: [uri] });
          setBusy(false);
          return;
        } catch (e) {
          if (e?.message?.toLowerCase?.().includes('cancel')) { setBusy(false); return; }
          // si algo falla en nativo, caemos al flujo web de abajo
        }
      }

      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], filename, { type: 'image/png' });

      // Menú nativo de compartir del navegador (celular/PWA) si lo soporta
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'Horarios Be Fit Lab' });
          setBusy(false);
          return;
        } catch (e) {
          if (e?.name === 'AbortError') { setBusy(false); return; }
        }
      }
      // Fallback: descarga
      const a = document.createElement('a');
      a.href = dataUrl; a.download = filename; a.click();
    } catch (e) {
      alert('No se pudo generar la imagen: ' + (e?.message || e));
    }
    setBusy(false);
  };

  return (
    <>
      <button onClick={() => setOpen(true)} style={buttonStyle || { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '14px', borderRadius: '16px', border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 10px 24px rgba(255,145,77,0.35)', fontFamily: 'var(--font-body)' }}>
        <Share2 size={18} /> {buttonLabel}
      </button>

      {open && createPortal(
        <AnimatePresence>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 6000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }} />
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 6001, maxHeight: '92vh', background: 'var(--app-surface-solid, #fff)', borderTopLeftRadius: 28, borderTopRightRadius: 28, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* header del sheet */}
            <div style={{ padding: '16px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle, rgba(0,0,0,0.06))', flexShrink: 0 }}>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--on-surface)', fontFamily: 'var(--font-display)' }}>Compartir horarios</span>
              <button onClick={() => setOpen(false)} style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={18} color="var(--on-surface)" /></button>
            </div>

            {/* toggle semana / día */}
            <div style={{ display: 'flex', gap: 8, padding: '14px 20px 6px', flexShrink: 0 }}>
              {[{ k: 'week', l: 'Semana', I: CalendarRange }, { k: 'day', l: 'Solo el día', I: CalendarDays }].map(({ k, l, I }) => (
                <button key={k} onClick={() => setMode(k)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 14, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem', background: mode === k ? 'var(--primary)' : 'rgba(0,0,0,0.05)', color: mode === k ? '#fff' : 'var(--on-surface-variant)' }}>
                  <I size={16} /> {l}
                </button>
              ))}
            </div>

            {/* preview (escalado) */}
            <div style={{ flex: 1, overflow: 'auto', padding: '14px 20px 0', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: 1080 * 0.30, height: 1920 * 0.30, flexShrink: 0 }}>
                <div style={{ transform: 'scale(0.30)', transformOrigin: 'top left', borderRadius: 24, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
                  <StoryCard ref={cardRef} mode={mode} week={week} dayData={dayData} rangeLabel={rangeLabel} />
                </div>
              </div>
            </div>

            {/* acción */}
            <div style={{ padding: '16px 20px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))', flexShrink: 0, borderTop: '1px solid var(--border-subtle, rgba(0,0,0,0.06))' }}>
              <button onClick={handleShare} disabled={busy} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '15px', borderRadius: 16, border: 'none', background: busy ? 'rgba(255,145,77,0.5)' : 'var(--primary)', color: '#fff', fontWeight: 800, fontSize: '0.95rem', cursor: busy ? 'default' : 'pointer', boxShadow: '0 10px 24px rgba(255,145,77,0.35)' }}>
                {busy ? 'Generando…' : <><Share2 size={18} /> Compartir / Descargar</>}
              </button>
              <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--on-surface-variant)', margin: '10px 0 0' }}>En el celular se abre el menú para compartir directo a Instagram. En computadora se descarga la imagen.</p>
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
