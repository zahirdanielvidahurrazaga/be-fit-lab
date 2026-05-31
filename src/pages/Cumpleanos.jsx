import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Cake, Gift, PartyPopper, User, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']; // lunes primero

const FRASES = [
  'El _proceso_ que hoy te pesa, mañana será tu mayor _recompensa_.',
  'Tu _cuerpo_ escucha todo lo que tu _mente_ dice.',
  'Cada clase es un _regalo_ que te das a ti misma.',
  'No se trata de ser _perfecta_, sino de ser _constante_.',
  'Tu única _competencia_ eres tú de ayer.',
  'Brilla por _dentro_ y se notará por _fuera_.',
  'Hoy es un buen día para _empezar_ de nuevo.',
];

const parseYMD = (s) => { const [y, m, d] = s.split('-').map(Number); return { y, m, d }; };
const dayOfYear = () => { const n = new Date(); return Math.floor((n - new Date(n.getFullYear(), 0, 0)) / 86400000); };
const buildCells = (year, month) => {
  const offset = (new Date(year, month, 1).getDay() + 6) % 7; // lunes primero
  const total = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);
  return cells;
};

function Frase({ text }) {
  const parts = text.split('_');
  return (
    <p style={{ fontFamily: "'Caveat', cursive", color: '#3A3632', fontSize: '2.1rem', lineHeight: 1.35, fontWeight: 600, margin: 0, textAlign: 'center' }}>
      {parts.map((seg, i) => i % 2 === 1
        ? <span key={i} style={{ textDecoration: 'underline', textUnderlineOffset: '4px' }}>{seg}</span>
        : <span key={i}>{seg}</span>)}
    </p>
  );
}

function Avatar({ p, size = 44, ring = 'var(--primary)' }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: `2px solid ${ring}`, background: 'rgba(255,139,66,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {p.avatar_url
        ? <img src={p.avatar_url} alt={p.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <User size={size * 0.5} color="var(--primary)" />}
    </div>
  );
}

// Unidad de la cuenta regresiva con número que "rueda" al cambiar
function Unit({ value, label }) {
  return (
    <div style={{ textAlign: 'center', flex: 1, minWidth: 0 }}>
      <div style={{ position: 'relative', height: '2.6rem', overflow: 'hidden' }}>
        <AnimatePresence initial={false}>
          <motion.div key={value}
            initial={{ y: '100%', opacity: 0 }} animate={{ y: '0%', opacity: 1 }} exit={{ y: '-100%', opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.95rem', fontWeight: 800, color: 'var(--black)', lineHeight: 1, fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums' }}>
            {String(value).padStart(2, '0')}
          </motion.div>
        </AnimatePresence>
      </div>
      <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '6px' }}>{label}</div>
    </div>
  );
}

// Mini-calendario (vista anual). Todo el mes es clickeable → entra a la vista mensual.
function MiniMonth({ year, month, bdays, today, onOpen }) {
  const cells = buildCells(year, month);
  return (
    <div onClick={() => onOpen(month)} style={{ cursor: 'pointer' }}>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.05rem', fontWeight: 600, letterSpacing: '0.12em', textAlign: 'center', color: 'var(--on-surface)', textTransform: 'uppercase' }}>{MESES[month]}</div>
      <div style={{ height: '1px', background: 'rgba(0,0,0,0.18)', margin: '6px 4px 8px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', textAlign: 'center' }}>
        {WEEKDAYS.map((w, i) => (
          <span key={'w' + i} style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '0.62rem', fontWeight: 600, color: 'var(--on-surface-variant)', paddingBottom: '3px' }}>{w}</span>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <span key={i} />;
          const ppl = bdays.get(d);
          const isToday = today.month === month && today.day === d;
          return (
            <span key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1px 0' }}>
              {ppl ? (
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', overflow: 'hidden', border: '1.5px solid #E07A9C', background: 'rgba(224,122,156,0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  {ppl[0].avatar_url
                    ? <img src={ppl[0].avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <Cake size={10} color="#E07A9C" />}
                </span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', fontSize: '0.62rem', fontVariantNumeric: 'tabular-nums', fontWeight: 500, color: 'var(--on-surface)', border: isToday ? '1.5px solid #E07A9C' : '1.5px solid transparent' }}>{d}</span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// Calendario grande (vista mensual). Cada día con cumpleaños es clickeable.
function BigMonth({ year, month, bdays, today, onDayClick }) {
  const cells = buildCells(year, month);
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '6px' }}>
        {WEEKDAYS.map((w, i) => (
          <span key={'w' + i} style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '0.85rem', fontWeight: 600, color: 'var(--on-surface-variant)' }}>{w}</span>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
        {cells.map((d, i) => {
          if (d === null) return <span key={i} />;
          const ppl = bdays.get(d);
          const isToday = today.month === month && today.day === d;
          return (
            <div key={i}
              onClick={ppl ? () => onDayClick(month, d, ppl) : undefined}
              style={{
                minHeight: '52px', borderRadius: '14px', padding: '4px 2px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px',
                cursor: ppl ? 'pointer' : 'default',
                background: ppl ? 'rgba(224,122,156,0.10)' : 'transparent',
                border: isToday ? '1.5px solid #E07A9C' : '1.5px solid transparent',
              }}>
              <span style={{ fontSize: '0.72rem', fontVariantNumeric: 'tabular-nums', fontWeight: ppl ? 800 : 500, color: ppl ? '#C2456E' : 'var(--on-surface)' }}>{d}</span>
              {ppl && (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {ppl.slice(0, 2).map((p, idx) => (
                    <div key={p.id} style={{ marginLeft: idx === 0 ? 0 : '-7px' }}><Avatar p={p} size={22} ring="#fff" /></div>
                  ))}
                  {ppl.length > 2 && <span style={{ marginLeft: '2px', fontSize: '0.6rem', fontWeight: 800, color: '#C2456E' }}>+{ppl.length - 2}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Cumpleanos() {
  const navigate = useNavigate();
  const isNative = Capacitor.isNativePlatform();
  const { user } = useAuth();

  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [view, setView] = useState('year');         // 'year' | 'month'
  const [activeMonth, setActiveMonth] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null); // { month, day, people }

  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('users')
        .select('id, full_name, avatar_url, birth_date, role')
        .not('birth_date', 'is', null);
      setPeople(data || []);
      setLoading(false);
    })();
  }, []);

  const frase = useMemo(() => FRASES[dayOfYear() % FRASES.length], []);
  const year = now.getFullYear();
  const today = { month: now.getMonth(), day: now.getDate() };
  const me = people.find(p => p.id === user?.id);

  const countdown = useMemo(() => {
    if (!me?.birth_date) return null;
    const { m, d } = parseYMD(me.birth_date);
    const isToday = (m - 1) === now.getMonth() && d === now.getDate();
    if (isToday) return { isToday: true };
    let target = new Date(now.getFullYear(), m - 1, d, 0, 0, 0);
    if (target < now) target = new Date(now.getFullYear() + 1, m - 1, d, 0, 0, 0);
    const diff = target - now;
    return { isToday: false, days: Math.floor(diff / 86400000), hours: Math.floor((diff % 86400000) / 3600000), mins: Math.floor((diff % 3600000) / 60000), secs: Math.floor((diff % 60000) / 1000) };
  }, [me, now]);

  const byMonthDay = useMemo(() => {
    const arr = Array.from({ length: 12 }, () => new Map());
    people.filter(p => p.birth_date).forEach(p => {
      const { m, d } = parseYMD(p.birth_date);
      const map = arr[m - 1];
      if (!map.has(d)) map.set(d, []);
      map.get(d).push(p);
    });
    return arr;
  }, [people]);

  const openMonth = (m) => { setActiveMonth(m); setView('month'); };
  const backToYear = () => { setView('year'); setActiveMonth(null); };

  // Tarjeta neutra (igual que la card del calendario) para no desentonar
  const cardWhite = {
    background: 'var(--surface-lowest)',
    border: '1px solid rgba(0,0,0,0.04)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
  };

  return (
    <div className="mobile-app-container" style={{ background: 'var(--app-bg)', minHeight: '100vh' }}>
      <header className="ios-header" style={{ paddingBottom: '5px', background: 'transparent' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
          <button onClick={() => { if (window.history.length > 1) navigate(-1); else navigate('/portal'); }} aria-label="Volver"
            style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: 'var(--surface-lowest)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <ChevronLeft size={22} color="var(--on-surface)" />
          </button>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: '0 0 2px', fontWeight: 600 }}>Be Fit Lab</p>
            <h1 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', margin: 0, lineHeight: 1.1, color: 'var(--black)' }}>Cumpleaños</h1>
          </div>
        </div>
      </header>

      <main className="dashboard-main" style={{ paddingTop: '10px', paddingBottom: '40px' }}>

        {/* COUNTDOWN */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {loading ? (
            <div style={{ borderRadius: '28px', padding: '28px 24px', ...cardWhite, minHeight: '118px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', fontWeight: 600 }}>Cargando…</span>
            </div>
          ) : !me?.birth_date ? (
            <div style={{ borderRadius: '28px', padding: '30px 24px', textAlign: 'center', ...cardWhite }}>
              <Cake size={40} color="#E07A9C" style={{ marginBottom: '12px' }} />
              <h2 style={{ margin: '0 0 6px', fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--black)' }}>¿Cuándo es tu cumple?</h2>
              <p style={{ margin: '0 0 18px', fontSize: '0.9rem', color: '#7A5C63', lineHeight: 1.5 }}>Agrégalo en tu perfil y te preparamos una sorpresa 🎉</p>
              <button onClick={() => navigate('/mi-cuenta')} style={{ background: '#E07A9C', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '16px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 20px rgba(224,122,156,0.35)' }}>Agregar mi cumpleaños</button>
            </div>
          ) : countdown?.isToday ? (
            <div style={{ borderRadius: '28px', padding: '36px 24px', textAlign: 'center', ...cardWhite, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', background: 'rgba(255,255,255,0.25)', borderRadius: '50%' }} />
              <PartyPopper size={46} color="#C2456E" style={{ marginBottom: '10px', position: 'relative' }} />
              <h2 style={{ margin: '0 0 6px', fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--black)', position: 'relative' }}>¡Hoy es tu día! 🎉</h2>
              <p style={{ margin: 0, fontSize: '1rem', color: '#7A3A4E', fontWeight: 600, position: 'relative' }}>Feliz cumpleaños, {me.full_name?.split(' ')[0] || 'hermosa'} 💕</p>
            </div>
          ) : (
            <div style={{ borderRadius: '28px', padding: '28px 24px', ...cardWhite, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-25px', right: '-25px', width: '100px', height: '100px', background: 'rgba(255,255,255,0.25)', borderRadius: '50%' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', position: 'relative' }}>
                <Gift size={20} color="#E07A9C" />
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#C2456E', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tu cumpleaños</span>
              </div>
              <div style={{ display: 'flex', gap: '4px', position: 'relative' }}>
                <Unit value={countdown.days} label="días" />
                <Unit value={countdown.hours} label="hrs" />
                <Unit value={countdown.mins} label="min" />
                <Unit value={countdown.secs} label="seg" />
              </div>
            </div>
          )}
        </motion.section>

        {/* FRASE (estilo post-it con washi tape) */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }} style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ position: 'relative', transform: 'rotate(-2.5deg)', background: '#FAF6EF', padding: '42px 26px 36px', borderRadius: '6px', boxShadow: '0 16px 32px rgba(0,0,0,0.12)', maxWidth: '330px', width: '100%' }}>
            {/* Washi tape */}
            <div style={{ position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%) rotate(-3deg)', width: '128px', height: '30px', background: 'rgba(224,122,156,0.28)', borderLeft: '2px dashed rgba(255,255,255,0.7)', borderRight: '2px dashed rgba(255,255,255,0.7)', backdropFilter: 'blur(1px)' }} />
            <Frase text={frase} />
          </div>
        </motion.section>

        {/* CALENDARIO */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }} style={{ marginTop: '30px' }}>
          <div style={{ background: 'var(--surface-lowest)', borderRadius: '28px', padding: '24px 16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)' }}>

            {view === 'year' ? (
              <>
                <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '0.8rem', letterSpacing: '0.45em', color: 'var(--on-surface-variant)', textTransform: 'uppercase', paddingLeft: '0.45em' }}>Calendario</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '3rem', fontWeight: 600, color: 'var(--on-surface)', lineHeight: 1 }}>{year}</div>
                </div>
                {loading ? (
                  <p style={{ textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: '0.9rem' }}>Cargando…</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '22px 14px' }}>
                    {MESES.map((_, idx) => (
                      <MiniMonth key={idx} year={year} month={idx} bdays={byMonthDay[idx]} today={today} onOpen={openMonth} />
                    ))}
                  </div>
                )}
                <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--on-surface-variant)', marginTop: '18px' }}>Toca un mes para verlo a detalle</p>
              </>
            ) : (
              <motion.div key={activeMonth} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <button onClick={backToYear} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--surface)', border: 'none', borderRadius: '12px', padding: '8px 12px', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', color: 'var(--on-surface)' }}>
                    <ChevronLeft size={16} /> Meses
                  </button>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.7rem', fontWeight: 600, color: 'var(--on-surface)', textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1 }}>{MESES[activeMonth]}</div>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '0.85rem', color: 'var(--on-surface-variant)', letterSpacing: '0.2em' }}>{year}</div>
                  </div>
                  <div style={{ width: '78px' }} />
                </div>
                <BigMonth year={year} month={activeMonth} bdays={byMonthDay[activeMonth]} today={today} onDayClick={(month, day, ppl) => setSelectedDay({ month, day, people: ppl })} />
                <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--on-surface-variant)', marginTop: '14px' }}>Toca un día con foto para ver de quién es el cumple 💕</p>
              </motion.div>
            )}
          </div>
        </motion.section>
      </main>

      {/* DETALLE DEL DÍA */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedDay(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: 'spring', damping: 24, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              style={{ width: 'min(360px, 100%)', maxHeight: '70vh', overflowY: 'auto', borderRadius: '26px', padding: '22px', background: 'rgba(255,255,255,0.62)', backdropFilter: 'blur(28px) saturate(180%)', WebkitBackdropFilter: 'blur(28px) saturate(180%)', border: '1px solid rgba(255,255,255,0.6)', boxShadow: '0 20px 50px rgba(0,0,0,0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#C2456E', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Cumpleaños</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--on-surface)' }}>{selectedDay.day} de {MESES[selectedDay.month]}</div>
                </div>
                <button onClick={() => setSelectedDay(null)} aria-label="Cerrar" style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <X size={16} color="var(--on-surface)" />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedDay.people.map(p => {
                  const mine = p.id === user?.id;
                  const isCoach = p.role === 'COACH';
                  const isBdayToday = today.month === selectedDay.month && today.day === selectedDay.day;
                  return (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Avatar p={p} size={46} ring={mine ? '#E07A9C' : 'var(--primary)'} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.full_name || 'Be Fit Lab'}{mine ? ' (tú)' : ''}</span>
                          {isCoach && <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--primary)', background: 'rgba(255,145,77,0.12)', padding: '2px 7px', borderRadius: '8px', textTransform: 'uppercase' }}>Coach</span>}
                        </div>
                        {isBdayToday && <span style={{ fontSize: '0.78rem', color: '#C2456E', fontWeight: 700 }}>¡Hoy! 🎉</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Cumpleanos;
