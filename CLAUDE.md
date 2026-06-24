# Be Fit Lab — Guía del proyecto (para Claude Code)

App del estudio de pilates **Be Fit Lab** (mujeres). React + Vite + Capacitor
(iOS/Android) + Supabase. La web se autodespliega en **Cloudflare Pages** con
cada push a `main`. Repo: `github.com/zahirdanielvidahurrazaga/be-fit-lab`.

> Desarrollado por: **Zahir Daniel Vidahurrazaga Marin**.

## ⏭️ PRÓXIMA SESIÓN (retomar) — SUBIR ANDROID
**iOS ✅ 1.2.0 (build 4)** generado y listo para archivar/subir el 2026-06-22 (incluye lo de abajo). La 1.1.0(3) del 2026-06-15 ya estaba en App Store Connect.
**Pendiente (mañana 2026-06-23): AAB de Android** con TODO (lo del 2026-06-15 + sesión 2026-06-22). Repo ya bumpeado → `versionCode 8` / `versionName 2.4.0` en `android/app/build.gradle`. El `dist` ya está construido y sincronizado (`npx cap sync` hecho el 22-jun); si pasó tiempo, reconstruir.

**📋 REQUERIMIENTO PARA CLAUDE (cuando el usuario pida "subir Android" en la otra PC):**
Ejecuta TÚ (Claude) automáticamente los pasos de CLI; el usuario solo hace los de GUI que tú no puedes. No pidas permiso paso a paso, hazlos y reporta.

**→ Pasos que HACE CLAUDE (CLI):**
1. `git pull origin main` (trae el código nuevo + el `versionCode` ya bumpeado).
2. `npm install`.
3. `npm run build` (⚠️ en este entorno tarda ~14 min y el proceso vite queda colgado tras "✓ built" → mátalo con `pkill -f "vite build"`).
4. `npx cap sync android`.
5. Verifica/sube el `versionCode` en `android/app/build.gradle` si hace falta (debe ser MAYOR al último subido a Play).
6. (Si el keystore/firma están configurados en gradle) puedes generar el AAB por CLI: `cd android && ./gradlew bundleRelease` → sale en `android/app/build/outputs/bundle/release/app-release.aab`. Si la firma NO está en gradle, deja que el usuario lo genere en Android Studio.
7. `npx cap open android` para que el usuario tenga Android Studio listo.

**→ Pasos que HACE EL USUARIO (GUI, Claude no puede):**
- En Android Studio: **Build → Generate Signed Bundle / APK → Android App Bundle (.aab)** con el **keystore de release** (si no se generó por CLI).
- Subir el `.aab` a **Google Play Console** y enviar a revisión.

- ⚠️ **CAUSA #1 de "no se subían las versiones": el `versionCode` debe ser MAYOR al último ya subido a Play.** Si Play rechaza con "version code N already used", Claude le sube +1 al `versionCode` en `build.gradle`, regenera el AAB y el usuario re-sube.
- ⚠️ El **hero del landing NO aplica a nativo** (la app redirige `/`→`/welcome`).

**Opcional (smoke test):** un cobro real chico. El flujo NO cambia entre test/live (mismo código), pero confirma que `sk_live` + webhook Live **registran** el sale/pedido. Reembolsable. (Ya se probó el 2026-06-15: pedido quedó `paid` ✅.)

## ✅ Sesión 2026-06-24 (parte 2: fotos de coaches + reset password Gmail) — iOS 1.4.0(7)
- **BUG fotos de coaches no se ven en reservar clases:** la causa NO era RLS ni el emparejamiento (las 285 clases tienen `coach_id` correcto). Era que **las fotos nunca se subían**: el bucket `avatars` estaba VACÍO para todos. `uploadAvatar` usaba **`fetch(dataURL)`**, que **falla en el WebView de iOS (WKWebView)** → la subida a Storage nunca ocurría y caía a guardar base64 (que para fotos pesadas de iPhone tampoco persistía → `avatar_url` NULL). Verificado con coach de prueba: backend (Storage upload + update users) da 200/204, el fallo era 100% cliente. **Fix:** `src/lib/avatar.js` convierte el data URL a Blob **manualmente con atob (sin fetch)**; `src/pages/MiCuenta.jsx` ahora **avisa si la subida falla** (antes fingía que guardó) + botón "Guardando…". ⚠️ Las 8 coaches con `avatar_url` NULL **deben volver a subir su foto** con el build nuevo (lo perdido no se recupera; Nallely tiene base64 que se migra sola).
- **BUG recuperar contraseña desde Gmail/Google (no Chrome):** "el enlace ya expiró o no es válido". Causa: el correo usaba **`{{ .ConfirmationURL }}`** (GET de auto-verificación de un solo uso) y **Gmail pre-escanea el enlace (GET) y quema el token** antes de abrirlo. **Fix (2 partes, ya en prod la plantilla):** (1) plantilla de correo de recovery ahora usa **`{{ .SiteURL }}/nueva-contrasena?token_hash={{ .TokenHash }}&type=recovery`** (cambiada vía Management API). (2) `NuevaContrasena.jsx` lee `token_hash` de la URL y verifica con **`supabase.auth.verifyOtp({type:'recovery', token_hash})`** (POST por JS → el pre-escaneo GET ya no consume el token). Mantiene fallback `getSession()` para enlaces viejos. Verificado: generate_link → verifyOtp → sesión OK. ⚠️ La plantilla ya está cambiada en prod → hay que **desplegar la web** para que la página maneje `token_hash` (los enlaces viejos con `#access_token` siguen funcionando por el fallback).

## ✅ Sesión 2026-06-24 (mejoras/bugs de la dueña) — iOS 1.4.0(6)
Cambios de **front** (web auto-deploy con push; iOS bumpeado a **1.4.0 / build 6** para resubir). Backend ya en prod (aditivo).
- **BUG GRAVE arreglado — clases caían en el día equivocado:** al agregar varias clases seguidas a un día (p. ej. viernes) desde Admin → Clases, de la 2ª en adelante saltaban a **HOY**. Causa: tras guardar (modo single), el reset del form ponía `date: todayLocalStr()` y como en single la fecha es invisible (se hereda del día del calendario), las siguientes se guardaban en hoy. Fix en `Admin.jsx` (`handleCreateClass`): el reset ahora **conserva `selectedCalendarDay`**.
- **Feature — gestionar clases de una clienta desde Admin → Clientas:** botón **"Clases"** en cada tarjeta abre modal (`ManageClassesModal` en `AdminClientas.jsx`) con: (1) **ajustar clases disponibles** (`classes_remaining`) con −/+ y +4/+8/+12, guarda al instante (UPDATE directo, admin ya tiene RLS); ilimitado = ∞. (2) **Reservar/quitar en una clase** del horario, navegando **por día** con ◀▶ (NO lista las 285; solo días con clases). Backend: RPCs **`admin_book_class` / `admin_cancel_class`** (SECURITY DEFINER, guard `is_reception_or_admin()`, espejo de `book_class_secure`; descuentan cupo+clase, respetan ilimitado). SQL en `supabase/sql/admin_book_class.sql` (gitignored), **ya aplicado en la BD**.
- **"Sin cupos" en perfil de la clienta:** `ScheduleCalendar.jsx` ahora marca lleno con `spots <= 0` (no `=== 0`), texto **rojo "Sin cupos"**, tarjeta no clickeable; `Agenda.jsx` blinda `handleReserveClick` (cupo agotado) y `confirmReservation` avisa si la reserva falla (se llenó justo). El servidor (`book_class_secure`) sigue siendo el guard real.
- **Sidebar de admin en PC con scroll:** `.sidebar-nav` ahora hace scroll interno (`overflow-y:auto; min-height:0`) y **"Cerrar sesión" queda fijo abajo** (`flex-shrink:0`). Antes se cortaban las últimas secciones. Aplica también al sidebar de coach (estilo compartido).
- ⚠️ **Bug PREVIO detectado (no tocado):** `Agenda.jsx` `handleAddToCalendar` usa `addClassToCalendar(modalData, d)` con `d` sin definir → "Agregar a mi calendario" (nativo) crashea. Pendiente aparte.
- BD: cuentas de prueba `admin.test@befitlab.app` / `clienta.test@befitlab.app` (usadas para probar en local) **borradas** al cerrar la sesión.

## ✅ Sesión 2026-06-23 (Recepción: pestañas Clases + Ventas) — pendiente rebuild/redeploy
**Recepción ahora hace mostrador completo, no solo el lector QR.** El rol `RECEPCION`
ya puede **agregar/editar/borrar clases** e **inscribir clientas + cobrar membresía**,
exactamente con la misma UI que ADMIN.
- **Front (sin duplicar código):** `Admin.jsx` acepta un prop **`recepcion`**. En ese
  modo rebranda el header a "Be Fit Lab · RECEPCIÓN" y **oculta** todo lo que no es
  mostrador (Reportes, Clientas, Insignias, Comida, Cafetería, Disciplinas, Eventos,
  Enviar aviso, y el menú ⋯ de categorías/plantillas en Clases). Quedan visibles las 3
  pestañas del mostrador: **Mostrador (QR) · Clases · Ventas** (la bottom-nav móvil ya
  era justo esas 3). `Recepcion.jsx` ahora solo hace `return <Admin recepcion />`.
- **Backend desplegado y verificado:**
  - Edge function **`admin-create-client`** ahora acepta **ADMIN o RECEPCION** (antes solo ADMIN). Re-deployada.
  - **RLS aditivo** (`supabase/sql/recepcion_ventas_clases_rls.sql`, ya aplicado vía Management API): `classes` INSERT/UPDATE/DELETE, `users` UPDATE (con guard `role <> 'ADMIN'` para que recepción NO pueda crear admins) y `sales` INSERT — todo con `is_reception_or_admin()`. El cobro (`activatePlan`) hace UPDATE en `users` y el registro de venta INSERT en `sales`; por eso ambos permisos.
- **Por qué funciona:** `applySessionUser()` ya llama `fetchAllUsers()`/`fetchCoaches()` para cualquier sesión (incl. RECEPCION) y recepción ya tenía SELECT en `users` → los selectores de "Alumna" y "Coach" se llenan.
- ⚠️ **PENDIENTE:** es cambio de **front** → exige **push a main** (auto-deploy web Cloudflare) y, para nativo, **rebuild + resubir iOS/Android**. El backend ya está en producción (es aditivo, no afecta a ADMIN).

### Fase A — Membresías editables desde admin (planes data-driven + Stripe) — backend YA en prod
**La dueña ya puede editar planes desde admin y se refleja en sitio + app + cobro, sin rebuild** (excepto este último rebuild para que el front nuevo llegue a nativo).
- **Tabla nueva `membership_plans`** (`supabase/sql/membership_plans.sql`, aplicada + verificada): fuente de verdad de las membresías. RLS: **SELECT público** (lo lee el landing anónimo — probado), **write solo ADMIN** (probado que anon NO puede). Sembrada con los 5 planes idénticos a los de antes. `name` = clave canónica (== `users.membership_plan` == metadata de Stripe), **no editable** tras crear. `price_mxn` en pesos; centavos se derivan.
- **`src/lib/plans.js` = REGISTRO VIVO:** `DEFAULT_PLANS` (fallback = valores actuales) + `export let PLANS/PLAN_BY_NAME` (live bindings) + `setPlans()`/`dbRowToPlan()`. `AuthContext.fetchPlans()` (corre al arrancar, público) hidrata el registro y expone estado `plans` (activos, orden) + `allPlans` (incl. archivados) + `createPlan/updatePlan/deletePlan`. **Si la BD falla, quedan los defaults → el sitio nunca queda vacío.** Por eso los call sites de los helpers de gating (`hasNutritionAccess`, etc.) **no cambiaron**.
- **Consumidores de listas** apuntan a `useAuth().plans` (re-render al cargar): `PricingCarousel`, dropdowns de `Admin` (inscribir/cobro), `AdminClientas`.
- **Stripe (cobro correcto):** `stripe-checkout` (web) y `stripe-membership-intent` (nativo) **leen el plan de la BD** (service role) en vez del map hardcodeado. **Re-deployadas + smoke-test** (plan inexistente → 400 sin tocar Stripe). Como los Prices de Stripe son inmutables, `resolvePrice()` usa **lookup_key versionada por monto** (`base_<centavos>`): precio sin cambios → reusa el Price existente (no duplica en LIVE); **precio nuevo → Price nuevo → cobra correcto a clientas nuevas; las ya suscritas conservan su precio** (no se migran). El **webhook/notify NO se tocaron** (leen `plan_title`/`class_count` de la metadata de la suscripción → renovaciones mantienen precio y clases originales).
- **UI admin:** nuevo componente **`AdminPlanes.jsx`** = pestaña **"Membresías"** (CRUD completo: precio, clases, ilimitado, nutrición, plan alimenticio, beneficios, subtítulo, orden, visible/oculto). "Eliminar" = **archiva** (active=false) si alguna clienta lo tiene, o borra real si nadie. Aviso visible de impacto en cobro/sitio. **No aparece en modo recepción.**
- ⏭️ **PENDIENTE de probar (smoke test real):** un cobro chico de membresía en LIVE (web o app) para confirmar que el flujo DB→Stripe cobra el monto correcto. No lo hice para no ensuciar Stripe LIVE con un cliente de prueba.
- ⏭️ **Fase B (no hecha):** textos del landing editables (mini-CMS `site_content`). Quedó fuera de esta sesión.

## ✅ Sesión 2026-06-22 (mantenimiento post-entrega + 2 features) — en iOS 1.2.0(4) / Android 2.4.0(8)
**Bugs corregidos:**
- **Inscribir clienta mostraba "Edge Function returned a non-2xx status code":** el front no leía el motivo real del 400. Ahora `Admin.jsx` (`handleInscribir`) lee `error.context.json()` y muestra el motivo ("El correo ya está registrado…", etc.). La causa del reporte original era **correo duplicado**; la función `admin-create-client` desplegada funciona bien (crea cuenta confirmada que SÍ entra). NOTA: un cliente sin plan se autentica pero el `ProtectedRoute` lo rebota de `/portal` (eso NO se cambió, decisión del dueño).
- **Parpadeo al abrir por deep link (cuenta nueva → confirmar correo → pantalla de pago "actualizándose"):** `AuthContext` rehacía todo en cada evento de auth. Ahora `applySessionUser()` mantiene la referencia de `user` estable por id y solo recarga datos pesados en un inicio de sesión real (no en TOKEN_REFRESHED/re-emisiones). Refs nuevos: `loadedAuthUserIdRef`.
- **Botón "Volver" muerto en la pantalla de membresía (`Planes.jsx`):** hacía `navigate(-1)` sin historial. Ahora si hay sesión **cierra sesión y va a `/welcome`** (decisión del dueño); si no, va a `/welcome`.
- **Reset de contraseña → pantalla en blanco en Chrome (no Safari):** el correo llevaba el deep link `befitlab://` que solo Safari abre. Ahora `recoveryRedirect()` (`src/lib/authRedirect.js`) SIEMPRE manda a `https://befitlab.app/nueva-contrasena` (web, funciona en cualquier navegador). `NuevaContrasena.jsx` ya no auto-entra: muestra cierre claro + botón "Iniciar sesión". El **registro sí sigue usando `befitlab://`** (queremos que la confirmación abra la app). OJO: el reset desde la app vieja seguirá mandando `befitlab://` hasta que el usuario actualice a 1.2.0.

**Features nuevas:**
- **Eliminar clienta/usuaria:** nueva edge function **`admin-delete-client`** (DEPLOYADA + verificada): valida ADMIN, **bloquea auto-borrado**, borra perfil (cascada a reservas/fotos/métricas/notifs/eventos/device_tokens/meal_plan; **SET NULL** en ventas/pedidos → conserva historial) y la cuenta Auth + storage. UI: botón 🗑️ "Eliminar" con doble confirmación en cada tarjeta de `AdminClientas.jsx` (no aparece sobre tu propia cuenta).
- **Los 2 planes más económicos sin Nutrición** (Principiante $750 e Inicial $850). `src/lib/plans.js`: flag `nutrition` (Básico/Fit/Premium) + helper `hasNutritionAccess()`; se quitó "+100 ideas de recetas" de los 2 económicos (las tarjetas del sitio salen de aquí vía `PricingCarousel`). Gate de ruta en `App.jsx` (`requireNutrition` → redirige a `/portal`), nav "Comida" oculto en `Portal`/`Evolucion`/`Agenda`, y pasos de recetario filtrados en `AppTour`. (La sección general "Beneficios de tu Membresía" del landing aún menciona recetas — es general, se dejó.)

## ✅ Sesión 2026-06-15 (Stripe LIVE + Recepción + correo de marca + dominio)
**Stripe LIVE — HECHO:**
- Supabase secrets: `STRIPE_SECRET_KEY=sk_live...`, `STRIPE_WEBHOOK_SECRET=whsec...` (se leen en runtime). El **webhook Live ya existía** (`we_1TcgypARaQ2rSJDtR2DkMvUa`, eventos `checkout.session.completed` + `invoice.payment_succeeded` + `customer.subscription.deleted` = exactamente los que maneja el handler; `payment_intent.succeeded` NO hace falta porque el pago nativo de cafetería/eventos se confirma con `stripe-cafe-verify`/`stripe-event-notify`).
- `.env`: `VITE_STRIPE_PUBLISHABLE_KEY=pk_live...` (se hornea en build).
- `GooglePayIsTesting:false` en `Cafeteria.jsx` y `Planes.jsx` (producción Android).
- **Web ya cobra en LIVE sin tocar Cloudflare**: usa Checkout redirigido server-side → lo decide `STRIPE_SECRET_KEY`. La publishable NO se usa en web; solo en nativo (PaymentSheet) → por eso **el nativo SÍ exige rebuild**.

**Rol RECEPCIÓN — NUEVO:**
- Rol `RECEPCION` con página `/recepcion` (solo lector QR), para teléfono fijo en recepción. Asignable desde `AdminClientas` (y redirect por rol en `App.jsx`).
- Componente compartido **`src/components/QrCheckIn.jsx`** (lo usan Admin "Mostrador QR" y Recepcion): tarjeta de la alumna **persistente con foto de perfil**, y **lista de asistencia del día en localStorage por fecha** (no se borra al cambiar de pestaña/recargar). `checkInClient` ahora devuelve `avatar`.
- **Ventana de check-in por clase**: banner con **contador a la derecha**. Abre 15 min antes y cierra 10 min después de la hora; fuera de la ventana el escáner **rechaza** el QR (standby). Calcula la "próxima clase" desde `globalClasses`.
- **RLS**: función `is_reception_or_admin()` + políticas SELECT `users`, SELECT/UPDATE `reservations`. SQL en `supabase/sql/recepcion_rls.sql` (⚠️ `*.sql` está gitignored — **ya aplicado en la BD**).

**Verificación de correo + recuperación de contraseña — HECHO (web y nativo):**
- Verificación ACTIVADA (`mailer_autoconfirm=false`).
- `signUp` con `emailRedirectTo`; pantalla **"Revisa tu correo"** + reenviar. Con verificación activa el signUp NO deja sesión → cumpleaños/estatura van en `user_metadata` y se copian al perfil en el **primer login** (backfill en `AuthContext.fetchUserData`). Plan comprado antes de registrarse: localStorage `befit_pending_plan`, se aplica al confirmar.
- Reset → nueva pantalla **`/nueva-contrasena`** (`updateUser`).
- Deep links nativos `befitlab://auth-callback?flow=signup|recovery` procesados por **`AuthDeepLinkHandler`** en `App.jsx`. Helper `src/lib/authRedirect.js`.

**Dominio + correo profesional — HECHO:**
- **`befitlab.app`** comprado en Cloudflare Registrar; web conectada como custom domain de Pages (**https://befitlab.app**, SSL OK). `be-fit-lab.pages.dev` sigue activo.
- Supabase `site_url=https://befitlab.app`; redirect allow-list con `befitlab://auth-callback` + dominios web.
- **Resend** SMTP propio: `befitlab.app` verificado (DKIM/SPF/DMARC vía Cloudflare). Supabase SMTP = `smtp.resend.com:465`, user `resend`, remitente **`hola@befitlab.app`** ("Be Fit Lab"). Límite 2/h → **30/h**. Plantillas de confirmación/recuperación con la marca (header degradado naranja→rosa). Prueba llegó a **inbox**.
- ⚠️ La config de **Supabase Auth** se cambia por **Management API**: `PATCH https://api.supabase.com/v1/projects/fifaowaiokauhuqklzwe/config/auth` (token `sbp_` guardado en el keychain del CLI de Supabase). Las **plantillas de correo** (confirmación, recuperación, cambio de correo) están personalizadas con la marca por ahí mismo (header degradado naranja→rosa). ⚠️ La de **cambio de correo está "dormida"**: la app NO expone cambiar correo (`updateUser` solo se usa para contraseña), así que esa plantilla no se dispara salvo que se agregue la función o se cambie un correo desde el dashboard.

**Entrega — HECHO:**
- **iOS 1.1.0 (build 3)** subida a App Store Connect (2026-06-15).
- **Android pendiente** (otra PC) — ver "PRÓXIMA SESIÓN" arriba. Repo ya con `versionCode 7`/`versionName 2.3.0`.
- **BD limpiada para entrega otra vez**: se borraron las 4 cuentas de prueba de hoy (admin/cliente/coach@prueba.com + gmail) y su transaccional (clases, reserva, pedido de café, notifs) → **0 cuentas**. Catálogo intacto (disciplines 25, cafe_products 14, badges 8, events 4, recipes 2). La dueña crea su cuenta y se le pone `ADMIN` a mano.
- **Fix Duplicar clase**: la copia arranca con cupo 10 (no arrastra lugares descontados).

## ✅ Limpieza de entrega (2026-06-13)
Base de datos del proyecto `fifaowaiokauhuqklzwe` limpiada para entrega:
- **0 cuentas** (se borraron las 35 de `auth.users` + perfiles). La **dueña creará su cuenta** y se le pone rol `ADMIN` a mano desde Supabase (tabla `users.role`).
- Borrado: todo lo transaccional/agenda (cafe_orders, reservations, classes, sales, notification_logs, body_measurements, progress_photos, nutrition_plans/meal_plan_days, event_registrations, device_tokens, etc.).
- **Conservado (catálogo/contenido):** `disciplines` (25), cafetería (`cafe_products`/`option_groups`/`options`), `badges_config` (8), `class_categories`/`class_templates`, `events` (4), `recipes`/`ingredients`.
- **Storage:** `progress-photos` vacío (cascada al borrar usuarios) y el único `.pkpass` de prueba borrado; se conservaron las imágenes de marca de `wallet-passes` (`befit-hero*`, `befit-logo.png`, `befit-mark.png`) y los buckets `cafe-products`/`disciplines`/`Video`. ⚠️ NO usar "Empty bucket" en `wallet-passes`: esas imágenes las necesita la edge function `generate-wallet-pass` para el arte del pase.

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
`CLIENT` (default), `COACH` (/coach), `BARISTA` (/barista), `RECEPCION` (/recepcion · solo lector QR), `ADMIN` (/admin). El admin asigna roles y da de baja clientas desde `AdminClientas`. El redirect por rol está en el `ProtectedRoute` de `App.jsx`.

## Notificaciones push (arquitectura clave)
**Para mandar un push: solo inserta una fila en `notification_logs`.** Un trigger de
DB (`pg_net`) llama a la edge function **`push-deliver`** que entrega vía APNs/FCM.
- `send-push` y `notify-event` ahora **solo insertan logs** (no entregan).
- APNs se envía en paralelo a **producción + sandbox** por confiabilidad.
- ⚠️ El **Simulador de iOS NO recibe push**. Builds de Xcode/debug usan **sandbox APNs** (a veces lento/intermitente). Builds de App Store/TestFlight usan **producción** (confiable).
- Notificaciones vivas: compra/regalo/pedido nuevo/pedido listo de cafetería, insignia, aviso admin, evento, recordatorios locales.

## Pagos Stripe
Funciones por dominio: `stripe-cafe-*` (cafetería), `stripe-event-*` (eventos), `stripe-checkout` (membresías) + `stripe-webhook`. El webhook clasifica por `type` (cafeteria/membresia/event). `admin-analytics` clasifica cargos para el dashboard financiero. Web deriva `user_id` del JWT para tracking/historial. **Claves Stripe en LIVE** (2026-06-15). Web cobra en LIVE vía Checkout server-side; nativo usa la `pk_live` horneada en el build (exige rebuild para producción).

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

## Estado actual (última sesión: 2026-06-11)
- ✅ **Hero del landing nuevo** (foto del equipo). Solo web: en nativo `App.jsx` redirige `/`→`/welcome`, así que el hero NO se ve en la app (es normal). Imagen extendida verticalmente (techo/piso generados con PIL, relación 0.39) en `public/fotos-hero/hero-equipo-v2.jpg` → un solo `cover` cubre cualquier pantalla sin cortar a nadie. Móvil anclado `center bottom` (encuadre consistente pese a alturas/barra del navegador), desktop `center 53%`.
- ✅ **Báscula 100% por Bluetooth**: `BasculaBLE.jsx` auto-detecta y conecta sola (se quitó la lista de dispositivos; solo "Buscando… súbete a la báscula"). En `Evolucion.jsx` se quitaron los botones "o importar desde Apple Salud" y "Sincronizar" (Apple Health para composición). La actividad (pasos/cal/FC de Apple Health) se mantiene.
- ✅ **iOS 1.0.3 (build 2) SUBIDA** a App Store/TestFlight (archivada y enviada por el usuario el 11-jun). Incluye imágenes nuevas de la app + báscula BLE.
- ⏳ **PENDIENTE — Android (OTRA PC):** Android Studio y la generación/subida del AAB se hacen en la otra PC. Falta empaquetar y subir a Google Play la versión con estos cambios (báscula 100% BLE + imágenes/cafetería/disciplinas). Flujo: `npm run build` → `npx cap copy android` (o `sync`) → Android Studio → bump `versionCode`/`versionName` en `build.gradle` → generar AAB. El **hero del landing NO aplica a nativo** (la app no muestra el landing).
- ✅ **Fix subida de fotos en Admin → Disciplinas (y cafetería)**: el bucket público dejaba LEER pero no SUBIR porque nunca se crearon las políticas de `storage.objects`. Nuevo script idempotente `supabase/storage_policies.sql` crea los buckets `disciplines` y `cafe-products` (públicos) + políticas RLS: lectura pública, escribir/actualizar/borrar solo `role='ADMIN'`. Corrido en Supabase, subida confirmada OK.
- Los `alert` de subida en `AdminDisciplinas.jsx` y `AdminCafeteria.jsx` ahora muestran el motivo real del error (antes era mudo) + `console.error`.

## Estado anterior (sesión: 2026-06-07)
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
- [x] ~~Pasar Stripe a claves LIVE~~ — HECHO 2026-06-15 (ver sección de arriba).
- [ ] **Rebuild + resubir iOS y AAB de Android** con todo lo del 2026-06-15 (Stripe LIVE, rol Recepción, deep links de auth, dominio befitlab.app).
- [ ] (Opcional) Smoke test de un cobro real chico y confirmar registro en `cafe_orders`.
- [ ] Confirmar modelo exacto de báscula para métricas extra y que la unidad de peso sea kg.
- [ ] Probar dark mode en dispositivos reales (iOS + Android).

## Notas / gotchas
- En web, abrir pago con `window.location.href` (no `window.open`, lo bloquea el popup blocker).
- Cerrar sheets: permitir tap fuera + botón X; respetar safe-area (`env(safe-area-inset-*)`).
- `getUserMedia` necesita permiso de cámara (ya configurado para avatares: NSCameraUsageDescription en iOS, CAMERA en Android).
- **Realtime**: Para que funcione, la tabla debe estar en la publicación `supabase_realtime`. Script en `scripts/enable_realtime.sql`.
- **mix-blend-mode: multiply**: Truco CSS para ocultar fondos blancos en imágenes JPG sin necesidad de convertirlas a PNG con transparencia.
- **Token Supabase**: Para desplegar edge functions usar `$env:SUPABASE_ACCESS_TOKEN="sbp_..." ; npx supabase functions deploy <nombre>`.

