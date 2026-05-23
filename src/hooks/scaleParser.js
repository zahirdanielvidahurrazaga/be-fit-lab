// ─────────────────────────────────────────────────────────────────
// SCALE PARSER — PLACEHOLDER
//
// Este archivo se reemplaza mañana con el parser específico
// del modelo de báscula confirmado.
//
// Cada marca define sus propios UUIDs de servicio/característica
// y su propio formato de bytes en los paquetes BLE.
//
// Una vez confirmado el modelo, este archivo tendrá:
//   1. SCALE_SERVICE_UUID  — UUID del servicio GATT de la báscula
//   2. SCALE_CHAR_UUID     — UUID de la característica de datos
//   3. parseScaleData(dataView) — convierte bytes crudos al objeto estándar
//
// Objeto que debe devolver parseScaleData:
// {
//   weight_kg:      number,
//   bmi:            number | null,
//   body_fat_pct:   number | null,
//   muscle_mass_kg: number | null,
//   muscle_pct:     number | null,
//   water_pct:      number | null,
//   bone_mass_kg:   number | null,
//   visceral_fat:   number | null,
//   metabolic_age:  number | null,
//   bmr:            number | null,
//   isStable:       boolean,  // true = el usuario ya está quieto sobre la báscula
// }
// ─────────────────────────────────────────────────────────────────

export const SCALE_SERVICE_UUID = '0000181b-0000-1000-8000-00805f9b34fb'; // placeholder
export const SCALE_CHAR_UUID    = '00002a9c-0000-1000-8000-00805f9b34fb'; // placeholder

export function parseScaleData(dataView) {
  // TODO: reemplazar con el parser real según el modelo de báscula
  console.warn('scaleParser: parser no configurado aún.');
  return null;
}
