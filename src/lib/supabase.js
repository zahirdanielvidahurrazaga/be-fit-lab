import { createClient, processLock } from '@supabase/supabase-js'
import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'

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
  setItem: async (key, value) => { await Preferences.set({ key, value }); },
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
