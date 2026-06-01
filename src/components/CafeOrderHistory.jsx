import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Receipt, ChevronRight, Clock, Gift } from 'lucide-react';
import { supabase } from '../lib/supabase';

const STATUS = {
  paid:      { label: 'Confirmado',  color: '#FF914D', tint: 'rgba(255,145,77,0.12)' },
  preparing: { label: 'Preparando', color: '#3B82F6', tint: 'rgba(59,130,246,0.12)' },
  ready:     { label: 'Listo',      color: '#16A34A', tint: 'rgba(22,163,74,0.12)' },
  completed: { label: 'Entregado',  color: '#6B5B50', tint: 'rgba(107,91,80,0.1)' },
  cancelled: { label: 'Cancelado',  color: '#9CA3AF', tint: 'rgba(156,163,175,0.12)' },
};
const ACTIVE = ['paid', 'preparing', 'ready'];

const fmtDate = (iso) => {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay
    ? `Hoy · ${d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`
    : d.toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

export default function CafeOrderHistory({ userId, onClose, onOpenOrder }) {
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await supabase.from('cafe_orders')
        .select('id,status,items,total,created_at,is_gift,pickup_time')
        .eq('user_id', userId).neq('status', 'pending_payment')
        .order('created_at', { ascending: false }).limit(50);
      setOrders(data || []);
    })();
  }, [userId]);

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 4200 }} />
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 32, stiffness: 320 }}
        style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 4201, maxHeight: '88vh', background: '#FDFBF7', borderTopLeftRadius: '28px', borderTopRightRadius: '28px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 -10px 40px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'calc(env(safe-area-inset-top,0px) + 8px) 22px 12px' }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: '#1A1C1E' }}>Mis pedidos</h2>
          <button onClick={onClose} aria-label="Cerrar" style={{ width: '34px', height: '34px', borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        <div style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '0 18px calc(env(safe-area-inset-bottom,0px) + 28px)', flex: 1 }}>
          {orders === null ? (
            <p style={{ textAlign: 'center', color: '#9CA3AF', padding: '40px 0' }}>Cargando…</p>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '54px 20px', color: '#9CA3AF' }}>
              <Receipt size={40} style={{ opacity: 0.35, marginBottom: '12px' }} />
              <p style={{ margin: 0, fontWeight: 600, color: '#6B5B50' }}>Aún no tienes pedidos</p>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>Tus compras de la cafetería aparecerán aquí.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {orders.map(o => {
                const st = STATUS[o.status] || STATUS.completed;
                const isActive = ACTIVE.includes(o.status);
                const clickable = o.status !== 'cancelled'; // sin tracking para cancelados
                const summary = (o.items || []).map(i => `${i.qty}× ${i.name}`).join(', ');
                const Tag = clickable ? 'button' : 'div';
                return (
                  <Tag key={o.id} onClick={clickable ? () => onOpenOrder(o.id) : undefined}
                    style={{ textAlign: 'left', width: '100%', cursor: clickable ? 'pointer' : 'default', opacity: clickable ? 1 : 0.7, display: 'flex', gap: '12px', alignItems: 'center', padding: '15px 16px', background: '#fff', borderRadius: '18px', border: isActive ? `1.5px solid ${st.color}55` : '1px solid rgba(0,0,0,0.05)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: st.color, background: st.tint, padding: '3px 9px', borderRadius: '7px' }}>{st.label}</span>
                        {isActive && <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: st.color, boxShadow: `0 0 0 0 ${st.color}`, animation: 'cafePulse 1.6s infinite' }} />}
                        {o.is_gift && <Gift size={13} color="#C2456E" />}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1A1C1E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{summary || 'Pedido'}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.76rem', color: '#A89A8E', marginTop: '3px' }}>
                        <Clock size={11} /> {fmtDate(o.created_at)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: '#1A1C1E' }}>${o.total}</div>
                      {clickable && <ChevronRight size={18} color="#C9BDB0" style={{ marginTop: '4px' }} />}
                    </div>
                  </Tag>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
      <style>{`@keyframes cafePulse {0%{box-shadow:0 0 0 0 currentColor;opacity:1}70%{box-shadow:0 0 0 6px transparent;opacity:.6}100%{box-shadow:0 0 0 0 transparent;opacity:1}}`}</style>
    </>
  );
}
