import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Check, Coffee } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  { value: 'coffee', label: 'Ice Coffee' },
  { value: 'smoothie', label: 'Coffee Lab & Smoothies' },
  { value: 'temporada', label: 'Bebidas de Temporada' },
];

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: '10px',
  border: '1px solid rgba(0,0,0,0.1)', background: 'white',
  fontSize: '0.9rem', boxSizing: 'border-box',
};

// Gestión del menú de cafetería para el admin: editar precio/nombre/disponibilidad,
// agregar y eliminar productos. El precio vive en la BD (public.cafe_products) y es
// el que usa el checkout — el cliente nunca lo define.
function AdminCafeteria() {
  const { cafeProducts, addCafeProduct, updateCafeProduct, deleteCafeProduct } = useAuth();

  const [drafts, setDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: 'coffee', description: '', cals: '', protein: '', image_url: '' });

  // Sincronizar borradores cuando cambian los productos (carga / realtime)
  useEffect(() => {
    const next = {};
    (cafeProducts || []).forEach(p => { next[p.id] = { name: p.name, price: String(p.price) }; });
    setDrafts(next);
  }, [cafeProducts]);

  const isDirty = (p) => {
    const d = drafts[p.id];
    return d && (d.name !== p.name || String(d.price) !== String(p.price));
  };

  const saveRow = async (p) => {
    const d = drafts[p.id];
    const price = parseInt(d.price, 10);
    if (!d.name.trim() || !Number.isFinite(price) || price < 0) {
      alert('Nombre y precio válidos requeridos.');
      return;
    }
    setSavingId(p.id);
    await updateCafeProduct(p.id, { name: d.name.trim(), price });
    setSavingId(null);
  };

  const toggleAvailable = (p) => updateCafeProduct(p.id, { available: !p.available });

  const removeProduct = (p) => {
    if (confirm(`¿Eliminar "${p.name}" del menú?`)) deleteCafeProduct(p.id);
  };

  const handleAdd = async () => {
    const price = parseInt(newProduct.price, 10);
    if (!newProduct.name.trim() || !Number.isFinite(price) || price < 0) {
      alert('Llena nombre y precio.');
      return;
    }
    const payload = {
      name: newProduct.name.trim(),
      price,
      category: newProduct.category,
      description: newProduct.description.trim() || null,
      cals: newProduct.cals ? parseInt(newProduct.cals, 10) : null,
      protein: newProduct.protein ? parseInt(newProduct.protein, 10) : null,
      image_url: newProduct.image_url.trim() || null,
      sort_order: (cafeProducts || []).filter(p => p.category === newProduct.category).length + 1,
    };
    const { success } = await addCafeProduct(payload);
    if (success) {
      setNewProduct({ name: '', price: '', category: 'coffee', description: '', cals: '', protein: '', image_url: '' });
      setShowAdd(false);
    }
  };

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-display)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Coffee size={20} color="var(--primary)" /> Cafetería
        </h2>
        <button onClick={() => setShowAdd(!showAdd)} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
          <Plus size={16} /> Nuevo
        </button>
      </div>

      {showAdd && (
        <div className="ios-glass-card" style={{ padding: '15px', marginBottom: '20px', background: 'white' }}>
          <input placeholder="Nombre (ej. Iced Latte)" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} style={{ ...inputStyle, marginBottom: '10px' }} />
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <input type="number" placeholder="Precio $" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} style={inputStyle} />
            <select value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} style={{ ...inputStyle, WebkitAppearance: 'none' }}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <input placeholder="Descripción" value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} style={{ ...inputStyle, marginBottom: '10px' }} />
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <input type="number" placeholder="Calorías (opcional)" value={newProduct.cals} onChange={e => setNewProduct({ ...newProduct, cals: e.target.value })} style={inputStyle} />
            <input type="number" placeholder="Proteína g (opcional)" value={newProduct.protein} onChange={e => setNewProduct({ ...newProduct, protein: e.target.value })} style={inputStyle} />
          </div>
          <input placeholder="URL de imagen (opcional, para cafés)" value={newProduct.image_url} onChange={e => setNewProduct({ ...newProduct, image_url: e.target.value })} style={{ ...inputStyle, marginBottom: '15px' }} />
          <button onClick={handleAdd} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--primary)', color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer' }}>Agregar producto</button>
        </div>
      )}

      {CATEGORIES.map(cat => {
        const items = (cafeProducts || []).filter(p => p.category === cat.value);
        if (items.length === 0) return null;
        return (
          <div key={cat.value} style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--on-surface-variant)', marginBottom: '10px' }}>{cat.label}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {items.map(p => {
                const d = drafts[p.id] || { name: p.name, price: String(p.price) };
                return (
                  <div key={p.id} className="ios-glass-card" style={{ padding: '12px', background: 'white', opacity: p.available ? 1 : 0.55 }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        value={d.name}
                        onChange={e => setDrafts({ ...drafts, [p.id]: { ...d, name: e.target.value } })}
                        style={{ ...inputStyle, flex: '1 1 140px', width: 'auto' }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontWeight: 800, color: 'var(--on-surface-variant)' }}>$</span>
                        <input
                          type="number"
                          value={d.price}
                          onChange={e => setDrafts({ ...drafts, [p.id]: { ...d, price: e.target.value } })}
                          onKeyDown={e => { if (e.key === 'Enter') saveRow(p); }}
                          style={{ ...inputStyle, width: '90px' }}
                        />
                      </div>
                      {isDirty(p) && (
                        <button onClick={() => saveRow(p)} disabled={savingId === p.id} style={{ background: '#22C55E', color: 'white', border: 'none', padding: '9px 12px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Check size={15} /> {savingId === p.id ? '...' : 'Guardar'}
                        </button>
                      )}
                      <button onClick={() => toggleAvailable(p)} style={{ background: p.available ? 'rgba(34,197,94,0.12)' : 'rgba(0,0,0,0.06)', color: p.available ? '#16A34A' : 'var(--on-surface-variant)', border: 'none', padding: '9px 12px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>
                        {p.available ? 'Disponible' : 'Oculto'}
                      </button>
                      <button onClick={() => removeProduct(p)} aria-label="Eliminar" style={{ background: 'rgba(186,26,26,0.1)', color: '#ba1a1a', border: 'none', padding: '9px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}

export default AdminCafeteria;
