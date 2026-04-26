import React from 'react';
import { Check, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function Planes() {
  const navigate = useNavigate();

  const handleStripeCheckout = () => {
    alert("Redirigiendo a la pasarela segura de Stripe...");
    // Aquí en el futuro irá window.location.href = 'https://buy.stripe.com/...'
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F4F7F6', padding: '4rem 2rem', fontFamily: 'var(--font-body)' }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: '#1A1C1E' }}>Elige tu Plan BEFIT</h1>
        <p style={{ color: '#6B7280', fontSize: '1.1rem' }}>Membresías diseñadas para transformar tu estilo de vida.</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Plan FIT */}
        <PlanCard 
          title="Plan FIT Presencial" 
          price="1,200" 
          features={["Acceso a 20 clases", "Recetario (+100 recetas)", "Registro de métricas"]}
          onCheckout={handleStripeCheckout}
        />

        {/* Plan Premium (Recomendado) */}
        <PlanCard 
          title="Plan Premium Presencial" 
          price="1,800" 
          recommended={true}
          features={["Acceso a 30 clases", "Recetario (+100 recetas)", "Registro de métricas", "3 invitadas al mes sin costo", "Contacto constante"]}
          onCheckout={handleStripeCheckout}
        />

        {/* Plan Basico */}
        <PlanCard 
          title="Plan Básico Presencial" 
          price="950" 
          features={["Acceso a 15 clases", "Recetario (+100 recetas)", "Registro de métricas"]}
          onCheckout={handleStripeCheckout}
        />

      </div>
      
      <div style={{ textAlign: 'center', marginTop: '4rem' }}>
        <button onClick={() => navigate(-1)} style={{ padding: '0.8rem 2rem', border: '1px solid #1A1C1E', background: 'transparent', borderRadius: '30px', cursor: 'pointer', fontWeight: 600 }}>Volver</button>
      </div>
    </div>
  );
}

function PlanCard({ title, price, features, recommended, onCheckout }) {
  return (
    <div style={{ 
      background: 'white', 
      borderRadius: '20px', 
      width: '320px', 
      overflow: 'hidden',
      boxShadow: recommended ? '0 20px 40px rgba(201, 114, 93, 0.15)' : '0 10px 30px rgba(0,0,0,0.05)',
      transform: recommended ? 'scale(1.05)' : 'scale(1)',
      border: recommended ? '2px solid var(--primary)' : '1px solid rgba(0,0,0,0.05)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {recommended && (
        <div style={{ background: 'var(--primary)', color: 'white', textAlign: 'center', padding: '0.5rem', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '1px' }}>
          MÁS POPULAR
        </div>
      )}
      <div style={{ padding: '2rem', textAlign: 'center', borderBottom: '1px solid #F3F4F6' }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#1A1C1E', fontSize: '1.2rem' }}>{title}</h3>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '4px' }}>
          <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1A1C1E' }}>${price}</span>
          <span style={{ color: '#6B7280', fontWeight: 500 }}>MXN /mes</span>
        </div>
      </div>
      <div style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
          {features.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <Check size={18} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ color: '#4B5563', fontSize: '0.9rem', lineHeight: 1.4 }}>{f}</span>
            </div>
          ))}
        </div>
        <button onClick={onCheckout} style={{ 
          marginTop: '2rem', width: '100%', padding: '1rem', borderRadius: '30px', 
          background: recommended ? 'var(--primary)' : '#1A1C1E', color: 'white', 
          border: 'none', fontWeight: 600, cursor: 'pointer',
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
        }}>
          Pagar con Stripe <CreditCard size={18} />
        </button>
      </div>
    </div>
  )
}

export default Planes;
