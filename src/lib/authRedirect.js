import { Capacitor } from '@capacitor/core';

// URLs de retorno para los correos de Supabase Auth.
// - Nativo: deep link befitlab:// (lo captura appUrlOpen y procesa la sesión).
// - Web: ruta normal de la PWA (detectSessionInUrl la resuelve sola).
// El deep link debe estar en la allow-list de Redirect URLs del proyecto.

export function signupRedirect() {
  return Capacitor.isNativePlatform()
    ? 'befitlab://auth-callback?flow=signup'
    : `${window.location.origin}/portal`;
}

export function recoveryRedirect() {
  return Capacitor.isNativePlatform()
    ? 'befitlab://auth-callback?flow=recovery'
    : `${window.location.origin}/nueva-contrasena`;
}
