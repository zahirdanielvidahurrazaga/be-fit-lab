import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Pencil, Sparkles, ImagePlus, Loader2, Camera, X, Save, MapPin, CalendarDays, Ticket, Bell, Users, ChevronDown, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { uploadImage } from '../lib/cafeImage';

const PRIMARY = '#FF914D';
const INK = '#1A1C1E';
const input = { width: '100%', padding: '11px 13px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', background: 'white', fontSize: '0.92rem', boxSizing: 'border-box', fontFamily: 'inherit' };
// ISO <-> input datetime-local (hora local)
const toLocalInput = (iso) => { if (!iso) return ''; const d = new Date(iso); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };

function PhotoButton({ url, onUploaded }) {
  const [busy, setBusy] = useState(false);
  const pick = async (e) => {
    const f = e.target.files?.[0]; e.target.value = ''; if (!f) return;
    setBusy(true);
    const { url: u, error } = await uploadImage(f, { bucket: 'cafe-products', folder: 'eventos' });
    setBusy(false);
    if (error) { alert('No se pudo subir la imagen.'); return; }
    onUploaded(u);
  };
  return (
    <label style={{ position: 'relative', width: '100%', height: '140px', borderRadius: '16px', cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: url ? '#F0E6DC' : 'rgba(255,145,77,0.1)', border: url ? '1px solid rgba(0,0,0,0.08)' : '1.5px dashed rgba(255,145,77,0.5)' }}>
      {url ? <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', color: PRIMARY, fontWeight: 700, fontSize: '0.85rem' }}><ImagePlus size={26} /> Imagen del evento</span>}
      <input type="file" accept="image/*" onChange={pick} style={{ display: 'none' }} />
      {url && !busy && <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', justifyContent: 'center', padding: '4px 0' }}><Camera size={14} color="#fff" /></span>}
      {busy && <span style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} style={{ display: 'flex' }}><Loader2 size={24} color={PRIMARY} /></motion.span></span>}
    </label>
  );
}

export default function AdminEventos() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [counts, setCounts] = useState({});
  const [regView, setRegView] = useState({}); // eventId -> array de inscritas (o undefined)

  const load = async () => {
    const { data } = await supabase.from('events').select('*').order('event_date', { ascending: false, nullsFirst: false });
    setEvents(data || []);
    const { data: regs } = await supabase.from('event_registrations').select('event_id');
    const c = {}; (regs || []).forEach(r => { c[r.event_id] = (c[r.event_id] || 0) + 1; });
    setCounts(c);
  };
  useEffect(() => { load(); }, []);

  const viewRegs = async (id) => {
    if (regView[id]) { setRegView(v => ({ ...v, [id]: undefined })); return; }
    const { data } = await supabase.from('event_registrations').select('user_id, users(full_name, email)').eq('event_id', id).order('created_at', { ascending: true });
    setRegView(v => ({ ...v, [id]: data || [] }));
  };
  const avisar = async (ev) => {
    if (!confirm(`¿Avisar a todas las clientas sobre "${ev.title}"?`)) return;
    const { data, error } = await notifyClients(ev);
    if (error || data?.error) alert('No se pudo enviar el aviso: ' + (error?.message || data?.error || 'error'));
    else alert(`Aviso enviado a ${data?.sent ?? 0} clientas · push entregado a ${data?.pushed ?? 0} dispositivos.`);
  };

  const blank = { title: '', description: '', event_date: '', location: '', image_url: '', price: '', registration_open: false, notify: true };
  const startEdit = (e) => setForm({ id: e.id, title: e.title || '', description: e.description || '', event_date: toLocalInput(e.event_date), location: e.location || '', image_url: e.image_url || '', price: e.price ?? '', registration_open: !!e.registration_open, notify: false });

  const notifyClients = (ev) => supabase.functions.invoke('notify-event', { body: {
    title: '✨ Nuevo evento: ' + ev.title,
    body: ev.event_date ? `${new Date(ev.event_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })} · ¡Entérate de los detalles en la app!` : '¡Entérate de los detalles en la app!',
    type: 'general',
  } });

  const save = async () => {
    if (!form.title.trim()) { alert('Falta el título.'); return; }
    setSaving(true);
    const payload = {
      title: form.title.trim(), description: form.description.trim() || null,
      event_date: form.event_date ? new Date(form.event_date).toISOString() : null,
      location: form.location.trim() || null, image_url: form.image_url || null,
      price: form.price === '' ? null : (parseInt(form.price, 10) || 0),
      registration_open: !!form.registration_open,
    };
    if (form.id) await supabase.from('events').update(payload).eq('id', form.id);
    else await supabase.from('events').insert(payload);
    if (form.notify) {
      const { data, error } = await notifyClients(payload);
      if (error || data?.error) alert('Evento guardado, pero el aviso falló: ' + (error?.message || data?.error || 'error'));
    }
    setSaving(false); setForm(null); load();
  };
  const del = async (e) => { if (confirm(`¿Eliminar el evento "${e.title}"?`)) { await supabase.from('events').delete().eq('id', e.id); load(); } };

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', margin: 0, color: INK, display: 'flex', alignItems: 'center', gap: '8px' }}><Sparkles size={20} color={PRIMARY} /> Eventos</h2>
        {!form && <button onClick={() => setForm({ ...blank })} style={{ background: PRIMARY, color: 'white', border: 'none', padding: '9px 15px', borderRadius: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}><Plus size={16} /> Nuevo evento</button>}
      </div>

      <AnimatePresence>
        {form && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginBottom: '20px' }}>
            <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid rgba(0,0,0,0.05)', padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: INK }}>{form.id ? 'Editar evento' : 'Nuevo evento'}</h3>
                <button onClick={() => setForm(null)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={16} /></button>
              </div>
              <div style={{ marginBottom: '12px' }}><PhotoButton url={form.image_url} onUploaded={(u) => setForm(f => ({ ...f, image_url: u }))} /></div>
              <input placeholder="Título del evento" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={{ ...input, marginBottom: '12px' }} />
              <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <input type="datetime-local" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} style={{ ...input, flex: '1 1 200px' }} />
                <input placeholder="Lugar (ej. El estudio)" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} style={{ ...input, flex: '1 1 160px' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <input type="number" placeholder="Precio $ (vacío = sin costo)" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} style={{ ...input, flex: '1 1 160px' }} />
                <button type="button" onClick={() => setForm({ ...form, registration_open: !form.registration_open })} style={{ flex: '1 1 160px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', padding: '11px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.84rem', background: form.registration_open ? 'rgba(34,197,94,0.12)' : 'rgba(0,0,0,0.05)', color: form.registration_open ? '#16A34A' : 'var(--on-surface-variant)' }}>
                  <Ticket size={15} /> {form.registration_open ? 'Inscripción ABIERTA' : 'Inscripción cerrada'}
                </button>
              </div>
              <textarea placeholder="Descripción" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} style={{ ...input, marginBottom: '12px', resize: 'vertical' }} />
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>
                <input type="checkbox" checked={form.notify} onChange={e => setForm({ ...form, notify: e.target.checked })} style={{ width: '18px', height: '18px', accentColor: PRIMARY }} />
                <Bell size={15} color={PRIMARY} /> Avisar a las clientas (push + notificación)
              </label>
              <button onClick={save} disabled={saving} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: PRIMARY, color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}><Save size={16} /> {saving ? 'Guardando…' : (form.id ? 'Guardar cambios' : 'Crear evento')}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '46px', color: 'var(--on-surface-variant)' }}><Sparkles size={34} style={{ opacity: 0.3, marginBottom: '12px' }} /><p style={{ margin: 0, fontWeight: 700, color: INK }}>Sin eventos todavía</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
          {events.map(e => (
            <div key={e.id} style={{ background: '#fff', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', padding: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {e.image_url ? <img src={e.image_url} alt="" style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }} /> : <div style={{ width: '64px', height: '64px', borderRadius: '12px', background: 'rgba(255,145,77,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Sparkles size={24} color={PRIMARY} /></div>}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, color: INK, fontSize: '0.95rem', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                    {e.event_date && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', color: 'var(--on-surface-variant)' }}><CalendarDays size={12} /> {new Date(e.event_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
                    {e.location && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', color: 'var(--on-surface-variant)' }}><MapPin size={12} /> {e.location}</span>}
                    {e.price != null && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', color: PRIMARY, fontWeight: 700 }}><Tag size={12} /> {e.price === 0 ? 'Gratis' : `$${e.price}`}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
                  <button onClick={() => startEdit(e)} style={{ width: '32px', height: '32px', borderRadius: '9px', border: 'none', background: 'rgba(255,145,77,0.12)', color: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Pencil size={15} /></button>
                  <button onClick={() => del(e)} style={{ width: '32px', height: '32px', borderRadius: '9px', border: 'none', background: 'rgba(186,26,26,0.08)', color: '#ba1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Trash2 size={15} /></button>
                </div>
              </div>
              {/* Acciones inferiores */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                {e.registration_open && (
                  <button onClick={() => viewRegs(e.id)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(34,197,94,0.1)', color: '#16A34A', border: 'none', borderRadius: '9px', padding: '7px 11px', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>
                    <Users size={13} /> {counts[e.id] || 0} inscritas <ChevronDown size={12} />
                  </button>
                )}
                <button onClick={() => avisar(e)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(255,145,77,0.12)', color: PRIMARY, border: 'none', borderRadius: '9px', padding: '7px 11px', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>
                  <Bell size={13} /> Avisar
                </button>
              </div>
              {regView[e.id] && (
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {regView[e.id].length === 0 ? <span style={{ fontSize: '0.82rem', color: 'var(--on-surface-variant)' }}>Aún no hay inscritas.</span>
                    : regView[e.id].map((r, i) => <div key={i} style={{ fontSize: '0.84rem', color: INK, display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: PRIMARY }} />{r.users?.full_name || r.users?.email || 'Clienta'}</div>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
