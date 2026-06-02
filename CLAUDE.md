# Be Fit Lab — Guía del proyecto (para Claude Code)

App del estudio de pilates **Be Fit Lab** (mujeres). React + Vite + Capacitor
(iOS/Android) + Supabase. La web se autodespliega en **Cloudflare Pages** con
cada push a `main`. Repo: `github.com/zahirdanielvidahurrazaga/be-fit-lab`.

> Desarrollado por: **Zahir Daniel Vidahurrazaga Marin**.

## Stack
- **Front:** React 18 + Vite + React Router. Animaciones con **framer-motion** (+ gsap en landing).
- **Nativo:** Capacitor (iOS + Android). Plugins: camera, push-notifications, local-notifications, preferences, app, browser, calendar, `@capacitor-community/stripe`, `@capgo/capacitor-health`.
- **Backend:** Supabase (Postgres + RLS + Storage + Edge Functions en Deno + Realtime + `pg_net`).
- **Pagos:** Stripe (PaymentSheet nativo con Apple/Google Pay + Checkout web + webhook).
- **Salud/báscula:** HealthKit (iOS) / Health Connect (Android) vía `@capgo/capacitor-health`. La báscula **VeSync** escribe en Salud y la app lee peso + % grasa (model-agnostic, sin Bluetooth directo).

## Comandos
```bash
npm install
npm run dev          # desarrollo web
npm run build        # build de producción (dist/)
npx cap sync         # copia web + plugins a iOS/Android (correr tras cada build)
npx cap open ios     # abre Xcode
npx cap open android # abre Android Studio
```
**Flujo de despliegue:** `git push origin main` → Cloudflare despliega la web.
Para nativo: `npm run build && npx cap sync` y luego build desde Xcode/Android Studio.
Mensajes de commit terminan con: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

## Estética / diseño
- **Liquid glass**: vars CSS `--glass-bg` / `--glass-border` (claro y oscuro) en `src/index.css`. `backdrop-filter: blur(20px) saturate(180%)`.
- Color de marca **primary `#FF914D`** (naranja durazno). Pills activas = degradado `#FF914D → #E68245`.
- Tipografías: `--font-display` (títulos) y `--font-body`. Frases aesthetic con `Caveat`.
- Sub-pestañas tipo pill glass; tarjetas con `var(--app-surface-solid)` y `var(--card-shadow)`.

## Estructura
- `src/pages/` — Portal (perfil), Evolucion (metas/progreso), Agenda (clases), Nutricion, Cafeteria, Eventos, Cumpleanos, Admin, Coach, Barista, Login/Register/Welcome, Landing, etc.
- `src/components/` — Admin* (paneles del dashboard), Cafe* (cafetería), ProgressPhotos, NotificationSheet, ScheduleCalendar, etc.
- `src/context/AuthContext.jsx` — sesión, `classesRemaining`, `avatarUrl`, `customBadges`, `badgeConfigs`, `profileName`. Maneja persistencia de sesión nativa y el flag `befit_payment_return` para no cerrar sesión al volver de Stripe.
- `src/hooks/useHealth.js` — permisos + lectura de pasos/calorías/FC y `readBodyComposition()` (peso + % grasa de la báscula).
- `supabase/functions/` — edge functions (ver abajo).

## Roles
`cliente` (default), `coach` (/coach), `barista` (/barista), `admin` (/admin). El admin asigna roles y da de baja clientas desde `AdminClientas`.

## Notificaciones push (arquitectura clave)
**Para mandar un push: solo inserta una fila en `notification_logs`.** Un trigger de
DB (`pg_net`) llama a la edge function **`push-deliver`** que entrega vía APNs/FCM.
- `send-push` y `notify-event` ahora **solo insertan logs** (no entregan).
- APNs se envía en paralelo a **producción + sandbox** por confiabilidad.
- ⚠️ El **Simulador de iOS NO recibe push**. Builds de Xcode/debug usan **sandbox APNs** (a veces lento/intermitente). Builds de App Store/TestFlight usan **producción** (confiable).
- Notificaciones vivas: compra/regalo/pedido nuevo/pedido listo de cafetería, insignia, aviso admin, evento, recordatorios locales.

## Pagos Stripe
Funciones por dominio: `stripe-cafe-*` (cafetería), `stripe-event-*` (eventos), `stripe-checkout` (membresías) + `stripe-webhook`. El webhook clasifica por `type` (cafeteria/membresia/event). `admin-analytics` clasifica cargos para el dashboard financiero. Web deriva `user_id` del JWT para tracking/historial. **Claves Stripe siguen en TEST** (pendiente pasar a LIVE).

## Evolución → Fotos de progreso (lo más reciente)
`src/components/ProgressPhotos.jsx` + sub-pestañas en `src/pages/Evolucion.jsx`
(**Resumen · Fotos · Insignias**).
- **Wizard paso a paso** (`CaptureWizard`): 3 fotos en secuencia estricta
  **1. Vista Frontal · 2. Perfil Izquierdo · 3. Perfil Derecho**. No avanza sin foto del paso. Barra de progreso + "Paso X de 3".
- **Cámara en vivo** (`getUserMedia`, frontal espejada) + fallback "Subir desde galería". Botón **"Capturar foto"** (sin temporizador, se quitó a pedido).
- **Silueta guía** (`PoseGuide`, SVG animado que "respira") superpuesta a la cámara, una pose por ángulo (perfil derecho = espejo del izquierdo). Punto de extensión marcado con comentario por si se cambia a Lottie/siluetas propias.
- **Review final**: las 3 fotos juntas + "Guardar mi sesión de fotos".
- Almacenamiento: bucket privado **`progress-photos`** (RLS + signed URLs 1h). Tabla **`progress_photos`** reutiliza columnas `front_path` (frente) / `side_path` (perfil izq) / `back_path` (perfil der) → **sin migración**. Cadencia recomendada: cada **6 semanas**.
- Display: `FlipCard` con frase motivacional al frente y la foto al voltear (privacidad).

## Báscula VeSync (composición corporal)
Tabla `body_measurements` (weight_kg, body_fat_pct, etc., `source='vesync'`). Botón
"Sincronizar con mi báscula" en Evolución → Resumen lee de Salud. En Android el
manifest ya habilita `READ_WEIGHT` + `READ_BODY_FAT`.

## Otras features hechas
- **Cafetería "Coffee Lab & Smoothies"** estilo Uber Eats: personalización, carrito, regalo, programar, pago Stripe/Apple Pay, tracking premium, historial, rol barista.
- **Eventos**: flyer, cupos (trigger race-safe), inscripción, pago opcional, galería compartida (solo admin sube), countdown estilo cumpleaños, push.
- **Admin**: dashboard financiero con sub-pestañas y filtro por fechas, clientas/staff, nutrición (planes por persona, recetas, galería, calendario mensual), reportes, insignias dinámicas.
- **Nutrición**, **Cumpleaños** (calendario mensual), **Insignias** (reglas: TOTAL_CLASSES, DIFFERENT_COACHES, WEEKLY_CLASSES, PROFILE_COMPLETE, MANUAL).
- Info estudio: Blvrd 22 Sur 5123, Villa Carmel, 72567 Puebla. Tel/WhatsApp +52 221 266 4253. IG @befit.lab. Mapa embebido (requiere `frame-src` de google/openstreetmap en el CSP de `index.html`).

## Pendientes / próximos pasos
- [ ] **Probar en dispositivo real** el wizard de fotos (cámara en vivo + siluetas). En Simulador cae a galería.
- [ ] Vista coach/admin para revisar fotos de progreso de clientas (RLS ya lo permite).
- [x] Comparador lado a lado de fotos entre sesiones (`CompareModal` en ProgressPhotos.jsx). ✅
- [ ] Push recordatorio a las 6 semanas para nueva sesión de fotos.
- [ ] Pasar Stripe a claves **LIVE**.
- [ ] Rebuild **AAB de Android** (en la PC con el keystore).
- [ ] Confirmar modelo exacto de báscula para métricas extra y que la unidad de peso sea kg.

## Notas / gotchas
- En web, abrir pago con `window.location.href` (no `window.open`, lo bloquea el popup blocker).
- Cerrar sheets: permitir tap fuera + botón X; respetar safe-area (`env(safe-area-inset-*)`).
- `getUserMedia` necesita permiso de cámara (ya configurado para avatares: NSCameraUsageDescription en iOS, CAMERA en Android).
