import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Trash2, Gift, Clock, Leaf, ShoppingBag, CreditCard, Banknote, ChevronRight, SmartphoneNfc } from 'lucide-react';

const fmtTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('es-MX', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
};

export default function CafeCartSheet({ cart, products, onUpdateQty, onRemove, onOpenProduct, onCheckout, onVerMenu }) {
  const [noStraw, setNoStraw] = useState(false);
  const [isGift, setIsGift] = useState(false);
  const [giftName, setGiftName] = useState('');
  const [giftMsg, setGiftMsg] = useState('');
  const [schedule, setSchedule] = useState(false);
  const [pickup, setPickup] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');

  const subtotal = cart.reduce((s, i) => s + i.lineTotal, 0);
  const inCart = new Set(cart.map(i => i.product_id));
  const complementos = (products || []).filter(p => p.available !== false && !inCart.has(p.id)).slice(0, 6);

  const finalize = () => {
    onCheckout({
      noStraw,
      gift: isGift ? { is_gift: true, recipient_name: giftName.trim() || null, message: giftMsg.trim() || null, recipient_user_id: null } : null,
      pickupTime: schedule && pickup ? new Date(pickup).toISOString() : null,
      paymentMethod
    });
  };

  const nowLocal = (() => { const d = new Date(Date.now() + 15 * 60000); d.setSeconds(0, 0); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: 'var(--font-body)' }}>
      {/* El título "Tu carrito" ahora lo pone el encabezado de la pestaña (con la flecha de salida). */}

      {cart.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--c-muted)' }}>
          <ShoppingBag size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--c-muted)' }}>Aún no hay nada aquí</p>
          <p style={{ margin: '8px 0 0', fontSize: '0.9rem' }}>Agrega tus bebidas favoritas desde el menú.</p>
          {onVerMenu && (
            <button type="button" onClick={onVerMenu}
              style={{ marginTop: '18px', padding: '12px 26px', borderRadius: '999px', border: 'none', background: 'var(--c-ink)', color: 'var(--c-bg)', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 8px 20px rgba(20,14,10,0.22)' }}>
              Ver el menú
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {cart.map(item => (
            <div key={item.lineId} style={{ display: 'flex', gap: '14px', padding: '10px', background: 'var(--c-card)', borderRadius: '22px', border: '1px solid var(--c-line)' }}>
              <div style={{ width: '76px', height: '76px', borderRadius: '16px', background: 'var(--c-soft)', overflow: 'hidden', flexShrink: 0 }}>
                {item.image_url && <img src={item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', padding: '2px 4px 0 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'baseline' }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--c-ink)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--c-ink)', flexShrink: 0 }}>${item.lineTotal}</div>
                </div>
                {item.optionsDisplay?.length > 0 && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--c-muted)', marginTop: '3px', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.optionsDisplay.map(o => o.name).join(' · ')}</div>
                )}
                {item.notes && <div style={{ fontSize: '0.8rem', color: 'var(--c-muted)', marginTop: '2px', fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>“{item.notes}”</div>}
                <div style={{ marginTop: 'auto', paddingTop: '8px', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid var(--c-line)', borderRadius: '999px', padding: '3px', width: 'fit-content' }}>
                  <button type="button" aria-label={item.qty > 1 ? 'Quitar uno' : 'Eliminar del carrito'} onClick={() => item.qty > 1 ? onUpdateQty(item.lineId, -1) : onRemove(item.lineId)}
                    style={{ border: 'none', background: 'transparent', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    {item.qty > 1 ? <Minus size={15} color="var(--c-ink)" /> : <Trash2 size={15} color="var(--c-muted)" />}
                  </button>
                  <span style={{ fontWeight: 800, fontSize: '0.92rem', minWidth: '18px', textAlign: 'center', color: 'var(--c-ink)' }}>{item.qty}</span>
                  <button type="button" aria-label="Agregar uno" onClick={() => onUpdateQty(item.lineId, 1)}
                    style={{ border: 'none', background: 'var(--c-ink)', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Plus size={15} color="var(--c-bg)" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Complementos */}
      {complementos.length > 0 && cart.length > 0 && (
        <div>
          <h3 style={{ fontFamily: 'var(--c-font)', fontWeight: 800, letterSpacing: '-0.025em', fontSize: '1rem', margin: '0 0 12px', color: 'var(--c-ink)' }}>¿Algo más?</h3>
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none', paddingBottom: '4px', margin: '0 -20px', paddingLeft: '20px', paddingRight: '20px' }}>
            <style>{`div::-webkit-scrollbar { display: none; }`}</style>
            {complementos.map(p => (
              <button key={p.id} type="button" onClick={() => onOpenProduct(p)}
                style={{ flex: '0 0 auto', width: '196px', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left', background: 'var(--c-card)', border: '1px solid var(--c-line)', borderRadius: '18px', padding: '8px 10px 8px 8px', cursor: 'pointer', fontFamily: 'inherit' }}>
                <span style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'var(--c-soft)', overflow: 'hidden', flexShrink: 0 }}>
                  {p.image_url && <img src={p.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: 'var(--c-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                  <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--c-muted)', fontWeight: 600, marginTop: '2px' }}>${p.price}</span>
                </span>
                <span aria-hidden="true" style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--c-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Plus size={14} color="var(--c-bg)" strokeWidth={2.6} />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {cart.length > 0 && (
        <>
          {/* Opciones - Estilo Lista iOS */}
          <div style={{ background: 'var(--c-card)', borderRadius: '22px', border: '1px solid var(--c-line)', overflow: 'hidden' }}>
            
            {/* Sin popote */}
            <div onClick={() => setNoStraw(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 20px', cursor: 'pointer', borderBottom: '1px solid var(--c-line)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--c-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                <Leaf size={20} color={noStraw ? 'var(--c-ink)' : 'var(--c-muted)'} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--c-ink)' }}>Sin popote</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--c-muted)', marginTop: '2px' }}>Cuida el planeta</div>
              </div>
              <div style={{ width: '50px', height: '30px', borderRadius: '30px', background: noStraw ? 'var(--c-ink)' : 'var(--c-seg)', position: 'relative', transition: 'all 0.3s ease' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--c-card)', position: 'absolute', top: '2px', left: noStraw ? '22px' : '2px', transition: 'all 0.3s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
              </div>
            </div>

            {/* Regalo */}
            <div style={{ borderBottom: '1px solid var(--c-line)' }}>
              <div onClick={() => setIsGift(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 20px', cursor: 'pointer' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--c-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                  <Gift size={20} color={isGift ? 'var(--c-ink)' : 'var(--c-muted)'} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--c-ink)' }}>Es un regalo</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--c-muted)', marginTop: '2px' }}>Para alguien especial</div>
                </div>
                <div style={{ width: '50px', height: '30px', borderRadius: '30px', background: isGift ? 'var(--c-ink)' : 'var(--c-seg)', position: 'relative', transition: 'all 0.3s ease' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--c-card)', position: 'absolute', top: '2px', left: isGift ? '22px' : '2px', transition: 'all 0.3s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                </div>
              </div>
              <AnimatePresence>
                {isGift && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <input value={giftName} onChange={e => setGiftName(e.target.value)} placeholder="¿Para quién? (nombre)" style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid var(--c-line)', color: 'var(--c-ink)', fontSize: '0.95rem', background: 'var(--c-bg)', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                      <textarea value={giftMsg} onChange={e => setGiftMsg(e.target.value)} maxLength={120} rows={2} placeholder="Mensaje (opcional)" style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid var(--c-line)', color: 'var(--c-ink)', fontSize: '0.95rem', resize: 'none', fontFamily: 'inherit', background: 'var(--c-bg)', boxSizing: 'border-box' }} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Hora de recogida */}
            <div>
              <div onClick={() => setSchedule(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 20px', cursor: 'pointer' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--c-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                  <Clock size={20} color={schedule ? 'var(--c-ink)' : 'var(--c-muted)'} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--c-ink)' }}>{schedule ? 'Programar recogida' : 'Lo antes posible'}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--c-muted)', marginTop: '2px' }}>{schedule && pickup ? fmtTime(new Date(pickup).toISOString()) : 'Toca para programar hora'}</div>
                </div>
                <div style={{ width: '50px', height: '30px', borderRadius: '30px', background: schedule ? 'var(--c-ink)' : 'var(--c-seg)', position: 'relative', transition: 'all 0.3s ease' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--c-card)', position: 'absolute', top: '2px', left: schedule ? '22px' : '2px', transition: 'all 0.3s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                </div>
              </div>
              <AnimatePresence>
                {schedule && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '0 20px 20px' }}>
                      <input type="datetime-local" value={pickup} min={nowLocal} onChange={e => setPickup(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid var(--c-line)', color: 'var(--c-ink)', fontSize: '0.95rem', boxSizing: 'border-box', background: 'var(--c-bg)', fontFamily: 'inherit' }} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Footer total + finalizar */}
          <div style={{ marginTop: '12px', paddingTop: '16px' }}>
            <h3 style={{ fontFamily: 'var(--c-font)', fontWeight: 800, letterSpacing: '-0.025em', fontSize: '0.95rem', margin: '0 0 12px', color: 'var(--c-ink)' }}>Método de pago</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              <button onClick={() => setPaymentMethod('card')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '18px', border: `1.5px solid ${paymentMethod === 'card' ? 'var(--c-ink)' : 'var(--c-line)'}`, background: 'var(--c-card)', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left' }}>
                <CreditCard size={22} color={paymentMethod === 'card' ? 'var(--c-ink)' : 'var(--c-muted)'} />
                <span style={{ flex: 1, color: paymentMethod === 'card' ? 'var(--c-ink)' : 'var(--c-muted)', fontWeight: paymentMethod === 'card' ? 700 : 500, fontSize: '0.95rem' }}>Pago con tarjeta</span>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${paymentMethod === 'card' ? 'var(--c-ink)' : 'var(--c-line)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{paymentMethod === 'card' && <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--c-ink)' }} />}</span>
              </button>
              <button onClick={() => setPaymentMethod('cash')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '18px', border: `1.5px solid ${paymentMethod === 'cash' ? 'var(--c-ink)' : 'var(--c-line)'}`, background: 'var(--c-card)', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left' }}>
                <Banknote size={22} color={paymentMethod === 'cash' ? 'var(--c-ink)' : 'var(--c-muted)'} />
                <span style={{ flex: 1, color: paymentMethod === 'cash' ? 'var(--c-ink)' : 'var(--c-muted)', fontWeight: paymentMethod === 'cash' ? 700 : 500, fontSize: '0.95rem' }}>Efectivo al recoger</span>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${paymentMethod === 'cash' ? 'var(--c-ink)' : 'var(--c-line)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{paymentMethod === 'cash' && <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--c-ink)' }} />}</span>
              </button>
            </div>
            
            <div style={{ background: 'var(--c-card)', padding: '20px', borderRadius: '22px', border: '1px solid var(--c-line)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
                <span style={{ fontSize: '1.1rem', color: 'var(--c-muted)', fontWeight: 600 }}>Total a pagar</span>
                <span style={{ fontFamily: 'var(--c-font)', fontWeight: 800, letterSpacing: '-0.025em', fontSize: '1.6rem', color: 'var(--c-ink)' }}>${subtotal}</span>
              </div>
              <button onClick={finalize} style={{ width: '100%', padding: '18px', borderRadius: '100px', border: 'none', background: 'var(--c-ink)', color: 'var(--c-bg)', fontWeight: 800, fontSize: '1.05rem', cursor: 'pointer', boxShadow: '0 12px 28px rgba(20,14,10,0.25)', transition: 'transform 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: 'var(--font-body)' }} onMouseEnter={e => e.currentTarget.style.transform='scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
                {paymentMethod === 'card' ? 'Pagar ahora' : 'Confirmar pedido'}
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
