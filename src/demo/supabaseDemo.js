// ─────────────────────────────────────────────────────────────────────────────
// CLIENTE DE SUPABASE FALSO PARA LAS MAQUETAS
//
// Portal y Agenda leen todo del contexto, pero Cafetería consulta la base 19
// veces por su cuenta, Eventos 14 y Cumpleaños 2. Y varias de esas tablas
// tienen lectura pública: sin esto, una prospecta abriría la cafetería de la
// maqueta y vería el MENÚ Y LOS PRECIOS REALES de Be Fit Lab.
//
// Aquí se imita lo justo de supabase-js para que esas pantallas funcionen con
// datos inventados. Las escrituras no hacen nada y se resuelven bien.
// ─────────────────────────────────────────────────────────────────────────────

// Imágenes generadas, nunca archivos: así ninguna maqueta depende de la
// fotografía de otro estudio.
const fondo = (a, b) => 'data:image/svg+xml;utf8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">`
  + `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">`
  + `<stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/>`
  + `</linearGradient></defs><rect width="600" height="400" fill="url(#g)"/></svg>`);

const hoy = new Date();
const enDias = (n) => new Date(hoy.getTime() + n * 86400000).toISOString().slice(0, 10);

export const PRODUCTOS_CAFE = [
  { id: 'demo-p1', name: 'Latte de vainilla', description: 'Espresso doble con leche vaporizada', price: 68, category: 'Café', available: true, image_url: fondo('#D9C7B2', '#B49A7D'), sort_order: 1 },
  { id: 'demo-p2', name: 'Matcha latte', description: 'Matcha ceremonial con leche de almendra', price: 78, category: 'Café', available: true, image_url: fondo('#C6D6BE', '#93AE88'), sort_order: 2 },
  { id: 'demo-p3', name: 'Smoothie de frutos rojos', description: 'Fresa, zarzamora y plátano', price: 85, category: 'Smoothies', available: true, image_url: fondo('#E0BFC6', '#B8848F'), sort_order: 3 },
  { id: 'demo-p4', name: 'Bowl de açaí', description: 'Con granola artesanal y fruta de temporada', price: 115, category: 'Snacks', available: true, image_url: fondo('#C9B6CE', '#8F7597'), sort_order: 4 },
  { id: 'demo-p5', name: 'Pan de plátano', description: 'Hecho en casa, sin azúcar refinada', price: 52, category: 'Snacks', available: true, image_url: fondo('#DFCBB0', '#B99C77'), sort_order: 5 },
  { id: 'demo-p6', name: 'Agua de pepino y menta', description: 'Sin azúcar añadida', price: 38, category: 'Bebidas', available: true, image_url: fondo('#CFE0D6', '#9BBCA9'), sort_order: 6 },
];

const DATOS = {
  cafe_products: PRODUCTOS_CAFE,

  cafe_covers: [{
    id: 'demo-c1', image_url: fondo('#CBBBA6', '#9E8469'),
    eyebrow: 'NUEVO', title: 'Ya llegó el matcha ceremonial', cta: 'Ver el menú',
    active: true, sort_order: 1,
  }],

  cafe_option_groups: [
    { id: 'demo-g1', name: 'Tipo de leche', product_id: 'demo-p1', min_select: 1, max_select: 1, sort_order: 1 },
    { id: 'demo-g2', name: 'Extras', product_id: 'demo-p1', min_select: 0, max_select: 3, sort_order: 2 },
  ],

  cafe_options: [
    { id: 'demo-o1', group_id: 'demo-g1', name: 'Entera', price_delta: 0, available: true },
    { id: 'demo-o2', group_id: 'demo-g1', name: 'Deslactosada', price_delta: 0, available: true },
    { id: 'demo-o3', group_id: 'demo-g1', name: 'Almendra', price_delta: 12, available: true },
    { id: 'demo-o4', group_id: 'demo-g2', name: 'Shot extra', price_delta: 15, available: true },
    { id: 'demo-o5', group_id: 'demo-g2', name: 'Canela', price_delta: 0, available: true },
  ],

  cafe_loyalty: [{ user_id: 'demo-yo', stamps: 7, gifts_available: 1, total_stamps_earned: 19 }],

  cafe_orders: [
    { id: 'demo-o-1', user_id: 'demo-yo', status: 'delivered', total: 68, created_at: new Date(hoy.getTime() - 3 * 86400000).toISOString(), items: [{ name: 'Latte de vainilla', qty: 1 }] },
    { id: 'demo-o-2', user_id: 'demo-yo', status: 'delivered', total: 163, created_at: new Date(hoy.getTime() - 9 * 86400000).toISOString(), items: [{ name: 'Bowl de açaí', qty: 1 }, { name: 'Pan de plátano', qty: 1 }] },
  ],

  events: [
    { id: 'demo-e1', title: 'Clase al aire libre en Los Fuertes', slug: 'clase-aire-libre', description: 'Una sesión distinta al amanecer, con mat y café de por medio. Cupo limitado.', event_date: enDias(12), price: 350, capacity: 25, registration_open: true, image_url: fondo('#C6D2C0', '#8FA487') },
    { id: 'demo-e2', title: 'Taller de respiración y movilidad', slug: 'taller-respiracion', description: 'Dos horas para entender cómo respirar mientras te mueves.', event_date: enDias(26), price: 0, capacity: 18, registration_open: true, image_url: fondo('#D5C6D8', '#9E8AA3') },
  ],

  event_registrations: [
    { id: 'demo-er1', event_id: 'demo-e1', user_id: 'demo-cliente-0', guests: [], created_at: hoy.toISOString() },
    { id: 'demo-er2', event_id: 'demo-e1', user_id: 'demo-cliente-3', guests: ['Ana'], created_at: hoy.toISOString() },
    { id: 'demo-er3', event_id: 'demo-e2', user_id: 'demo-cliente-7', guests: [], created_at: hoy.toISOString() },
  ],

  event_photos: [
    { id: 'demo-f1', event_id: 'demo-e1', url: fondo('#D8CBB8', '#A8917A'), created_at: hoy.toISOString() },
    { id: 'demo-f2', event_id: 'demo-e1', url: fondo('#C3D0C9', '#8CA095'), created_at: hoy.toISOString() },
    { id: 'demo-f3', event_id: 'demo-e1', url: fondo('#DCC9CE', '#AE8E97'), created_at: hoy.toISOString() },
  ],
};

const RPCS = {
  get_birthdays: [
    { user_id: 'demo-cliente-1', full_name: 'Valeria Torres', birthday: enDias(2), avatar_url: null },
    { user_id: 'demo-cliente-5', full_name: 'Paulina Cárdenas', birthday: enDias(9), avatar_url: null },
    { user_id: 'demo-cliente-11', full_name: 'Renata Bautista', birthday: enDias(21), avatar_url: null },
  ],
};

// Constructor de consultas: cualquier filtro (eq, in, order, limit…) devuelve el
// mismo objeto, y al hacerle `await` entrega los datos sembrados.
function consulta(datos) {
  const resultado = {
    data: datos,
    error: null,
    count: Array.isArray(datos) ? datos.length : null,
    status: 200,
  };
  const proxy = new Proxy({}, {
    get(_, prop) {
      if (typeof prop === 'symbol') return undefined;
      if (prop === 'then') return (ok, mal) => Promise.resolve(resultado).then(ok, mal);
      if (prop === 'catch') return (f) => Promise.resolve(resultado).catch(f);
      if (prop === 'finally') return (f) => Promise.resolve(resultado).finally(f);
      if (prop === 'single' || prop === 'maybeSingle') {
        return () => consulta(Array.isArray(datos) ? (datos[0] ?? null) : datos);
      }
      return () => proxy;
    },
  });
  return proxy;
}

const canalFalso = {
  on() { return canalFalso; },
  subscribe() { return canalFalso; },
  unsubscribe() { return Promise.resolve('ok'); },
};

// Las edge functions NO se pueden dejar pasar: Cafetería y Eventos invocan
// cobros de Stripe, pedidos en efectivo y `send-push`. Una prospecta jugando
// con la maqueta podría crear cargos reales o mandarle notificaciones a las
// baristas de Be Fit Lab. Aquí se simulan y no sale nada a la red.
const funcionesFalsas = {
  invoke: async (nombre) => {
    console.info(`[demo] se simuló la función "${nombre}" (no se llamó a nada real)`);
    return {
      data: { demo: true, message: 'Simulado en la demostración' },
      error: null,
    };
  },
};

export const supabaseDemo = {
  functions: funcionesFalsas,

  from(tabla) {
    const filas = DATOS[tabla] ?? [];
    return {
      select: () => consulta(filas),
      // Las escrituras no hacen nada: la maqueta se reinicia al recargar.
      insert: () => consulta([]),
      update: () => consulta([]),
      upsert: () => consulta([]),
      delete: () => consulta([]),
    };
  },
  rpc(nombre) {
    return consulta(RPCS[nombre] ?? []);
  },
  channel() { return canalFalso; },
  removeChannel() { return Promise.resolve('ok'); },
  removeAllChannels() { return Promise.resolve('ok'); },
};

export default supabaseDemo;
