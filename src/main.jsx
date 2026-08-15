import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import { Capacitor } from '@capacitor/core';
import { iniciarMarca } from './config/estudio';

defineCustomElements(window);

// La paleta del estudio se escribe sobre las variables de index.css antes del
// primer render, para que no se alcance a ver el color de fábrica.
iniciarMarca();

// Desregistrar Service Workers en apps nativas — WebView no debe servir desde caché stale
if (Capacitor.isNativePlatform() && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(r => r.unregister());
  });
  if (window.caches) {
    caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
