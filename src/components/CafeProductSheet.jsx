import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Minus, Flame, ShoppingCart } from 'lucide-react';

// Ficha de producto estilo Uber Eats: info + personalización + cantidad + notas.
export default function CafeProductSheet({ product, groups, onClose, onAdd }) {
  // Grupos que aplican a la categoría del producto
  const applicable = useMemo(
    () => (groups || [])
      .filter(g => !g.applies_to || g.applies_to.length === 0 || g.applies_to.includes(product.category))
      .map(g => ({ ...g, options: (g.cafe_options || g.options || []).filter(o => o.available !== false).sort((a, b) => a.sort_order - b.sort_order) }))
      .filter(g => g.options.length > 0)
      .sort((a, b) => a.sort_order - b.sort_order),
    [groups, product]
  );

  // selección: { [groupId]: optionId | optionId[] }
  const [sel, setSel] = useState(() => {
    const init = {};
    applicable.forEach(g => {
      if (g.selection_type === 'single' && g.required) init[g.id] = g.options[0]?.id;
      if (g.selection_type === 'multi') init[g.id] = [];
    });
    return init;
  });
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState('');

  const pickSingle = (gid, oid) => setSel(s => ({ ...s, [gid]: s[gid] === oid ? undefined : oid }));
  const toggleMulti = (gid, oid) => setSel(s => {
    const arr = s[gid] || [];
    return { ...s, [gid]: arr.includes(oid) ? arr.filter(x => x !== oid) : [...arr, oid] };
  });

  const { optionIds, display, unit } = useMemo(() => {
    const ids = [];
    const disp = [];
    let extra = 0;
    applicable.forEach(g => {
      const v = sel[g.id];
      const chosen = Array.isArray(v) ? v : (v ? [v] : []);
      chosen.forEach(oid => {
        const o = g.options.find(x => x.id === oid);
        if (o) { ids.push(o.id); disp.push({ group: g.name, name: o.name, delta: o.price_delta || 0 }); extra += (o.price_delta || 0); }
      });
    });
    return { optionIds: ids, display: disp, unit: product.price + extra };
  }, [sel, applicable, product]);

  const lineTotal = unit * qty;

  const add = () => {
    onAdd({
      lineId: (crypto?.randomUUID?.() || String(Date.now() + Math.random())),
      product_id: product.id,
      name: product.name,
      image_url: product.image_url,
      qty,
      option_ids: optionIds,
      optionsDisplay: display,
      notes: notes.trim(),
      unitPrice: unit,
      lineTotal,
    });
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 4000 }} />
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 32, stiffness: 320 }}
        style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 4001, maxHeight: '90vh', background: '#FDFBF7', borderTopLeftRadius: '28px', borderTopRightRadius: '28px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 -10px 40px rgba(0,0,0,0.25)' }}>
        {/* Header con imagen */}
        <div style={{ position: 'relative' }}>
          {product.image_url ? (
            <div style={{ height: '200px', background: 'linear-gradient(180deg,#F0E6DC,#FDFBF7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={product.image_url} alt={product.name} style={{ maxHeight: '180px', maxWidth: '80%', objectFit: 'contain', mixBlendMode: 'multiply' }} />
            </div>
          ) : <div style={{ height: '64px' }} />}
          <button onClick={onClose} aria-label="Cerrar" style={{ position: 'absolute', top: '16px', right: '16px', width: '36px', height: '36px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
            <X size={18} color="#1A1C1E" />
          </button>
        </div>

        <div style={{ overflowY: 'auto', padding: '20px 22px 0', flex: 1 }}>
          <h2 style={{ margin: '0 0 6px', fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: '#1A1C1E' }}>{product.name}</h2>
          {product.description && <p style={{ margin: '0 0 12px', color: '#6B7280', fontSize: '0.92rem', lineHeight: 1.5 }}>{product.description}</p>}
          {(product.cals || product.protein) && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
              {product.cals != null && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.04)', padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}><Flame size={14} color="#EF4444" /> {product.cals} cals</span>}
              {product.protein != null && <span style={{ background: 'rgba(255,145,77,0.12)', padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, color: '#D97706' }}>{product.protein}g proteína</span>}
            </div>
          )}

          {/* Grupos de personalización */}
          {applicable.map(g => (
            <div key={g.id} style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1A1C1E' }}>{g.name}</h3>
                {g.required && <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)' }}>Requerido</span>}
                <span style={{ fontSize: '0.72rem', color: '#9CA3AF', marginLeft: 'auto' }}>{g.selection_type === 'multi' ? 'Elige las que quieras' : 'Elige 1'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {g.options.map(o => {
                  const selected = g.selection_type === 'multi' ? (sel[g.id] || []).includes(o.id) : sel[g.id] === o.id;
                  return (
                    <button key={o.id} onClick={() => g.selection_type === 'multi' ? toggleMulti(g.id, o.id) : pickSingle(g.id, o.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '14px', cursor: 'pointer', textAlign: 'left',
                        background: selected ? 'rgba(255,145,77,0.1)' : '#fff', border: `1.5px solid ${selected ? 'var(--primary)' : 'rgba(0,0,0,0.08)'}` }}>
                      <span style={{ width: '20px', height: '20px', borderRadius: g.selection_type === 'multi' ? '6px' : '50%', border: `2px solid ${selected ? 'var(--primary)' : '#CBD5E1'}`, background: selected ? 'var(--primary)' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selected && <span style={{ color: '#fff', fontSize: '0.7rem', fontWeight: 900 }}>✓</span>}
                      </span>
                      <span style={{ flex: 1, fontWeight: 600, fontSize: '0.92rem', color: '#1A1C1E' }}>{o.name}</span>
                      {o.price_delta > 0 && <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#6B7280' }}>+${o.price_delta}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Notas */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '1rem', fontWeight: 800, color: '#1A1C1E' }}>Notas (opcional)</h3>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} maxLength={200} rows={2} placeholder="Ej. sin crema, extra caliente…"
              style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid rgba(0,0,0,0.1)', background: '#fff', fontSize: '0.92rem', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>
        </div>

        {/* Footer: cantidad + agregar */}
        <div style={{ padding: '14px 22px', paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 16px)', borderTop: '1px solid rgba(0,0,0,0.06)', background: '#FDFBF7', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#fff', borderRadius: '16px', padding: '8px 12px', border: '1.5px solid rgba(0,0,0,0.08)' }}>
            <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex' }}><Minus size={18} color="var(--primary)" /></button>
            <span style={{ fontWeight: 800, minWidth: '18px', textAlign: 'center' }}>{qty}</span>
            <button onClick={() => setQty(q => q + 1)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex' }}><Plus size={18} color="var(--primary)" /></button>
          </div>
          <button onClick={add} style={{ flex: 1, padding: '15px', borderRadius: '16px', border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 10px 24px rgba(255,145,77,0.35)' }}>
            <ShoppingCart size={18} /> Agregar · ${lineTotal}
          </button>
        </div>
      </motion.div>
    </>
  );
}
