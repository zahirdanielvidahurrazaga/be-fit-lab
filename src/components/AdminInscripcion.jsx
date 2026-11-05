import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ─────────────────────────────────────────────────────────────────────────────
// INSCRIPCIÓN ANUAL y CLASE SUELTA en el panel (nov-2026).
//
// Todo cobro pasa por el RPC `registrar_pago_extra` (BD), que en una sola
// transacción: registra el pago, suma la clase o extiende la inscripción, mete
// la venta al corte y avisa a la clienta. Si algo falla, no queda nada a medias.
// ─────────────────────────────────────────────────────────────────────────────

const PRIMARY = '#FF914D';
const INK = '#1A1C1E';
const money = (n) => `$${Number(n || 0).toLocaleString('es-MX')}`;

// Traduce los `raise exception` de la BD a algo que la dueña entienda.
export function motivoPagoExtra(err) {
  const m = String(err?.message || err || '');
  if (m.includes('VENTA_DUPLICADA')) return 'Ya se registró este mismo cobro hace un momento. Si de verdad es otro pago, espera un minuto.';
  if (m.includes('ILIMITADA')) return 'Tiene plan de clases ilimitadas: no necesita clase suelta.';
  if (m.includes('NO_AUTORIZADO')) return 'Tu cuenta no tiene permiso para cobrar.';
  if (m.includes('FALTA_MOTIVO')) return 'Escribe el motivo para registrarla sin cobro.';
  if (m.includes('FECHA_INVALIDA')) return 'La fecha de pago tiene que ser de los últimos 12 meses.';
  if (/could not find the function|does not exist/i.test(m)) return 'Falta activar esta función en la base de datos. Avísale a Zahir.';
  return m || 'No se pudo registrar el cobro.';
}

/** Lee montos y reglas (app_config). Devuelve null mientras carga o si las columnas no existen. */
export function useConfigCobros() {
  const [cfg, setCfg] = useState(null);
  const cargar = useCallback(async () => {
    const { data, error } = await supabase.from('app_config')
      .select('inscripcion_activa, inscripcion_monto, inscripcion_bloqueo_desde, inscripcion_exenta_clase_suelta, clase_suelta_monto, clase_suelta_dias')
      .eq('id', 1).single();
    if (!error) setCfg(data);
  }, []);
  useEffect(() => { cargar(); }, [cargar]);
  return [cfg, cargar];
}

/** Cobra una clase suelta en el estudio. @returns {Promise<boolean>} */
export async function cobrarClaseSuelta({ clienta, metodo, monto }) {
  const quien = clienta.full_name || clienta.email || 'la clienta';
  const ilimitada = (clienta.classes_remaining ?? 0) >= 9000;
  if (ilimitada) { window.alert(`${quien} tiene clases ilimitadas: no necesita clase suelta.`); return false; }
  if (!window.confirm(`Cobrar CLASE SUELTA (${money(monto)}) en ${metodo} a:\n\n${quien}\n${clienta.email || ''}\n\nSe le SUMA 1 clase (no se le borra su saldo).`)) return false;
  const { error } = await supabase.rpc('registrar_pago_extra', { p_user: clienta.id, p_tipo: 'clase_suelta', p_metodo: metodo });
  if (error) { window.alert(motivoPagoExtra(error)); return false; }
  return true;
}

/** Configuración de cobros extra para la pestaña Membresías.
 *  Dos tarjetas separadas (antes iban juntas y se confundían): la inscripción
 *  anual (con su interruptor y fecha de bloqueo) y la clase suelta. */
export function ConfigInscripcion() {
  const [cfg, recargar] = useConfigCobros();
  const [form, setForm] = useState(null);
  const [estado, setEstado] = useState({}); // { insc|suelta: { guardando, msg } }
  useEffect(() => { if (cfg) setForm({ ...cfg, inscripcion_bloqueo_desde: cfg.inscripcion_bloqueo_desde || '' }); }, [cfg]);
  if (!form) return null;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const marcar = (cual, v) => setEstado(e => ({ ...e, [cual]: { ...(e[cual] || {}), ...v } }));
  const sucio = (campos) => campos.some(k => String(form[k] ?? '') !== String((k === 'inscripcion_bloqueo_desde' ? (cfg[k] || '') : cfg[k]) ?? ''));

  const guardar = async (cual) => {
    let datos;
    if (cual === 'insc') {
      const monto = Number(form.inscripcion_monto);
      if (!(monto > 0)) { marcar(cual, { msg: { ok: false, t: 'El costo tiene que ser mayor a 0.' } }); return; }
      if (form.inscripcion_activa && !cfg.inscripcion_activa && !window.confirm(
        'Al encender la inscripción, a las clientas que no la tengan registrada les saldrá el aviso en la app y les llegará un recordatorio los lunes y jueves.\n\n¿Ya registraste a las que la pagaron este año?')) return;
      datos = { inscripcion_activa: !!form.inscripcion_activa, inscripcion_monto: monto,
                inscripcion_bloqueo_desde: form.inscripcion_bloqueo_desde || null,
                inscripcion_exenta_clase_suelta: !!form.inscripcion_exenta_clase_suelta };
    } else {
      const monto = Number(form.clase_suelta_monto), dias = parseInt(form.clase_suelta_dias, 10);
      if (!(monto > 0) || !(dias > 0)) { marcar(cual, { msg: { ok: false, t: 'El costo y los días tienen que ser mayores a 0.' } }); return; }
      datos = { clase_suelta_monto: monto, clase_suelta_dias: dias };
    }
    marcar(cual, { guardando: true, msg: null });
    const { error } = await supabase.from('app_config').update(datos).eq('id', 1);
    marcar(cual, { guardando: false, msg: error ? { ok: false, t: error.message } : { ok: true, t: 'Guardado.' } });
    if (!error) recargar();
  };

  const tarjeta = { background: '#fff', borderRadius: '20px', border: '1px solid rgba(0,0,0,0.06)', padding: '18px', marginBottom: '14px' };
  const campo = { padding: '11px 12px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.12)', fontSize: '0.95rem', fontWeight: 600, width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff', color: INK, minWidth: 0 };
  const etiqueta = { display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.7rem', fontWeight: 800, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.04em', minWidth: 0 };
  const ayuda = { fontSize: '0.72rem', textTransform: 'none', letterSpacing: 0, fontWeight: 600 };
  const pie = (cual, campos) => {
    const e = estado[cual] || {};
    const hayCambios = sucio(campos);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '14px' }}>
        <button onClick={() => guardar(cual)} disabled={e.guardando || !hayCambios}
          style={{ border: 'none', borderRadius: '12px', padding: '11px 20px', fontWeight: 800, fontFamily: 'inherit',
                   background: hayCambios ? PRIMARY : 'rgba(0,0,0,0.06)', color: hayCambios ? '#fff' : 'var(--on-surface-variant)',
                   cursor: e.guardando ? 'wait' : hayCambios ? 'pointer' : 'default' }}>
          {e.guardando ? 'Guardando…' : 'Guardar'}
        </button>
        {e.msg && <span style={{ fontSize: '0.82rem', fontWeight: 700, color: e.msg.ok ? '#16A34A' : '#DC2626' }}>{e.msg.t}</span>}
      </div>
    );
  };
  const camposInsc = ['inscripcion_activa', 'inscripcion_monto', 'inscripcion_bloqueo_desde', 'inscripcion_exenta_clase_suelta'];
  const camposSuelta = ['clase_suelta_monto', 'clase_suelta_dias'];
  const encendida = !!form.inscripcion_activa;

  return (
    <>
      {/* ── INSCRIPCIÓN ANUAL ── */}
      <div style={tarjeta}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: INK }}>Inscripción anual</h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--on-surface-variant)', lineHeight: 1.45 }}>
              {encendida
                ? 'Encendida: a quien no la tenga le sale el aviso en la app y le llega un recordatorio los lunes y jueves.'
                : 'Apagada: nadie ve avisos ni se bloquea. Igual puedes cobrarla en Ventas.'}
            </p>
          </div>
          {/* Interruptor */}
          <button type="button" role="switch" aria-checked={encendida} aria-label="Cobrar inscripción anual"
            onClick={() => set('inscripcion_activa', !encendida)}
            style={{ flexShrink: 0, width: '50px', height: '30px', borderRadius: '999px', border: 'none', cursor: 'pointer', position: 'relative',
                     background: encendida ? '#16A34A' : 'rgba(0,0,0,0.15)', transition: 'background 0.2s' }}>
            <span style={{ position: 'absolute', top: '3px', left: encendida ? '23px' : '3px', width: '24px', height: '24px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginTop: '16px' }}>
          <label style={etiqueta}>Costo
            <input type="number" inputMode="numeric" min="1" value={form.inscripcion_monto} onChange={e => set('inscripcion_monto', e.target.value)} onWheel={e => e.currentTarget.blur()} style={campo} />
          </label>
          <label style={etiqueta}>Bloquear reservas desde
            <input type="date" value={form.inscripcion_bloqueo_desde} onChange={e => set('inscripcion_bloqueo_desde', e.target.value)} style={campo} />
            <span style={ayuda}>{form.inscripcion_bloqueo_desde ? 'Desde ese día, quien no la pague no puede reservar.' : 'Vacío = solo avisar, nunca bloquear.'}</span>
          </label>
        </div>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontWeight: 600, fontSize: '0.86rem', color: INK, marginTop: '14px', cursor: 'pointer', lineHeight: 1.4 }}>
          <input type="checkbox" checked={!!form.inscripcion_exenta_clase_suelta} onChange={e => set('inscripcion_exenta_clase_suelta', e.target.checked)} style={{ width: '18px', height: '18px', marginTop: '1px', flexShrink: 0, accentColor: '#FF914D' }} />
          No pedírsela a quien solo compra clases sueltas
        </label>
        {pie('insc', camposInsc)}
      </div>

      {/* ── CLASE SUELTA ── */}
      <div style={tarjeta}>
        <h3 style={{ margin: 0, fontSize: '1.05rem', color: INK }}>Clase suelta</h3>
        <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--on-surface-variant)', lineHeight: 1.45 }}>
          Suma 1 clase al saldo (no reemplaza el plan). Si la clienta no tiene plan vigente, recibe 1 clase con estos días para usarla.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
          <label style={etiqueta}>Costo
            <input type="number" inputMode="numeric" min="1" value={form.clase_suelta_monto} onChange={e => set('clase_suelta_monto', e.target.value)} onWheel={e => e.currentTarget.blur()} style={campo} />
          </label>
          <label style={etiqueta}>Días para usarla
            <input type="number" inputMode="numeric" min="1" value={form.clase_suelta_dias} onChange={e => set('clase_suelta_dias', e.target.value)} onWheel={e => e.currentTarget.blur()} style={campo} />
          </label>
        </div>
        {pie('suelta', camposSuelta)}
      </div>
    </>
  );
}
