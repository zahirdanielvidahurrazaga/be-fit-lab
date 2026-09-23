import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

import { defineCustomElements } from '@ionic/pwa-elements/loader';
import { Capacitor } from '@capacitor/core';
import { iniciarMarca } from './config/estudio';
import { cargarTemporada } from './lib/temporada';

defineCustomElements(window);

// La paleta del estudio se escribe sobre las variables de index.css antes del
// primer render, para que no se alcance a ver el color de fábrica.
iniciarMarca();

// Y encima, si hoy corre una temporada (patrio, Halloween, Navidad), se pinta
// sobre esa paleta. No se espera: es decoración, y hacer el arranque de la app
// dependiente de una consulta de adorno sería un mal negocio. Pinta desde el
// caché al instante y se corrige cuando contesta la base.
cargarTemporada();

// Desregistrar Service Workers en apps nativas — WebView no debe servir desde caché stale
if (Capacitor.isNativePlatform() && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(r => r.unregister());
  });
  if (window.caches) {
    caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
  }
}

// El despliegue de MAQUETAS monta otra aplicación: solo el índice y las demos.
// Al ser una constante de compilación, el bundler elimina por completo la rama
// que no aplica — el sitio de demos no incluye ni un chunk de la app del
// estudio, y la app del estudio no incluye nada de demos.
const raiz = createRoot(document.getElementById('root'));

if (import.meta.env.VITE_DEMOS === 'true') {
  const { default: AppDemos } = await import('./AppDemos.jsx');
  raiz.render(<StrictMode><AppDemos /></StrictMode>);
} else {
  const { default: App } = await import('./App.jsx');
  raiz.render(<StrictMode><App /></StrictMode>);
}
