// Helpers de vigencia de membresía (fecha de pago / vencimiento).
// Regla del negocio: todos los planes vencen 1 mes después del pago.
// El sellado de fechas es automático (al activar/renovar); estos helpers solo
// formatean y comparan para mostrar/bloquear en la UI. El bloqueo REAL al
// reservar vive en el RPC `book_class_secure` (server-side).

// ¿La membresía está vencida? NULL = sin fecha sellada → NO se considera
// vencida (por seguridad: nadie sin fecha queda bloqueado de golpe).
export function isPlanExpired(expiresAt) {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now();
}

// Días que faltan para vencer (negativo si ya venció, null si no hay fecha).
export function daysUntilExpiry(expiresAt) {
  if (!expiresAt) return null;
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000);
}

// "24 de junio de 2026" (formato corto opcional → "24 jun 2026").
export function formatPlanDate(d, short = false) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: short ? 'short' : 'long',
    year: 'numeric',
  });
}

/**
 * ¿Puede reservar hoy, o qué le falta? Una sola regla para Inicio y Clases:
 * antes invitaban a "Agendar ahora" a una clienta vencida o sin clases, y al
 * intentarlo rebotaba.
 * @returns {null | { tipo: 'vencido'|'sin_clases', titulo: string, texto: string, cta: string }}
 */
export function bloqueoParaReservar({ membershipStatus, planExpiresAt, classesRemaining }) {
  if (membershipStatus !== 'ACTIVE' || isPlanExpired(planExpiresAt)) {
    return {
      tipo: 'vencido',
      titulo: 'Tu plan ya venció',
      texto: planExpiresAt ? `Venció el ${formatPlanDate(planExpiresAt)}. Renuévalo para volver a reservar.` : 'Elige un plan para empezar a reservar.',
      cta: 'Renovar mi plan',
    };
  }
  if ((classesRemaining ?? 0) <= 0) {
    return {
      tipo: 'sin_clases',
      titulo: 'Ya usaste todas tus clases',
      texto: 'Compra un paquete o una clase suelta para seguir reservando.',
      cta: 'Comprar clases',
    };
  }
  return null;
}
