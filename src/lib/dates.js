// Fecha LOCAL en formato 'YYYY-MM-DD'.
//
// Por qué existe: `new Date().toISOString().split('T')[0]` devuelve la fecha en
// UTC. En zonas con offset negativo (México = UTC-6), de tarde/noche el UTC ya
// es el día siguiente → el calendario marcaba "mañana" como hoy (p. ej. viernes
// por la noche se veía como sábado). Esto siempre usa la fecha del dispositivo.
export function toLocalDateStr(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const todayLocalStr = () => toLocalDateStr(new Date());
