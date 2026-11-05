import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Check, Coffee, Sliders, ImagePlus, Loader2, ChevronDown, Camera } from 'lucide-react';
import MenuAcciones from './MenuAcciones';
import { useAuth } from '../context/AuthContext';
import AdminCafeOptions from './AdminCafeOptions';
import AdminCafeCovers from './AdminCafeCovers';
import { uploadCafeImage, resolveCafeImage } from '../lib/cafeImage';
import { ESTUDIO } from '../config/estudio';

const CATEGORIES = [
  { value: 'coffee', label: 'Ice Coffee' },
  { value: 'smoothie', label: `${ESTUDIO.nombreCafeteria} & Smoothies` },
  { value: 'temporada', label: 'Bebidas de Temporada' },
];

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: '10px',
  border: '1px solid rgba(0,0,0,0.1)', background: 'white',
  fontSize: '0.9rem', boxSizing: 'border-box',
};

// Botón para subir/cambiar la foto de un producto a Supabase Storage.
function PhotoButton({ imageUrl, onUploaded, size = 64, round = '14px' }) {
  const [busy, setBusy] = useState(false);
  const onPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    const { url, error } = await uploadCafeImage(file);
    setBusy(false);
    if (error) {
      console.error('[cafe] upload error:', error);
      const msg = error?.message || error?.error || (typeof error === 'string' ? error : 'Error desconocido');
      alert('No se pudo subir la imagen.\n\nMotivo: ' + msg);
      return;
    }
    onUploaded(url);
  };
  return (
    <label style={{ position: 'relative', width: size, height: size, borderRadius: round, flexShrink: 0, cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: imageUrl ? '#F0E6DC' : 'rgba(255,145,77,0.1)', border: imageUrl ? '1px solid rgba(0,0,0,0.08)' : '1.5px dashed rgba(255,145,77,0.5)' }}>
      {imageUrl
        ? <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <ImagePlus size={22} color="var(--primary)" />}
      <input type="file" accept="image/*" onChange={onPick} style={{ display: 'none' }} />
      {/* overlay cámara para indicar que es editable */}
      {imageUrl && !busy && (
        <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', justifyContent: 'center', padding: '2px 0' }}><Camera size={13} color="#fff" /></span>
      )}
      {busy && (
        <span style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} style={{ display: 'flex' }}><Loader2 size={20} color="var(--primary)" /></motion.span>
        </span>
      )}
    </label>
  );
}

// Tarjeta de producto: nombre/precio inline + foto + expander con el resto de campos.
function ProductCard({ p, onSave, onPatch, onToggle, onDelete }) {
  const [draft, setDraft] = useState({ name: p.name, price: String(p.price) });
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setDraft({ name: p.name, price: String(p.price) }); }, [p.name, p.price]);

  const dirty = draft.name !== p.name || String(draft.price) !== String(p.price);
  const save = async () => {
    const price = parseInt(draft.price, 10);
    if (!draft.name.trim() || !Number.isFinite(price) || price < 0) { alert('Nombre y precio válidos.'); return; }
    setSaving(true); await onSave(p.id, { name: draft.name.trim(), price }); setSaving(false);
  };

  return (
    <div className="ios-glass-card" style={{ padding: '12px', background: 'white', opacity: p.available ? 1 : 0.6 }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <PhotoButton imageUrl={resolveCafeImage(p)} onUploaded={(url) => onPatch(p.id, { image_url: url })} />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} style={{ ...inputStyle, fontWeight: 700 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
              <span style={{ fontWeight: 800, color: 'var(--on-surface-variant)' }}>$</span>
              <input type="number" inputMode="numeric" value={draft.price} onChange={e => setDraft({ ...draft, price: e.target.value })}
                onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setDraft({ name: p.name, price: String(p.price) }); }}
                // La ruedita del mouse cambiaba el precio sin querer al pasar por encima.
                onWheel={e => e.currentTarget.blur()}
                style={{ ...inputStyle, width: '90px', flex: 'none' }} />
            </div>
            <AnimatePresence>
              {dirty && (
                <motion.button key="guardar" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} onClick={save} disabled={saving}
                  style={{ background: '#22C55E', color: 'white', border: 'none', padding: '9px 12px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Check size={15} /> {saving ? '...' : 'Guardar'}
                </motion.button>
              )}
              {dirty && !saving && (
                <motion.button key="deshacer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => setDraft({ name: p.name, price: String(p.price) })}
                  style={{ background: 'transparent', color: 'var(--on-surface-variant)', border: 'none', padding: '9px 6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}>
                  Deshacer
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
        <button onClick={() => onToggle(p)} style={{ background: p.available ? 'rgba(34,197,94,0.12)' : 'rgba(0,0,0,0.06)', color: p.available ? '#16A34A' : 'var(--on-surface-variant)', border: 'none', padding: '8px 12px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>
          {p.available ? 'Disponible' : 'Oculto'}
        </button>
        <button onClick={() => setOpen(o => !o)} style={{ background: 'rgba(0,0,0,0.04)', color: 'var(--on-surface-variant)', border: 'none', padding: '8px 12px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
          Detalles <motion.span animate={{ rotate: open ? 180 : 0 }} style={{ display: 'flex' }}><ChevronDown size={15} /></motion.span>
        </button>
        <div style={{ marginLeft: 'auto' }}>
          <MenuAcciones acciones={[{ label: 'Eliminar del menú', icon: <Trash2 size={15} />, peligro: true, onClick: () => onDelete(p) }]} />
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '12px', marginTop: '10px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              <textarea defaultValue={p.description || ''} placeholder="Descripción" rows={2} onBlur={e => { const v = e.target.value.trim() || null; if (v !== (p.description || null)) onPatch(p.id, { description: v }); }} style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit' }} />
              <select defaultValue={p.category} onChange={e => onPatch(p.id, { category: e.target.value })} style={{ ...inputStyle, WebkitAppearance: 'none' }}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="number" defaultValue={p.cals ?? ''} placeholder="Calorías" onBlur={e => { const v = e.target.value ? parseInt(e.target.value, 10) : null; if (v !== (p.cals ?? null)) onPatch(p.id, { cals: v }); }} style={inputStyle} />
                <input type="number" defaultValue={p.protein ?? ''} placeholder="Proteína g" onBlur={e => { const v = e.target.value ? parseInt(e.target.value, 10) : null; if (v !== (p.protein ?? null)) onPatch(p.id, { protein: v }); }} style={inputStyle} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AdminCafeteria() {
  const { cafeProducts, addCafeProduct, updateCafeProduct, deleteCafeProduct } = useAuth();
  const [subtab, setSubtab] = useState('products');
  const [showAdd, setShowAdd] = useState(false);
  const [np, setNp] = useState({ name: '', price: '', category: 'coffee', description: '', cals: '', protein: '', image_url: '' });

  const saveRow = (id, patch) => updateCafeProduct(id, patch);
  const patchRow = (id, patch) => updateCafeProduct(id, patch);
  const toggleAvailable = (p) => updateCafeProduct(p.id, { available: !p.available });
  const removeProduct = (p) => { if (confirm(`¿Eliminar "${p.name}" del menú?`)) deleteCafeProduct(p.id); };

  const handleAdd = async () => {
    const price = parseInt(np.price, 10);
    if (!np.name.trim() || !Number.isFinite(price) || price < 0) { alert('Llena nombre y precio.'); return; }
    const payload = {
      name: np.name.trim(), price, category: np.category,
      description: np.description.trim() || null,
      cals: np.cals ? parseInt(np.cals, 10) : null,
      protein: np.protein ? parseInt(np.protein, 10) : null,
      image_url: np.image_url || null,
      sort_order: (cafeProducts || []).filter(p => p.category === np.category).length + 1,
    };
    const { success } = await addCafeProduct(payload);
    if (success) { setNp({ name: '', price: '', category: 'coffee', description: '', cals: '', protein: '', image_url: '' }); setShowAdd(false); }
  };

  // Pestañas como selector segmentado de ancho completo: antes eran 3 botones
  // sueltos junto al título y en celular se partían en dos renglones.
  const Tab = ({ id, label, Icon }) => (
    <button onClick={() => setSubtab(id)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 6px', borderRadius: '11px', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.84rem', fontFamily: 'inherit', minWidth: 0,
      background: subtab === id ? '#fff' : 'transparent', color: subtab === id ? 'var(--black)' : 'var(--on-surface-variant)',
      boxShadow: subtab === id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none' }}>
      <Icon size={15} style={{ flexShrink: 0 }} /> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
    </button>
  );
  const [catActiva, setCatActiva] = useState('all');

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', margin: 0, flex: 1 }}>Cafetería</h2>
        {subtab === 'products' && (
          <button onClick={() => setShowAdd(s => !s)} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '9px 14px', borderRadius: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontFamily: 'inherit' }}>
            <Plus size={16} /> {showAdd ? 'Cerrar' : 'Nuevo'}
          </button>
        )}
      </div>
      <div style={{ display: 'flex', gap: '4px', padding: '4px', borderRadius: '14px', background: 'rgba(0,0,0,0.05)', marginBottom: '18px' }}>
        <Tab id="products" label="Productos" Icon={Coffee} />
        <Tab id="options" label="Opciones" Icon={Sliders} />
        <Tab id="covers" label="Portada" Icon={ImagePlus} />
      </div>

      {subtab === 'covers' ? (
        <AdminCafeCovers />
      ) : subtab === 'products' ? (
        <>
          {/* Saltar de categoría sin recorrer todo el menú */}
          {(() => {
            const conProductos = CATEGORIES.filter(c => (cafeProducts || []).some(p => p.category === c.value));
            if (conProductos.length < 2) return null;
            const chip = (id, texto, n) => (
              <button key={id} onClick={() => setCatActiva(id)}
                style={{ flexShrink: 0, padding: '8px 13px', borderRadius: '999px', border: catActiva === id ? '1px solid var(--primary)' : '1px solid rgba(0,0,0,0.08)',
                         background: catActiva === id ? 'rgba(255,145,77,0.12)' : '#fff', color: catActiva === id ? 'var(--primary)' : 'var(--on-surface-variant)',
                         fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                {texto} <span style={{ opacity: 0.6 }}>{n}</span>
              </button>
            );
            return (
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '14px', WebkitOverflowScrolling: 'touch' }}>
                {chip('all', 'Todo', (cafeProducts || []).length)}
                {conProductos.map(c => chip(c.value, c.label, (cafeProducts || []).filter(p => p.category === c.value).length))}
              </div>
            );
          })()}

          <AnimatePresence>
            {showAdd && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginBottom: '20px' }}>
                <div className="ios-glass-card" style={{ padding: '16px', background: 'white' }}>
                  <div style={{ display: 'flex', gap: '14px', marginBottom: '12px' }}>
                    <PhotoButton imageUrl={np.image_url} onUploaded={(url) => setNp({ ...np, image_url: url })} size={72} round="16px" />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <input placeholder="Nombre (ej. Iced Latte)" value={np.name} onChange={e => setNp({ ...np, name: e.target.value })} style={inputStyle} />
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <input type="number" placeholder="Precio $" value={np.price} onChange={e => setNp({ ...np, price: e.target.value })} style={inputStyle} />
                        <select value={np.category} onChange={e => setNp({ ...np, category: e.target.value })} style={{ ...inputStyle, WebkitAppearance: 'none' }}>
                          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                  <input placeholder="Descripción (opcional)" value={np.description} onChange={e => setNp({ ...np, description: e.target.value })} style={{ ...inputStyle, marginBottom: '10px' }} />
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                    <input type="number" placeholder="Calorías (opcional)" value={np.cals} onChange={e => setNp({ ...np, cals: e.target.value })} style={inputStyle} />
                    <input type="number" placeholder="Proteína g (opcional)" value={np.protein} onChange={e => setNp({ ...np, protein: e.target.value })} style={inputStyle} />
                  </div>
                  <button onClick={handleAdd} style={{ width: '100%', padding: '11px', borderRadius: '10px', background: 'var(--primary)', color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer' }}>Agregar producto</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {CATEGORIES.filter(cat => catActiva === 'all' || cat.value === catActiva).map(cat => {
            const items = (cafeProducts || []).filter(p => p.category === cat.value);
            if (items.length === 0) return null;
            return (
              <div key={cat.value} style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--on-surface-variant)', marginBottom: '10px' }}>{cat.label}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {items.map(p => (
                    <ProductCard key={p.id} p={p} onSave={saveRow} onPatch={patchRow} onToggle={toggleAvailable} onDelete={removeProduct} />
                  ))}
                </div>
              </div>
            );
          })}
        </>
      ) : (
        <AdminCafeOptions />
      )}
    </section>
  );
}

export default AdminCafeteria;
