import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Users, Ticket, CheckCircle2, DollarSign, Link2, Copy, Check, Download, Mail, Trash2, Loader2, Search, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Panel de CONTROL de un evento: todo lo vendido en un solo lugar — socias e
// invitados, contacto, quién invitó a quién, asistencia y dinero. Desde aquí la
// dueña reenvía boletos, copia el link público y exporta la lista para la puerta.
const PRIMARY = '#FF914D';
const MAUVE = '#E07A9C';
const INK = '#1A1C1E';

const fmtCorto = (iso) => iso ? new Date(iso).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

function Metrica({ icon, valor, label, color = PRIMARY }) {
  return (
    <div style={{ flex: '1 1 120px', background: 'rgba(0,0,0,0.03)', borderRadius: '16px', padding: '13px 15px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color, marginBottom: '4px' }}>
        {icon}
        <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: INK, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{valor}</div>
    </div>
  );
}

export default function AdminEventoBoletos({ ev, onClose, onChange }) {
  const [lista, setLista] = useState(null);
  const [q, setQ] = useState('');
  const [copiado, setCopiado] = useState('');
  const [ocupado, setOcupado] = useState(null); // id de la fila con acción en curso
  const [aviso, setAviso] = useState(null);

  const cargar = async () => {
    const { data } = await supabase.from('event_registrations')
      .select('id, user_id, guest_name, guest_email, guest_phone, invited_by, ticket_code, checked_in, checked_in_at, payment_intent_id, created_at, users!event_registrations_user_id_fkey(full_name, email, phone)')
      .eq('event_id', ev.id).order('created_at', { ascending: true });
    // Nombre de quien invitó (para la columna "vino con")
    const anfitriones = [...new Set((data || []).map(r => r.invited_by).filter(Boolean))];
    let mapa = {};
    if (anfitriones.length) {
      const { data: us } = await supabase.from('users').select('id, full_name').in('id', anfitriones);
      (us || []).forEach(u => { mapa[u.id] = u.full_name; });
    }
    setLista((data || []).map(r => ({ ...r, anfitrion: r.invited_by ? (mapa[r.invited_by] || 'una socia') : null })));
  };
  useEffect(() => { cargar(); }, [ev.id]);

  const nombre = (r) => r.guest_name || r.users?.full_name || r.users?.email || 'Clienta';
  const contacto = (r) => r.guest_email || r.users?.email || '';
  const telefono = (r) => r.guest_phone || r.users?.phone || '';

  const stats = useMemo(() => {
    const l = lista || [];
    return {
      total: l.length,
      socias: l.filter(r => r.user_id).length,
      invitados: l.filter(r => !r.user_id).length,
      asistieron: l.filter(r => r.checked_in).length,
      ingresos: l.filter(r => r.payment_intent_id).length * (ev.price || 0),
    };
  }, [lista, ev.price]);

  // Con slug queda /evento/rodeo; sin él, cae al UUID.
  const linkPublico = `https://befitlab.app/evento/${ev.slug || ev.id}`;

  const copiar = async (texto, clave) => {
    try { await navigator.clipboard.writeText(texto); setCopiado(clave); setTimeout(() => setCopiado(''), 1800); }
    catch (_) { setAviso({ tipo: 'err', msg: 'No se pudo copiar' }); }
  };

  const reenviar = async (r) => {
    setOcupado(r.id);
    const { data, error } = await supabase.functions.invoke('event-tickets', { body: { resendRegistrationId: r.id } });
    setOcupado(null);
    if (error || data?.error || !data?.ok) setAviso({ tipo: 'err', msg: data?.error || 'No se pudo reenviar el correo' });
    else setAviso({ tipo: 'ok', msg: `Boleto reenviado a ${data.correo}` });
    setTimeout(() => setAviso(null), 3500);
  };

  const quitar = async (r) => {
    const texto = `¿Quitar el boleto de ${nombre(r)}?\n\nSe libera su lugar (quedarán ${(ev.capacity ?? 0) - stats.total + 1} disponibles).${r.payment_intent_id ? '\n\nOJO: el pago NO se devuelve solo. Si hay que reembolsar, hazlo desde Stripe.' : ''}`;
    if (!confirm(texto)) return;
    setOcupado(r.id);
    const { error } = await supabase.from('event_registrations').delete().eq('id', r.id);
    setOcupado(null);
    if (error) { setAviso({ tipo: 'err', msg: 'No se pudo quitar' }); setTimeout(() => setAviso(null), 3000); return; }
    await cargar(); onChange?.();
  };

  const exportarCSV = () => {
    const filas = [['Nombre', 'Tipo', 'Boleto', 'Correo', 'Teléfono', 'Vino con', 'Asistió', 'Comprado']];
    (lista || []).forEach(r => filas.push([
      nombre(r), r.user_id ? 'Socia' : 'Invitado', r.ticket_code || '',
      contacto(r), telefono(r), r.anfitrion || '', r.checked_in ? 'Sí' : 'No', fmtCorto(r.created_at),
    ]));
    const csv = '﻿' + filas.map(f => f.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url; a.download = `${ev.title.replace(/[^\w]+/g, '-').toLowerCase()}-boletos.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const filtrada = (lista || []).filter(r => {
    const t = q.trim().toLowerCase();
    if (!t) return true;
    return [nombre(r), r.ticket_code, contacto(r), telefono(r), r.anfitrion].some(v => (v || '').toLowerCase().includes(t));
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 6000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <motion.div onClick={e => e.stopPropagation()} initial={{ scale: 0.94, opacity: 0, y: 18 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.94, opacity: 0 }}
        transition={{ type: 'spring', damping: 24, stiffness: 260 }}
        style={{ width: 'min(760px, 100%)', maxHeight: '88vh', background: '#fff', borderRadius: '26px', padding: '24px', boxShadow: '0 24px 60px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Encabezado */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: '0 0 2px', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--on-surface-variant)' }}>Boletos y control</p>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.45rem', color: INK, lineHeight: 1.15 }}>{ev.title}</h2>
          </div>
          <button onClick={onClose} aria-label="Cerrar" style={{ flexShrink: 0, width: '36px', height: '36px', borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.05)', color: INK, cursor: 'pointer' }}><X size={18} /></button>
        </div>

        {/* Métricas */}
        <div style={{ flexShrink: 0, display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
          <Metrica icon={<Ticket size={14} />} label="Vendidos" valor={ev.capacity ? `${stats.total}/${ev.capacity}` : stats.total} />
          <Metrica icon={<Users size={14} />} label="Socias" valor={stats.socias} />
          <Metrica icon={<UserPlus size={14} />} label="Invitados" valor={stats.invitados} color={MAUVE} />
          <Metrica icon={<CheckCircle2 size={14} />} label="Entraron" valor={stats.asistieron} color="#16A34A" />
          <Metrica icon={<DollarSign size={14} />} label="Cobrado" valor={`$${stats.ingresos.toLocaleString('es-MX')}`} color="#16A34A" />
        </div>

        {/* Link público para compartir */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px', borderRadius: '14px', background: 'rgba(255,145,77,0.09)', marginBottom: '14px' }}>
          <Link2 size={16} color={PRIMARY} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, minWidth: 0, fontSize: '0.82rem', color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{linkPublico}</span>
          <button onClick={() => copiar(linkPublico, 'link')}
            style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '5px', border: 'none', borderRadius: '10px', padding: '7px 11px', background: PRIMARY, color: '#fff', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>
            {copiado === 'link' ? <><Check size={13} /> Copiado</> : <><Copy size={13} /> Copiar</>}
          </button>
        </div>

        {/* Buscador + exportar */}
        <div style={{ flexShrink: 0, display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={15} color="var(--on-surface-variant)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nombre, boleto, correo…"
              style={{ width: '100%', padding: '10px 12px 10px 34px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.12)', fontSize: '0.86rem', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <button onClick={exportarCSV} disabled={!lista?.length}
            style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(0,0,0,0.12)', borderRadius: '12px', padding: '10px 13px', background: '#fff', color: INK, fontWeight: 700, fontSize: '0.82rem', cursor: lista?.length ? 'pointer' : 'default', opacity: lista?.length ? 1 : 0.5 }}>
            <Download size={15} /> Lista
          </button>
        </div>

        {aviso && (
          <div style={{ flexShrink: 0, padding: '10px 13px', borderRadius: '12px', marginBottom: '10px', fontSize: '0.84rem', fontWeight: 600,
            background: aviso.tipo === 'ok' ? 'rgba(34,197,94,0.12)' : 'rgba(186,26,26,0.1)', color: aviso.tipo === 'ok' ? '#16A34A' : '#ba1a1a' }}>
            {aviso.msg}
          </div>
        )}

        {/* Lista */}
        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {!lista ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--on-surface-variant)' }}><Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} /></div>
          ) : !filtrada.length ? (
            <p style={{ textAlign: 'center', padding: '26px', color: 'var(--on-surface-variant)', fontSize: '0.9rem' }}>
              {lista.length ? `Nadie coincide con “${q}”.` : 'Todavía no hay boletos vendidos.'}
            </p>
          ) : filtrada.map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 13px', borderRadius: '14px', background: r.checked_in ? 'rgba(34,197,94,0.07)' : 'rgba(0,0,0,0.03)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.92rem', color: INK }}>{nombre(r)}</span>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '3px 7px', borderRadius: '7px',
                    background: r.user_id ? 'rgba(255,145,77,0.14)' : 'rgba(224,122,156,0.16)', color: r.user_id ? PRIMARY : MAUVE }}>
                    {r.user_id ? 'Socia' : 'Invitado'}
                  </span>
                  {r.checked_in && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.68rem', fontWeight: 800, color: '#16A34A' }}><CheckCircle2 size={12} /> Entró</span>}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--on-surface-variant)', marginTop: '3px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: PRIMARY, letterSpacing: '0.06em' }}>{r.ticket_code}</span>
                  {contacto(r) && <span>{contacto(r)}</span>}
                  {telefono(r) && <span>{telefono(r)}</span>}
                  {r.anfitrion && <span style={{ color: MAUVE }}>vino con {r.anfitrion}</span>}
                </div>
              </div>
              <div style={{ flexShrink: 0, display: 'flex', gap: '5px' }}>
                <button onClick={() => copiar(`https://befitlab.app/boleto/${r.ticket_code}`, r.id)} title="Copiar link del boleto"
                  style={{ width: '32px', height: '32px', borderRadius: '9px', border: 'none', background: 'rgba(0,0,0,0.05)', color: INK, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {copiado === r.id ? <Check size={14} color="#16A34A" /> : <Copy size={14} />}
                </button>
                <button onClick={() => reenviar(r)} disabled={ocupado === r.id} title="Reenviar boleto por correo"
                  style={{ width: '32px', height: '32px', borderRadius: '9px', border: 'none', background: 'rgba(255,145,77,0.12)', color: PRIMARY, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {ocupado === r.id ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Mail size={14} />}
                </button>
                <button onClick={() => quitar(r)} disabled={ocupado === r.id} title="Quitar boleto y liberar el lugar"
                  style={{ width: '32px', height: '32px', borderRadius: '9px', border: 'none', background: 'rgba(186,26,26,0.08)', color: '#ba1a1a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
