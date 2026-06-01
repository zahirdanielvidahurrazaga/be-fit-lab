import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Minus, Trash2, Gift, Clock, Leaf, ShoppingBag } from 'lucide-react';

const fmtTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('es-MX', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
};

// Carrito estilo Uber Eats: items, complementos, sin popote, regalo, hora de recogida, total.
export default function CafeCartSheet({ cart, products, onClose, onUpdateQty, onRemove, onOpenProduct, onCheckout }) {
  const [noStraw, setNoStraw] = useState(false);
  const [isGift, setIsGift] = useState(false);
  const [giftName, setGiftName] = useState('');
  const [giftMsg, setGiftMsg] = useState('');
  const [schedule, setSchedule] = useState(false);
  const [pickup, setPickup] = useState('');

  const subtotal = cart.reduce((s, i) => s + i.lineTotal, 0);
  const inCart = new Set(cart.map(i => i.product_id));
  const complementos = (products || []).filter(p => p.available !== false && !inCart.has(p.id)).slice(0, 6);

  const finalize = () => {
    onCheckout({
      noStraw,
      gift: isGift ? { is_gift: true, recipient_name: giftName.trim() || null, message: giftMsg.trim() || null, recipient_user_id: null } : null,
      pickupTime: schedule && pickup ? new Date(pickup).toISOString() : null,
    });
  };

  const nowLocal = (() => { const d = new Date(Date.now() + 15 * 60000); d.setSeconds(0, 0); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); })();

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 4000 }} />
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 32, stiffness: 320 }}
        style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 4001, maxHeight: '92vh', background: '#FDFBF7', borderTopLeftRadius: '28px', borderTopRightRadius: '28px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 -10px 40px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 22px 12px' }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: '#1A1C1E' }}>Tu pedido</h2>
          <button onClick={onClose} aria-label="Cerrar" style={{ width: '34px', height: '34px', borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        <div style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '0 22px 28px', flex: 1 }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 0', color: '#9CA3AF' }}>
              <ShoppingBag size={40} style={{ opacity: 0.4, marginBottom: '10px' }} />
              <p style={{ margin: 0 }}>Tu carrito está vacío</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {cart.map(item => (
                <div key={item.lineId} style={{ display: 'flex', gap: '12px', padding: '14px', background: '#fff', borderRadius: '18px', border: '1px solid rgba(0,0,0,0.05)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#1A1C1E' }}>{item.name}</div>
                    {item.optionsDisplay?.length > 0 && (
                      <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '3px' }}>{item.optionsDisplay.map(o => o.name).join(' · ')}</div>
                    )}
                    {item.notes && <div style={{ fontSize: '0.78rem', color: '#9CA3AF', marginTop: '2px', fontStyle: 'italic' }}>“{item.notes}”</div>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F3F4F6', borderRadius: '12px', padding: '5px 10px' }}>
                        <button onClick={() => item.qty > 1 ? onUpdateQty(item.lineId, -1) : onRemove(item.lineId)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex' }}>
                          {item.qty > 1 ? <Minus size={15} color="var(--primary)" /> : <Trash2 size={15} color="#EF4444" />}
                        </button>
                        <span style={{ fontWeight: 800, fontSize: '0.85rem', minWidth: '14px', textAlign: 'center' }}>{item.qty}</span>
                        <button onClick={() => onUpdateQty(item.lineId, 1)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex' }}><Plus size={15} color="var(--primary)" /></button>
                      </div>
                      <span style={{ fontWeight: 800, color: '#1A1C1E' }}>${item.lineTotal}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Complementos */}
          {complementos.length > 0 && cart.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 12px', color: '#1A1C1E' }}>¿Algo más?</h3>
              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '6px' }}>
                {complementos.map(p => (
                  <button key={p.id} onClick={() => onOpenProduct(p)} style={{ flex: '0 0 auto', width: '120px', textAlign: 'left', background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '16px', padding: '12px', cursor: 'pointer' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1A1C1E', lineHeight: 1.2, marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 800 }}>+ ${p.price}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {cart.length > 0 && (
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Sin popote */}
              <button onClick={() => setNoStraw(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', borderRadius: '16px', border: `1.5px solid ${noStraw ? '#22C55E' : 'rgba(0,0,0,0.08)'}`, background: noStraw ? 'rgba(34,197,94,0.08)' : '#fff', cursor: 'pointer', textAlign: 'left' }}>
                <Leaf size={20} color={noStraw ? '#16A34A' : '#9CA3AF'} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1A1C1E' }}>Sin popote</div>
                  <div style={{ fontSize: '0.78rem', color: '#6B7280' }}>Cuida el planeta</div>
                </div>
                <span style={{ width: '20px', height: '20px', borderRadius: '6px', border: `2px solid ${noStraw ? '#22C55E' : '#CBD5E1'}`, background: noStraw ? '#22C55E' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '0.7rem' }}>{noStraw ? '✓' : ''}</span>
              </button>

              {/* Regalo */}
              <div style={{ borderRadius: '16px', border: `1.5px solid ${isGift ? 'var(--primary)' : 'rgba(0,0,0,0.08)'}`, background: '#fff', overflow: 'hidden' }}>
                <button onClick={() => setIsGift(v => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}>
                  <Gift size={20} color={isGift ? 'var(--primary)' : '#9CA3AF'} />
                  <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1A1C1E' }}>Es un regalo</div><div style={{ fontSize: '0.78rem', color: '#6B7280' }}>Para alguien especial</div></div>
                  <span style={{ width: '20px', height: '20px', borderRadius: '6px', border: `2px solid ${isGift ? 'var(--primary)' : '#CBD5E1'}`, background: isGift ? 'var(--primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '0.7rem' }}>{isGift ? '✓' : ''}</span>
                </button>
                {isGift && (
                  <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input value={giftName} onChange={e => setGiftName(e.target.value)} placeholder="¿Para quién? (nombre)" style={{ padding: '11px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '0.9rem' }} />
                    <textarea value={giftMsg} onChange={e => setGiftMsg(e.target.value)} maxLength={120} rows={2} placeholder="Mensaje (opcional)" style={{ padding: '11px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '0.9rem', resize: 'none', fontFamily: 'inherit' }} />
                  </div>
                )}
              </div>

              {/* Hora de recogida */}
              <div style={{ borderRadius: '16px', border: `1.5px solid ${schedule ? 'var(--primary)' : 'rgba(0,0,0,0.08)'}`, background: '#fff', overflow: 'hidden' }}>
                <button onClick={() => setSchedule(v => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}>
                  <Clock size={20} color={schedule ? 'var(--primary)' : '#9CA3AF'} />
                  <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1A1C1E' }}>{schedule ? 'Programar recogida' : 'Lo antes posible'}</div><div style={{ fontSize: '0.78rem', color: '#6B7280' }}>{schedule && pickup ? fmtTime(new Date(pickup).toISOString()) : 'Toca para programar una hora'}</div></div>
                  <span style={{ width: '20px', height: '20px', borderRadius: '6px', border: `2px solid ${schedule ? 'var(--primary)' : '#CBD5E1'}`, background: schedule ? 'var(--primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '0.7rem' }}>{schedule ? '✓' : ''}</span>
                </button>
                {schedule && (
                  <div style={{ padding: '0 14px 14px' }}>
                    <input type="datetime-local" value={pickup} min={nowLocal} onChange={e => setPickup(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer total + finalizar */}
        {cart.length > 0 && (
          <div style={{ padding: '16px 22px', paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 16px)', borderTop: '1px solid rgba(0,0,0,0.06)', background: '#FDFBF7' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'baseline' }}>
              <span style={{ fontSize: '1rem', color: '#6B7280', fontWeight: 600 }}>Total</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1A1C1E' }}>${subtotal} MXN</span>
            </div>
            <button onClick={finalize} style={{ width: '100%', padding: '16px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.45)', background: 'rgba(255,145,77,0.9)', backdropFilter: 'blur(16px) saturate(160%)', WebkitBackdropFilter: 'blur(16px) saturate(160%)', color: '#fff', fontWeight: 800, fontSize: '1.05rem', cursor: 'pointer', boxShadow: '0 10px 24px rgba(255,145,77,0.35)' }}>
              Finalizar compra
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
}
