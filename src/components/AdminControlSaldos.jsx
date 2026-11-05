import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import SearchableClientSelect from './SearchableClientSelect';
import { RefreshCw, ScrollText, Scale, Receipt, Users, Ban, Undo2, AlertTriangle, ArrowRight, Pencil, X, CheckCircle2, ChevronDown } from 'lucide-react';

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
  clase_suelta:      { label: 'Clase suelta comprada',      color: '#EA7A3B' },
  clase_suelta_sin_plan: { label: 'Clase suelta (sin plan)', color: '#EA7A3B' },
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

// Ojo: una fecha SIN hora ('2026-08-29') la parsea el navegador como medianoche
// UTC y en México se pinta el día anterior. Se le pega mediodía local.
const fmtDia = (iso) => {
  if (!iso) return '—';
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00`) : new Date(iso);
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
};

const plural = (n, sing, plur) => `${n} ${n === 1 ? sing : plur}`;

const norm = (s = '') => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();

const h3 = { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', margin: '0 0 4px', color: 'var(--black)', fontFamily: 'var(--font-display)' };
const hint = { fontSize: '0.82rem', color: 'var(--on-surface-variant)', margin: '0 0 14px', lineHeight: 1.45 };
const chip = (bg, color) => ({ fontSize: '0.72rem', fontWeight: 700, padding: '3px 9px', borderRadius: '8px', background: bg, color, whiteSpace: 'nowrap' });

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

  // Fecha desde la que el rastro clase↔cobro está completo. Antes de eso no se
  // guardaba a qué clase iba cada descuento, así que NO se audita: cualquier
  // cifra sería inventada (que es justo lo que hacía la versión anterior).
  const [trazableDesde, setTrazableDesde] = useState(null);
  useEffect(() => {
    supabase.from('audit_config').select('trazable_desde').eq('id', 1).maybeSingle()
      .then(({ data }) => setTrazableDesde(data?.trazable_desde || null));
  }, []);

  // Primero lo que le cuesta dinero al estudio (clases no cobradas), y dentro
  // de cada grupo, la clase más reciente arriba.
  const descOrdenados = useMemo(() => {
    if (!descuadres) return null;
    return [...descuadres].sort((a, b) =>
      (a.tipo === 'reserva_sin_cobro' ? 0 : 1) - (b.tipo === 'reserva_sin_cobro' ? 0 : 1)
      || String(b.fecha_clase || '').localeCompare(String(a.fecha_clase || '')));
  }, [descuadres]);


  // ── Ventas (huérfanas / duplicadas / anular) ─────────────────────────────
  const [sales, setSales] = useState([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [voidBusy, setVoidBusy] = useState(null);

  const fetchSales = useCallback(async () => {
    setSalesLoading(true);
    const { data } = await supabase.from('sales')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(400);
    setSales(data || []);
    setSalesLoading(false);
  }, []);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  // ── Cobros dobles: pares/grupos de la MISMA clienta y plan con < 30 min ──
  // Solo esto pide una decisión ("¿es el mismo pago?"). Las ventas de cuentas
  // borradas NO son pendientes: el dinero sí entró, solo perdió el vínculo.
  const gruposCobroDoble = useMemo(() => {
    const porClave = {};
    for (const v of sales) {
      if (!v.user_id && !v.client_name) continue;
      const k = (v.user_id || norm(v.client_name)) + '|' + v.plan_name;
      (porClave[k] = porClave[k] || []).push(v);
    }
    const grupos = [];
    for (const lista of Object.values(porClave)) {
      const ord = lista.slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      let actual = [ord[0]];
      for (let i = 1; i < ord.length; i++) {
        if ((new Date(ord[i].created_at) - new Date(ord[i - 1].created_at)) / 60000 < 30) actual.push(ord[i]);
        else { if (actual.length > 1) grupos.push(actual); actual = [ord[i]]; }
      }
      if (actual.length > 1) grupos.push(actual);
    }
    return grupos
      .map(g => ({ ventas: g, pendiente: g.filter(v => !v.voided).length > 1 && !g.every(v => v.revisada) }))
      .sort((a, b) => (b.pendiente - a.pendiente) || (new Date(b.ventas[0].created_at) - new Date(a.ventas[0].created_at)));
  }, [sales]);
  const doblesPendientes = gruposCobroDoble.filter(g => g.pendiente);
  const ventasHuerfanas = useMemo(() => sales.filter(v => !v.user_id && !v.voided), [sales]);

  const marcarRevisadas = async (grupo) => {
    if (!confirm('¿Confirmas que son PAGOS DISTINTOS (las dos cuentan como ingreso)?\n\nDejarán de salir como pendientes.')) return;
    const ids = grupo.ventas.map(v => v.id);
    const { error } = await supabase.from('sales').update({ revisada: true }).in('id', ids);
    if (error) {
      alert(/revisada/.test(error.message)
        ? 'Falta activar esta opción en la base de datos. Avísale a Zahir.'
        : 'No se pudo guardar: ' + error.message);
      return;
    }
    fetchSales();
  };

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

  // Cuántas cosas piden acción de verdad. Auditoría es una BANDEJA DE
  // PENDIENTES, no un explorador de datos: su estado normal es "todo cuadra".
  // Cuando se mezclaron las dos cosas, la dueña leyó 37 renglones de ruido como
  // 37 tareas y "corrigió" 53 clases que estaban bien cobradas.
  const pendientes = (descuadres?.length || 0) + doblesPendientes.length + (gruposDuplicados?.length || 0);
  const cargando = descuadres === null;

  // Pestañas: una cosa a la vez. Antes todo estaba apilado con párrafos largos
  // y la dueña no sabía por dónde empezar ("mega confuso").
  const TABS = [
    ['saldos', 'Saldos', descuadres?.length || 0],
    ['dobles', 'Cobros dobles', doblesPendientes.length],
    ['cuentas', 'Cuentas dobles', gruposDuplicados?.length || 0],
    ['historial', 'Historial', null],
  ];
  const [tab, setTab] = useState(null);
  const tabActiva = tab || (TABS.find(t => t[2] > 0)?.[0]) || 'saldos';
  const verHistorialDe = (id) => { setLedgerUserId(id); setTab('historial'); };

  const queEs = (texto) => (
    <details style={{ margin: '0 0 14px' }}>
      <summary style={{ cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, color: 'var(--on-surface-variant)' }}>¿Qué significa esto?</summary>
      <div style={{ ...hint, margin: '8px 0 0' }}>{texto}</div>
    </details>
  );
  const vacio = (texto) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '18px', borderRadius: '14px', background: 'rgba(5,150,105,0.07)', color: '#047857', fontWeight: 700, fontSize: '0.9rem' }}>
      <CheckCircle2 size={20} /> {texto}
    </div>
  );
  const btnSec = { display: 'inline-flex', alignItems: 'center', gap: '5px', border: 'none', borderRadius: '10px', padding: '8px 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, fontFamily: 'inherit' };

  return (
    <section>
      <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', margin: '0 0 12px', color: 'var(--black)' }}>Auditoría</h2>

      {/* Estado general en una línea */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '13px 15px', marginBottom: '14px', borderRadius: '16px',
        background: cargando ? 'rgba(0,0,0,0.03)' : pendientes === 0 ? 'rgba(5,150,105,0.08)' : 'rgba(234,122,59,0.09)' }}>
        {!cargando && (pendientes === 0
          ? <CheckCircle2 size={20} color="#059669" style={{ flexShrink: 0 }} />
          : <AlertTriangle size={20} color="#EA7A3B" style={{ flexShrink: 0 }} />)}
        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--black)' }}>
          {cargando ? 'Revisando…' : pendientes === 0 ? 'Todo cuadra. No hay nada que corregir.' : `${plural(pendientes, 'cosa por revisar', 'cosas por revisar')}`}
        </div>
      </div>

      {/* Pestañas */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', marginBottom: '16px', WebkitOverflowScrolling: 'touch' }}>
        {TABS.map(([id, label, n]) => {
          const activa = tabActiva === id;
          return (
            <button key={id} onClick={() => setTab(id)}
              style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 14px', borderRadius: '999px', fontFamily: 'inherit',
                       border: activa ? '1px solid var(--primary)' : '1px solid rgba(0,0,0,0.08)', cursor: 'pointer',
                       background: activa ? 'rgba(255,145,77,0.12)' : '#fff', color: activa ? 'var(--primary)' : 'var(--black)', fontWeight: 800, fontSize: '0.84rem' }}>
              {label}
              {n !== null && (
                <span style={{ minWidth: '20px', padding: '1px 6px', borderRadius: '999px', fontSize: '0.72rem', textAlign: 'center',
                               background: n > 0 ? '#EA7A3B' : 'rgba(0,0,0,0.07)', color: n > 0 ? '#fff' : 'var(--on-surface-variant)' }}>{n}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── SALDOS ── */}
      {tabActiva === 'saldos' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <p style={{ ...hint, margin: 0, flex: 1 }}>Clases donde la reserva y el cobro no coinciden.</p>
            <button onClick={fetchDescuadres} disabled={descLoading} aria-label="Actualizar" style={{ ...btnSec, background: 'rgba(0,0,0,0.05)', color: 'var(--black)', padding: '7px 9px' }}>
              <RefreshCw size={14} style={descLoading ? { animation: 'spin 1s linear infinite' } : {}} />
            </button>
          </div>
          {queEs(<>
            <b>No se le descontó:</b> tiene lugar en la clase y nunca se le cobró (el estudio se la está regalando).<br />
            <b>Se le descontó de más:</b> se le cobró y ya no tiene lugar (el estudio se la debe).<br />
            No aparecen pagos en efectivo, cortesías ni reposiciones: esas son decisiones tuyas{trazableDesde ? <>. Solo se revisa desde el <b>{fmtDia(trazableDesde)}</b></> : null}.
          </>)}
          {descuadres === null ? <p style={hint}>Cargando…</p> : descuadres.length === 0 ? vacio('Todos los saldos cuadran.') : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {descOrdenados.map(d => {
                const sinCobro = d.tipo === 'reserva_sin_cobro';
                const acento = sinCobro ? '#DC2626' : '#EA7A3B';
                const motivo = sinCobro
                  ? `Cobro de la clase "${d.clase}" del ${fmtDia(d.fecha_clase)}, que había quedado sin descontar`
                  : `Devolución de la clase "${d.clase}" del ${fmtDia(d.fecha_clase)}, que se cobró sin que tuviera lugar`;
                return (
                  <div key={`${d.user_id}-${d.class_id}-${d.tipo}`} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)', borderLeft: `4px solid ${acento}`, borderRadius: '14px', padding: '13px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'baseline' }}>
                      <b style={{ fontSize: '0.95rem', color: 'var(--black)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.nombre || d.email}</b>
                      <span style={{ ...chip(sinCobro ? 'rgba(220,38,38,0.1)' : 'rgba(234,122,59,0.12)', acento), flexShrink: 0 }}>{sinCobro ? 'No se le descontó' : 'De más'}</span>
                    </div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--black)', margin: '6px 0 10px' }}>
                      {d.clase} · {fmtDia(d.fecha_clase)}{d.hora_clase ? ` · ${d.hora_clase}` : ''}
                      <span style={{ color: 'var(--on-surface-variant)' }}> — hoy tiene {plural(d.saldo, 'clase', 'clases')}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button onClick={() => openFix(d.user_id, d.nombre || d.email, d.saldo, d.saldo_sugerido, motivo)} style={{ ...btnSec, background: 'rgba(255,145,77,0.14)', color: PRIMARY }}>
                        <Pencil size={13} /> {sinCobro ? 'Descontar 1' : 'Devolver 1'}
                      </button>
                      <button onClick={() => verHistorialDe(d.user_id)} style={{ ...btnSec, background: 'rgba(0,0,0,0.04)', color: 'var(--black)' }}>
                        Ver su historial <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── COBROS DOBLES ── */}
      {tabActiva === 'dobles' && (
        <div>
          <p style={{ ...hint, marginBottom: '6px' }}>A la misma clienta se le registró el mismo plan dos veces en menos de 30 minutos.</p>
          {queEs(<>
            Si fue <b>un solo pago capturado dos veces</b>, anula la repetida: deja de contar como ingreso (no se borra).
            Si fueron <b>dos pagos distintos</b>, márcalos como revisados y dejan de salir aquí.
          </>)}
          {salesLoading && sales.length === 0 ? <p style={hint}>Cargando…</p> : doblesPendientes.length === 0 ? vacio('No hay cobros dobles por revisar.') : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {doblesPendientes.map((g, gi) => {
                const primera = g.ventas[0];
                return (
                  <div key={gi} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '14px', padding: '13px 14px' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--black)' }}>{primera.client_name || 'Cuenta borrada'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', marginBottom: '10px' }}>{primera.plan_name} · ${primera.amount}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                      {g.ventas.map((v, i) => (
                        <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 11px', borderRadius: '11px', background: 'rgba(0,0,0,0.03)', opacity: v.voided ? 0.5 : 1 }}>
                          <div style={{ flex: 1, minWidth: 0, fontSize: '0.84rem' }}>
                            <b>{i === 0 ? '1er cobro' : `${i + 1}º cobro`}</b> · {fmtFecha(v.created_at)} · {v.method}
                            {v.voided && <span style={{ ...chip('rgba(107,114,128,0.12)', '#6B7280'), marginLeft: '6px' }}>Anulada</span>}
                          </div>
                          {i > 0 && (
                            <button onClick={() => toggleVoid(v)} disabled={voidBusy === v.id}
                              style={{ ...btnSec, padding: '6px 10px', background: v.voided ? 'rgba(5,150,105,0.1)' : 'rgba(220,38,38,0.08)', color: v.voided ? '#059669' : '#DC2626' }}>
                              {v.voided ? <><Undo2 size={13} /> Restaurar</> : <><Ban size={13} /> Anular</>}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button onClick={() => marcarRevisadas(g)} style={{ ...btnSec, background: 'rgba(5,150,105,0.1)', color: '#047857' }}>
                      <CheckCircle2 size={14} /> Eran pagos distintos
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {ventasHuerfanas.length > 0 && (
            <details style={{ marginTop: '18px' }}>
              <summary style={{ cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, color: 'var(--on-surface-variant)' }}>
                {plural(ventasHuerfanas.length, 'venta de una cuenta borrada', 'ventas de cuentas borradas')} — no hay que hacer nada
              </summary>
              <p style={{ ...hint, margin: '8px 0 10px' }}>El dinero sí entró; solo que esa cuenta ya no existe. Se quedan contando como ingreso.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {ventasHuerfanas.slice(0, 60).map(v => (
                  <div key={v.id} style={{ fontSize: '0.8rem', padding: '8px 10px', borderRadius: '10px', background: 'rgba(0,0,0,0.03)' }}>
                    <b>{v.client_name || 'Sin nombre'}</b> · {v.plan_name} · ${v.amount} · {fmtDia(v.created_at)}
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* ── CUENTAS DUPLICADAS ── */}
      {tabActiva === 'cuentas' && (
        <div>
          <p style={{ ...hint, marginBottom: '6px' }}>Clientas que parecen tener dos cuentas (nombre casi igual o mismo teléfono).</p>
          {queEs(<>El riesgo: cobrarle en una cuenta mientras reserva desde la otra. Revisa el historial de cada una para ver cuál usa, y mejor <b>da de baja</b> la que sobra en vez de borrarla (borrar deja sus ventas sin nombre).</>)}
          {gruposDuplicados.length === 0 ? vacio('No hay cuentas duplicadas aparentes.') : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {gruposDuplicados.map((grupo, gi) => (
                <div key={gi} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '14px', padding: '6px 14px' }}>
                  {grupo.map((u, i) => (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderTop: i ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--black)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.full_name}</div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--on-surface-variant)', marginTop: '2px' }}>
                          {u.membership_plan || 'Sin plan'} · {(u.classes_remaining ?? 0) >= 9000 ? 'ilimitadas' : plural(u.classes_remaining ?? 0, 'clase', 'clases')}
                        </div>
                      </div>
                      <button onClick={() => verHistorialDe(u.id)} style={{ ...btnSec, flexShrink: 0, background: 'rgba(0,0,0,0.04)', color: 'var(--black)' }}>
                        Historial <ArrowRight size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── HISTORIAL (consulta) ── */}
      {tabActiva === 'historial' && (
        <div>
          <p style={{ ...hint, marginBottom: '10px' }}>Cada cambio de clases o membresía, con quién lo hizo. Es consulta: no son pendientes.</p>
          <div style={{ marginBottom: '12px' }}>
            <SearchableClientSelect clients={allUsers || []} value={ledgerUserId} onChange={setLedgerUserId} placeholder="Buscar una clienta (vacío = lo más reciente)…" />
          </div>
          {nombreLedger && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.84rem', color: 'var(--on-surface-variant)' }}>Movimientos de <b style={{ color: 'var(--black)' }}>{nombreLedger}</b></span>
              <button onClick={() => {
                const u = (allUsers || []).find(x => x.id === ledgerUserId);
                openFix(ledgerUserId, nombreLedger, u?.classes_remaining ?? 0, u?.classes_remaining ?? 0);
              }} style={{ ...btnSec, padding: '6px 10px', background: 'rgba(255,145,77,0.12)', color: PRIMARY }}>
                <Pencil size={12} /> Ajustar saldo
              </button>
            </div>
          )}
          {ledger.length === 0 ? (
            <p style={{ ...hint, margin: 0 }}>{ledgerLoading ? 'Cargando…' : 'Sin movimientos registrados.'}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {ledger.map(m => {
                const f = FUENTES[m.source] || FUENTES.desconocido;
                return (
                  <div key={m.id} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '12px', padding: '10px 12px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ width: '40px', flexShrink: 0, textAlign: 'center', fontWeight: 900, fontSize: '1rem',
                                  color: m.delta > 0 ? '#059669' : m.delta < 0 ? '#DC2626' : 'var(--on-surface-variant)' }}>
                      {m.delta > 0 ? `+${m.delta}` : m.delta}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {!ledgerUserId && <div style={{ fontWeight: 800, fontSize: '0.86rem', color: 'var(--black)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.user_name || m.user_email || '—'}</div>}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', margin: '2px 0' }}>
                        <span style={chip(f.color + '1a', f.color)}>{f.label}</span>
                        <span style={{ fontSize: '0.76rem', color: 'var(--on-surface-variant)' }}>queda en {m.balance_after ?? '—'}</span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--on-surface-variant)' }}>
                        {fmtFecha(m.created_at)} · {m.actor_name || (m.db_role === 'service_role' ? 'Sistema' : '—')}
                      </div>
                      {m.note && <div style={{ fontSize: '0.76rem', color: 'var(--on-surface-variant)', marginTop: '3px', lineHeight: 1.4 }}>{m.note}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

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
              <b>{fixTarget.nombre}</b> tiene hoy <b>{plural(fixTarget.saldoActual, 'clase', 'clases')}</b>.
              El número que escribas <b>reemplaza</b> su saldo (no se suma).
            </p>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--on-surface-variant)', marginBottom: '5px' }}>Clases que le quedarán</label>
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
