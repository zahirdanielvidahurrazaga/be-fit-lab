// Transiciones del SITIO (solo web; la app nativa tiene las suyas).
//
// 1) Pantalla de entrada: index.html pinta #arranque antes de que cargue JS
//    (durazno + nombre + rayita). Aquí se espera a que la página esté lista y
//    se cierra en círculo hacia el durazno, mostrando la página. 1 vez por sesión.
// 2) Cambio de pantalla: al tocar un enlace interno del sitio, un círculo con los
//    colores del estudio se abre desde donde tocaste (como al salir de la
//    cafetería), aparece el durazno, cambia la pantalla y se desvanece.
//    Para botones que navegan por código: irConTransicion('/ruta', evento).
// 3) Atrás/adelante del navegador: fundido suave (no hay punto de origen).
import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { useLocation, useNavigate } from 'react-router-dom';
import { ESTUDIO } from '../config/estudio';

// Pantallas del sitio público donde aplican las transiciones (origen).
const PUBLICA = /^\/(|login|registro|planes|terminos|privacidad|nueva-contrasena|evento\/.*)$/;
const FONDO = '#F6EFE8';
const CURVA = 'cubic-bezier(0.76, 0, 0.24, 1)';
const reducir = () => window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

/** Navega con la transición en círculo desde donde se tocó (para botones con navigate). */
export function irConTransicion(destino, evento, state) {
  const r = evento?.currentTarget?.getBoundingClientRect?.();
  window.dispatchEvent(new CustomEvent('befit:ir', {
    detail: { destino, state, x: r ? r.left + r.width / 2 : evento?.clientX, y: r ? r.top + r.height / 2 : evento?.clientY },
  }));
}

function crearCapa() {
  const capa = document.createElement('div');
  capa.setAttribute('aria-hidden', 'true');
  capa.style.cssText = `position:fixed;inset:0;z-index:8000;background:${FONDO};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;pointer-events:none;`;
  const logo = document.createElement('img');
  logo.src = '/favicon_peach.png'; logo.width = 64; logo.height = 64; logo.alt = '';
  const nombre = document.createElement('div');
  nombre.textContent = (ESTUDIO.nombre || '').toUpperCase();
  nombre.style.cssText = 'font-family:Inter,system-ui,sans-serif;font-weight:700;font-size:12px;letter-spacing:0.32em;color:#5E5343;';
  capa.append(logo, nombre);
  document.body.appendChild(capa);
  return { capa, logo, nombre };
}

/** Espera a que la pantalla nueva ya esté pintada (las páginas cargan en diferido). */
function esperarPantalla(maxMs = 2500) {
  return new Promise((res) => {
    const t0 = performance.now();
    const revisa = () => {
      const cargando = document.querySelector('#root .loader');
      if ((!cargando && document.querySelector('#root')?.childElementCount) || performance.now() - t0 > maxMs) {
        requestAnimationFrame(() => requestAnimationFrame(res));
      } else setTimeout(revisa, 60);
    };
    revisa();
  });
}

export default function TransicionesWeb() {
  const navigate = useNavigate();
  const location = useLocation();
  const enCurso = useRef(false);
  const rutaPrevia = useRef(location.pathname);
  const nativo = Capacitor.isNativePlatform();

  // ── 1) Salida de la pantalla de entrada ─────────────────────────────────
  useEffect(() => {
    const el = document.getElementById('arranque');
    const raiz = document.documentElement;
    if (!raiz.classList.contains('con-arranque') || !el) { el?.remove(); return; }
    try { sessionStorage.setItem('befit_entrada', '1'); } catch { /* sin storage */ }
    let vivo = true;
    const minimo = new Promise((r) => setTimeout(r, Math.max(0, 1300 - performance.now())));
    // La foto de portada lista, para no destapar una pantalla a medio cargar.
    const foto = new Promise((r) => { const i = new Image(); i.onload = i.onerror = r; i.src = window.innerWidth > 768 ? '/fotos-hero/hero-equipo-escritorio.jpg' : '/fotos-hero/hero-equipo-v2.jpg'; setTimeout(r, 2500); });
    Promise.all([minimo, foto, esperarPantalla(3000)]).then(() => {
      if (!vivo) return;
      const quitar = () => { el.remove(); raiz.classList.remove('con-arranque'); };
      if (reducir() || typeof el.animate !== 'function') { quitar(); return; }
      raiz.classList.remove('con-arranque'); // devuelve el scroll; la capa sigue encima
      el.style.display = 'flex';
      const logo = el.querySelector('.ar-logo');
      const r = logo?.getBoundingClientRect();
      const cx = r ? r.left + r.width / 2 : window.innerWidth / 2;
      const cy = r ? r.top + r.height / 2 : window.innerHeight / 2;
      const radio = Math.hypot(Math.max(cx, window.innerWidth - cx), Math.max(cy, window.innerHeight - cy));
      el.querySelector('.ar-nombre')?.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(6px)' }], { duration: 240, fill: 'forwards' });
      el.querySelector('.ar-linea')?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
      logo?.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(0.4)', opacity: 0 }], { duration: 760, easing: CURVA, fill: 'forwards' });
      const a = el.animate([{ clipPath: `circle(${radio}px at ${cx}px ${cy}px)` }, { clipPath: `circle(0px at ${cx}px ${cy}px)` }],
        { duration: 760, delay: 120, easing: CURVA, fill: 'forwards' });
      a.onfinish = () => el.remove();
      setTimeout(() => el.remove(), 1400);
    });
    return () => { vivo = false; };
  }, []);

  // ── 2) Cambio de pantalla con círculo ───────────────────────────────────
  useEffect(() => {
    // App nativa: sin animación, pero Login/Registro navegan con irConTransicion →
    // hay que atender el evento (si no, sus botones no harían nada). Codex 6-nov.
    if (nativo) {
      const alPedirNativo = (e) => {
        const { destino, state } = e.detail || {};
        if (destino) navigate(destino, state ? { state } : undefined);
      };
      window.addEventListener('befit:ir', alPedirNativo);
      return () => window.removeEventListener('befit:ir', alPedirNativo);
    }

    const animarIda = (destino, state, x, y) => {
      if (enCurso.current) return;
      if (reducir() || typeof document.body.animate !== 'function') { navigate(destino, state ? { state } : undefined); return; }
      enCurso.current = true;
      const cx = Number.isFinite(x) ? x : window.innerWidth / 2;
      const cy = Number.isFinite(y) ? y : window.innerHeight / 2;
      const radio = Math.hypot(Math.max(cx, window.innerWidth - cx), Math.max(cy, window.innerHeight - cy));
      const { capa, logo, nombre } = crearCapa();
      capa.animate([{ clipPath: `circle(0px at ${cx}px ${cy}px)` }, { clipPath: `circle(${radio}px at ${cx}px ${cy}px)` }], { duration: 560, easing: CURVA, fill: 'forwards' });
      logo.animate([{ opacity: 0, transform: 'scale(0.6)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 420, delay: 220, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', fill: 'both' });
      nombre.animate([{ opacity: 0, letterSpacing: '0.6em' }, { opacity: 1, letterSpacing: '0.32em' }], { duration: 480, delay: 300, easing: 'ease-out', fill: 'both' });
      setTimeout(async () => {
        navigate(destino, state ? { state } : undefined);
        await esperarPantalla();
        const fuera = capa.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(1.04)' }], { duration: 420, easing: 'ease-out', fill: 'forwards' });
        const fin = () => { capa.remove(); enCurso.current = false; };
        fuera.onfinish = fin;
        setTimeout(fin, 900); // por si onfinish no llega
      }, 760);
    };

    // Enlaces internos (<Link>, <a href="/...">) tocados dentro del sitio público.
    const alClic = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (!PUBLICA.test(window.location.pathname)) return;
      const a = e.target.closest?.('a[href]');
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return; // anclas en la misma página
      if (url.pathname.startsWith('/cafeteria')) return;   // la cafetería tiene su propia entrada
      e.preventDefault();
      const r = a.getBoundingClientRect();
      animarIda(url.pathname + url.search, undefined, r.left + r.width / 2, r.top + r.height / 2);
    };
    const alPedir = (e) => {
      const { destino, state, x, y } = e.detail || {};
      if (!destino) return;
      if (!PUBLICA.test(window.location.pathname) || destino.startsWith('/cafeteria')) { navigate(destino, state ? { state } : undefined); return; }
      animarIda(destino, state, x, y);
    };
    document.addEventListener('click', alClic, true);
    window.addEventListener('befit:ir', alPedir);
    return () => { document.removeEventListener('click', alClic, true); window.removeEventListener('befit:ir', alPedir); };
  }, [nativo, navigate]);

  // ── 3) Atrás/adelante (o cualquier cambio sin círculo): fundido suave ───
  useEffect(() => {
    const antes = rutaPrevia.current;
    rutaPrevia.current = location.pathname;
    if (nativo || antes === location.pathname || enCurso.current || reducir()) return;
    if (!PUBLICA.test(antes) || !PUBLICA.test(location.pathname)) return;
    const capa = document.createElement('div');
    capa.setAttribute('aria-hidden', 'true');
    capa.style.cssText = `position:fixed;inset:0;z-index:8000;background:${FONDO};pointer-events:none;`;
    document.body.appendChild(capa);
    esperarPantalla().then(() => {
      const a = capa.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, easing: 'ease-out', fill: 'forwards' });
      a.onfinish = () => capa.remove();
      setTimeout(() => capa.remove(), 800);
    });
  }, [location.pathname, nativo]);

  return null;
}
