// ── FUENTE ÚNICA DE VERDAD de las membresías (lo que muestra el sitio web) ──
// Usado por: PricingCarousel (landing/planes), Planes.jsx, Evolucion (tope de
// meta), Admin (activación manual). `name` = nombre canónico = users.membership_plan.
//
// ⚠️ Las Edge Functions (Deno) tienen su PROPIA copia de estos valores en
// supabase/functions/stripe-checkout y stripe-membership-intent (no pueden
// importar de src/). Si cambias precios/clases aquí, actualízalas también.

export const PLANS = [
  {
    name: 'Plan Inicial', title: 'Inicial', price: '$850', classes: 12, unlimited: false,
    lookupKey: 'befit_plan_inicial_monthly', subtitle: 'Perfecto para probar',
    features: ['Acceso a 12 clases', '+100 ideas de recetas', 'Registro de métricas', 'Acceso a la app'],
    paymentUrl: '#',
  },
  {
    name: 'Plan Básico', title: 'Básico', price: '$1,050', classes: 15, unlimited: false,
    lookupKey: 'befit_plan_basico_monthly', subtitle: 'Para las que van en serio',
    features: ['Acceso a 15 clases', '+100 ideas de recetas', 'Registro de métricas', 'Acceso a la app'],
    paymentUrl: '#',
  },
  {
    name: 'Plan Fit', title: 'Fit', price: '$1,300', classes: 20, unlimited: false,
    lookupKey: 'befit_plan_fit_monthly', subtitle: 'Constancia que transforma',
    features: ['Acceso a 20 clases', '+100 ideas de recetas', 'Registro de métricas', 'Acceso a la app'],
    paymentUrl: '#',
  },
  {
    name: 'Plan Premium', title: 'Premium', price: '$1,850', classes: 9999, unlimited: true,
    lookupKey: 'befit_plan_premium_monthly', subtitle: 'El más completo',
    features: ['Acceso clases ILIMITADAS', '3 invitadas al mes sin costo', 'Plan alimenticio personalizado', '+100 ideas de recetas', 'Registro de métricas', 'Acceso a la app', '10% desc. en cafetería'],
    paymentUrl: '#',
  },
];

// Lookup por nombre canónico ('Plan Fit', etc.)
export const PLAN_BY_NAME = Object.fromEntries(PLANS.map(p => [p.name, p]));

// Tope de meta mensual: las clases que da el plan; ilimitado o desconocido → 31 (≈ 1/día)
export function monthlyGoalCap(planName) {
  const p = PLAN_BY_NAME[planName];
  if (!p) return 31;
  return p.unlimited ? 31 : p.classes;
}
