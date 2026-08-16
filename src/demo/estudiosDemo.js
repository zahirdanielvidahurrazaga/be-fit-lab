// ─────────────────────────────────────────────────────────────────────────────
// ESTUDIOS DE DEMOSTRACIÓN
//
// Cada entrada es una maqueta de venta: se abre en /demo/<clave> y la app se
// pinta entera con esa marca, sin tocar Supabase ni pedir cuenta.
//
// Para armar la demo de un prospecto: copia un bloque, cambia nombre, colores y
// horario (el horario real sale de su Instagram — es lo que hace que la demo
// convenza), y mándale el link.
//
// ⚠️ Las demos con el nombre y logo de un estudio REAL son maquetas de venta,
// no su producto. Van siempre con `esReal: true` para que la pantalla muestre
// el sello de "maqueta preparada por…" y la página se marque como noindex.
// ─────────────────────────────────────────────────────────────────────────────

import { logoDeTexto } from '../config/estudio';

// Degradado como SVG en línea, para no depender de archivos de imagen.
const fondoDemo = (a, b) => 'data:image/svg+xml;utf8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="500">`
  + `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">`
  + `<stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/>`
  + `</linearGradient></defs><rect width="420" height="500" fill="url(#g)"/></svg>`);

export const ESTUDIOS_DEMO = {

  // La demo permanente y sin riesgo: estudio inventado. Es la que se puede
  // poner en el portafolio y mandar sin pensarlo dos veces.
  vera: {
    esReal: false,
    nombre: 'Estudio Vera',
    nombreMayusculas: 'ESTUDIO VERA',
    nombrePanel: 'Panel Vera',
    giro: 'Pilates Reformer',
    nombreCafeteria: 'Café Vera',
    nombreNutricion: 'Vera Nutrición',
    ciudad: 'Puebla',
    // ⚠️ La paleta de una maqueta tiene que respetar la LUMINOSIDAD de la de
    // fábrica, no solo el tono: el CSS asume texto oscuro sobre --primary
    // (en Be Fit Lab es un naranja claro). Un verde oscuro deja los textos de
    // las tarjetas de clase ilegibles, aunque el color por sí solo se vea bien.
    colores: {
      primario: '#8FB5A1',
      primarioTenue: '#7CA491',
      primarioVivo: '#6D9583',
      acento: '#DCE8E1',
      fondo: '#F0EDE7',
      fondoSuave: '#F7F5F1',
      textoTenue: '#5F5A52',
    },
    marca: { logo: logoDeTexto('Estudio Vera', '#5B7B6F') },
    // Vacías a propósito: la maqueta no tiene app publicada, y heredar las de
    // fábrica mandaría a la prospecta a descargar la app DE BE FIT LAB.
    tiendas: { appleId: '', bundleId: '', appStore: '', playStore: '', applePayMerchantId: '' },
    coloresOscuro: {
      primario: '#7FA394',
      primarioTenue: '#6B8D7E',
      primarioVivo: '#5C7F70',
      acento: '#232B27',
      fondo: '#121614',
      fondoSuave: '#1A201D',
      textoTenue: '#A8B2AC',
    },
    coaches: ['Renata', 'Alejandra', 'Sofía', 'Camila'],
    disciplinas: [
      { titulo: 'Reformer Basics', nivel: 'Principiante' },
      { titulo: 'Reformer Flow', nivel: 'Intermedio' },
      { titulo: 'Power Reformer', nivel: 'Avanzado' },
      { titulo: 'Barre', nivel: 'Todos los niveles' },
      { titulo: 'Stretch & Restore', nivel: 'Todos los niveles' },
    ],
    // Un estudio de reformer típico: 10 camas, bloque de mañana y de tarde.
    lugares: 10,
    horarios: ['07:00', '08:10', '09:20', '10:30', '17:00', '18:10', '19:20', '20:30'],
    clienta: { nombre: 'María', clasesRestantes: 8, plan: 'Plan Fit' },
    // ⚠️ Las portadas de "Explora" tienen que venir de aquí: las de fábrica son
    // FOTOGRAFÍA DE BE FIT LAB (hay un gorro con su logo bien visible) y
    // enseñarle a otra dueña la marca de su competencia hunde la venta.
    // TODAS las fotos, no solo las tarjetas: la app usa fotografía del estudio
    // en la tarjeta de membresía, el pase de clase, Comida, Evolución y la
    // agenda. Heredarlas le enseñaría a la prospecta el estudio de Be Fit Lab.
    portadas: {
      cafeteria: fondoDemo('#D9C7B2', '#8A6F52'),
      cumpleanos: fondoDemo('#E0BFC6', '#9E6B78'),
      eventos: fondoDemo('#C6D2C0', '#6E8567'),
      membresia: fondoDemo('#A9BFB1', '#4E6659'),
      pase: fondoDemo('#B6CDBF', '#5E7A6C'),
      nutricion: fondoDemo('#D6C9B4', '#8E7A5E'),
      progreso: fondoDemo('#C2D2CB', '#71897E'),
      evolucion: fondoDemo('#BCCFC4', '#6B8577'),
      meta: fondoDemo('#DCD2C0', '#9C8B72'),
      agenda: fondoDemo('#C9D8CF', '#7B948A'),
      cafeteriaPromo: fondoDemo('#CBBBA6', '#9E8469'),
      galeriaEventos: fondoDemo('#C6D2C0', '#8FA487'),
    },
    modulos: {
      cafeteria: true,
      eventos: true,
      cumpleanos: true,
      nutricion: true,
      evolucion: true,
      fotosProgreso: true,
      insignias: true,
      wallet: false,
      salud: false,
    },
  },
};

export function estudioDemo(clave) {
  return ESTUDIOS_DEMO[String(clave || '').toLowerCase()] || null;
}
