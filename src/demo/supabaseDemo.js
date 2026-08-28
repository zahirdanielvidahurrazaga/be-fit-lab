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

// El panel de administración consulta la base por su cuenta en sus 13
// sub-pestañas. Estas filas las alimenta la misma semilla que el resto de la
// maqueta, para que el panel no salga vacío en una junta.
let SEMILLA = null;
export function sembrarDesde(datos) { SEMILLA = datos; }

const desdeSemilla = {
  users: () => [
    ...(SEMILLA?.clientas || []),
    ...(SEMILLA?.coaches || []),
  ],
  classes: () => SEMILLA?.clases || [],
  // ⚠️ Las filas llevan `users` ANIDADO: las pantallas piden el join
  // `users:user_id(...)` y con filas planas la lista de alumnas salía vacía.
  reservations: () => {
    const porId = new Map((SEMILLA?.clientas || []).map((c) => [c.id, c]));
    const porClase = new Map((SEMILLA?.clases || []).map((c) => [c.id, c]));
    const conPersona = (r) => ({
      ...r,
      classes: porClase.get(r.class_id)
        ? { title: porClase.get(r.class_id).title,
            instructor: porClase.get(r.class_id).instructor,
            coach_id: porClase.get(r.class_id).coach_id,
            category: porClase.get(r.class_id).category }
        : null,
      users: porId.get(r.user_id)
        ? { id: r.user_id, full_name: porId.get(r.user_id).full_name,
            email: porId.get(r.user_id).email, avatar_url: null }
        : { id: r.user_id, full_name: SEMILLA?.yo?.full_name || 'Clienta',
            email: SEMILLA?.yo?.email || '', avatar_url: null },
    });
    return [
      ...(SEMILLA?.reservas || []).map((r) => conPersona({
        id: r.id, class_id: r.classId, user_id: SEMILLA?.yo?.id,
        status: r.status, checked_in: r.checkedIn, created_at: new Date().toISOString(),
      })),
      ...(SEMILLA?.reservasDeOtras || []).map(conPersona),
    ];
  },
  sales: () => SEMILLA?.ventas || [],
  class_credit_ledger: () => SEMILLA?.movimientos || [],
};

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
    // Dos en curso: la pantalla de la barra sin pedidos no enseña nada.
    { id: 'demo-o-a', user_id: 'demo-cliente-2', status: 'paid', total: 146,
      created_at: new Date(hoy.getTime() - 4 * 60000).toISOString(),
      client_name: 'Ximena Vega', pickup_time: null, is_gift: false,
      items: [{ name: 'Matcha latte', qty: 1 }, { name: 'Pan de plátano', qty: 1 }] },
    { id: 'demo-o-b', user_id: 'demo-cliente-6', status: 'preparing', total: 85,
      created_at: new Date(hoy.getTime() - 11 * 60000).toISOString(),
      client_name: 'Mariana Ibarra', pickup_time: null, is_gift: false,
      items: [{ name: 'Smoothie de frutos rojos', qty: 1 }] },
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

// Código de la maqueta para abrir Reportes. En producción se verifica contra la
// base con verify_admin_code; aquí se acepta uno fijo y se enseña en pantalla,
// porque si el candado no abre la prospecta nunca ve Reportes — que es de las
// pantallas que más venden.
export const CODIGO_DEMO = '1234';

const RPCS = {
  // El panel de auditoría de saldos: sin descuadres, que es como debe verse un
  // estudio bien llevado.
  admin_audit_saldos: [],
  admin_set_saldo: null,
  admin_book_class: null,
  admin_cancel_class: null,
  admin_issue_event_ticket: null,

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
// Resumen financiero con la misma forma que devuelve admin-analytics, para que
// la pestaña de Reportes tenga números en vez de salir en blanco.
function analiticaFalsa(dias = 30) {
  const serie = [];
  let bruto = 0;
  for (let i = dias - 1; i >= 0; i--) {
    const f = new Date(hoy.getTime() - i * 86400000);
    // Fin de semana más flojo, como en un estudio de verdad.
    const finde = f.getDay() === 0 || f.getDay() === 6;
    const monto = Math.round((finde ? 900 : 2600) + Math.sin(i / 3) * 700 + (i % 5) * 180);
    bruto += monto;
    serie.push({ date: f.toISOString().slice(0, 10), amount: monto });
  }
  const comisiones = Math.round(bruto * 0.036);
  const cuenta = Math.round(dias * 2.4);
  return {
    currency: 'MXN', mode: 'demo',
    gross: bruto, net: bruto - comisiones, fees: comisiones,
    refunded: 0, count: cuenta,
    byType: {
      membresia: Math.round(bruto * 0.72),
      cafeteria: Math.round(bruto * 0.19),
      evento: Math.round(bruto * 0.09),
    },
    series: serie,
    recent: serie.slice(-12).reverse().map((d, i) => ({
      id: `demo-cargo-${i}`, amount: d.amount, created: new Date(d.date).getTime() / 1000,
      description: i % 3 === 0 ? 'Cafetería' : 'Membresía', status: 'succeeded',
    })),
    avgTicket: Math.round(bruto / Math.max(cuenta, 1)),
  };
}

const funcionesFalsas = {
  invoke: async (nombre, opciones) => {
    if (nombre === 'admin-analytics') {
      return { data: analiticaFalsa(opciones?.body?.days || 30), error: null };
    }
    // El panel de la dueña abre la ficha de una clienta y consulta su cobro
    // automático. Devolver la forma genérica dejaba la pantalla en blanco, así
    // que aquí se simula una suscripción con la misma forma que la real.
    if (nombre === 'admin-membership') {
      if (opciones?.body?.action !== 'list') {
        return { data: { resultado: 'Simulado en la demostración' }, error: null };
      }
      return {
        data: {
          duplicadas: 0,
          suscripciones: [{
            id: 'sub_demo', monto: 1300, estado: 'active',
            esLaDeLaApp: true, pausada: false, terminaAlVencer: false,
            proximoCobro: Math.floor((hoy.getTime() + 21 * 86400000) / 1000),
          }],
        },
        error: null,
      };
    }
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
    const filas = desdeSemilla[tabla] ? desdeSemilla[tabla]() : (DATOS[tabla] ?? []);
    return {
      select: () => consulta(filas),
      // Las escrituras no hacen nada: la maqueta se reinicia al recargar.
      insert: () => consulta([]),
      update: () => consulta([]),
      upsert: () => consulta([]),
      delete: () => consulta([]),
    };
  },
  rpc(nombre, args) {
    // El candado de Reportes espera exactamente `true`.
    if (nombre === 'verify_admin_code') {
      return consulta(String(args?.p_code || '').trim() === CODIGO_DEMO);
    }
    return consulta(RPCS[nombre] ?? []);
  },
  channel() { return canalFalso; },
  removeChannel() { return Promise.resolve('ok'); },
  removeAllChannels() { return Promise.resolve('ok'); },
};

export default supabaseDemo;
