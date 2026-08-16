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

export const ESTUDIOS_DEMO = {

  // La demo permanente y sin riesgo: estudio inventado. Es la que se puede
  // poner en el portafolio y mandar sin pensarlo dos veces.
  vera: {
    esReal: false,
    nombre: 'Estudio Vera',
    nombreMayusculas: 'ESTUDIO VERA',
    nombrePanel: 'Panel Vera',
    giro: 'Pilates Reformer',
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
    clienta: { nombre: 'María', clasesRestantes: 8, plan: 'Plan 12 clases' },
    // ⚠️ Cafetería, eventos y cumpleaños se apagan en las demos: sus tarjetas
    // usan FOTOGRAFÍA DE BE FIT LAB (hay un gorro con su logo bien visible), y
    // enseñarle a una dueña la marca de su competencia hunde la venta. Además
    // la demo gana: se concentra en lo que de verdad convence — reservar, la
    // lista de espera y el progreso — en vez de dispersarse.
    modulos: {
      cafeteria: false,
      eventos: false,
      cumpleanos: false,
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
