import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, TrendingUp, Users, Coffee, CalendarDays, Award, CreditCard, Gift, Activity, Crown, Receipt, BarChart3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const money = (n) => `$${Math.round(n || 0).toLocaleString('es-MX')}`;
const PALETTE = ['#FF914D', '#E07A9C', '#6C5CE7', '#00B894', '#0984E3', '#FDCB6E', '#E17055', '#00CEC9'];
const SUBTABS = [
  ['resumen', 'Resumen', BarChart3],
  ['finanzas', 'Finanzas', CreditCard],
  ['clases', 'Clases', CalendarDays],
  ['coaches', 'Coaches', Award],
  ['cafeteria', 'Cafetería', Coffee],
];

// Tarjeta KPI blanca
function Kpi({ label, value, sub, Icon, accent = 'var(--primary)' }) {
  return (
    <div style={{ padding: '18px', background: 'white', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.03)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ fontSize: '0.68rem', color: 'var(--on-surface-variant)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
        <div style={{ width: '30px', height: '30px', borderRadius: '9px', background: `${accent}1A`, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={16} /></div>
      </div>
      <div style={{ fontSize: '1.7rem', fontWeight: 900, color: 'var(--black)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.74rem', color: 'var(--on-surface-variant)', marginTop: '6px', fontWeight: 600 }}>{sub}</div>}
    </div>
  );
}

// Barras simples (serie por día)
function MiniBars({ series, height = 70 }) {
  const max = Math.max(1, ...series.map(s => s.amount));
  return (
    <div style={{ height, display: 'flex', alignItems: 'flex-end', gap: '3px' }}>
      {series.map((s, i) => (
        <div key={i} title={`${s.date}: ${money(s.amount)}`} style={{ flex: 1, height: `${Math.max(3, (s.amount / max) * 100)}%`, background: i === series.length - 1 ? 'var(--accent)' : 'rgba(255,255,255,0.18)', borderRadius: '3px', minWidth: '2px' }} />
      ))}
    </div>
  );
}

// Fila de ranking con barra de progreso
function RankRow({ rank, title, sub, value, pct, color, avatar }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'white', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.03)', boxShadow: '0 6px 16px rgba(0,0,0,0.03)' }}>
      <div style={{ width: '26px', fontWeight: 900, color: rank === 1 ? 'var(--primary)' : 'var(--on-surface-variant)', fontFamily: 'var(--font-display)', fontSize: rank === 1 ? '1.1rem' : '0.95rem', flexShrink: 0, textAlign: 'center' }}>{rank}</div>
      {avatar !== undefined && (
        avatar
          ? <img src={avatar} alt="" style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          : <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>{(title || '?').charAt(0)}</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
          <span style={{ fontWeight: 700, color: 'var(--black)', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
          <span style={{ fontWeight: 800, color: 'var(--black)', fontSize: '0.9rem', flexShrink: 0 }}>{value}</span>
        </div>
        <div style={{ height: '7px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ type: 'spring', stiffness: 80, damping: 18 }} style={{ height: '100%', background: color, borderRadius: '4px' }} />
        </div>
        {sub && <div style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)', marginTop: '4px', fontWeight: 600 }}>{sub}</div>}
      </div>
    </div>
  );
}

const SectionTitle = ({ children }) => (
  <h3 style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--on-surface-variant)', margin: '4px 0 12px' }}>{children}</h3>
);

export default function AdminReportes() {
  const { allUsers, coaches } = useAuth();
  const [subtab, setSubtab] = useState('resumen');
  const [fin, setFin] = useState(null);
  const [finErr, setFinErr] = useState(false);
  const [reservations, setReservations] = useState([]);
  const [cafeOrders, setCafeOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // Finanzas (Stripe) — vía edge function admin
      supabase.functions.invoke('admin-analytics', { body: { days: 90 } })
        .then(({ data, error }) => { if (error || data?.error) setFinErr(true); else setFin(data); })
        .catch(() => setFinErr(true));

      // Asistencias (reservas + clase)
      const { data: resv } = await supabase.from('reservations')
        .select('id, checked_in, status, created_at, classes(title, instructor, coach_id, category)')
        .order('created_at', { ascending: false }).limit(4000);
      setReservations(resv || []);

      // Pedidos de cafetería pagados
      const { data: orders } = await supabase.from('cafe_orders')
        .select('id, items, total, created_at, is_gift, status')
        .in('status', ['paid', 'preparing', 'ready', 'completed'])
        .order('created_at', { ascending: false }).limit(2000);
      setCafeOrders(orders || []);
      setLoading(false);
    })();
  }, []);

  // ---- Agregaciones ----
  const coachById = useMemo(() => {
    const m = new Map();
    (coaches || []).forEach(c => m.set(c.id, c));
    return m;
  }, [coaches]);

  const classRank = useMemo(() => {
    const m = new Map(); // title -> {reservas, asistencias}
    reservations.forEach(r => {
      const t = r.classes?.title || 'Sin nombre';
      const e = m.get(t) || { reservas: 0, asistencias: 0 };
      e.reservas++; if (r.checked_in) e.asistencias++;
      m.set(t, e);
    });
    return [...m.entries()].map(([title, v]) => ({ title, ...v })).sort((a, b) => b.asistencias - a.asistencias || b.reservas - a.reservas);
  }, [reservations]);

  const coachRank = useMemo(() => {
    const m = new Map(); // key -> {name, avatar, reservas, asistencias}
    reservations.forEach(r => {
      const cid = r.classes?.coach_id;
      const coach = cid ? coachById.get(cid) : null;
      const name = coach?.full_name || r.classes?.instructor || 'Sin asignar';
      const key = cid || name;
      const e = m.get(key) || { name, avatar: coach?.avatar_url || null, reservas: 0, asistencias: 0 };
      e.reservas++; if (r.checked_in) e.asistencias++;
      m.set(key, e);
    });
    return [...m.values()].sort((a, b) => b.asistencias - a.asistencias || b.reservas - a.reservas);
  }, [reservations, coachById]);

  const cafe = useMemo(() => {
    const prod = new Map(); // name -> {qty, revenue}
    let revenue = 0, gifts = 0;
    cafeOrders.forEach(o => {
      revenue += o.total || 0;
      if (o.is_gift) gifts++;
      (o.items || []).forEach(it => {
        const e = prod.get(it.name) || { qty: 0, revenue: 0 };
        e.qty += it.qty || 1;
        e.revenue += (it.line_total != null ? it.line_total : (it.base_price || 0) * (it.qty || 1));
        prod.set(it.name, e);
      });
    });
    const ranking = [...prod.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.qty - a.qty);
    return { revenue, orders: cafeOrders.length, gifts, ranking, avg: cafeOrders.length ? Math.round(revenue / cafeOrders.length) : 0 };
  }, [cafeOrders]);

  const members = useMemo(() => {
    const clients = (allUsers || []).filter(u => u.role === 'CLIENT');
    const active = clients.filter(u => u.membership_status === 'ACTIVE');
    const plans = {};
    active.forEach(u => { const p = u.membership_plan || 'Sin plan'; plans[p] = (plans[p] || 0) + 1; });
    const last30 = clients.filter(u => u.created_at && (Date.now() - new Date(u.created_at).getTime()) < 30 * 86400000).length;
    return { total: clients.length, active: active.length, plans, last30 };
  }, [allUsers]);

  const totalAsistencias = useMemo(() => reservations.filter(r => r.checked_in).length, [reservations]);
  const ingresos30 = useMemo(() => (fin?.series || []).reduce((s, d) => s + d.amount, 0), [fin]);

  // ---- UI ----
  return (
    <section>
      <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', marginBottom: '16px', color: 'var(--black)' }}>Reportes & Analítica</h2>

      {/* Sub-pestañas */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '22px', WebkitOverflowScrolling: 'touch' }}>
        {SUBTABS.map(([id, label, Icon]) => {
          const on = subtab === id;
          return (
            <button key={id} onClick={() => setSubtab(id)} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 15px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.86rem', whiteSpace: 'nowrap', flexShrink: 0,
              background: on ? 'var(--primary)' : 'rgba(0,0,0,0.05)', color: on ? '#fff' : 'var(--on-surface-variant)' }}>
              <Icon size={16} /> {label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={subtab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>

          {/* ===== RESUMEN ===== */}
          {subtab === 'resumen' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px' }}>
                <Kpi label="Ingresos (30d)" value={fin ? money(ingresos30) : (finErr ? '—' : '…')} Icon={DollarSign} sub={fin?.mode === 'test' ? 'Stripe en modo prueba' : 'Stripe'} />
                <Kpi label="Socias activas" value={members.active} sub={`${members.total} en total`} Icon={Users} accent="#6C5CE7" />
                <Kpi label="Asistencias" value={totalAsistencias} sub="check-ins totales" Icon={Activity} accent="#00B894" />
                <Kpi label="Pedidos café" value={cafe.orders} sub={`${money(cafe.revenue)} vendido`} Icon={Coffee} accent="#E07A9C" />
              </div>

              {/* Hero ingresos */}
              <div style={{ background: 'linear-gradient(135deg, #2C302E, #1A1C1E)', padding: '24px', borderRadius: '24px', boxShadow: '0 15px 35px rgba(0,0,0,0.15)' }}>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Ingresos últimos 30 días</div>
                <div style={{ fontSize: '2.6rem', fontWeight: 900, color: 'white', fontFamily: 'var(--font-display)', lineHeight: 1, marginBottom: '16px' }}>{fin ? money(ingresos30) : (finErr ? 'Sin datos' : '…')}</div>
                {fin && <MiniBars series={fin.series} />}
              </div>

              {/* Top clase + top coach rápido */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                <div>
                  <SectionTitle>Clase más concurrida</SectionTitle>
                  {classRank[0] ? <RankRow rank={1} title={classRank[0].title} value={`${classRank[0].asistencias}`} sub={`${classRank[0].reservas} reservas`} pct={100} color={PALETTE[0]} /> : <Empty text="Sin asistencias aún" />}
                </div>
                <div>
                  <SectionTitle>Coach más solicitada</SectionTitle>
                  {coachRank[0] ? <RankRow rank={1} title={coachRank[0].name} value={`${coachRank[0].asistencias}`} sub={`${coachRank[0].reservas} reservas`} pct={100} color={PALETTE[1]} avatar={coachRank[0].avatar} /> : <Empty text="Sin datos de coaches" />}
                </div>
              </div>
            </div>
          )}

          {/* ===== FINANZAS ===== */}
          {subtab === 'finanzas' && (
            finErr ? <Empty text="No se pudieron cargar las finanzas" sub="Revisa la conexión con Stripe." />
            : !fin ? <Loading />
            : <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ background: 'linear-gradient(135deg, #2C302E, #1A1C1E)', padding: '24px', borderRadius: '24px', boxShadow: '0 15px 35px rgba(0,0,0,0.15)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Ingresos brutos (90 días)</div>
                      <div style={{ fontSize: '2.6rem', fontWeight: 900, color: 'white', fontFamily: 'var(--font-display)', lineHeight: 1 }}>{money(fin.gross)}</div>
                    </div>
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, color: fin.mode === 'live' ? '#4ADE80' : '#FDCB6E', background: 'rgba(255,255,255,0.1)', padding: '4px 9px', borderRadius: '7px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{fin.mode}</span>
                  </div>
                  <div style={{ margin: '18px 0' }}><MiniBars series={fin.series} height={64} /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    {[['Neto', money(fin.net)], ['Comisiones', money(fin.fees)], ['Transacciones', fin.count]].map(([l, v]) => (
                      <div key={l} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '10px 12px' }}>
                        <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.6)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'white' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Desglose por tipo */}
                <div>
                  <SectionTitle>Por tipo de venta</SectionTitle>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(() => {
                      const tot = Math.max(1, fin.byType.membresia + fin.byType.cafeteria);
                      return [
                        { name: 'Membresías', v: fin.byType.membresia, c: '#6C5CE7', Icon: Crown },
                        { name: 'Cafetería', v: fin.byType.cafeteria, c: '#E07A9C', Icon: Coffee },
                      ].map((x, i) => (
                        <RankRow key={i} rank={i + 1} title={x.name} value={money(x.v)} sub={`${Math.round((x.v / tot) * 100)}% de los ingresos`} pct={(x.v / tot) * 100} color={x.c} />
                      ));
                    })()}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '14px' }}>
                    <Kpi label="Ticket promedio" value={money(fin.avgTicket)} Icon={Receipt} />
                    <Kpi label="Reembolsado" value={money(fin.refunded)} Icon={TrendingUp} accent="#E17055" />
                  </div>
                </div>

                {/* Transacciones recientes */}
                <div>
                  <SectionTitle>Transacciones recientes</SectionTitle>
                  <div style={{ background: 'white', borderRadius: '18px', border: '1px solid rgba(0,0,0,0.03)', overflow: 'hidden' }}>
                    {fin.recent.length === 0 ? <div style={{ padding: '20px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>Sin transacciones</div>
                    : fin.recent.map((t, i) => (
                      <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderTop: i ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: t.type === 'cafeteria' ? 'rgba(224,122,156,0.12)' : 'rgba(108,92,231,0.12)', color: t.type === 'cafeteria' ? '#E07A9C' : '#6C5CE7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {t.type === 'cafeteria' ? <Coffee size={16} /> : <Crown size={16} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--black)', textTransform: 'capitalize' }}>{t.type}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.email || 'Sin correo'} · {new Date(t.created * 1000).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</div>
                        </div>
                        <div style={{ fontWeight: 800, color: t.status === 'refunded' ? '#E17055' : 'var(--black)', fontSize: '0.92rem' }}>{t.status === 'refunded' ? '-' : ''}{money(t.amount)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
          )}

          {/* ===== CLASES ===== */}
          {subtab === 'clases' && (
            loading ? <Loading /> : classRank.length === 0 ? <Empty text="Aún no hay asistencias registradas" sub="Los datos aparecen al hacer check-in en el mostrador." />
            : <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px' }}>
                  <Kpi label="Clase top" value={classRank[0].title} sub={`${classRank[0].asistencias} asistencias`} Icon={Crown} />
                  <Kpi label="Tipos de clase" value={classRank.length} Icon={CalendarDays} accent="#6C5CE7" />
                  <Kpi label="Asistencias" value={totalAsistencias} sub="check-ins totales" Icon={Activity} accent="#00B894" />
                </div>
                <div>
                  <SectionTitle>Ranking por asistencia</SectionTitle>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {classRank.slice(0, 12).map((c, i) => (
                      <RankRow key={c.title} rank={i + 1} title={c.title} value={`${c.asistencias}`} sub={`${c.reservas} reservas · ${c.reservas ? Math.round((c.asistencias / c.reservas) * 100) : 0}% asistencia`} pct={(c.asistencias / Math.max(1, classRank[0].asistencias)) * 100} color={PALETTE[i % PALETTE.length]} />
                    ))}
                  </div>
                </div>
              </div>
          )}

          {/* ===== COACHES ===== */}
          {subtab === 'coaches' && (
            loading ? <Loading /> : coachRank.length === 0 ? <Empty text="Sin datos de coaches" sub="Asigna coaches a las clases y registra asistencias." />
            : <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px' }}>
                  <Kpi label="Coach top" value={coachRank[0].name} sub={`${coachRank[0].asistencias} asistencias`} Icon={Crown} accent="#E07A9C" />
                  <Kpi label="Coaches activas" value={coachRank.length} Icon={Award} accent="#6C5CE7" />
                </div>
                <div>
                  <SectionTitle>Ranking de coaches</SectionTitle>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {coachRank.slice(0, 12).map((c, i) => (
                      <RankRow key={c.name + i} rank={i + 1} title={c.name} value={`${c.asistencias}`} sub={`${c.reservas} reservas`} pct={(c.asistencias / Math.max(1, coachRank[0].asistencias)) * 100} color={PALETTE[i % PALETTE.length]} avatar={c.avatar} />
                    ))}
                  </div>
                </div>
              </div>
          )}

          {/* ===== CAFETERÍA ===== */}
          {subtab === 'cafeteria' && (
            loading ? <Loading /> : cafe.orders === 0 ? <Empty text="Aún no hay ventas de cafetería" sub="Los pedidos pagados aparecerán aquí." />
            : <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px' }}>
                  <Kpi label="Ingresos café" value={money(cafe.revenue)} Icon={DollarSign} accent="#E07A9C" />
                  <Kpi label="Pedidos" value={cafe.orders} Icon={Coffee} />
                  <Kpi label="Ticket prom." value={money(cafe.avg)} Icon={Receipt} accent="#6C5CE7" />
                  <Kpi label="Regalos" value={cafe.gifts} Icon={Gift} accent="#00B894" />
                </div>
                <div>
                  <SectionTitle>Productos más vendidos</SectionTitle>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {cafe.ranking.slice(0, 12).map((p, i) => (
                      <RankRow key={p.name} rank={i + 1} title={p.name} value={`${p.qty}`} sub={`${money(p.revenue)} · ${p.qty} unidades`} pct={(p.qty / Math.max(1, cafe.ranking[0].qty)) * 100} color={PALETTE[i % PALETTE.length]} />
                    ))}
                  </div>
                </div>
              </div>
          )}

        </motion.div>
      </AnimatePresence>
    </section>
  );
}

function Loading() {
  return <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--on-surface-variant)' }}>Cargando datos…</div>;
}
function Empty({ text, sub }) {
  return (
    <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--on-surface-variant)' }}>
      <BarChart3 size={36} style={{ opacity: 0.3, marginBottom: '12px' }} />
      <p style={{ margin: 0, fontWeight: 700, color: 'var(--black)' }}>{text}</p>
      {sub && <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>{sub}</p>}
    </div>
  );
}
