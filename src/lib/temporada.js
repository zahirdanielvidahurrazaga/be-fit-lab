// ─────────────────────────────────────────────────────────────────────────────
// TEMPORADA ACTIVA
//
// Resuelve qué temporada corre hoy leyendo la tabla `app_seasons` y la instala
// en la configuración del estudio (ver `instalarTemporada` en config/estudio).
//
// Por qué la temporada se lee de la BD y no se escribe en el código: el bundle
// solo llega a las apps nativas con una versión aprobada por Apple. Si cada
// temporada fuera código, cada temporada dependería de la revisión de la App
// Store. Así este archivo viaja UNA vez y de ahí en adelante una temporada
// nueva es una fila.
//
// Tres reglas que no se negocian:
//   1. La fecha se calcula en hora de MÉXICO, no la del dispositivo. El reloj
//      de un teléfono mal configurado no puede adelantar ni atrasar Halloween.
//      (Es el mismo bug que tuvo el lector de QR en julio.)
//   2. Nada aquí puede romper la app. Es decoración: si la consulta falla, si
//      no hay red o si localStorage truena, la app se ve como siempre.
//   3. Se pinta primero desde el caché y luego se confirma con la BD, para que
//      en la segunda visita no haya un parpadeo de la paleta normal.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { mexicoTodayStr } from './dates';
import { instalarTemporada, temporadaActual } from '../config/estudio';

const LLAVE_CACHE = 'befit_temporada';
const EVENTO = 'befit:temporada';

const CAMPOS = 'slug,nombre,starts_on,ends_on,colores,colores_oscuro,decor,saludo';

// ¿La temporada cubre el día que le paso? Se valida SIEMPRE, también contra el
// caché: si no, un Halloween guardado seguiría pintando la app en noviembre.
function cubre(t, hoy) {
  return !!t && typeof t.starts_on === 'string' && typeof t.ends_on === 'string'
    && t.starts_on <= hoy && hoy <= t.ends_on;
}

function leerCache() {
  try {
    const crudo = localStorage.getItem(LLAVE_CACHE);
    return crudo ? JSON.parse(crudo) : null;
  } catch {
    return null;
  }
}

function guardarCache(t) {
  try {
    if (t) localStorage.setItem(LLAVE_CACHE, JSON.stringify(t));
    else localStorage.removeItem(LLAVE_CACHE);
  } catch {
    /* modo privado o almacenamiento bloqueado: se vive sin caché */
  }
}

function anunciar(t) {
  instalarTemporada(t);
  try {
    window.dispatchEvent(new CustomEvent(EVENTO, { detail: t }));
  } catch {
    /* sin window (pruebas): la paleta ya se aplicó, que es lo que importa */
  }
}

// Se llama una vez al arrancar, desde main.jsx. No se espera su resultado.
export async function cargarTemporada() {
  const hoy = mexicoTodayStr();

  // 1. Caché: pinta de inmediato si lo guardado sigue vigente HOY.
  const guardada = leerCache();
  if (cubre(guardada, hoy)) anunciar(guardada);
  else if (guardada) guardarCache(null);

  // 2. Base de datos: la verdad. Puede confirmar, cambiar o apagar la temporada.
  try {
    const { data, error } = await supabase
      .from('app_seasons')
      .select(CAMPOS)
      .eq('activa', true)
      .lte('starts_on', hoy)
      .gte('ends_on', hoy)
      // Si dos se traslapan gana la que empezó más tarde: así una temporada
      // corta y específica (Día de Muertos) le gana a una larga que la envuelve.
      .order('starts_on', { ascending: false })
      .limit(1);

    if (error) return;           // se queda lo del caché, o nada
    const t = cubre(data?.[0], hoy) ? data[0] : null;
    anunciar(t);
    guardarCache(t);
  } catch {
    /* sin red: la app funciona igual, solo sin adorno */
  }
}

// Para los componentes que pintan la capa decorativa. La temporada se instala
// fuera de React (la paleta tiene que aplicarse antes del primer render), así
// que el aviso de que llegó viaja por un evento de window.
export function useTemporada() {
  const [t, setT] = useState(() => temporadaActual());
  useEffect(() => {
    const alCambiar = () => setT(temporadaActual());
    window.addEventListener(EVENTO, alCambiar);
    return () => window.removeEventListener(EVENTO, alCambiar);
  }, []);
  return t;
}
