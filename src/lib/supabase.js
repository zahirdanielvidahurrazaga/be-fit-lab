import { createClient, processLock } from '@supabase/supabase-js'
import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'
import { App as CapApp } from '@capacitor/app'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validación estricta para evitar que la App se ponga en blanco si olvidaron poner la URL real
const isValidUrl = supabaseUrl && supabaseUrl.startsWith('http');
const finalUrl = isValidUrl ? supabaseUrl : 'https://placeholder.supabase.co';
const finalKey = supabaseAnonKey && supabaseAnonKey.length > 20 ? supabaseAnonKey : 'placeholder';

if (!isValidUrl) {
  console.warn("⚠️ Las variables de Supabase están vacías o son inválidas. Usando MODO SEGURO (Offline).")
}

const isNative = Capacitor.isNativePlatform();

// En app nativa, los tokens de sesión se guardan con @capacitor/preferences
// (almacenamiento NATIVO persistente). El localStorage del WebView puede ser
// purgado por iOS/Android al cerrar la app, lo que cerraba la sesión al reabrir.
// getItem migra automáticamente la sesión de usuarios que vienen de la versión
// anterior (que guardaba en localStorage), para que NO tengan que volver a entrar.
const nativeStorage = {
  getItem: async (key) => {
    const { value } = await Preferences.get({ key });
    if (value !== null && value !== undefined) return value;
    const legacy = window.localStorage.getItem(key);
    if (legacy != null) {
      await Preferences.set({ key, value: legacy });
      return legacy;
    }
    return null;
  },
  // Doble escritura: Preferences (fuente de verdad) + localStorage (respaldo).
  // Con la rotación de refresh tokens, un respaldo DESACTUALIZADO es peor que
  // ninguno: si Preferences se pierde y el fallback devuelve un token viejo,
  // Supabase lo rechaza ("Refresh Token Not Found") y cierra la sesión. Al
  // escribir ambos en cada rotación, el respaldo siempre tiene el token vigente.
  setItem: async (key, value) => {
    await Preferences.set({ key, value });
    try { window.localStorage.setItem(key, value); } catch (e) {}
  },
  removeItem: async (key) => {
    await Preferences.remove({ key });
    try { window.localStorage.removeItem(key); } catch (e) {}
  },
};

// En el WebView nativo, el Web Locks API (navigator.locks) por defecto de
// supabase-js se colgaba (getSession tomaba el lock y no lo soltaba → login
// atascado en "Validando..."). Antes se usó un lock NO-OP, pero ese NO serializa
// las operaciones de auth: con la ROTACIÓN de refresh token activada, varias
// renovaciones simultáneas (timer de auto-refresh + getSession al volver del
// fondo + onAuthStateChange) usaban el MISMO refresh token → una lo rota y la
// otra queda inválida → "Invalid/Already Used Refresh Token" → SIGNED_OUT →
// se cerraba la sesión sola. `processLock` es el lock EN MEMORIA que Supabase
// recomienda para móvil: serializa las operaciones en una cola de promesas
// (sin navigator.locks, así no se cuelga). En web mantenemos el lock por defecto.
export const supabase = createClient(finalUrl, finalKey, {
  auth: {
    storage: isNative ? nativeStorage : window.localStorage,
    persistSession: true,
    autoRefreshToken: true,
    // En nativo no hay redirect con sesión en la URL; evitarlo previene falsos
    // negativos al arrancar. En web se mantiene por compatibilidad.
    detectSessionInUrl: !isNative,
    ...(isNative ? { lock: processLock } : {}),
  },
})

// Patrón recomendado por Supabase para móvil: pausar el auto-refresh del token
// cuando la app pasa a SEGUNDO PLANO y reanudarlo al VOLVER. Si un refresh queda
// en vuelo justo cuando iOS/Android suspende la app, el servidor rota el token
// pero la respuesta nunca se procesa → el token guardado queda inválido y la
// PRÓXIMA apertura cierra la sesión ("Already Used"/"Not Found"). supabase-js
// intenta cubrirlo con visibilitychange, pero ese evento no siempre alcanza a
// correr en el WebView; appStateChange es la señal NATIVA y sí da tiempo.
// startAutoRefresh() además dispara un tick inmediato al volver, así el token
// expirado se renueva al instante (serializado por processLock).
if (isNative) {
  CapApp.addListener('appStateChange', ({ isActive }) => {
    if (isActive) supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
