import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, BadgeCheck, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { cobrarPlanAClienta } from '../lib/cobrarPlan';
import { isPlanExpired, formatPlanDate } from '../lib/membership';
import SearchableClientSelect from './SearchableClientSelect';
import { cobrarClaseSuelta, motivoPagoExtra, useConfigCobros } from './AdminInscripcion';

// ─────────────────────────────────────────────────────────────────────────────
// COBRAR EN EL MOSTRADOR — una sola pantalla para Ventas y para la ficha.
//
// "¿Qué paga?" separa tres cosas que se comportan distinto y no se deben
// confundir: la MEMBRESÍA reemplaza el saldo, la CLASE SUELTA suma 1 y la
// INSCRIPCIÓN no toca clases. Antes de cobrar se ve a quién (plan, saldo,
// vencimiento, inscripción) y el botón dice el total y qué va a pasar.
//
// Los candados viven donde siempre: cobrarPlanAClienta (confirmación, aviso de
// saldo que se pisa, duplicados) y registrar_pago_extra en la BD (atómico).
// ─────────────────────────────────────────────────────────────────────────────

const PRIMARY = 'var(--primary, #FF914D)';
const INK = 'var(--black, #1A1C1E)';
const money = (n) => `$${Number(n || 0).toLocaleString('es-MX')}`;
const fecha = (iso) => iso ? new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
const METODOS = [['efectivo', 'Efectivo'], ['tarjeta', 'Tarjeta'], ['transferencia', 'Transferencia']];

const label = { fontSize: '0.74rem', fontWeight: 800, color: 'var(--on-surface-variant)', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' };
// Flecha del <select> (con appearance:none el navegador la quita).
const flecha = { paddingRight: '40px', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', backgroundSize: '14px',
  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23786C62' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" };
const input = { width: '100%', boxSizing: 'border-box', minWidth: 0, padding: '13px 14px', borderRadius: '14px', border: '1px solid rgba(55,61,59,0.1)', background: 'var(--surface-lowest, #fff)', fontFamily: 'inherit', fontSize: '0.92rem', outline: 'none', color: INK, WebkitAppearance: 'none' };

function Segmentado({ opciones, valor, onCambio }) {
  return (
    <div role="radiogroup" style={{ display: 'grid', gridTemplateColumns: `repeat(${opciones.length}, 1fr)`, gap: '6px', padding: '4px', borderRadius: '14px', background: 'rgba(55,61,59,0.06)' }}>
      {opciones.map(([id, texto, deshabilitada]) => {
        const activa = valor === id;
        return (
          <button key={id} type="button" role="radio" aria-checked={activa} disabled={deshabilitada}
            onClick={() => !deshabilitada && onCambio(id)}
            style={{ border: 'none', borderRadius: '11px', padding: '10px 6px', fontWeight: 800, fontSize: '0.82rem', fontFamily: 'inherit',
                     cursor: deshabilitada ? 'not-allowed' : 'pointer', opacity: deshabilitada ? 0.4 : 1,
                     background: activa ? 'var(--surface-lowest, #fff)' : 'transparent',
                     color: activa ? INK : 'var(--on-surface-variant)',
                     boxShadow: activa ? '0 2px 8px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>
            {texto}
          </button>
        );
      })}
    </div>
  );
}

/** Estado de la clienta en una línea + su inscripción. */
function EstadoClienta({ clienta, insc, soloInscripcion }) {
  if (!clienta) return null;
  const ilimitada = (clienta.classes_remaining ?? 0) >= 9000;
  const vencida = clienta.plan_expires_at && isPlanExpired(clienta.plan_expires_at);
  const activa = clienta.membership_status === 'ACTIVE' && !vencida;
  const partes = [
    clienta.membership_plan || 'Sin plan',
    activa ? (ilimitada ? 'ilimitadas' : `${clienta.classes_remaining ?? 0} ${(clienta.classes_remaining ?? 0) === 1 ? 'clase' : 'clases'}`) : null,
    clienta.plan_expires_at ? `${vencida ? 'venció' : 'vence'} ${formatPlanDate(clienta.plan_expires_at, true)}` : null,
  ].filter(Boolean);
  const debe = insc && !insc.al_dia && !insc.exenta;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
      {!soloInscripcion && (
        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: (vencida || !activa) ? '#DC2626' : 'var(--on-surface-variant)' }}>
          {partes.join(' · ')}
        </div>
      )}
      {insc && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700,
                      color: debe ? '#C2410C' : '#15803D' }}>
          {debe ? <AlertTriangle size={14} /> : <BadgeCheck size={14} />}
          {insc.al_dia ? `Inscripción al día hasta ${fecha(insc.vence)}`
            : insc.exenta ? 'Sin inscripción (solo clases sueltas)'
            : insc.vence ? `Inscripción vencida desde ${fecha(insc.vence)}` : 'Inscripción anual pendiente'}
        </div>
      )}
    </div>
  );
}

/**
 * @param {object}   props
 * @param {object}   [props.clientaFija]  fila de users; si viene, no se muestra el buscador (ficha)
 * @param {Function} [props.onCobrado]    se llama tras un cobro exitoso
 * @param {boolean}  [props.sinTarjeta]   no envolver en tarjeta (la ficha ya tiene su fondo)
 */
export default function CobroMostrador({ clientaFija, onCobrado, sinTarjeta }) {
  const { allUsers, plans, activatePlan, fetchAllUsers, user } = useAuth();
  const [cfg] = useConfigCobros();

  const [clientaId, setClientaId] = useState(clientaFija?.id || '');
  const clienta = clientaFija || (allUsers || []).find(u => u.id === clientaId) || null;
  const alumnas = useMemo(() => (allUsers || []).filter(u => u.role === 'CLIENT' || !u.role).map(u => ({
    id: u.id, name: u.full_name || (u.email || '').split('@')[0], plan: u.membership_plan || 'Sin Plan',
    classes: u.classes_remaining || 0, email: u.email, status: u.membership_status?.toLowerCase() || 'inactive',
  })), [allUsers]);

  const [concepto, setConcepto] = useState('membresia');
  const planesActivos = (plans || []).filter(p => p.active !== false);
  const [planName, setPlanName] = useState('');
  const plan = planesActivos.find(p => p.name === planName) || null;
  const [metodo, setMetodo] = useState('efectivo');
  const [sumarInsc, setSumarInsc] = useState(false);
  const [cobrando, setCobrando] = useState(false);
  const [exito, setExito] = useState(null);
  const [modoSinCobro, setModoSinCobro] = useState(false);
  const [pagadaEl, setPagadaEl] = useState('');
  const [nota, setNota] = useState('');

  // Inscripción de la clienta elegida
  // Se guarda junto con el id de la clienta: si recepción cambia de clienta mientras
  // carga, la respuesta vieja se descarta (Codex 4-nov: podía marcar "Sumar
  // inscripción" a quien ya la pagó). Mientras no cargue la de ESTA clienta, no cuenta.
  const [inscDe, setInscDe] = useState({ id: null, data: null, cargando: false });
  const ultimaInsc = useRef(null);
  const cargarInsc = useCallback(async (id) => {
    ultimaInsc.current = id || null;
    if (!id) { setInscDe({ id: null, data: null, cargando: false }); return; }
    setInscDe({ id, data: null, cargando: true });
    const { data, error } = await supabase.rpc('mi_inscripcion', { p_user: id });
    if (ultimaInsc.current !== id) return; // respuesta de otra clienta: se ignora
    setInscDe({ id, data: error ? null : data, cargando: false });
  }, []);
  useEffect(() => { cargarInsc(clienta?.id); }, [clienta?.id, cargarInsc]);
  const insc = inscDe.id === clienta?.id ? inscDe.data : null;
  const inscCargando = !!clienta?.id && (inscDe.id !== clienta?.id || inscDe.cargando);

  const debeInsc = !!insc && !insc.al_dia && !insc.exenta;
  const ilimitada = (clienta?.classes_remaining ?? 0) >= 9000;
  const montoInsc = Number(cfg?.inscripcion_monto ?? insc?.monto ?? 500);
  const montoSuelta = Number(cfg?.clase_suelta_monto ?? 150);

  // Al cambiar de clienta: la casilla viene marcada si debe la inscripción y
  // el cobro está encendido; el concepto vuelve a membresía si no aplica.
  useEffect(() => {
    setSumarInsc(debeInsc && !!cfg?.inscripcion_activa);
    setModoSinCobro(false);
  }, [clienta?.id, debeInsc, cfg?.inscripcion_activa]);
  useEffect(() => { if (concepto === 'suelta' && ilimitada) setConcepto('membresia'); }, [ilimitada, concepto]);

  const total = concepto === 'membresia' ? (plan ? plan.amount + (sumarInsc && debeInsc ? montoInsc : 0) : 0)
    : concepto === 'suelta' ? montoSuelta : montoInsc;
  // No se cobra hasta saber si ESTA clienta debe la inscripción (cambia el total).
  const listo = !!clienta && !inscCargando && (concepto !== 'membresia' || !!plan);

  const consecuencia = !clienta ? null
    : concepto === 'membresia'
      ? (plan ? `Su saldo se reemplaza por ${plan.unlimited ? 'clases ilimitadas' : `${plan.classes} clases`} y vence en un mes.` : 'Elige la membresía.')
    : concepto === 'suelta'
      ? (clienta.membership_status === 'ACTIVE' && !isPlanExpired(clienta.plan_expires_at)
          ? 'Se le suma 1 clase a su saldo; vence junto con su plan.'
          : `Queda con 1 clase para usar en ${cfg?.clase_suelta_dias || 30} días.`)
    : insc?.al_dia ? `Ya la tiene pagada: se extiende un año más (hasta ${fecha(new Date(new Date(insc.vence).getTime() + 365 * 86400000))}).`
    : 'Queda al día por 12 meses. No mueve su saldo de clases.';

  const terminar = (texto) => {
    setExito(texto);
    fetchAllUsers?.();
    cargarInsc(clienta?.id);
    onCobrado?.();
    setTimeout(() => {
      setExito(null);
      setPlanName(''); setNota(''); setPagadaEl(''); setModoSinCobro(false);
      if (!clientaFija) { setClientaId(''); setConcepto('membresia'); }
    }, 2400);
  };

  const registrarInscripcion = async (pMetodo, extra = {}) => {
    const { error } = await supabase.rpc('registrar_pago_extra', {
      p_user: clienta.id, p_tipo: 'inscripcion', p_metodo: pMetodo,
      p_pagada_el: extra.pagadaEl || null, p_nota: extra.nota || null,
    });
    return error;
  };

  const cobrar = async () => {
    if (!listo || cobrando) return;
    setCobrando(true);
    try {
      if (concepto === 'membresia') {
        const conInsc = sumarInsc && debeInsc;
        let primera = true;
        const { ok } = await cobrarPlanAClienta({
          clienta,
          plan: { name: plan.name, amount: plan.amount, classes: plan.classes },
          metodo, vendedorId: user?.id, activatePlan,
          // La 1ª confirmación incluye la inscripción: un solo "sí" para todo.
          confirmar: (m) => {
            const texto = primera && conInsc ? `${m}\n\n+ INSCRIPCIÓN ANUAL ${money(montoInsc)}\nTOTAL: ${money(total)}` : m;
            primera = false;
            return window.confirm(texto);
          },
        });
        if (!ok) return;
        if (conInsc) {
          const err = await registrarInscripcion(metodo);
          if (err) {
            window.alert(`La membresía SÍ quedó cobrada, pero la inscripción NO:\n\n${motivoPagoExtra(err)}\n\nCóbrala aparte con "Inscripción".`);
            terminar('Membresía cobrada (inscripción pendiente)');
            return;
          }
        }
        terminar(conInsc ? `Cobrado ${money(total)} · membresía + inscripción` : `Cobrado ${money(total)} · ${plan.title || plan.name}`);
      } else if (concepto === 'suelta') {
        const ok = await cobrarClaseSuelta({ clienta, metodo, monto: montoSuelta });
        if (ok) terminar(`Cobrado ${money(montoSuelta)} · clase suelta (+1)`);
      } else {
        const quien = clienta.full_name || clienta.email;
        if (!window.confirm(`Cobrar INSCRIPCIÓN ANUAL (${money(montoInsc)}) en ${metodo} a:\n\n${quien}\n${clienta.email || ''}`)) return;
        const err = await registrarInscripcion(metodo);
        if (err) { window.alert(motivoPagoExtra(err)); return; }
        terminar(`Cobrado ${money(montoInsc)} · inscripción anual`);
      }
    } finally {
      setCobrando(false);
    }
  };

  const registrarSinCobro = async () => {
    if (cobrando || (!pagadaEl && !nota.trim())) return;
    const quien = clienta.full_name || clienta.email;
    const msg = pagadaEl
      ? `Registrar que ${quien} YA PAGÓ su inscripción el ${pagadaEl}?\n\nNo entra dinero al corte; su año corre desde esa fecha.`
      : `Dar la inscripción de CORTESÍA a ${quien}?\n\nNo entra dinero al corte. Le dura 12 meses desde hoy.`;
    if (!window.confirm(msg)) return;
    setCobrando(true);
    const err = await registrarInscripcion(pagadaEl ? 'ya_pagada' : 'cortesia', { pagadaEl, nota: nota.trim() });
    setCobrando(false);
    if (err) { window.alert(motivoPagoExtra(err)); return; }
    terminar(pagadaEl ? 'Inscripción registrada como pagada' : 'Inscripción de cortesía registrada');
  };

  const cuerpo = (
    <AnimatePresence mode="wait">
      {exito ? (
        <motion.div key="ok" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
          style={{ padding: '28px 12px', textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <CheckCircle2 size={28} color="#16A34A" />
          </div>
          <div style={{ fontWeight: 800, fontSize: '1.02rem', color: INK }}>{exito}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', marginTop: '4px' }}>{clienta?.full_name || ''}</div>
        </motion.div>
      ) : (
        <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {clientaFija && insc && (
            <div style={{ margin: '-10px 0 16px' }}><EstadoClienta clienta={clienta} insc={insc} soloInscripcion /></div>
          )}
          {!clientaFija && (
            <div style={{ marginBottom: '18px' }}>
              <label style={label}>Alumna</label>
              <SearchableClientSelect clients={alumnas} value={clientaId} onChange={setClientaId} placeholder="Buscar alumna por nombre o correo…" />
              <EstadoClienta clienta={clienta} insc={insc} />
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={label}>¿Qué paga?</label>
            <Segmentado valor={concepto} onCambio={(c) => { setConcepto(c); setModoSinCobro(false); }}
              opciones={[['membresia', 'Membresía'], ['suelta', 'Clase suelta', ilimitada], ['inscripcion', 'Inscripción']]} />
            {ilimitada && <p style={{ margin: '6px 2px 0', fontSize: '0.74rem', color: 'var(--on-surface-variant)' }}>Tiene clases ilimitadas: no necesita clase suelta.</p>}
          </div>

          {concepto === 'membresia' && (
            <div style={{ marginBottom: '16px' }}>
              <select value={planName} onChange={e => setPlanName(e.target.value)} style={{ ...input, ...flecha }} aria-label="Membresía">
                <option value="">Elige la membresía…</option>
                {planesActivos.map(p => (
                  <option key={p.name} value={p.name}>{p.title || p.name} — {p.unlimited ? 'ilimitadas' : `${p.classes} clases`} · {money(p.amount)}</option>
                ))}
              </select>
              {debeInsc && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px', padding: '11px 12px', borderRadius: '12px',
                                background: sumarInsc ? 'rgba(255,145,77,0.1)' : 'rgba(55,61,59,0.04)', cursor: 'pointer',
                                fontSize: '0.86rem', fontWeight: 700, color: INK }}>
                  <input type="checkbox" checked={sumarInsc} onChange={e => setSumarInsc(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#FF914D' }} />
                  <span style={{ flex: 1 }}>Sumar inscripción anual</span>
                  <span style={{ color: 'var(--on-surface-variant)' }}>+{money(montoInsc)}</span>
                </label>
              )}
            </div>
          )}

          {concepto === 'inscripcion' && !modoSinCobro && !insc?.al_dia && (
            <button type="button" onClick={() => setModoSinCobro(true)}
              style={{ margin: '-4px 0 14px', border: 'none', background: 'none', padding: 0, color: 'var(--on-surface-variant)', fontSize: '0.78rem', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit' }}>
              Ya la había pagado antes · darla de cortesía
            </button>
          )}

          {concepto === 'inscripcion' && modoSinCobro ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ ...label, marginBottom: 0 }}>¿Cuándo la pagó? <span style={{ textTransform: 'none', fontWeight: 600 }}>(vacío si es cortesía)</span>
                <input type="date" value={pagadaEl} onChange={e => setPagadaEl(e.target.value)} style={{ ...input, marginTop: '6px' }} />
              </label>
              <input placeholder="Motivo (ej. pagó en efectivo en marzo)" value={nota} onChange={e => setNota(e.target.value)} style={input} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => setModoSinCobro(false)} style={{ flex: 1, borderRadius: '14px', padding: '13px', border: '1px solid rgba(55,61,59,0.14)', background: 'transparent', fontWeight: 700, cursor: 'pointer', color: INK, fontFamily: 'inherit' }}>Volver</button>
                <button type="button" onClick={registrarSinCobro} disabled={cobrando || (!pagadaEl && !nota.trim())}
                  style={{ flex: 2, borderRadius: '14px', padding: '13px', border: 'none', fontWeight: 800, fontFamily: 'inherit',
                           cursor: (!pagadaEl && !nota.trim()) ? 'not-allowed' : 'pointer',
                           background: (!pagadaEl && !nota.trim()) ? 'rgba(55,61,59,0.08)' : INK,
                           color: (!pagadaEl && !nota.trim()) ? 'var(--on-surface-variant)' : '#fff' }}>
                  {pagadaEl ? 'Registrar que ya pagó' : 'Dar de cortesía'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '20px' }}>
                <label style={label}>Método</label>
                <Segmentado valor={metodo} onCambio={setMetodo} opciones={METODOS} />
              </div>

              <button type="button" onClick={cobrar} disabled={!listo || cobrando}
                style={{ width: '100%', padding: '15px', borderRadius: '14px', border: 'none', fontWeight: 800, fontSize: '1rem', fontFamily: 'inherit',
                         display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                         cursor: (!listo || cobrando) ? 'not-allowed' : 'pointer',
                         background: (!listo || cobrando) ? 'rgba(55,61,59,0.08)' : PRIMARY,
                         color: (!listo || cobrando) ? 'var(--on-surface-variant)' : '#fff' }}>
                {cobrando ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Cobrando…</>
                  : !clienta ? 'Elige a la alumna'
                  : listo ? `Cobrar ${money(total)}` : 'Cobrar'}
              </button>
              {consecuencia && (
                <p style={{ margin: '10px 2px 0', fontSize: '0.78rem', lineHeight: 1.45, color: 'var(--on-surface-variant)', textAlign: 'center' }}>{consecuencia}</p>
              )}
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (sinTarjeta) return cuerpo;
  return (
    <div className="ios-glass-card" style={{ background: 'var(--surface)', border: 'none', padding: '22px', margin: 0 }}>
      {cuerpo}
    </div>
  );
}

export { EstadoClienta };
