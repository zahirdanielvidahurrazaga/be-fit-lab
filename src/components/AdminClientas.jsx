import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Cake, Crown, UserX, UserCheck, Shield, Coffee, Dumbbell, ChevronDown, Mail, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const ROLES = [
  { value: 'CLIENT', label: 'Clienta', Icon: Dumbbell, color: '#6C5CE7' },
  { value: 'COACH', label: 'Coach', Icon: Crown, color: '#E07A9C' },
  { value: 'BARISTA', label: 'Barista', Icon: Coffee, color: '#FF914D' },
  { value: 'ADMIN', label: 'Admin', Icon: Shield, color: '#1A1C1E' },
];
const roleMeta = (r) => ROLES.find(x => x.value === r) || ROLES[0];

const fmtBday = (d) => {
  if (!d) return null;
  const [, m, day] = d.split('-');
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${parseInt(day, 10)} ${meses[parseInt(m, 10) - 1]}`;
};

const FILTERS = [
  ['all', 'Todas'],
  ['active', 'Activas'],
  ['inactive', 'Sin plan'],
  ['staff', 'Staff'],
];

function ClientCard({ u, onRole, onBaja, onReactivar, busy }) {
  const [openRole, setOpenRole] = useState(false);
  const rm = roleMeta(u.role);
  const active = u.membership_status === 'ACTIVE';
  return (
    <div style={{ background: 'white', borderRadius: '18px', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 8px 20px rgba(0,0,0,0.03)', padding: '14px' }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        {u.avatar_url
          ? <img src={u.avatar_url} alt="" style={{ width: '46px', height: '46px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          : <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: `linear-gradient(135deg, ${rm.color}, ${rm.color}99)`, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>{(u.full_name || u.email || '?').charAt(0).toUpperCase()}</div>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, color: 'var(--black)', fontSize: '0.98rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.full_name || 'Sin nombre'}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
        </div>
        {/* Selector de rol */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button onClick={() => setOpenRole(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: `${rm.color}15`, color: rm.color, border: 'none', borderRadius: '10px', padding: '7px 10px', fontWeight: 800, fontSize: '0.74rem', cursor: 'pointer' }}>
            <rm.Icon size={13} /> {rm.label} <ChevronDown size={13} />
          </button>
          {openRole && (
            <>
              <div onClick={() => setOpenRole(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
              <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 11, background: 'white', borderRadius: '12px', boxShadow: '0 12px 30px rgba(0,0,0,0.18)', border: '1px solid rgba(0,0,0,0.05)', overflow: 'hidden', minWidth: '150px' }}>
                {ROLES.map(r => (
                  <button key={r.value} onClick={() => { setOpenRole(false); if (r.value !== u.role) onRole(u, r.value); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 12px', border: 'none', background: r.value === u.role ? 'rgba(0,0,0,0.04)' : 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', color: r.color, textAlign: 'left' }}>
                    <r.Icon size={15} /> {r.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '4px 9px', borderRadius: '8px', background: active ? 'rgba(34,197,94,0.12)' : 'rgba(0,0,0,0.05)', color: active ? '#16A34A' : 'var(--on-surface-variant)' }}>
          {active ? (u.membership_plan || 'Activa') : 'Sin plan'}
        </span>
        {active && u.classes_remaining != null && (
          <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '4px 9px', borderRadius: '8px', background: 'rgba(255,145,77,0.12)', color: 'var(--primary)' }}>{u.classes_remaining} clases</span>
        )}
        {u.birth_date && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 700, padding: '4px 9px', borderRadius: '8px', background: 'rgba(224,122,156,0.12)', color: '#E07A9C' }}><Cake size={12} /> {fmtBday(u.birth_date)}</span>
        )}
        {u.phone && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 700, padding: '4px 9px', borderRadius: '8px', background: 'rgba(0,0,0,0.05)', color: 'var(--on-surface-variant)' }}><Phone size={11} /> {u.phone}</span>
        )}
      </div>

      {/* Acciones de membresía */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        {active ? (
          <button disabled={busy} onClick={() => onBaja(u)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(186,26,26,0.08)', color: '#ba1a1a', border: 'none', borderRadius: '10px', padding: '8px 12px', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>
            <UserX size={14} /> Dar de baja
          </button>
        ) : (
          <button disabled={busy} onClick={() => onReactivar(u)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(34,197,94,0.1)', color: '#16A34A', border: 'none', borderRadius: '10px', padding: '8px 12px', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>
            <UserCheck size={14} /> Reactivar plan
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminClientas() {
  const { allUsers, fetchAllUsers } = useAuth();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState(false);

  const patch = async (id, updates) => {
    setBusy(true);
    const { error } = await supabase.from('users').update(updates).eq('id', id);
    if (error) alert('No se pudo actualizar: ' + error.message);
    await fetchAllUsers();
    setBusy(false);
  };

  const onRole = (u, role) => {
    const label = roleMeta(role).label;
    if (confirm(`¿Cambiar a "${u.full_name || u.email}" al rol de ${label}?`)) patch(u.id, { role });
  };
  const onBaja = (u) => {
    if (confirm(`¿Dar de baja la membresía de "${u.full_name || u.email}"? Se pondrá sin plan y sin clases.`)) patch(u.id, { membership_status: 'INACTIVE', classes_remaining: 0 });
  };
  const onReactivar = (u) => {
    if (confirm(`¿Reactivar la membresía de "${u.full_name || u.email}"?`)) patch(u.id, { membership_status: 'ACTIVE' });
  };

  const list = useMemo(() => {
    let arr = allUsers || [];
    if (filter === 'active') arr = arr.filter(u => u.membership_status === 'ACTIVE' && u.role === 'CLIENT');
    else if (filter === 'inactive') arr = arr.filter(u => u.membership_status !== 'ACTIVE' && u.role === 'CLIENT');
    else if (filter === 'staff') arr = arr.filter(u => ['COACH', 'BARISTA', 'ADMIN'].includes(u.role));
    const s = q.trim().toLowerCase();
    if (s) arr = arr.filter(u => (u.full_name || '').toLowerCase().includes(s) || (u.email || '').toLowerCase().includes(s));
    return [...arr].sort((a, b) => (a.full_name || a.email || '').localeCompare(b.full_name || b.email || ''));
  }, [allUsers, filter, q]);

  const counts = useMemo(() => {
    const clients = (allUsers || []).filter(u => u.role === 'CLIENT');
    return {
      total: (allUsers || []).length,
      active: clients.filter(u => u.membership_status === 'ACTIVE').length,
      clients: clients.length,
    };
  }, [allUsers]);

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', margin: 0, color: 'var(--black)' }}>Clientas</h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>{counts.clients} clientas · {counts.active} activas · {counts.total} cuentas</span>
      </div>

      {/* Buscador */}
      <div style={{ position: 'relative', marginBottom: '12px' }}>
        <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)' }} />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nombre o correo…"
          style={{ width: '100%', padding: '12px 14px 12px 42px', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.1)', background: 'white', fontSize: '0.92rem', boxSizing: 'border-box' }} />
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '18px' }}>
        {FILTERS.map(([id, label]) => {
          const on = filter === id;
          return (
            <button key={id} onClick={() => setFilter(id)} style={{ padding: '8px 14px', borderRadius: '11px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', whiteSpace: 'nowrap', flexShrink: 0, background: on ? 'var(--primary)' : 'rgba(0,0,0,0.05)', color: on ? '#fff' : 'var(--on-surface-variant)' }}>{label}</button>
          );
        })}
      </div>

      {list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--on-surface-variant)' }}>
          <UserX size={36} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <p style={{ margin: 0, fontWeight: 700, color: 'var(--black)' }}>Sin resultados</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
          {list.map(u => (
            <ClientCard key={u.id} u={u} onRole={onRole} onBaja={onBaja} onReactivar={onReactivar} busy={busy} />
          ))}
        </div>
      )}
    </section>
  );
}
