import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Flame, ShoppingCart, Check } from 'lucide-react';

// Los assets locales del catálogo (PNG/WebP con fondo blanco) usan multiply para
// fundir el fondo; las fotos subidas por Admin (JPEG) van normales con sombra.
const needsMultiply = (url) => /^\/cafeteria\//.test(url || '') || /\.png(\?|$)/i.test(url || '');

// Total tipo "ticker": el número se desliza/funde al cambiar (sensación premium).
function AnimatedTotal({ value, prefix = '$' }) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', minWidth: '1ch', justifyContent: 'center', overflow: 'hidden' }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={value}
          initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          style={{ display: 'inline-block' }}>
          {prefix}{value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

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
  const fotoReal = !!product.image_url && !needsMultiply(product.image_url);

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
        style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 4001, maxHeight: '90vh', background: 'var(--c-bg)', borderTopLeftRadius: '28px', borderTopRightRadius: '28px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 -10px 40px rgba(0,0,0,0.25)' }}>

          <button onClick={onClose} aria-label="Cerrar" style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 3, width: '36px', height: '36px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
            <X size={18} color="#1A1C1E" />
          </button>
        <div style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', flex: 1 }}>
        {/* Header con imagen: scrollea con el contenido (antes quedaba fijo y se comía ~40% de la pantalla) */}
          <div style={{ position: 'relative' }}>
            {fotoReal ? (
              // FOTO real: a sangre, de lado a lado (antes salía angosta en un recuadro).
              <div style={{ position: 'relative', height: 'min(420px, 56vh)', overflow: 'hidden', background: 'var(--c-soft)', borderRadius: '0 0 28px 28px' }}>
                <motion.img src={product.image_url} alt={product.name}
                  initial={{ scale: 1.08, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(20,14,10,0.82) 0%, rgba(20,14,10,0.35) 38%, transparent 62%)' }} />
                <div style={{ position: 'absolute', left: '22px', right: '22px', bottom: '20px', color: '#fff', textAlign: 'center' }}>
                  <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    style={{ fontFamily: 'var(--c-font)', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.02, margin: '0 0 8px', fontSize: '1.75rem' }}>{product.name}</motion.h2>
                  {product.description && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.9 }} transition={{ delay: 0.2 }} style={{ margin: '0 auto', maxWidth: '340px', fontSize: '0.9rem', lineHeight: 1.45 }}>{product.description}</motion.p>}
                  {(product.cals != null || product.protein != null) && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.28 }} style={{ display: 'flex', justifyContent: 'center', gap: '34px', marginTop: '14px' }}>
                      {product.cals != null && <div><div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{product.cals}</div><div style={{ fontSize: '0.72rem', opacity: 0.75 }}>kcal</div></div>}
                      {product.protein != null && <div><div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{product.protein} g</div><div style={{ fontSize: '0.72rem', opacity: 0.75 }}>proteína</div></div>}
                    </motion.div>
                  )}
                </div>
              </div>
            ) : product.image_url ? (
              <div style={{ height: '200px', background: 'radial-gradient(120% 90% at 50% 18%, var(--c-soft) 0%, var(--c-bg) 75%)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <motion.img src={product.image_url} alt={product.name}
                  initial={{ scale: 0.82, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: [0, -8, 0] }}
                  transition={{ scale: { type: 'spring', stiffness: 180, damping: 18 }, opacity: { duration: 0.4 }, y: { duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 } }}
                  style={{ maxHeight: '180px', maxWidth: '80%', objectFit: 'contain', mixBlendMode: needsMultiply(product.image_url) ? 'multiply' : 'normal', filter: needsMultiply(product.image_url) ? 'none' : 'drop-shadow(0 18px 24px rgba(80,50,30,0.22))' }} />
              </div>
            ) : <div style={{ height: '64px' }} />}
          </div>
          <div style={{ padding: '22px 22px 0' }}>
          {!fotoReal && <>
          <motion.h2 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            style={{ fontFamily: 'var(--c-font)', fontWeight: 800, letterSpacing: '-0.025em', margin: '0 0 6px', fontSize: '1.45rem', color: 'var(--c-ink)' }}>{product.name}</motion.h2>
          {product.description && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} style={{ margin: '0 0 12px', color: 'var(--c-muted)', fontSize: '0.92rem', lineHeight: 1.5 }}>{product.description}</motion.p>}
          {(product.cals || product.protein) && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
              {product.cals != null && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--c-soft)', color: 'var(--c-ink)', padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}><Flame size={14} color="#EF4444" /> {product.cals} cals</span>}
              {product.protein != null && <span style={{ background: 'rgba(255,145,77,0.12)', padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, color: '#D97706' }}>{product.protein}g proteína</span>}
            </div>
          )}
          </>}

          {/* Grupos de personalización (entrada escalonada) */}
          {applicable.map((g, gi) => (
            <motion.div key={g.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + gi * 0.07, type: 'spring', stiffness: 120, damping: 18 }} style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--c-ink)' }}>{g.name}</h3>
                {g.required && <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)' }}>Requerido</span>}
                <span style={{ fontSize: '0.72rem', color: 'var(--c-muted)', marginLeft: 'auto' }}>{g.selection_type === 'multi' ? 'Elige las que quieras' : 'Elige 1'}</span>
              </div>
              {/* Opciones como pastillas (como las referencias): oscura = elegida */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {g.options.map(o => {
                  const multi = g.selection_type === 'multi';
                  const selected = multi ? (sel[g.id] || []).includes(o.id) : sel[g.id] === o.id;
                  return (
                    <motion.button key={o.id} type="button" onClick={() => multi ? toggleMulti(g.id, o.id) : pickSingle(g.id, o.id)}
                      whileTap={{ scale: 0.94 }} aria-pressed={selected}
                      animate={{ backgroundColor: selected ? 'var(--c-ink)' : 'var(--c-card)', color: selected ? 'var(--c-bg)' : 'var(--c-ink)', borderColor: selected ? 'var(--c-ink)' : 'var(--c-line)' }}
                      transition={{ duration: 0.18 }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '999px', cursor: 'pointer', border: '1.5px solid var(--c-line)', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.9rem' }}>
                      {multi && (
                        <AnimatePresence mode="wait" initial={false}>
                          {selected
                            ? <motion.span key="s" initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} style={{ display: 'flex' }}><Check size={14} strokeWidth={3} /></motion.span>
                            : <motion.span key="n" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} style={{ display: 'flex', opacity: 0.6 }}><Plus size={14} strokeWidth={2.5} /></motion.span>}
                        </AnimatePresence>
                      )}
                      <span>{o.name}</span>
                      {o.price_delta > 0 && <span style={{ fontWeight: 800, opacity: selected ? 0.85 : 0.55, fontSize: '0.82rem' }}>+${o.price_delta}</span>}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          ))}

          {/* Notas */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '1rem', fontWeight: 800, color: 'var(--c-ink)' }}>Notas (opcional)</h3>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} maxLength={200} rows={2} placeholder="Ej. sin crema, extra caliente…"
              style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid var(--c-line)', background: 'var(--c-card)', color: 'var(--c-ink)', fontSize: '0.92rem', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>
          </div>
        </div>

        {/* Footer: cantidad + agregar */}
        <div style={{ padding: '14px 22px', paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 16px)', borderTop: '1px solid var(--c-line)', background: 'var(--c-bg)', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'var(--c-card)', borderRadius: '999px', padding: '12px 16px', border: '1.5px solid var(--c-line)' }}>
            <motion.button whileTap={{ scale: 0.85 }} onClick={() => setQty(q => Math.max(1, q - 1))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex' }}><Minus size={18} color="var(--c-ink)" /></motion.button>
            <span style={{ fontWeight: 800, minWidth: '18px', textAlign: 'center', color: 'var(--c-ink)' }}>
              <AnimatedTotal value={qty} prefix="" />
            </span>
            <motion.button whileTap={{ scale: 0.85 }} onClick={() => setQty(q => q + 1)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex' }}><Plus size={18} color="var(--c-ink)" /></motion.button>
          </div>
          <motion.button onClick={add} whileTap={{ scale: 0.97 }}
            style={{ flex: 1, padding: '16px', borderRadius: '999px', border: 'none', background: 'var(--c-ink)', color: 'var(--c-bg)', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 12px 28px rgba(20,14,10,0.28)', fontFamily: 'inherit' }}>
            <ShoppingCart size={18} /> Agregar · <AnimatedTotal value={lineTotal} />
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}
