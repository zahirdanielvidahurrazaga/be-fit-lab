import React from 'react';
import { Download, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

function Nutricion() {
  return (
    <div style={{ backgroundColor: 'var(--surface)', minHeight: '100vh', padding: '3rem 5% 4rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* Botón Volver Súper Elegante */}
        <Link to="/" className="back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--on-surface-variant)', textDecoration: 'none', fontWeight: 500, marginBottom: '2.5rem', fontSize: '0.95rem' }}>
          <ArrowLeft size={18} /> Volver al inicio
        </Link>

        {/* Header Section */}
        <div style={{ marginBottom: '3rem' }}>
          <div className="badge-peach">Plan Personalizado</div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 2.8rem)', marginBottom: '1rem', color: 'var(--black)', fontFamily: 'var(--font-display)' }}>Tu Nutrición <span style={{color:'var(--primary)', fontStyle: 'italic'}}>Balanceada</span></h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '1.05rem', maxWidth: '600px', lineHeight: 1.6 }}>
            Alimentación diseñada para la asimilación post-entrenamiento muscular. Enfocado en recomposición corporal sin restricción extrema.
          </p>
        </div>

        {/* Resumen Macros */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '4rem'
        }}>
          {['1,850 Kcal Diarias', '130g Proteínas', '180g Carbohidratos', '65g Grasas'].map((macro, i) => (
            <div key={i} style={{
              background: 'var(--surface-lowest)', padding: '1.5rem', borderRadius: 'var(--shape-lg)',
              border: '1px solid rgba(89,88,86,0.05)', textAlign: 'center', fontWeight: '500', 
              color: i === 0 ? 'var(--primary)' : 'var(--on-surface)', fontSize: '0.95rem'
            }}>
              {macro}
            </div>
          ))}
        </div>

        {/* Plan del Día */}
        <h2 style={{ fontSize: '1.8rem', marginBottom: '2rem', fontFamily: 'var(--font-display)' }}>Recetas Sugeridas del Día</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <MealCard 
            type="Desayuno (Por asimilación lenta)" 
            title="Tostada Francesa Proteica con Frutos Rojos"
            cal="350 kcal"
            ingredients={['2 Rebanadas pan Ezequiel', '1/2 scoop de proteína Vainilla', '1 Huevo entero', 'Frutos rojos al gusto']}
          />
          <MealCard 
            type="Almuerzo Post-Entrenamiento" 
            title="Bowl Mediterráneo de Pechuga y Quinoa"
            cal="550 kcal"
            ingredients={['150g Pechuga de pollo', '1/2 taza de Quinoa', 'Hummus orgánico', 'Mix de lechugas frescas', 'Olivas y tomate cherry']}
          />
          <MealCard 
            type="Cena Ligera (Restauración Muscular)" 
            title="Salmón al horno con Espárragos"
            cal="420 kcal"
            ingredients={['120g Salmón fresco noruego', 'Espárragos salteados en ghee', '1/4 Aguacate Hass']}
          />

        </div>

      </div>
    </div>
  );
}

function MealCard({ type, title, cal, ingredients }) {
  return (
    <div className="meal-card">
      <div>
        <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)', fontWeight: 600, marginBottom: '0.5rem' }}>{type}</div>
        <h3 style={{ fontSize: '1.4rem', marginBottom: '1.2rem', fontFamily: 'var(--font-display)', color: 'var(--on-surface)' }}>{title}</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {ingredients.map((ing, i) => (
            <li key={i} style={{ color: 'var(--on-surface-variant)', fontSize: '0.95rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={16} color="var(--primary)" /> {ing}
            </li>
          ))}
        </ul>
      </div>
      <div className="meal-card-action">
        <div style={{ fontSize: '1.8rem', fontWeight: 600, color: 'var(--on-surface)', fontFamily: 'var(--font-display)' }}>{cal}</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>Calorías Estimadas</div>
        <button style={{
          marginTop: '1.5rem', background: 'var(--surface-low)', border: 'none', padding: '0.6rem 1.2rem',
          borderRadius: 'var(--shape-xl)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px',
          fontWeight: 600, color: 'var(--on-surface)', fontSize: '0.85rem', transition: 'background 0.2s'
        }}>
          <Download size={16} /> Ver Receta
        </button>
      </div>
    </div>
  );
}

export default Nutricion;
