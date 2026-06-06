import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Cake, User, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']; // lunes primero

const parseYMD = (s) => { const [y, m, d] = s.split('-').map(Number); return { y, m, d }; };
const buildCells = (year, month) => {
  const offset = (new Date(year, month, 1).getDay() + 6) % 7; // lunes primero
  const total = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);
  return cells;
};

function Avatar({ p, size = 44, ring = 'var(--primary)' }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: `2px solid ${ring}`, background: 'rgba(255,139,66,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {p.avatar_url
        ? <img src={p.avatar_url} alt={p.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <User size={size * 0.5} color="var(--primary)" />}
    </div>
  );
}

// Unidad de la cuenta regresiva como "sticker" blanco sobre el collage crema.
function Unit({ value, label }) {
  return (
    <div style={{ flex: 1, maxWidth: '76px', background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 6px 16px rgba(80,55,30,0.12)', padding: '11px 4px 8px', textAlign: 'center' }}>
      <div style={{ position: 'relative', height: '2.05rem', overflow: 'hidden' }}>
        <AnimatePresence initial={false}>
          <motion.div key={value}
            initial={{ y: '100%', opacity: 0 }} animate={{ y: '0%', opacity: 1 }} exit={{ y: '-100%', opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.7rem', fontWeight: 800, color: '#2E2018', lineHeight: 1, fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums' }}>
            {String(value).padStart(2, '0')}
          </motion.div>
        </AnimatePresence>
      </div>
      <div style={{ fontSize: '0.58rem', fontWeight: 800, color: '#8A7A6E', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px' }}>{label}</div>
    </div>
  );
}

// Decoración del collage (sobre el papel kraft): garland arriba, globos a los
// costados, pastel abajo y destellos. Elementos en vivo (no imagen pegada).
function CollageDecor() {
  const Balloon = ({ cx, cy, col, rot }) => (
    <g transform={`rotate(${rot} ${cx} ${cy})`}>
      <ellipse cx={cx} cy={cy} rx="19" ry="24" fill={col} />
      <ellipse cx={cx - 6} cy={cy - 8} rx="4.5" ry="7" fill="rgba(255,255,255,0.45)" />
      <path d={`M${cx} ${cy + 24} l-2.5 5 l5 0 z`} fill={col} />
      <path d={`M${cx} ${cy + 29} q6 16 -2 32`} stroke="rgba(120,90,60,0.45)" strokeWidth="1.3" fill="none" />
    </g>
  );
  const Sparkle = ({ x, y, s, c }) => (
    <path transform={`translate(${x} ${y}) scale(${s})`} d="M0,-6 L1.6,-1.6 L6,0 L1.6,1.6 L0,6 L-1.6,1.6 L-6,0 L-1.6,-1.6 Z" fill={c} />
  );
  return (
    <>
      <img src="/cumple/garland.png" alt="" aria-hidden="true" style={{ position: 'absolute', top: '3%', left: '50%', transform: 'translateX(-50%)', width: '84%', pointerEvents: 'none' }} />
      <img src="/cumple/cake.png" alt="" aria-hidden="true" style={{ position: 'absolute', bottom: '2%', left: '50%', transform: 'translateX(-50%)', width: '26%', pointerEvents: 'none' }} />
      <svg viewBox="0 0 360 360" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <Balloon cx={40} cy={152} col="#A8D0E6" rot={-8} />
        <Balloon cx={322} cy={120} col="#F4C7C2" rot={7} />
        <Balloon cx={330} cy={214} col="#F6D3A8" rot={-5} />
        <Sparkle x={42} y={300} s={1.4} c="#D9B25A" />
        <Sparkle x={314} y={296} s={1.05} c="#D9B25A" />
      </svg>
    </>
  );
}

// Mini-calendario (vista anual). Todo el mes es clickeable → entra a la vista mensual.
function MiniMonth({ year, month, bdays, today, onOpen }) {
  const cells = buildCells(year, month);
  return (
    <div onClick={() => onOpen(month)} style={{ cursor: 'pointer' }}>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.05rem', fontWeight: 600, letterSpacing: '0.12em', textAlign: 'center', color: 'var(--on-surface)', textTransform: 'uppercase' }}>{MESES[month]}</div>
      <div style={{ height: '1px', background: 'var(--divider)', margin: '6px 4px 8px' }} />
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
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', overflow: 'hidden', border: '1.5px solid #FF914D', background: 'rgba(255,145,77,0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  {ppl[0].avatar_url
                    ? <img src={ppl[0].avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <Cake size={10} color="#FF914D" />}
                </span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', fontSize: '0.62rem', fontVariantNumeric: 'tabular-nums', fontWeight: 500, color: 'var(--on-surface)', border: isToday ? '1.5px solid #FF914D' : '1.5px solid transparent' }}>{d}</span>
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
                background: ppl ? 'rgba(255,145,77,0.10)' : 'transparent',
                border: isToday ? '1.5px solid #FF914D' : '1.5px solid transparent',
              }}>
              <span style={{ fontSize: '0.72rem', fontVariantNumeric: 'tabular-nums', fontWeight: ppl ? 800 : 500, color: ppl ? '#C75D3A' : 'var(--on-surface)' }}>{d}</span>
              {ppl && (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {ppl.slice(0, 2).map((p, idx) => (
                    <div key={p.id} style={{ marginLeft: idx === 0 ? 0 : '-7px' }}><Avatar p={p} size={22} ring="#fff" /></div>
                  ))}
                  {ppl.length > 2 && <span style={{ marginLeft: '2px', fontSize: '0.6rem', fontWeight: 800, color: '#C75D3A' }}>+{ppl.length - 2}</span>}
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
    border: '1px solid var(--border-subtle)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
  };
  // Card del collage de cumpleaños (papel kraft + recortes), cuadrada.
  const collageCard = {
    position: 'relative', maxWidth: '360px', margin: '0 auto', width: '100%',
    aspectRatio: '1 / 1', borderRadius: '28px', overflow: 'hidden',
    backgroundImage: 'url(/cumple/kraft.jpg)', backgroundSize: 'cover', backgroundPosition: 'center',
    boxShadow: '0 20px 44px rgba(80,55,30,0.16)',
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
              <Cake size={40} color="#FF914D" style={{ marginBottom: '12px' }} />
              <h2 style={{ margin: '0 0 6px', fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--black)' }}>¿Cuándo es tu cumple?</h2>
              <p style={{ margin: '0 0 18px', fontSize: '0.9rem', color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>Agrégalo en tu perfil y te preparamos una sorpresa 🎉</p>
              <button onClick={() => navigate('/mi-cuenta')} style={{ background: '#FF914D', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '16px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 20px rgba(255,145,77,0.35)' }}>Agregar mi cumpleaños</button>
            </div>
          ) : countdown?.isToday ? (
            <div style={collageCard}>
              <CollageDecor />
              <div style={{ position: 'absolute', left: 0, right: 0, top: '45%', transform: 'translateY(-50%)', textAlign: 'center', padding: '0 26px' }}>
                <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.86)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', borderRadius: '20px', padding: '18px 22px', boxShadow: '0 10px 26px rgba(80,55,30,0.16)' }}>
                  <h2 style={{ margin: '0 0 4px', fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: '#2E2018' }}>¡Hoy es tu día! 🎉</h2>
                  <p style={{ margin: 0, fontSize: '0.92rem', color: '#7A6A5E', fontWeight: 600 }}>Feliz cumpleaños, {me.full_name?.split(' ')[0] || 'hermosa'} 🧡</p>
                </div>
              </div>
            </div>
          ) : (
            <div style={collageCard}>
              <CollageDecor />
              <div style={{ position: 'absolute', left: 0, right: 0, top: '44%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '0 16px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.16em', color: '#C75D3A' }}>FALTAN</span>
                <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'center' }}>
                  <Unit value={countdown.days} label="días" />
                  <Unit value={countdown.hours} label="hrs" />
                  <Unit value={countdown.mins} label="min" />
                  <Unit value={countdown.secs} label="seg" />
                </div>
              </div>
            </div>
          )}
        </motion.section>

        {/* CALENDARIO */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }} style={{ marginTop: '30px' }}>
          <div style={{ background: 'var(--surface-lowest)', borderRadius: '28px', padding: '24px 16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid var(--border-subtle)' }}>

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
              style={{ width: 'min(360px, 100%)', maxHeight: '70vh', overflowY: 'auto', borderRadius: '26px', padding: '22px', background: 'var(--glass-bg)', backdropFilter: 'blur(28px) saturate(180%)', WebkitBackdropFilter: 'blur(28px) saturate(180%)', border: '1px solid var(--glass-border)', boxShadow: '0 20px 50px rgba(0,0,0,0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#C75D3A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Cumpleaños</div>
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
                      <Avatar p={p} size={46} ring={mine ? '#FF914D' : 'var(--primary)'} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.full_name || 'Be Fit Lab'}{mine ? ' (tú)' : ''}</span>
                          {isCoach && <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--primary)', background: 'rgba(255,145,77,0.12)', padding: '2px 7px', borderRadius: '8px', textTransform: 'uppercase' }}>Coach</span>}
                        </div>
                        {isBdayToday && <span style={{ fontSize: '0.78rem', color: '#C75D3A', fontWeight: 700 }}>¡Hoy! 🎉</span>}
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
