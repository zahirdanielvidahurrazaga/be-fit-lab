import React, { useEffect, useState, useMemo } from 'react';
import { Coffee, LogOut, Gift, Clock, Leaf, CheckCircle2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const STATUS = {
  paid: { label: 'Nuevo', color: '#FF914D', next: 'preparing', action: 'Preparar' },
  preparing: { label: 'Preparando', color: '#3B82F6', next: 'ready', action: 'Marcar listo' },
  ready: { label: 'Listo', color: '#22C55E', next: 'completed', action: 'Entregado' },
};

const timeAgo = (iso) => {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'Ahora';
  if (m < 60) return `Hace ${m} min`;
  const h = Math.floor(m / 60);
  return `Hace ${h} h`;
};
const fmtPickup = (iso) => new Date(iso).toLocaleString('es-MX', { weekday: 'short', hour: '2-digit', minute: '2-digit' });

function Barista() {
  const { logout, profileName } = useAuth();
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('active'); // active | history
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('cafe_orders')
      .select('*, buyer:user_id(full_name)')
      .neq('status', 'pending_payment')
      .order('created_at', { ascending: false })
      .limit(100);
    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    const channel = supabase.channel('barista:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cafe_orders' }, () => fetchOrders())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const advance = async (order) => {
    const next = STATUS[order.status]?.next;
    if (!next) return;
    setOrders(os => os.map(o => o.id === order.id ? { ...o, status: next } : o)); // optimista
    await supabase.from('cafe_orders').update({ status: next }).eq('id', order.id);
  };

  const active = useMemo(() => orders.filter(o => ['paid', 'preparing', 'ready'].includes(o.status)), [orders]);
  const history = useMemo(() => orders.filter(o => o.status === 'completed' || o.status === 'cancelled'), [orders]);
  const list = tab === 'active' ? active : history;

  return (
    <div style={{ minHeight: '100vh', background: '#F4EFE9', paddingBottom: '40px' }}>
      {/* HEADER */}
      <header style={{ background: 'linear-gradient(135deg, #2B211C, #4A3B30)', padding: 'calc(env(safe-area-inset-top,0px) + 18px) 20px 18px', color: '#fff', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Coffee size={22} color="#FFB7A8" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.7, fontWeight: 600 }}>Be Fit Lab · Cafetería</p>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontFamily: 'var(--font-display)' }}>Pedidos {active.length > 0 && <span style={{ fontSize: '0.9rem', background: 'var(--primary)', borderRadius: '10px', padding: '2px 9px', marginLeft: '4px' }}>{active.length}</span>}</h1>
          </div>
          <button onClick={fetchOrders} aria-label="Refrescar" style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.12)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><RefreshCw size={18} /></button>
          <button onClick={logout} aria-label="Salir" style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: 'rgba(255,77,77,0.2)', color: '#FF8B8B', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><LogOut size={18} /></button>
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          {[['active', 'Activos'], ['history', 'Historial']].map(([k, lbl]) => (
            <button key={k} onClick={() => setTab(k)} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', background: tab === k ? '#fff' : 'rgba(255,255,255,0.1)', color: tab === k ? '#2B211C' : '#fff' }}>{lbl}</button>
          ))}
        </div>
      </header>

      <main style={{ maxWidth: '720px', margin: '0 auto', padding: '18px 16px' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#8a7266' }}>Cargando…</p>
        ) : list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8a7266' }}>
            <Coffee size={44} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p style={{ margin: 0, fontWeight: 600 }}>{tab === 'active' ? 'Sin pedidos activos' : 'Sin historial'}</p>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', opacity: 0.8 }}>Los pedidos nuevos aparecen aquí al instante.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <AnimatePresence initial={false}>
              {list.map(order => {
                const st = STATUS[order.status];
                return (
                  <motion.div key={order.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
                    style={{ background: '#fff', borderRadius: '20px', padding: '16px', boxShadow: '0 6px 20px rgba(0,0,0,0.06)', border: order.status === 'ready' ? '2px solid #22C55E' : '1px solid rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: '#1A1C1E' }}>{order.buyer?.full_name || 'Clienta'}</div>
                        <div style={{ fontSize: '0.78rem', color: '#8a7266' }}>{timeAgo(order.created_at)} · #{order.id.slice(0, 6)}</div>
                      </div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#fff', background: (st?.color || '#9CA3AF'), borderRadius: '10px', padding: '4px 10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {st?.label || order.status}
                      </span>
                    </div>

                    {/* Badges */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                      {order.pickup_time && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#B45309', background: 'rgba(245,158,11,0.12)', padding: '4px 9px', borderRadius: '9px' }}><Clock size={12} /> {fmtPickup(order.pickup_time)}</span>}
                      {order.no_straw && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#16A34A', background: 'rgba(34,197,94,0.12)', padding: '4px 9px', borderRadius: '9px' }}><Leaf size={12} /> Sin popote</span>}
                      {order.is_gift && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#C2456E', background: 'rgba(224,122,156,0.12)', padding: '4px 9px', borderRadius: '9px' }}><Gift size={12} /> Regalo{order.gift_recipient_name ? ` · ${order.gift_recipient_name}` : ''}</span>}
                    </div>

                    {/* Items */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: order.gift_message ? '8px' : '12px' }}>
                      {(order.items || []).map((it, idx) => (
                        <div key={idx} style={{ borderLeft: '3px solid rgba(255,145,77,0.4)', paddingLeft: '10px' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1A1C1E' }}>{it.qty}× {it.name}</div>
                          {it.options?.length > 0 && <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>{it.options.map(o => o.name).join(' · ')}</div>}
                          {it.notes && <div style={{ fontSize: '0.78rem', color: '#9CA3AF', fontStyle: 'italic' }}>“{it.notes}”</div>}
                        </div>
                      ))}
                    </div>

                    {order.gift_message && <div style={{ fontSize: '0.82rem', color: '#C2456E', background: 'rgba(224,122,156,0.08)', borderRadius: '10px', padding: '8px 10px', marginBottom: '12px' }}>💌 “{order.gift_message}”</div>}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1A1C1E' }}>${order.total} MXN</span>
                      {st && (
                        <button onClick={() => advance(order)} style={{ border: 'none', cursor: 'pointer', background: st.color, color: '#fff', fontWeight: 800, fontSize: '0.9rem', padding: '11px 20px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {order.status === 'ready' ? <CheckCircle2 size={16} /> : null} {st.action}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}

export default Barista;
