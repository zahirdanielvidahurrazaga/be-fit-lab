import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import SearchableClientSelect from './SearchableClientSelect';
import { RefreshCw, ScrollText, Scale, Receipt, Users, Ban, Undo2, AlertTriangle, ArrowRight, Pencil, X } from 'lucide-react';

// Pestaña "Auditoría" del admin — control de saldos y ventas.
// Se alimenta del libro mayor class_credit_ledger (BD lo llena sola con cada
// cambio de saldo/membresía) + el RPC admin_audit_saldos (descuadres) + sales.
// Nace del reporte de la dueña (13-jul): saldos que no cuadraban, un plan
// pagado sin activar y ventas duplicadas que inflaban el dashboard.

const PRIMARY = 'var(--primary)';

// Etiquetas humanas para la columna `source` del ledger.
const FUENTES = {
  reserva:           { label: 'Reserva (app)',              color: '#2563EB' },
  reserva_admin:     { label: 'Reserva por staff',          color: '#2563EB' },
  cancelacion:       { label: 'Cancelación (devuelta)',     color: '#059669' },
  cancelacion_admin: { label: 'Cancelación por staff',      color: '#059669' },
  promocion_espera:  { label: 'Subió de lista de espera',   color: '#7C3AED' },
  activacion_plan:   { label: 'Cobro / activación de plan', color: '#EA7A3B' },
  alta_con_plan:     { label: 'Alta con plan incluido',     color: '#EA7A3B' },
  ajuste_manual:     { label: 'Ajuste manual de staff',     color: '#DC2626' },
  stripe_sistema:    { label: 'Stripe / sistema',           color: '#0891B2' },
  baja_membresia:    { label: 'Baja de membresía',          color: '#6B7280' },
  app_clienta:       { label: 'App de la clienta',          color: '#6B7280' },
  sistema:           { label: 'Sistema',                    color: '#6B7280' },
  desconocido:       { label: '—',                          color: '#6B7280' },
};

const fmtFecha = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) + ' · ' +
         d.toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' });
};

const norm = (s = '') => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();

const card = { background: 'var(--surface, #fff)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '18px', padding: '18px', marginBottom: '18px' };
const h3 = { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', margin: '0 0 4px', color: 'var(--black)', fontFamily: 'var(--font-display)' };
const hint = { fontSize: '0.82rem', color: 'var(--on-surface-variant)', margin: '0 0 14px', lineHeight: 1.45 };
const chip = (bg, color) => ({ fontSize: '0.72rem', fontWeight: 700, padding: '3px 9px', borderRadius: '8px', background: bg, color, whiteSpace: 'nowrap' });
const thStyle = { textAlign: 'left', padding: '8px 10px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--on-surface-variant)', borderBottom: '1px solid rgba(0,0,0,0.08)', whiteSpace: 'nowrap' };
const tdStyle = { padding: '9px 10px', fontSize: '0.85rem', color: 'var(--black)', borderBottom: '1px solid rgba(0,0,0,0.05)', verticalAlign: 'top' };

export default function AdminControlSaldos() {
  const { user, allUsers, fetchAllUsers } = useAuth();

  // ── Movimientos (ledger) ──────────────────────────────────────────────────
  const [ledgerUserId, setLedgerUserId] = useState('');
  const [ledger, setLedger] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  const fetchLedger = useCallback(async () => {
    setLedgerLoading(true);
    let q = supabase.from('class_credit_ledger')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(ledgerUserId ? 100 : 40);
    if (ledgerUserId) q = q.eq('user_id', ledgerUserId);
    const { data } = await q;
    setLedger(data || []);
    setLedgerLoading(false);
  }, [ledgerUserId]);

  useEffect(() => { fetchLedger(); }, [fetchLedger]);

  // ── Descuadres (RPC) ──────────────────────────────────────────────────────
  const [descuadres, setDescuadres] = useState(null);
  const [descLoading, setDescLoading] = useState(false);

  const fetchDescuadres = useCallback(async () => {
    setDescLoading(true);
    const { data, error } = await supabase.rpc('admin_audit_saldos');
    if (!error) setDescuadres(data || []);
    setDescLoading(false);
  }, []);

  useEffect(() => { fetchDescuadres(); }, [fetchDescuadres]);

  // ── Ventas (huérfanas / duplicadas / anular) ─────────────────────────────
  const [sales, setSales] = useState([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [voidBusy, setVoidBusy] = useState(null);

  const fetchSales = useCallback(async () => {
    setSalesLoading(true);
    const { data } = await supabase.from('sales')
      .select('id, user_id, plan_name, amount, method, created_at, client_name, client_email, voided')
      .order('created_at', { ascending: false })
      .limit(400);
    setSales(data || []);
    setSalesLoading(false);
  }, []);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  // Sospechosas: huérfanas (sin cuenta) + posibles duplicadas (misma clienta,
  // mismo plan, con menos de 30 min entre sí).
  const ventasSospechosas = useMemo(() => {
    const flags = new Map(); // id → motivo
    for (const s of sales) {
      if (!s.user_id && !s.client_name) flags.set(s.id, 'Cuenta borrada');
      else if (!s.user_id) flags.set(s.id, `Cuenta borrada (era ${s.client_name})`);
    }
    const byKey = {};
    for (const s of sales) {
      const key = (s.user_id || norm(s.client_name || '?')) + '|' + s.plan_name;
      (byKey[key] = byKey[key] || []).push(s);
    }
    for (const group of Object.values(byKey)) {
      if (group.length < 2) continue;
      const sorted = group.slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      for (let i = 1; i < sorted.length; i++) {
        const gapMin = (new Date(sorted[i].created_at) - new Date(sorted[i - 1].created_at)) / 60000;
        if (gapMin < 30) {
          const motivo = `Posible duplicada (${Math.round(gapMin) || '<1'} min después de otra igual)`;
          flags.set(sorted[i].id, flags.has(sorted[i].id) ? flags.get(sorted[i].id) + ' · ' + motivo : motivo);
          if (!flags.has(sorted[i - 1].id)) flags.set(sorted[i - 1].id, 'Tiene una posible duplicada');
        }
      }
    }
    return sales.filter(s => flags.has(s.id) || s.voided).map(s => ({ ...s, motivo: flags.get(s.id) || '' }));
  }, [sales]);

  const montoFantasma = useMemo(() =>
    ventasSospechosas.filter(s => !s.voided && /duplicada|borrada/i.test(s.motivo)).reduce((t, s) => t + (s.amount || 0), 0),
  [ventasSospechosas]);

  const toggleVoid = async (s) => {
    const accion = s.voided ? 'restaurar' : 'ANULAR';
    const quien = s.client_name || 'cuenta borrada';
    if (!confirm(`¿${accion} la venta de "${s.plan_name}" ($${s.amount}) de ${quien}?\n\n${s.voided ? 'Volverá a contar en el dashboard.' : 'Dejará de contar como ingreso en el dashboard. No se borra: queda marcada.'}`)) return;
    setVoidBusy(s.id);
    const { error } = await supabase.from('sales').update(
      s.voided ? { voided: false, voided_at: null, voided_by: null }
               : { voided: true, voided_at: new Date().toISOString(), voided_by: user?.id }
    ).eq('id', s.id);
    setVoidBusy(null);
    if (error) { alert('No se pudo actualizar: ' + error.message); return; }
    fetchSales();
  };

  // ── Cuentas duplicadas ────────────────────────────────────────────────────
  const gruposDuplicados = useMemo(() => {
    const clients = (allUsers || []).filter(u => u.role === 'CLIENT');
    const grupos = [];
    const usado = new Set();
    for (let i = 0; i < clients.length; i++) {
      if (usado.has(clients[i].id)) continue;
      const a = norm(clients[i].full_name || '');
      if (!a) continue;
      const grupo = [clients[i]];
      for (let j = i + 1; j < clients.length; j++) {
        if (usado.has(clients[j].id)) continue;
        const b = norm(clients[j].full_name || '');
        const mismoTel = clients[i].phone && clients[j].phone && clients[i].phone.replace(/\D/g, '') === clients[j].phone.replace(/\D/g, '');
        // Mismo nombre, o uno es "prefijo por palabras" del otro (≥2 palabras):
        // "margarita ruiz" ⊂ "margarita ruiz lara".
        const prefijo = (x, y) => x.split(' ').length >= 2 && (y === x || y.startsWith(x + ' '));
        if (b && (mismoTel || prefijo(a, b) || prefijo(b, a))) {
          grupo.push(clients[j]);
          usado.add(clients[j].id);
        }
      }
      if (grupo.length > 1) { grupo.forEach(g => usado.add(g.id)); grupos.push(grupo); }
    }
    return grupos;
  }, [allUsers]);

  const nombreLedger = ledgerUserId ? (allUsers || []).find(u => u.id === ledgerUserId)?.full_name : null;

  // ── Corregir saldo (con motivo → queda en el ledger) ─────────────────────
  const [fixTarget, setFixTarget] = useState(null); // { userId, nombre, saldoActual, sugerido }
  const [fixSaldo, setFixSaldo] = useState('');
  const [fixMotivo, setFixMotivo] = useState('');
  const [fixBusy, setFixBusy] = useState(false);

  const openFix = (userId, nombre, saldoActual, sugerido, motivoSugerido = '') => {
    setFixTarget({ userId, nombre, saldoActual });
    setFixSaldo(String(sugerido ?? saldoActual ?? 0));
    setFixMotivo(motivoSugerido);
  };

  const saveFix = async () => {
    const nuevo = parseInt(fixSaldo, 10);
    if (Number.isNaN(nuevo) || nuevo < 0 || nuevo > 9999) { alert('El saldo debe ser un número entre 0 y 9999.'); return; }
    if (!fixMotivo.trim()) { alert('Escribe el motivo: es lo que queda en el historial.'); return; }
    setFixBusy(true);
    const { error } = await supabase.rpc('admin_set_saldo', {
      p_user_id: fixTarget.userId, p_new_balance: nuevo, p_note: fixMotivo.trim(),
    });
    setFixBusy(false);
    if (error) {
      const msgs = { NO_AUTORIZADO: 'Solo admin/recepción pueden corregir saldos.', MOTIVO_REQUERIDO: 'Escribe el motivo.', SALDO_INVALIDO: 'Saldo inválido.', CLIENTA_NO_EXISTE: 'La clienta ya no existe.' };
      alert(msgs[error.message] || 'No se pudo corregir: ' + error.message);
      return;
    }
    setFixTarget(null);
    fetchDescuadres();
    fetchLedger();
    fetchAllUsers?.();
  };

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', margin: 0, color: 'var(--black)' }}>Auditoría</h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>Control de saldos, ventas y cuentas</span>
      </div>

      {/* ── 1. DESCUADRES ── */}
      <div style={card}>
        <h3 style={h3}><Scale size={18} color={PRIMARY} /> Saldos que no cuadran
          <button onClick={fetchDescuadres} disabled={descLoading} style={{ marginLeft: 'auto', border: 'none', background: 'rgba(0,0,0,0.05)', borderRadius: '10px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--black)' }}>
            <RefreshCw size={13} style={descLoading ? { animation: 'spin 1s linear infinite' } : {}} /> Actualizar
          </button>
        </h3>
        <p style={hint}>
          Compara, por clienta con plan activo: las clases que su plan da menos su saldo actual (= lo descontado)
          contra sus reservas confirmadas desde que empezó el plan. <b>Diferencia positiva</b> = tiene más saldo del
          que debería (reservas que no se descontaron, ajustes manuales o un re-cobro que reseteó el saldo).
          El detalle exacto de cada caso está en «Movimientos».
        </p>
        {descuadres === null ? <p style={hint}>Cargando…</p> : descuadres.length === 0 ? (
          <p style={{ ...hint, color: '#059669', fontWeight: 700, margin: 0 }}>Todo cuadra ✓</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                <th style={thStyle}>Clienta</th><th style={thStyle}>Plan</th><th style={thStyle}>Saldo</th>
                <th style={thStyle}>Descontadas</th><th style={thStyle}>Reservas</th><th style={thStyle}>Diferencia</th><th style={thStyle}></th>
              </tr></thead>
              <tbody>
                {descuadres.map(d => (
                  <tr key={d.user_id}>
                    <td style={tdStyle}><b>{d.nombre || d.email}</b></td>
                    <td style={tdStyle}>{(d.plan || '').replace('Plan ', '')} ({d.plan_clases})</td>
                    <td style={tdStyle}>{d.saldo}</td>
                    <td style={tdStyle}>{d.descontadas}</td>
                    <td style={tdStyle}>{d.reservas}</td>
                    <td style={tdStyle}>
                      <span style={chip(d.diferencia > 0 ? 'rgba(220,38,38,0.1)' : 'rgba(234,122,59,0.12)', d.diferencia > 0 ? '#DC2626' : '#EA7A3B')}>
                        {d.diferencia > 0 ? `+${d.diferencia} sin descontar` : `${d.diferencia} de más`}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <button onClick={() => setLedgerUserId(d.user_id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: PRIMARY, fontWeight: 700, fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          Movimientos <ArrowRight size={12} />
                        </button>
                        <button onClick={() => openFix(d.user_id, d.nombre || d.email, d.saldo, Math.max(0, (d.plan_clases || 0) - Number(d.reservas || 0)), `Corrección por auditoría: ${d.reservas} reservas desde el inicio del plan vs ${d.descontadas} descontadas`)}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', border: 'none', borderRadius: '9px', padding: '5px 9px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(255,145,77,0.12)', color: PRIMARY }}>
                          <Pencil size={12} /> Corregir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 2. MOVIMIENTOS (ledger) ── */}
      <div style={card}>
        <h3 style={h3}><ScrollText size={18} color={PRIMARY} /> Movimientos de saldo
          <button onClick={fetchLedger} disabled={ledgerLoading} style={{ marginLeft: 'auto', border: 'none', background: 'rgba(0,0,0,0.05)', borderRadius: '10px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--black)' }}>
            <RefreshCw size={13} style={ledgerLoading ? { animation: 'spin 1s linear infinite' } : {}} /> Actualizar
          </button>
        </h3>
        <p style={hint}>
          Historial automático de <b>cada</b> cambio de clases o membresía: reservas, cancelaciones, cobros,
          ajustes manuales y Stripe — con quién lo hizo. Registra desde el 14 de julio de 2026 (lo anterior no existe).
        </p>
        <div style={{ maxWidth: '420px', marginBottom: '12px' }}>
          <SearchableClientSelect clients={allUsers || []} value={ledgerUserId} onChange={setLedgerUserId} placeholder="Filtrar por clienta (o deja vacío: últimos movimientos)…" />
        </div>
        {nombreLedger && (
          <p style={{ ...hint, marginTop: '-4px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span>Mostrando movimientos de <b>{nombreLedger}</b>.</span>
            <button onClick={() => {
              const u = (allUsers || []).find(x => x.id === ledgerUserId);
              openFix(ledgerUserId, nombreLedger, u?.classes_remaining ?? 0, u?.classes_remaining ?? 0);
            }} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', border: 'none', borderRadius: '9px', padding: '5px 9px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(255,145,77,0.12)', color: PRIMARY }}>
              <Pencil size={12} /> Ajustar saldo
            </button>
          </p>
        )}
        {ledger.length === 0 ? (
          <p style={{ ...hint, margin: 0 }}>{ledgerLoading ? 'Cargando…' : 'Sin movimientos registrados todavía.'}</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                <th style={thStyle}>Cuándo</th>{!ledgerUserId && <th style={thStyle}>Clienta</th>}<th style={thStyle}>Cambio</th>
                <th style={thStyle}>Saldo</th><th style={thStyle}>Origen</th><th style={thStyle}>Hecho por</th><th style={thStyle}>Nota</th>
              </tr></thead>
              <tbody>
                {ledger.map(m => {
                  const f = FUENTES[m.source] || FUENTES.desconocido;
                  return (
                    <tr key={m.id}>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{fmtFecha(m.created_at)}</td>
                      {!ledgerUserId && <td style={tdStyle}><b>{m.user_name || m.user_email || '—'}</b></td>}
                      <td style={{ ...tdStyle, fontWeight: 800, color: m.delta > 0 ? '#059669' : m.delta < 0 ? '#DC2626' : 'var(--on-surface-variant)' }}>
                        {m.delta > 0 ? `+${m.delta}` : m.delta}
                      </td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{m.balance_before ?? '—'} → {m.balance_after ?? '—'}</td>
                      <td style={tdStyle}><span style={chip(f.color + '1a', f.color)}>{f.label}</span></td>
                      <td style={tdStyle}>{m.actor_name || (m.db_role === 'service_role' ? 'Servidor' : '—')}</td>
                      <td style={{ ...tdStyle, fontSize: '0.78rem', color: 'var(--on-surface-variant)' }}>{m.note || ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 3. VENTAS SOSPECHOSAS ── */}
      <div style={card}>
        <h3 style={h3}><Receipt size={18} color={PRIMARY} /> Ventas por revisar
          <button onClick={fetchSales} disabled={salesLoading} style={{ marginLeft: 'auto', border: 'none', background: 'rgba(0,0,0,0.05)', borderRadius: '10px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--black)' }}>
            <RefreshCw size={13} style={salesLoading ? { animation: 'spin 1s linear infinite' } : {}} /> Actualizar
          </button>
        </h3>
        <p style={hint}>
          Cobros registrados a cuentas que ya se borraron y cobros repetidos del mismo plan a la misma clienta
          en menos de 30 minutos (doble click o re-cobro). <b>Anular</b> una venta la saca del dashboard financiero
          sin borrarla — úsalo con las duplicadas para que el ingreso del mes sea el real.
        </p>
        {montoFantasma > 0 && (
          <p style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 700, color: '#B45309', background: 'rgba(245,158,11,0.1)', borderRadius: '12px', padding: '10px 14px' }}>
            <AlertTriangle size={16} /> Hay ${montoFantasma.toLocaleString('es-MX')} en ventas por revisar que hoy cuentan como ingreso.
          </p>
        )}
        {ventasSospechosas.length === 0 ? (
          <p style={{ ...hint, color: '#059669', fontWeight: 700, margin: 0 }}>{salesLoading ? 'Cargando…' : 'Nada sospechoso ✓'}</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                <th style={thStyle}>Fecha</th><th style={thStyle}>Clienta</th><th style={thStyle}>Plan</th>
                <th style={thStyle}>Monto</th><th style={thStyle}>Método</th><th style={thStyle}>Motivo</th><th style={thStyle}></th>
              </tr></thead>
              <tbody>
                {ventasSospechosas.map(s => (
                  <tr key={s.id} style={s.voided ? { opacity: 0.45 } : {}}>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{fmtFecha(s.created_at)}</td>
                    <td style={tdStyle}><b>{s.client_name || 'Cuenta borrada'}</b>{s.client_email ? <div style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)' }}>{s.client_email}</div> : null}</td>
                    <td style={tdStyle}>{s.plan_name}</td>
                    <td style={tdStyle}><b>${s.amount}</b></td>
                    <td style={tdStyle}>{s.method}</td>
                    <td style={{ ...tdStyle, fontSize: '0.78rem' }}>{s.voided ? <span style={chip('rgba(107,114,128,0.12)', '#6B7280')}>ANULADA</span> : s.motivo}</td>
                    <td style={tdStyle}>
                      <button onClick={() => toggleVoid(s)} disabled={voidBusy === s.id}
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', border: 'none', borderRadius: '10px', padding: '6px 10px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, background: s.voided ? 'rgba(5,150,105,0.1)' : 'rgba(220,38,38,0.08)', color: s.voided ? '#059669' : '#DC2626' }}>
                        {s.voided ? <><Undo2 size={13} /> Restaurar</> : <><Ban size={13} /> Anular</>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 4. CUENTAS DUPLICADAS ── */}
      <div style={card}>
        <h3 style={h3}><Users size={18} color={PRIMARY} /> Posibles cuentas duplicadas</h3>
        <p style={hint}>
          Clientas con nombre casi idéntico o el mismo teléfono. El riesgo: cobrar el plan en una cuenta mientras
          la clienta reserva desde la otra. Antes de borrar una, revisa en «Movimientos» cuál usa de verdad —
          y mejor dala de baja en lugar de borrarla (borrar deja las ventas sin nombre).
        </p>
        {gruposDuplicados.length === 0 ? (
          <p style={{ ...hint, color: '#059669', fontWeight: 700, margin: 0 }}>Sin duplicados aparentes ✓</p>
        ) : gruposDuplicados.map((grupo, gi) => (
          <div key={gi} style={{ border: '1px dashed rgba(0,0,0,0.15)', borderRadius: '14px', padding: '12px 14px', marginBottom: '10px' }}>
            {grupo.map(u => (
              <div key={u.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', padding: '5px 0' }}>
                <b style={{ fontSize: '0.9rem', color: 'var(--black)' }}>{u.full_name}</b>
                <span style={{ fontSize: '0.78rem', color: 'var(--on-surface-variant)' }}>{u.email}</span>
                <span style={chip('rgba(0,0,0,0.05)', 'var(--on-surface-variant)')}>{u.membership_plan || 'Sin plan'}</span>
                <span style={chip('rgba(255,145,77,0.12)', PRIMARY)}>{(u.classes_remaining ?? 0) >= 9000 ? '∞' : (u.classes_remaining ?? 0)} clases</span>
                <button onClick={() => setLedgerUserId(u.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: PRIMARY, fontWeight: 700, fontSize: '0.75rem' }}>Ver movimientos →</button>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* ── MODAL: corregir saldo ── */}
      {fixTarget && (
        <div onClick={() => !fixBusy && setFixTarget(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ background: 'white', borderRadius: '20px', padding: '22px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <h3 style={{ ...h3, margin: 0 }}><Pencil size={17} color={PRIMARY} /> Corregir saldo</h3>
              <button onClick={() => setFixTarget(null)} disabled={fixBusy} style={{ border: 'none', background: 'rgba(0,0,0,0.05)', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={15} />
              </button>
            </div>
            <p style={{ ...hint, marginBottom: '14px' }}>
              <b>{fixTarget.nombre}</b> — saldo actual: <b>{fixTarget.saldoActual}</b> clases.
            </p>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--on-surface-variant)', marginBottom: '5px' }}>Nuevo saldo</label>
            <input type="number" min="0" max="9999" value={fixSaldo} onChange={(e) => setFixSaldo(e.target.value)}
              style={{ width: '100%', padding: '11px 13px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.14)', fontSize: '1rem', fontWeight: 700, marginBottom: '13px', boxSizing: 'border-box' }} />
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--on-surface-variant)', marginBottom: '5px' }}>Motivo (obligatorio)</label>
            <textarea value={fixMotivo} onChange={(e) => setFixMotivo(e.target.value)} rows={3} placeholder="Ej. Corrección por auditoría: reservas sin descontar"
              style={{ width: '100%', padding: '11px 13px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.14)', fontSize: '0.88rem', resize: 'vertical', marginBottom: '10px', boxSizing: 'border-box', fontFamily: 'inherit' }} />
            <p style={{ ...hint, fontSize: '0.75rem', marginBottom: '14px' }}>
              Quedará en «Movimientos» como ajuste manual, con tu nombre y este motivo.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setFixTarget(null)} disabled={fixBusy}
                style={{ flex: 1, padding: '12px', borderRadius: '13px', border: '1px solid rgba(0,0,0,0.12)', background: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', color: 'var(--black)' }}>
                Cancelar
              </button>
              <button onClick={saveFix} disabled={fixBusy || !fixMotivo.trim()}
                style={{ flex: 1, padding: '12px', borderRadius: '13px', border: 'none', background: PRIMARY, color: 'white', cursor: fixBusy ? 'wait' : 'pointer', fontWeight: 700, fontSize: '0.9rem', opacity: fixBusy || !fixMotivo.trim() ? 0.55 : 1 }}>
                {fixBusy ? 'Guardando…' : 'Guardar corrección'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
