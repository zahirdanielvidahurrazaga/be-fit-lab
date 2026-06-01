import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, CalendarDays, MapPin, Sparkles } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '../lib/supabase';

const PRIMARY = '#FF914D';

function EventCard({ ev, past }) {
  const d = ev.event_date ? new Date(ev.event_date) : null;
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 120, damping: 18 }}
      style={{ background: 'var(--app-surface-solid, #fff)', borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--border-subtle, rgba(0,0,0,0.05))', opacity: past ? 0.65 : 1 }}>
      <div style={{ position: 'relative', height: '160px', background: ev.image_url ? `#eee url('${ev.image_url}') center/cover` : 'linear-gradient(135deg, #FF914D, #E07A9C)' }}>
        {!ev.image_url && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sparkles size={40} color="rgba(255,255,255,0.6)" /></div>}
        {d && (
          <div style={{ position: 'absolute', top: '14px', left: '14px', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', borderRadius: '14px', padding: '6px 12px', textAlign: 'center', boxShadow: '0 4px 14px rgba(0,0,0,0.15)' }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 800, color: PRIMARY, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d.toLocaleDateString('es-MX', { month: 'short' })}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1A1C1E', lineHeight: 1, fontFamily: 'var(--font-display)' }}>{d.getDate()}</div>
          </div>
        )}
        {past && <div style={{ position: 'absolute', top: '14px', right: '14px', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '0.66rem', fontWeight: 700, padding: '4px 10px', borderRadius: '8px' }}>Finalizado</div>}
      </div>
      <div style={{ padding: '16px 18px' }}>
        <h3 style={{ margin: '0 0 6px', fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--on-surface)', lineHeight: 1.2 }}>{ev.title}</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: ev.description ? '10px' : 0 }}>
          {d && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}><CalendarDays size={14} color={PRIMARY} /> {d.toLocaleString('es-MX', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
          {ev.location && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}><MapPin size={14} color={PRIMARY} /> {ev.location}</span>}
        </div>
        {ev.description && <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--on-surface-variant)', lineHeight: 1.55 }}>{ev.description}</p>}
      </div>
    </motion.div>
  );
}

export default function Eventos() {
  const navigate = useNavigate();
  const isNative = Capacitor.isNativePlatform();
  const [events, setEvents] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    supabase.from('events').select('*').order('event_date', { ascending: true, nullsFirst: false })
      .then(({ data }) => setEvents(data || []));
  }, []);

  const { upcoming, past } = useMemo(() => {
    const now = Date.now() - 86400000;
    const up = [], pa = [];
    (events || []).forEach(e => { (e.event_date && new Date(e.event_date).getTime() < now ? pa : up).push(e); });
    pa.reverse();
    return { upcoming: up, past: pa };
  }, [events]);

  return (
    <div className="mobile-app-container" style={{ background: 'var(--app-bg)', minHeight: '100vh' }}>
      <header className="ios-header" style={{ background: 'transparent', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => { if (window.history.length > 1) navigate(-1); else navigate('/portal'); }} aria-label="Volver"
          style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid var(--border-subtle, rgba(0,0,0,0.08))', background: 'var(--app-surface-solid, #fff)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, color: 'var(--on-surface)' }}>
          <ChevronLeft size={20} />
        </button>
        <div>
          <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: '0 0 2px', fontWeight: 600 }}>Comunidad</p>
          <h1 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', margin: 0, lineHeight: 1.1, color: 'var(--on-surface)' }}>Eventos</h1>
        </div>
      </header>

      <main style={{ padding: '10px 18px calc(env(safe-area-inset-bottom,0px) + 120px)', maxWidth: '640px', margin: '0 auto' }}>
        {events === null ? (
          <p style={{ textAlign: 'center', color: 'var(--on-surface-variant)', padding: '50px 0' }}>Cargando…</p>
        ) : upcoming.length === 0 && past.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--on-surface-variant)' }}>
            <div style={{ width: '76px', height: '76px', borderRadius: '24px', background: 'linear-gradient(135deg, rgba(255,145,77,0.15), rgba(224,122,156,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <Sparkles size={36} color={PRIMARY} />
            </div>
            <h3 style={{ margin: '0 0 6px', fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--on-surface)' }}>Pronto, algo especial</h3>
            <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>Aquí anunciaremos nuestros próximos eventos,<br />talleres y experiencias de la tribu. 💛</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {upcoming.length > 0 && (
              <>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--on-surface-variant)' }}>Próximos</div>
                {upcoming.map(ev => <EventCard key={ev.id} ev={ev} />)}
              </>
            )}
            {past.length > 0 && (
              <>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--on-surface-variant)', marginTop: '10px' }}>Anteriores</div>
                {past.map(ev => <EventCard key={ev.id} ev={ev} past />)}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
