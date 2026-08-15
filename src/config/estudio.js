// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN DEL ESTUDIO
//
// Todo lo que cambia de un cliente a otro vive AQUÍ. Ningún otro archivo debe
// tener escrito a mano el nombre del estudio, sus colores ni sus enlaces.
//
// Para montar un estudio nuevo:
//   1. Cambia los valores de este archivo.
//   2. Reemplaza en `public/` los archivos que apunta `marca`.
//   3. Apaga en `modulos` lo que ese estudio no contrató.
//
// Los valores de abajo son los de Be Fit Lab, el primer cliente.
// ─────────────────────────────────────────────────────────────────────────────

const APPLE_ID = '6772008660';
const BUNDLE_ID = 'com.befitlab.app';

export const ESTUDIO = {

  // ── Identidad ──────────────────────────────────────────────────────────────
  nombre: 'Be Fit Lab',
  // Versión en mayúsculas para las pantallas que la usan como logotipo tipográfico
  // (Welcome, Ajustes). Se deja explícita en vez de calcularla porque hay marcas
  // que no se ven bien en mayúsculas automáticas.
  nombreMayusculas: 'BE FIT LAB',
  // Cómo se llama el panel de administración por dentro. Lo ve el staff, no las
  // clientas, así que puede ser distinto del nombre comercial.
  nombrePanel: 'Gestión Lab',
  giro: 'Estudio de Pilates',
  ciudad: 'Puebla',

  // ── Datos legales (Términos y Aviso de Privacidad) ─────────────────────────
  legal: {
    razonSocial: 'Grupo Be Fit Lab S.A. de C.V.',
    domicilio: 'Ciudad de Puebla, México',
  },

  // ── Contacto y ubicación ───────────────────────────────────────────────────
  // Sale en Términos, Aviso de Privacidad, el pie del sitio y los boletos.
  contacto: {
    telefono: '+52 221 266 4253',
    // Solo dígitos con lada de país: así lo pide wa.me.
    whatsapp: '522212664253',
    email: 'befitlab1@gmail.com',
    instagram: '@befit.lab',
    instagramUrl: 'https://instagram.com/befit.lab',
    // En renglones: el sitio la parte en dos líneas y Términos la une en una.
    direccion: [
      'Blvrd 22 Sur 5123, Villa Carmel,',
      '72567 Heroica Puebla de Zaragoza, Pue.',
    ],
    mapaLink: 'https://maps.app.goo.gl/RFUhTHGG5cQuVoST8',
    horarios: [
      'Lunes a Viernes: 8:00 AM - 12:00 PM y 5:00 PM - 9:00 PM',
      'Sábados: 8:30 AM - 12:00 PM',
    ],
  },

  // ── Enlaces públicos ───────────────────────────────────────────────────────
  enlaces: {
    sitio: 'https://befitlab.app',
    // Sin protocolo. Se usa en los enlaces cortos que se comparten en Instagram.
    dominio: 'befitlab.app',
    // URL de inserción de Google Maps para la sección de ubicación del sitio.
    mapaEmbed: '',
  },

  // ── Archivos de marca (todos viven en public/) ─────────────────────────────
  marca: {
    logo: '/logo2.png',
    icono: '/favicon_peach.png',
    portadaAgenda: '/assets/agenda_lifestyle.png',
  },

  // ── Tiendas de aplicaciones ────────────────────────────────────────────────
  // Cada estudio publica bajo SU PROPIA cuenta de desarrollador, así que estos
  // tres valores cambian siempre. Si un estudio todavía no publica, deja
  // `appleId` y `bundleId` vacíos y la app oculta los botones de descarga.
  tiendas: {
    appleId: APPLE_ID,
    bundleId: BUNDLE_ID,
    appStore: `https://apps.apple.com/mx/app/id${APPLE_ID}`,
    playStore: `https://play.google.com/store/apps/details?id=${BUNDLE_ID}`,
    // Identificador de comercio de Apple Pay. Se da de alta en la cuenta de
    // desarrollador del estudio y tiene que coincidir con el de Xcode.
    applePayMerchantId: `merchant.${BUNDLE_ID}`,
  },

  // ── Paleta ─────────────────────────────────────────────────────────────────
  // Estos seis colores se inyectan sobre las variables de src/index.css al
  // arrancar (ver aplicarMarca más abajo). Cambiarlos cambia la identidad visual
  // completa sin tocar una línea de CSS.
  colores: {
    primario: '#FF914D',
    primarioTenue: '#E68245',
    acento: '#FFD4BA',
    fondo: '#EFE9E4',
    fondoSuave: '#F5F2F0',
    textoTenue: '#5E5343',
  },

  // Mismo juego para el tema oscuro. El modo oscuro solo aplica al rol CLIENT.
  // Ojo: en oscuro el acento NO es el mismo color claro aclarado — es un tono
  // café oscuro que funciona como superficie elevada. Copiar aquí el acento
  // claro rompe el modo oscuro sin que salte ningún error.
  coloresOscuro: {
    primario: '#FF914D',
    primarioTenue: '#E68245',
    acento: '#2B231D',
    fondo: '#15110E',
    fondoSuave: '#1B1612',
    textoTenue: '#B8ABA0',
  },

  // ── Módulos ────────────────────────────────────────────────────────────────
  // Poner en false saca el módulo de las rutas, del menú de la clienta y del
  // panel de administración. El código se queda en el repo, simplemente no se
  // monta. Reservas, clases, planes, cobros y los roles de staff son el núcleo
  // y no se apagan.
  modulos: {
    cafeteria: true,       // Coffee Lab: menú, carrito, pedidos, rol BARISTA
    nutricion: true,       // recetas y plan alimenticio
    evolucion: true,       // medidas corporales y gráficas de progreso
    fotosProgreso: true,   // fotos frontal / perfil / espalda
    insignias: true,       // logros y rachas
    eventos: true,         // eventos con venta de boletos
    cumpleanos: true,      // calendario de cumpleaños
    wallet: true,          // pases .pkpass para Apple Wallet
    salud: true,           // Apple Health y Health Connect
  },
};

// Devuelve la paleta que toca según el tema activo.
export function paletaDe(tema) {
  return tema === 'dark' ? ESTUDIO.coloresOscuro : ESTUDIO.colores;
}

// Qué variable de CSS alimenta cada color de la configuración. Un color puede
// alimentar varias: el primario, por ejemplo, se usa como color de marca y
// también como acento de la cáscara de la app.
const TOKENS = {
  primario: ['--primary', '--app-accent'],
  primarioTenue: ['--primary-dim'],
  acento: ['--accent'],
  fondo: ['--surface', '--app-bg'],
  fondoSuave: ['--surface-low'],
  textoTenue: ['--on-surface-variant', '--app-on-surface-variant'],
};

// Escribe la paleta del estudio sobre las variables de CSS. Se llama al arrancar
// y cada vez que cambia el tema.
export function aplicarMarca(tema = 'light') {
  if (typeof document === 'undefined') return;
  const paleta = paletaDe(tema);
  const raiz = document.documentElement;
  for (const [clave, valor] of Object.entries(paleta)) {
    for (const token of TOKENS[clave] || []) {
      raiz.style.setProperty(token, valor);
    }
  }
}

// Aplica la paleta al arrancar y la vuelve a aplicar cada vez que cambia el
// tema. Se engancha al atributo `data-theme` en lugar de a cada punto donde se
// cambia el tema, que hoy son diez repartidos por la app: así ninguno se puede
// olvidar de avisar.
//
// Ojo: aplicarMarca escribe estilos en línea sobre <html>, que ganan por
// especificidad a las reglas de index.css. Por eso hay que reaplicar en cada
// cambio de tema — si no, la paleta clara se quedaría pegada en modo oscuro.
export function iniciarMarca() {
  if (typeof document === 'undefined') return () => {};
  const raiz = document.documentElement;
  const sincronizar = () => aplicarMarca(raiz.getAttribute('data-theme') || 'light');
  sincronizar();
  const observador = new MutationObserver(sincronizar);
  observador.observe(raiz, { attributes: true, attributeFilter: ['data-theme'] });
  return () => observador.disconnect();
}

// Atajo para preguntar por un módulo sin cargar todo el objeto.
export function moduloActivo(nombre) {
  return ESTUDIO.modulos[nombre] !== false;
}

export default ESTUDIO;
