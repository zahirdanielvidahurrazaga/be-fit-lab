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
- **Cafetería "Coffee Lab & Smoothies"** estilo Uber Eats: personalización, carrito, regalo, programar, pago Stripe/efectivo, tracking premium con animación de taza, historial con realtime, rol barista, upsell con imágenes recortadas.
- **Eventos**: flyer, cupos (trigger race-safe), inscripción, pago opcional, galería compartida (solo admin sube), countdown estilo cumpleaños, push.
- **Admin**: dashboard financiero con sub-pestañas y filtro por fechas, clientas/staff, nutrición (planes por persona, recetas, galería, calendario mensual), reportes, insignias dinámicas.
- **Nutrición**, **Cumpleaños** (calendario mensual), **Insignias** (reglas: TOTAL_CLASSES, DIFFERENT_COACHES, WEEKLY_CLASSES, PROFILE_COMPLETE, MANUAL).
- Info estudio: Blvrd 22 Sur 5123, Villa Carmel, 72567 Puebla. Tel/WhatsApp +52 221 266 4253. IG @befit.lab. Mapa embebido (requiere `frame-src` de google/openstreetmap en el CSP de `index.html`).

## Estado actual (última sesión: 2026-06-07)
- **Mudanza del proyecto**: Por problemas de sincronización con OneDrive, el proyecto se movió de manera definitiva a `C:\proyectos\be-fit-lab`.
- **Icono de Android perfecto**: Se resolvió el problema del recorte del logo en Android Adaptive Icons. Usando un durazno aislado provisto por el usuario, se creó el script `pad_icon.cjs` para centrar el icono a 600x600 dentro de un lienzo de 1024x1024, evitando que la máscara circular/redondeada de Android corte los bordes.
- **Preparación para Google Play Console**: 
  - Se actualizó el `versionCode` a 5 y `versionName` a 2.1.2 en `build.gradle` para permitir el upload del App Bundle (.aab).
  - Se configuró la **Prueba Cerrada (Closed Testing)** y se redactó la declaración de privacidad de datos de Salud (para `READ_BODY_FAT` y `READ_WEIGHT` mediante Health Connect).
  - Se aclaró que los cobros en modo prueba (Test Mode de Stripe) y los enlaces profundos vacíos son correctos para esta fase de revisión.
- ✅ **Pago en efectivo funcional**: Se creó y desplegó la edge function `cash-cafe-checkout` que inserta pedidos directamente en `cafe_orders` con status `paid` y envía notificación push al admin/barista.
- ✅ **Realtime en historial de pedidos**: Se habilitó `supabase_realtime` para la tabla `cafe_orders` y se añadió suscripción WebSocket en `CafeOrderHistory.jsx`. Cuando el barista cambia el estado de un pedido, el cliente lo ve reflejado al instante sin recargar.
- ✅ **Rediseño de "Mis Pedidos"**: Tipografía premium con `var(--font-body)` y `var(--font-display)`, tarjetas con mejor espaciado, bordes suaves, sombras refinadas y animaciones al tocar. Al hacer clic en un pedido se abre el modal de tracking (taza animada con stepper de progreso).
- ✅ **Upsell con imágenes**: Las tarjetas de "¿Algo más?" en el carrito ahora muestran la imagen del producto recortada a la mitad, con `mix-blend-mode: multiply` para eliminar fondos blancos sin necesidad de PNGs transparentes.
- ✅ **Método de pago simplificado**: Se dejó únicamente "Pago con tarjeta" y "Efectivo al recoger" como opciones claras en el carrito.
- ✅ **Deploy edge functions**: `cash-cafe-checkout` y `send-push` desplegadas exitosamente al proyecto `fifaowaiokauhuqklzwe` de Supabase.
- ✅ **Commit, push y sync**: Todos los cambios pusheados a `main`. Build de producción + `npx cap sync` para iOS y Android completados.

## Pendientes / próximos pasos
- [ ] **Probar en dispositivo real** el wizard de fotos (cámara en vivo + siluetas). En Simulador cae a galería.
- [ ] Vista coach/admin para revisar fotos de progreso de clientas (RLS ya lo permite).
- [ ] Push recordatorio a las 6 semanas para nueva sesión de fotos.
- [ ] Pasar Stripe a claves **LIVE** en Supabase y `.env` antes del pase a Producción final.
- [ ] Rebuild **AAB de Android** con claves LIVE para Producción.
- [ ] Confirmar modelo exacto de báscula para métricas extra y que la unidad de peso sea kg.
- [ ] Probar dark mode en dispositivos reales (iOS + Android).

## Notas / gotchas
- En web, abrir pago con `window.location.href` (no `window.open`, lo bloquea el popup blocker).
- Cerrar sheets: permitir tap fuera + botón X; respetar safe-area (`env(safe-area-inset-*)`).
- `getUserMedia` necesita permiso de cámara (ya configurado para avatares: NSCameraUsageDescription en iOS, CAMERA en Android).
- **Realtime**: Para que funcione, la tabla debe estar en la publicación `supabase_realtime`. Script en `scripts/enable_realtime.sql`.
- **mix-blend-mode: multiply**: Truco CSS para ocultar fondos blancos en imágenes JPG sin necesidad de convertirlas a PNG con transparencia.
- **Token Supabase**: Para desplegar edge functions usar `$env:SUPABASE_ACCESS_TOKEN="sbp_..." ; npx supabase functions deploy <nombre>`.

