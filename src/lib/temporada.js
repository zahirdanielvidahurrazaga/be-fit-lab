// Temporadas de la app de la clienta (Halloween, Día de Muertos…).
//
// Se prenden SOLAS por fecha y se apagan solas: no hay que sacar otra versión
// para quitarlas. Además las dueñas (o nosotros) pueden apagarlas al instante
// con `app_config.temporadas = false` — si esa columna no existe todavía, la
// consulta falla y se toma como prendido (la fecha sigue mandando).
//
// Para revisarlas fuera de fecha: ?temporada=halloween | muertos | off en la
// dirección (se guarda en localStorage 'befit_temporada'; ?temporada=auto lo quita).
import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { Capacitor } from '@capacitor/core';
import { mexicoTodayStr } from './dates';

// [mes (1-12), día desde, día hasta] — ambos inclusive, hora local.
export const TEMPORADAS = {
  halloween: { desde: [10, 25], hasta: [10, 31] },
  muertos: { desde: [11, 1], hasta: [11, 2] },
};

const clave = (m, d) => m * 100 + d;

/** ¿Esta fecha 'YYYY-MM-DD' cae dentro de la temporada indicada? */
export function enTemporada(dateStr, id) {
  const t = TEMPORADAS[id];
  if (!t || !dateStr) return false;
  const [, m, d] = dateStr.split('-').map(Number);
  const k = clave(m, d);
  return k >= clave(...t.desde) && k <= clave(...t.hasta);
}

/** Temporada que toca hoy (o null). Se mide con la fecha de México, no con el
 *  reloj del teléfono: un aparato con la hora mal no debe pintar Halloween en
 *  noviembre (lección de la rama `temporadas-diciembre`). */
export function temporadaPorFecha(hoyStr = mexicoTodayStr()) {
  for (const id of Object.keys(TEMPORADAS)) if (enTemporada(hoyStr, id)) return id;
  return null;
}

function forzada() {
  try {
    // También por la dirección: ?temporada=halloween|muertos|off (se recuerda;
    // más fácil que escribir en la consola, que se olvida recargar).
    const enUrl = new URLSearchParams(window.location.search).get('temporada');
    if (enUrl === 'halloween' || enUrl === 'muertos' || enUrl === 'off') localStorage.setItem('befit_temporada', enUrl);
    if (enUrl === 'auto') localStorage.removeItem('befit_temporada');
    const v = localStorage.getItem('befit_temporada');
    return v === 'halloween' || v === 'muertos' || v === 'off' ? v : null;
  } catch { return null; }
}

// Un solo viaje a la base por sesión, compartido por todas las pantallas.
let interruptor = null;
function leerInterruptor() {
  if (!interruptor) {
    interruptor = supabase.from('app_config').select('temporadas').eq('id', 1).single()
      .then(({ data, error }) => (error || !data ? true : data.temporadas !== false))
      .catch(() => true);
  }
  return interruptor;
}

/** Temporada activa ahora: 'halloween' | 'muertos' | null. */
export function useTemporada() {
  const f = forzada();
  const porFecha = f === 'off' ? null : (f || temporadaPorFecha());
  const [prendida, setPrendida] = useState(true);
  useEffect(() => {
    if (!porFecha || f) return;
    let vivo = true;
    leerInterruptor().then(v => { if (vivo) setPrendida(v); });
    return () => { vivo = false; };
  }, [porFecha, f]);
  return prendida ? porFecha : null;
}

// ── Animación de entrada (src/components/IntroTemporada.jsx, la monta /welcome) ──
export const DURACION_INTRO_MS = 3300;
const claveIntro = (t) => `befit_intro_visto_${t}`;

/** ¿Toca la animación de entrada de temporada en este arranque? (y la marca como vista) */
export function tomarIntroTemporada(temporada) {
  if (!temporada) return false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('intro') === '1') localStorage.setItem('befit_intro', '1');
    if (params.get('intro') === '0') localStorage.removeItem('befit_intro');
    if (localStorage.getItem('befit_intro') === '1') return true;
    if (!Capacitor.isNativePlatform()) return false;
    if (localStorage.getItem(claveIntro(temporada)) === mexicoTodayStr()) return false;
    localStorage.setItem(claveIntro(temporada), mexicoTodayStr());
    return true;
  } catch { return false; }
}

