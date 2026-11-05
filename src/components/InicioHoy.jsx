import React, { useEffect, useMemo, useState } from 'react';
import { Users, Activity, DollarSign, UserPlus, CalendarClock, BatteryLow, BadgeCheck, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { mexicoClassStart } from '../lib/dates';

// ─────────────────────────────────────────────────────────────────────────────
// INICIO del panel (junto al escáner QR). Antes solo había dos números sueltos.
// Ahora contesta lo que recepción necesita al llegar: qué clases hay hoy y qué
// tan llenas, a quién hay que atender (vence esta semana, sin clases, debe
// inscripción) y accesos directos a lo que más se hace (cobrar, inscribir).
// ─────────────────────────────────────────────────────────────────────────────

const INK = 'var(--black, #1A1C1E)';
const card = { background: 'white', borderRadius: '22px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.04)' };
const titulo = { fontSize: '0.74rem', fontWeight: 800, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' };
const ocupadas = (c) => Math.max(0, (c.max_spots || 10) - (c.spots ?? 0));

function Stat({ icon, valor, etiqueta, tono = 'var(--primary)', fondo = 'rgba(255,145,77,0.1)' }) {
  return (
    <div style={{ ...card, padding: '18px' }}>
      <div style={{ color: tono, marginBottom: '10px', background: fondo, width: '38px', height: '38px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      <div style={{ fontSize: '2rem', fontWeight: 900, color: INK, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{valor}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 700, marginTop: '5px' }}>{etiqueta}</div>
    </div>
  );
}

function Pendiente({ icon, n, texto, onClick, tono }) {
  if (!n) return null;
  return (
    <button type="button" onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '12px 14px', border: 'none', borderRadius: '14px',
               background: 'rgba(0,0,0,0.03)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
      <span style={{ color: tono, display: 'flex' }}>{icon}</span>
      <span style={{ flex: 1, fontSize: '0.88rem', fontWeight: 700, color: INK }}><b>{n}</b> {texto}</span>
      <ChevronRight size={16} color="var(--on-surface-variant)" />
    </button>
  );
}

export default function InicioHoy({ todayClasses = [], coaches = [], allUsers = [], onIr }) {
  const ahora = Date.now();
  const coachPorId = useMemo(() => new Map((coaches || []).map(c => [c.id, c])), [coaches]);

  const clases = useMemo(() => (todayClasses || [])
    .map(c => ({ ...c, inicio: mexicoClassStart(c.date, c.time)?.getTime() ?? 0 }))
    .sort((a, b) => a.inicio - b.inicio), [todayClasses]);
  const reservas = clases.reduce((s, c) => s + ocupadas(c), 0);
  const cupo = clases.reduce((s, c) => s + (c.max_spots || 10), 0);
  const ocupacion = cupo ? Math.round((reservas / cupo) * 100) : 0;
  // La siguiente clase: la primera que no ha terminado (~1 h de duración).
  const idxSiguiente = clases.findIndex(c => c.inicio + 3600000 > ahora);

  // Pendientes
  const [inscritasIds, setInscritasIds] = useState(null);
  const [inscActiva, setInscActiva] = useState(false);
  useEffect(() => {
    (async () => {
      const { data: cfg } = await supabase.from('app_config').select('inscripcion_activa').eq('id', 1).single();
      setInscActiva(!!cfg?.inscripcion_activa);
      if (!cfg?.inscripcion_activa) return;
      const { data } = await supabase.from('pagos_extra').select('user_id')
        .eq('tipo', 'inscripcion').gt('vigente_hasta', new Date().toISOString());
      setInscritasIds(new Set((data || []).map(r => r.user_id)));
    })();
  }, []);

  const pend = useMemo(() => {
    const limite = ahora + 7 * 86400000;
    const activas = (allUsers || []).filter(u => u.role === 'CLIENT' && u.membership_status === 'ACTIVE');
    const vigente = (u) => !u.plan_expires_at || new Date(u.plan_expires_at).getTime() > ahora;
    return {
      // Misma regla que el filtro "Por renovar" de Clientas: vence en 7 días o ya venció.
      vencen: activas.filter(u => u.plan_expires_at && new Date(u.plan_expires_at).getTime() <= limite).length,
      sinClases: activas.filter(u => vigente(u) && (u.classes_remaining ?? 0) <= 0).length,
      inscripcion: inscActiva && inscritasIds
        ? activas.filter(u => vigente(u) && u.membership_plan !== 'Clase suelta' && !inscritasIds.has(u.id)).length : 0,
    };
  }, [allUsers, inscritasIds, inscActiva]); // eslint-disable-line

  const irAClientas = (filtro) => {
    try { sessionStorage.setItem('befit_clientas_filtro', filtro); } catch { /* sin storage: abre sin filtro */ }
    onIr?.('clientas');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Stat icon={<Users size={19} />} valor={reservas} etiqueta="Reservas hoy" />
        <Stat icon={<Activity size={19} />} valor={<>{ocupacion}<span style={{ fontSize: '1.1rem', color: 'var(--on-surface-variant)' }}>%</span></>}
          etiqueta={`Ocupación · ${clases.length} ${clases.length === 1 ? 'clase' : 'clases'}`} tono="#B45309" fondo="rgba(238,186,137,0.22)" />
      </div>

      {/* Accesos directos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {[[<DollarSign size={18} />, 'Cobrar', 'ventas'], [<UserPlus size={18} />, 'Inscribir clienta', 'ventas']].map(([ic, t, tab]) => (
          <button key={t} type="button" onClick={() => onIr?.(tab)}
            style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', cursor: 'pointer',
                     fontFamily: 'inherit', fontWeight: 800, fontSize: '0.9rem', color: INK }}>
            <span style={{ color: 'var(--primary)', display: 'flex' }}>{ic}</span>{t}
          </button>
        ))}
      </div>

      {/* Para atender */}
      {(pend.vencen || pend.sinClases || pend.inscripcion) ? (
        <div style={{ ...card, padding: '16px' }}>
          <p style={titulo}>Para atender</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Pendiente icon={<CalendarClock size={18} />} tono="#C2410C" n={pend.vencen} texto={pend.vencen === 1 ? 'por renovar (vence pronto o ya venció)' : 'por renovar (vencen pronto o ya vencieron)'} onClick={() => irAClientas('porvencer')} />
            <Pendiente icon={<BatteryLow size={18} />} tono="#B45309" n={pend.sinClases} texto={pend.sinClases === 1 ? 'clienta se quedó sin clases' : 'clientas se quedaron sin clases'} onClick={() => irAClientas('sinclases')} />
            <Pendiente icon={<BadgeCheck size={18} />} tono="#DC2626" n={pend.inscripcion} texto="deben la inscripción anual" onClick={() => onIr?.('clientas')} />
          </div>
        </div>
      ) : null}

      {/* Clases de hoy */}
      <div style={{ ...card, padding: '16px' }}>
        <p style={titulo}>Clases de hoy</p>
        {clases.length === 0 ? (
          <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--on-surface-variant)' }}>Hoy no hay clases programadas.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {clases.map((c, i) => {
              const n = ocupadas(c), max = c.max_spots || 10, pct = Math.min(100, Math.round((n / max) * 100));
              const pasada = c.inicio + 3600000 <= ahora;
              const siguiente = i === idxSiguiente;
              const coach = (c.coach_id && coachPorId.get(c.coach_id)?.full_name) || c.instructor || '';
              const lleno = n >= max;
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '9px 10px', borderRadius: '12px',
                                         background: siguiente ? 'rgba(255,145,77,0.08)' : 'transparent', opacity: pasada ? 0.5 : 1 }}>
                  <div style={{ width: '64px', flexShrink: 0, fontSize: '0.8rem', fontWeight: 800, color: siguiente ? 'var(--primary)' : INK }}>{c.time}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</div>
                    {coach && <div style={{ fontSize: '0.74rem', color: 'var(--on-surface-variant)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{coach}</div>}
                    <div style={{ height: '4px', borderRadius: '3px', background: 'rgba(0,0,0,0.06)', marginTop: '6px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', borderRadius: '3px', background: lleno ? '#16A34A' : 'var(--primary)' }} />
                    </div>
                  </div>
                  <div style={{ flexShrink: 0, fontSize: '0.8rem', fontWeight: 800, color: lleno ? '#16A34A' : 'var(--on-surface-variant)', textAlign: 'right' }}>
                    {n}/{max}{lleno && <div style={{ fontSize: '0.66rem' }}>Llena</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
