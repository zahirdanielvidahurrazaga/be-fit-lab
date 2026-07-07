# Be Fit Lab — Guía del proyecto (para Claude Code)

App del estudio de pilates **Be Fit Lab** (mujeres). React + Vite + Capacitor
(iOS/Android) + Supabase. La web se autodespliega en **Cloudflare Pages** con
cada push a `main`. Repo: `github.com/zahirdanielvidahurrazaga/be-fit-lab`.

> Desarrollado por: **Zahir Daniel Vidahurrazaga Marin**.

## ⏭️ PRÓXIMA SESIÓN (retomar) — SUBIR ANDROID

> **ESTADO 2026-07-07:** 4 mejoras pedidas por las dueñas, **todo front → web ya desplegada** (push a `main`). **Nativo (iOS/Android) NO incluye esto aún** — requiere rebuild. Ver "Sesión 2026-07-07" abajo.
> **ESTADO 2026-07-06:** iOS preparado a **1.6.2 (build 16)** con el **fix de fotos de coaches** (ver "Sesión 2026-07-06" abajo). `npm run build` + `npx cap sync ios` hechos y **Xcode abierto** → solo falta que el usuario haga Archive → Distribute → Upload. Web ya desplegada con el fix (commit `8fd2523`). Android sigue en `versionCode 10` / `2.4.2` (otra PC).
> **ESTADO 2026-07-02 (previo):** iOS bumpeado a **1.6.0 (build 14)** con el fix del **lector QR robusto** (ver "Sesión 2026-07-02" abajo). `npm run build` + `npx cap sync ios` hechos y **Xcode abierto** → solo falta que el usuario haga Archive → Distribute → Upload. Android sigue en `versionCode 10` / `2.4.2` (otra PC). ⚠️ Las notas de abajo mencionan builds 9/8/7 como PREPARADOS/pendientes: son **histórico**; el binario iOS vigente es el **14** (incluye todo lo acumulado). Las sesiones intermedias 1.5.1–1.6.0 (lista de espera, mejora check-in, push a baristas, registro de entrada de staff, SEO, fix /welcome web) están en el git log pero no todas documentadas aquí.
**iOS 🆕 1.5.0 (build 9)** PREPARADO el 2026-06-26 (build + `npx cap sync ios` hechos; código **pusheado a `main`** → web ya desplegada). **Xcode ya está ABIERTO limpio con 1.5.0(9)** (se cerró la instancia vieja y se reabrió para que tomara el `project.pbxproj` nuevo). **SOLO FALTA que el usuario haga en Xcode: target App → "Any iOS Device" → Product → Archive → Distribute App → App Store Connect → Upload.** Incluye lo del 26-jun (ver sesión abajo): cancelar/pausar membresía, pase de lista, editar vencimiento desde admin, "Studio" en el nav, y el **fix raíz del deep link** (RR7 `useNavigate`). **OJO:** el 1.4.0 (build 7) sigue esperando aprobación de Apple; el 1.5.0 va como versión nueva por encima.
**iOS (previo) 1.4.2 (build 8)** quedó preparado el 25-jun pero **NUNCA se subió** (solo se usó para probar en local); lo reemplaza el 1.5.0(9).
**iOS (previo) 1.4.0 (build 7)** subido el 2026-06-24, esperando aprobación. Incluía 15→24-jun: Stripe LIVE, Recepción, deep links de auth, dominio befitlab.app, fixes 22/23-jun, gestionar clases por clienta, "sin cupos", sidebar scroll, fix de fotos de coaches.
**⏳ ÚNICO PENDIENTE DE DESPLIEGUE: AAB de Android** (otra PC) con TODO lo acumulado hasta el 26-jun. Android sigue en `versionCode 8` / `versionName 2.4.0` y NO se ha subido a Play con nada de esto; al reconstruir, `main` ya trae todos los cambios (solo bumpear `versionCode` si Play lo pide). El `dist` está construido para iOS; para Android **reconstruir** (`npm run build && npx cap sync android`).

**📋 REQUERIMIENTO PARA CLAUDE (cuando el usuario pida "subir Android" en la otra PC):**
Ejecuta TÚ (Claude) automáticamente los pasos de CLI; el usuario solo hace los de GUI que tú no puedes. No pidas permiso paso a paso, hazlos y reporta.

**→ Pasos que HACE CLAUDE (CLI):**
1. `git pull origin main` (trae el código nuevo + el `versionCode` ya bumpeado).
2. `npm install`.
3. `npm run build` (ahora con **Vite v8/rolldown** es **rápido ~1s y ya NO se cuelga**; la nota vieja de "~14 min + pkill" quedó obsoleta).
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

## ✅ Sesión 2026-07-07 (4 mejoras de las dueñas: buscador de cobro · modal editar clase · CLASES ESPECIALES · Cumpleaños en admin)
**Todo pusheado a `main`** (web auto-desplegando). **Todo es front** salvo 2 columnas nuevas en `classes` (aditivas, ya en prod). **Nativo pendiente de rebuild** para incluir esto.

- **🔎 Buscador en Cobro de Membresía (Ventas):** el `<select>` de "Alumna" con las 146+ era imposible de usar. Nuevo componente reutilizable **`src/components/SearchableClientSelect.jsx`** (input + lupa + dropdown que filtra por nombre/correo en vivo, muestra plan, botón limpiar). Aplicado en **Ventas → Cobro de Membresía** y en **Insignias → Otorgamiento Manual** (mismo problema). `Admin.jsx`.
- **✏️ Editar clase = MODAL centrado en PC:** al dar "Editar" el form se rellenaba hasta el fondo (había que hacer scroll). Ahora abre **modal centrado** con backdrop. Truco sin duplicar el form: el wrapper usa **`display:contents` cuando se AÑADE** (queda inline como antes) y se vuelve backdrop `position:fixed` + tarjeta centrada cuando `editingClassId` (se EDITA). `Admin.jsx`. Cerrar: clic fuera / Cancelar / al guardar.
- **✨ CLASES ESPECIALES (masterclass/eventos que entran como clases normales):**
  - **BD:** columnas nuevas **`classes.is_special` (bool default false)** + **`classes.special_label` (text)** — `supabase/sql/special_classes.sql` (gitignored), **aplicado a prod vía Management API**. NO cambia cupo/reserva/check-in; sigue siendo clase normal.
  - **Admin (modal de clase):** switch **"Clase especial"** (icono `Sparkles`) + campo de etiqueta opcional (Masterclass/Taller/Evento…; vacío ⇒ "Especial"). Se guarda en `is_special`/`special_label` (payloads single y range, `prefillFromClass`, resets).
  - **Resaltado (iteramos con las dueñas hasta que quedó):** la clienta lo ve como **tarjeta clara con HUMO NARANJA EN MOVIMIENTO** — reusa la técnica del **portafolio** ("glow viajero"): contenedor `overflow:hidden` + 3 blobs `radial-gradient` con `filter:blur(42px)` que se desplazan en loop. CSS nuevo en **`src/index.css`**: `.special-smoke-wrap` / `.special-smoke-a/b/c` + `@keyframes specialRoamA/B/C` + fallback `prefers-reduced-motion`. Sobre el humo: label pill degradado **naranja→mauve `#E07A9C`** (el mismo de **Eventos**; NO fucsia) con la etiqueta, texto oscuro normal. `ScheduleCalendar.jsx` (`ClassItem`).
  - **Otras superficies:** chip mauve (sin estrella) en lista del admin (`Admin.jsx`), vista coach (`Coach.jsx`) y detalle de la clase (`Agenda.jsx`); y **punto de color especial** (degradado + aro) en el calendario del mes y el strip de semana (`ScheduleCalendar.jsx`). ⚠️ Nota de estilo: la marca **NO usa emojis** (iconos lucide sí) — de paso se quitaron los emojis del form de clases (`✏️`→icono `Pencil`, `📋`/`➕` a texto).
- **🎂 Cumpleaños en ADMIN:** las dueñas querían ver los cumpleaños con el mismo calendario de las clientas. Se **extrajo** el calendario a un componente exportado **`export function BirthdayCalendar`** en `src/pages/Cumpleanos.jsx` (reusa `MiniMonth`/`BigMonth`/`Avatar`; auto-fetch de `users` con `birth_date`; el page de la clienta quedó **intacto**). Nuevo **`src/components/AdminCumpleanos.jsx`** (encabezado + `<BirthdayCalendar/>`). En `Admin.jsx`: ítem **"Cumpleaños"** (icono `Cake`) en sidebar desktop + menú superior móvil + tab `cumpleanos`. **150 de 163 usuarias tienen cumpleaños** cargado.
- **Verificado:** build OK (`✓ built in ~0.9s`); vista previa de las tarjetas renderizada con headless Chrome. **Datos de prueba borrados** (cuenta `clienta.prueba@befitlab.app` + clase "Masterclass de Reformer (PRUEBA)") → 0 clases especiales en prod al cerrar. ⏭️ **PENDIENTE:** las dueñas crean clases especiales reales; y **rebuild iOS/Android** para llevar las 4 mejoras a nativo.

## ✅ Sesión 2026-07-06 (fix fotos de coaches + limpieza Scarlett + webhook Stripe) — iOS 1.6.2(16)
**Pusheado a `main`** (commit `8fd2523`, web desplegando). Reporte de la dueña: (1) las fotos de las coaches seguían sin aparecer en los horarios y (2) una foto de un **QR** de una cuenta demo salía en un perfil que "nada que ver".

- **🔴 Causa raíz del QR ubicuo (badge `COACH_PROFILE`):** existía un badge global en `badges_config` (`rule_type='COACH_PROFILE'`) que se usaba como **foto comodín** para CUALQUIER clase cuya coach no se resolviera. `MiCuenta.jsx` lo **sobrescribía** cada vez que una coach/admin guardaba su perfil (era un singleton) → la cuenta **"COACH PRUEBA (DEMO)"** guardó ahí su avatar (el QR) y su URL era literalmente `.../avatars/205c1fa8.../avatar.jpg`. Se veía en **~113 clases** con el nombre "MARLENE YANELI" pegado. **Se BORRÓ el badge de la BD** (fix instantáneo en web **y apps ya instaladas**, porque leen ese dato en vivo). Además, en código: `ScheduleCalendar.jsx` + `Portal.jsx` ya **no** usan los fallbacks "adivinados" (`coaches[0]` ni el badge) → sin match/foto = **inicial**, nunca una foto ajena. `MiCuenta.jsx` **dejó de escribir** ese badge.
- **🟠 Por qué NO aparecían las fotos reales (distinto del QR):** de 9 cuentas COACH, solo 2 tenían foto (la demo=QR y **Nallely**=base64). Las otras 7 con `avatar_url` NULL y **CERO archivos en Storage** (revisado bucket `avatars`: 26 archivos, 25 de CLIENT + 1 del demo; ninguno de las coaches). Diagnóstico: **subieron su foto desde la app VIEJA** (anterior al 24-jun, bug `fetch(data:)` en WKWebView) → la de Nallely "pegó" como base64 por ser ligera; las demás eran fotos pesadas de iPhone y el bug las tiró a NULL. **No mienten, lo hicieron en versión vieja.** Camino de arreglo (probado y con RLS confirmada): la **dueña sube cada foto desde la WEB** (befitlab.app en compu) → **Clientas → filtro "Staff" → coach → cámara**. ⏭️ PENDIENTE: que suba una y verificar en la BD que quedó.
- **🟢 Dueña coach+clienta (Brenda / "Bren Flores💐", `sally_2609`):** imparte **72 clases** (56 futuras) pero su cuenta es **rol CLIENT** (tiene membresía activa; a veces la cambia para ver la app como socia) → no salía en la lista de coaches y sus clases perdían la foto. **Fix (opción C):** `AuthContext.fetchCoaches` ahora incluye también a **quien está asignado como `coach_id` en alguna clase aunque su rol no sea COACH** (2ª consulta a `classes.coach_id` + lookup; la RLS `authenticated=true` lo permite). Así sus clases resuelven por `coach_id` y mostrarán su foto en cuanto suba una. Solo agrega a esa persona (verificado: 1 cuenta, no las 146 clientas). Ojo: su cuenta ahora también aparece en el **selector de coach** al crear clases (correcto, ella imparte).
- **🧹 Instructor "a mano" (legado):** el selector de clase actual solo ofrece cuentas COACH y setea `coach_id`+`instructor` juntos; los casos raros son de la carga inicial (23-24 jun): **Mayra** (39 clases, `coach_id` null, **sin cuenta**) y **Scarlett** (2 clases). **Scarlett se salió → se BORRARON sus 2 clases** (25 y 26 jun, ya pasadas; 1 reserva histórica cayó en cascada). ⏭️ PENDIENTE: **Mayra** sigue sin cuenta; si se queda y se quiere su foto hay que crearle cuenta COACH y reasignar sus 39 clases.
- **🔒 RLS de `users` (investigado, NO aplicado a pedido del usuario):** se detectaron 2 políticas muy abiertas — **`Enable read access for authenticated users = true`** y **`Enable update for all authenticated users = true`** (cualquier usuaria con sesión puede leer/editar el perfil de cualquier otra; incluso auto-escalar su propio `role`/`classes_remaining`). Se mapearon TODAS las lecturas/escrituras de `users` y las funciones helper (`is_admin`, `is_reception_or_admin`, `is_staff`). **Plan diseñado pero NO aplicado** (el usuario pidió parar): (a) quitar la UPDATE abierta + **trigger** `enforce_user_profile_guard` que bloquee cambios a columnas de membresía/rol salvo staff (`is_reception_or_admin()`) o roles elevados (`service_role`/`postgres` = webhook/mantenimiento) — ⚠️ la Management API bloquea crear ese trigger por WAF (error 1010): correrlo en el **SQL Editor** del panel; (b) la lectura NO se puede cerrar sin RPCs de columnas seguras (cumpleaños `Cumpleanos.jsx` y coaches leen filas ajenas) **y rompería apps nativas viejas** que leen `users` directo → hay que hacerlo por fases (RPC → deploy → cerrar). Retomar cuando el usuario quiera.
- **💳 Webhook de Stripe (correo de fallos):** el aviso era **solo del webhook de PRUEBA** (`we_1TchBx…`), que fallaba porque apunta a la misma URL que el LIVE pero la función solo conoce el secret de LIVE → los eventos de test no verifican firma. **Producción (`we_1Tcgyp… "Activación de membresías"`) 100% sano** (verificado con Stripe CLI: procesó un pago real de **$1,300 el 6-jul 22:46 UTC**). **Se ELIMINÓ el webhook de prueba** con el CLI (`stripe webhook_endpoints delete we_1TchBx… --confirm`) → se acaban los correos y el auto-apagado del 9-jul; producción intacto. (Stripe CLI en `/opt/homebrew/bin/stripe`, autenticado a `acct_1TcfJQARaQ2rSJDt` / @befit.lab.)
- **Archivos:** `src/components/ScheduleCalendar.jsx`, `src/pages/Portal.jsx`, `src/pages/MiCuenta.jsx`, `src/context/AuthContext.jsx` (`fetchCoaches`). Build OK (`✓ built in ~0.9s`). iOS bumpeado a **1.6.2 (build 16)**, `npm run build` + `npx cap sync ios` hechos, **Xcode abierto** → falta Archive/Upload del usuario.

## ✅ Sesión 2026-07-04 (fix reembolso al cancelar + falso "sin reserva" en QR + cancelar lista de espera)
**Pusheado a `main`** (web desplegando). Reportes de la dueña: (1) al cancelar una reserva NO se devolvía la clase al paquete, y (2) al escanear el QR salía "no tiene reserva" aunque sí la tuviera. Se auditó a fondo, se hallaron las causas RAÍZ (no parches) y se blindó el check-in. **TODO es front, sin cambios en la BD.**

- **🔴 Reembolso al cancelar (causa raíz):** el bloqueo de "5 horas" en `cancelClass` (`AuthContext`) y en `canCancelReservation` (`Portal`) calculaba la hora límite con **`getNextClassOccurrence(day, time)`** = próxima ocurrencia de ese **día de semana**, IGNORANDO la **fecha real** de la clase (`classes.date`). Como el estudio repite el mismo horario cada semana, bloqueaba por error cancelaciones de clases de semanas futuras (probado numéricamente: bloqueaba una cancelación hecha con 7 días de anticipación) → la clienta no podía cancelar y nunca se le devolvía la clase. La función de BD `cancel_class_secure` SÍ reembolsa bien (todas las reservas son `confirmed`); el bug era 100% del front. **Fix:** usar la fecha real vía `classDateTime(classObj.date, classObj.time)`; solo cae a `getNextClassOccurrence` si la clase no tuviera `date` (recurrentes viejas).
- **🔴 Falso "no tiene reserva" en el lector QR — DOS defectos:**
  1. **Cooldown de 1 HORA por código** en `QrCheckIn.jsx` bloqueaba el 2º check-in de clientas con **2 clases seguidas / dentro de la misma hora** (ej. 7:00 + 8:00 AM). Bajado a **90 s** (el backend ya es idempotente por reserva y maneja "ya asististe" + el selector de traslapes).
  2. El match de "hoy" comparaba `classes.date === todayLocalStr()` = fecha LOCAL del **dispositivo de recepción** → si su reloj/zona horaria está mal, salía "no tiene reserva". **Fix:** nuevo `mexicoTodayStr()` / `mexicoClassStart()` en `lib/dates.js` (zona **America/Mexico_City** vía Intl, UTC-6 fijo) → el "hoy" ya NO depende de la zona/idioma del equipo (probado con TZ=Tokio). Además respaldo: una reserva cuenta como de hoy si su clase cae dentro de **±3 h de ahora**.
- **🟠 Lista de espera en el check-in (hueco latente cerrado):** `checkInClient` no filtraba `status` → al llenarse una clase y entrar alguien a lista de espera, al escanearla la marcaba "asistió" sin lugar confirmado. Ahora **solo cuenta las `confirmed`**; si solo tiene de espera → "Está en LISTA DE ESPERA (sin lugar confirmado)".
- **🟢 Cancelar la reserva de lista de espera:** ya aparecía en "Próximas clases" y se podía cancelar, pero (a) el bloqueo de 5 h la estorbaba, (b) el texto decía "se devolverá a tu paquete" (falso, nunca se cobró) y (c) la tarjeta no la distinguía. Ahora: de la espera se sale **en cualquier momento**, sin tocar saldo/cupo (front + `cancelClass` respetan `status==='waitlist'`), mensaje correcto, botón "Salir de lista de espera" y chip "En lista de espera" en la tarjeta/modal.
- **Verificado:** build OK; auditoría de datos (0 saldos negativos, ilimitadas sanas en 9999, saldos limitados cuadran); FK `reservations.class_id` es **ON DELETE CASCADE** (nunca hay reservas huérfanas); RLS del staff abierta (ve todas las reservas). Simulaciones de la lógica nueva pasan todos los casos.
- **Archivos:** `src/lib/dates.js`, `src/context/AuthContext.jsx` (`cancelClass`, `checkInClient`), `src/pages/Portal.jsx` (`canCancelReservation` + modal + TicketCard), `src/components/QrCheckIn.jsx` (cooldown + zona México).
- ⏭️ **PENDIENTE:** la web/PWA de recepción y clientas recibe todo con el push. El fix de **cancelación en la app NATIVA (clientas) exige rebuild** de iOS/Android. Y confirmar un par de check-ins reales con el lector físico el primer día.

## ✅ Sesión 2026-07-02 (Lector QR robusto — fix "usuario desconocido / sin reserva") — iOS 1.6.0(14)
**Pusheado a `main`** (commit `9e0836a`, web desplegando). Reporte de la dueña: clientas que **sí reservaron** salían como "usuario desconocido" y "sin reserva" al escanear su QR (en Mostrador de admin y en Recepción), sobre todo con **clases consecutivas a 5–10 min** (confirmado: 8:00/8:10, 9:20/9:30, 6:20/6:30, 7:45/7:50 son lo normal).

- **Causa raíz:** el lector acoplaba *identidad* + *reserva* dentro de una ventana rígida (±15/-10 min) y **adivinaba** cuál clase marcar; cuando fallaba, dejaba a recepción sin salida.
- **Decisiones de la dueña:** ventana **suave** (nunca bloquea, solo advierte) + **sin walk-in** (si no hay reserva, solo se informa).
- **`AuthContext.jsx` — `checkInClient` reescrito** (+ helper `finalizeReservationCheckIn` idempotente + `checkInReservation` para selección manual, ambos expuestos en el provider):
  1. **Lookup robusto de UUID** (`extractUserId`): toma el PRIMER UUID válido del texto escaneado → tolera lecturas pegadas (doble escaneo) o con basura. Truncado → `unreadable:true` = "Código no legible, vuelve a escanear" (NO "usuario desconocido").
  2. **Siempre resuelve a la persona:** caché `allUsers` → **BD fresca con `maybeSingle`** de respaldo. Si existe, aparece.
  3. **Solo reservas de HOY** (filtra por `classes.date === todayLocalStr()` vía embed `reservations→classes(title,time,date)`, FK `reservations_class_id_fkey` confirmada) → excluye los **79 no-shows viejos** que antes contaminaban.
  4. **Ventana SUAVE:** ya NO existe `blockedWindow`. 1 reserva pendiente → **check-in automático** (el 100% de las 36 clientas de hoy). Varias traslapadas → si exactamente 1 está en ventana, esa; si no, **`needsSelection`** con candidatas para que recepción **toque cuál** (no adivina). El `update` lleva `.eq('checked_in', false)` (idempotente, no infla cupos por doble-tap).
- **`QrCheckIn.jsx` — UI:** maneja `unreadable` / `needsSelection` / `outsideWindow` / `alreadyIn`; muestra la tarjeta de la clienta **aunque no tenga reserva** (recepción ve quién es y su plan); **modal selector** con la clase "Ahora" marcada. Se quitó el paso de `windowOpen` y la rama de bloqueo por ventana.
- **Verificado:** build OK (`✓ built in 899ms`), FK del embed confirmada, distribución real (36/36 clientas de hoy con 1 pendiente → camino rápido; el selector solo aparece en traslapes reales). ⏭️ **PENDIENTE:** prueba con el **lector físico real** en la tablet de recepción (el foco del input oculto es lo único no reproducible aquí) + confirmar zona horaria/reloj de esa compu (el "hoy" sale de la fecha local del dispositivo).
- iOS bumpeado a **1.6.0 (build 14)**; web/PWA de recepción/admin recibe el fix con el push. Nativo llega hasta el rebuild.

## ✅ Sesión 2026-06-30 (FIX acceso-gratis-sin-pago + cupos a prueba de fallos + compañeras + check-in + foto admin)
**Pusheado a `main`** (web desplegando). Backend (BD + edge functions) **ya en producción**. iOS/Android pendientes de rebuild (acumulan también lo del 26-jun).

- **🔴 BUG GRAVE — membresía ACTIVA sin cobro confirmado (acceso gratis):** la app activaba el plan por la *selección*, no por el *pago*. Dos huecos cerrados:
  1. `AuthContext.fetchUserData` llamaba `activatePlan()` si había `befit_pending_plan` en localStorage (se guarda ANTES de redirigir a Stripe) → si el pago quedaba incompleto/abandonado, al iniciar sesión daba acceso gratis. **Se quitó esa activación** (la bandera se conserva solo para que /planes re-muestre el plan al volver de Stripe).
  2. `Register.jsx` activaba directo con `activatePlan(purchasedPlan…)` tras registrarse. **Ahora navega a `/planes` con el plan preseleccionado para PAGAR** (el webhook activa al cobrar). Se quitó el import de `activatePlan`/`useAuth`.
  - La membresía SOLO se activa con pago confirmado: `stripe-webhook` (`checkout.session.completed` con `payment_status='paid'` / `invoice.payment_succeeded`) o `stripe-membership-notify` (verifica PI/sub). `activatePlan` queda solo para la **activación manual del admin** (efectivo) en `Admin.jsx:224`.
  - **DATO DE ALERTA:** al revisar, **91 clientas ACTIVAS sin `stripe_subscription_id`** (vs 16 con) y pico de altas 25–27 jun. Mezcla de efectivo legítimo + posibles coladas por el bug. PENDIENTE: **reconciliación con Stripe** (cruce DB↔Stripe: pagada/incompleta/ninguna) para que la dueña decida a quién dar de baja. NO se desactivó a nadie aún.
- **🟠 CUPOS a prueba de desincronización (sobrecupo arreglado):** `classes.spots` era un contador mutable de "restantes" sin capacidad real → se desincronizaba (ej. spots=6 con 18 reservas) y nunca marcaba "lleno". Causas: editar la clase reescribía spots, el +/- lo subía, y **`cancel_class_secure` SIEMPRE hacía `spots+1` y `classes_remaining+1`** aunque no hubiera reserva que borrar (doble-tap → inflaba cupo y regalaba clases). **Fix (`supabase/sql/class_capacity_fix.sql`, YA APLICADO):** columna nueva `classes.max_spots` (capacidad fija al crear = el máximo a respetar). `spots` ahora lo DERIVA un trigger = `max_spots - reservas reales` (auto-sanado). `book_class_secure`/`admin_book_class` cuentan reservas reales vs `max_spots` y **bloquean doble reserva**. `cancel_class_secure`/`admin_cancel_class` solo reembolsan si de verdad borraron una reserva. Reconciliadas las 288 clases (Cardio Dance 30-jun quedó llena: estaba sobre-llenada). **Front:** Admin → Clases edita `max_spots` (el form/stepper "Cupos" = capacidad; `updateClassSpots` actualiza max_spots); ScheduleCalendar/Agenda muestran "Sin cupos" con `spots<=0`.
- **🟢 Ver compañeras de clase:** función segura `get_class_attendees(p_class_id)` (SECURITY DEFINER) devuelve **nombre de pila + foto** SOLO si la clienta pertenece a esa clase (o es personal). UI: `src/components/ClassmatesList.jsx` en el bottom-sheet de `Agenda` (las clases reservadas ahora son tocables para abrir el detalle). Decisión de privacidad de la dueña: foto + nombre de pila.
- **🟢 FIX asistencias marcaba "Reservó" pese a check-in:** `checkInClient` marcaba `resData[0]` (primera reserva pendiente, sin filtrar por clase) → si la alumna tenía varias reservas marcaba la equivocada. Ahora recibe `opts.classId` (la clase de la ventana abierta, que `QrCheckIn` ya calcula) y marca ESA. (El historial mal marcado no se reasigna.)
- **🟢 Foto de perfil de clientas desde admin:** botón de cámara en el avatar del modal "Clases" de `AdminClientas` (usa `uploadAvatar` + `patch` a `users.avatar_url`). RLS nuevo: `avatars staff write/update` para que admin/recepción suban a cualquier carpeta.
- **🐞 FIX crash "Agregar a mi calendario" (nativo):** `Agenda.handleAddToCalendar` usaba `d` indefinido → ahora `modalData.date`.
- ⚠️ Helper para consultar la BD por Management API: token en keychain `security find-generic-password -s "Supabase CLI" -w` → `POST https://api.supabase.com/v1/projects/fifaowaiokauhuqklzwe/database/query`.

## ✅ Sesión 2026-06-26 (cancelar/pausar membresía + pase de lista + editar vencimiento + "Studio" + FIX deep link) — iOS 1.5.0(9)
**Todo pusheado a `main`** (commit `d02ec54`, web desplegando). Backend (BD + edge functions) **ya en producción**. iOS bumpeado a **1.5.0 (build 9)**, falta Archive/Upload del usuario. Android (otra PC) pendiente.

- **🐞 FIX RAÍZ del "temblor/rebote" al confirmar el correo (deep link):** era la **causa de TODO** (el temblor original Y el rebote `/planes`↔`/welcome`). `AuthDeepLinkHandler` (en `App.jsx`) tenía el efecto con dep `[navigate]`, y **`useNavigate()` de React Router 7 cambia de identidad en cada cambio de ruta** → el efecto se re-ejecutaba en cada navegación y volvía a llamar `CapApp.getLaunchUrl()`, que **sigue devolviendo el link del correo** → re-navegaba en bucle. Por eso cerrar/reabrir lo curaba (ahí getLaunchUrl ya no devuelve ese link). **Fix:** efecto con deps `[]` + `navRef` (ref viva de navigate) + `launchHandledRef` (procesar la launch URL UNA sola vez). ⚠️ LECCIÓN: nunca poner `navigate` como dep de un efecto que lee `getLaunchUrl()`. (El flujo es **implicit flow**: el correo trae tokens en el hash → `setSession`, NO `exchangeCodeForSession`/PKCE.)
- **Flujo post-registro nuevo:** tras confirmar el correo se aterriza en **`/welcome`** (no `/portal`, que rebotaba a `/planes`). `Welcome.jsx` ahora es consciente de sesión: sin sesión → crear cuenta/login; con plan ACTIVO → entra directo al portal; **con sesión sin plan → pantalla "¡Tu cuenta está lista!" + chip "✓ Correo confirmado" + botón "Entrar a mi perfil"** (no auto-rebota). Bandera `sessionStorage 'befit_just_confirmed'` la pone el handler. (Una 1ª versión con dedupe de token rompía el `setSession` → se quitó; la lógica de confirmación quedó como estaba probada.)
- **(1) Cancelar / Pausar membresía (clienta, `Planes.jsx` "Mi Membresía"):**
  - **Pausar (vacaciones):** Stripe `pause_collection:{behavior:'void'}` — no cobra la próxima renovación, conserva acceso hasta el vencimiento, **reactivable sin re-meter tarjeta**.
  - **Cancelar:** `cancel_at_period_end:true` — no se renueva, conserva acceso hasta el vencimiento, luego termina (re-suscribirse para volver).
  - **Reactivar:** limpia pausa y cancelación.
  - Las clientas **sin** `stripe_subscription_id` (efectivo/alta manual; ~22 de 29) ven un **aviso** "tu plan no tiene renovación automática" en vez de botones (no hay cobro que parar).
  - **BD:** columna nueva `users.membership_renewal` (`active|paused|canceling`, default `active`, YA APLICADA). **Edge function nueva `manage-membership`** (JWT → userId del token; pause/resume/cancel; maneja "sin suscripción" y "sub inexistente en Stripe"). `stripe-webhook` + `stripe-membership-notify` resetean `membership_renewal:'active'` en cada activación/renovación/cancelación. **3 functions desplegadas.** `AuthContext` expone `membershipRenewal` + `hasSubscription`.
- **(2) Pase de lista / Asistencias (admin):** nuevo `src/components/AdminAsistencias.jsx` (pestaña "Pase de lista", admin-only — sidebar + menú ⋯). Navegador por día (`<input type=date>` + ◀▶) → cada clase con su roster de alumnas: badge **"Asistió ✓"** (check-in QR, `reservations.checked_in`) o **"Reservó"**, + resumen del día (clases/reservas/asistieron) + filtro "solo asistió". Lee `reservations` con join a `users` (admin ya tiene RLS, mismo patrón que `fetchClassReservations`). ⚠️ Hay 56 reservas pero **0 check-ins** en la BD → la columna "Asistieron" sale en 0 hasta que **escaneen el QR** en recepción.
- **(3) Editar vencimiento desde admin:** en `AdminClientas.jsx` modal "Clases" → sección "Vencimiento de la membresía" con `<input type=date>` + Guardar (UPDATE directo a `users.plan_expires_at` vía `patch`, admin ya tiene RLS). Se sella a las 23:59 local del día elegido. `onBaja`/`onReactivar` también resetean `membership_renewal`.
- **(4) Sitio:** nav "Estudio" → **"Studio"** (desktop + móvil, `Landing.jsx`).
- ✅ **Entorno actualizado:** el build ahora es **Vite v8 (rolldown), rápido (~1s) y ya NO se cuelga** (la nota vieja de "14 min + pkill" quedó obsoleta).

## ✅ Sesión 2026-06-25 (vencimiento de membresía + orden de clases + sección App del sitio) — iOS 1.4.2(8)
Tres cambios pedidos por el usuario. **Web ya pusheada a `main`** (commits `e04028b` + `9e5c4db`, Cloudflare desplegando). **Backend del vencimiento ya en producción.** iOS 1.4.2(8) preparado (build + sync), falta Archive/Upload del usuario. Android (otra PC) sigue pendiente.
- **(1) Orden de clases por horario:** `src/components/ScheduleCalendar.jsx` `getClassesForDate` filtraba pero NO ordenaba por hora → dependía del orden del array `globalClasses` (que se rompe con inserts realtime). Además `time` se guarda en **AM/PM** ("7:00 AM"), no se podía ordenar como texto. Fix: ordena por minutos reusando `parseTimeStr` (de `useLocalNotifications`). Aplica a clienta (Agenda/Portal), coach y admin (todos usan ese componente).
- **(2) Fecha de pago + vencimiento + bloqueo automático:** regla = todos los planes vencen **+1 mes** desde el pago, fecha **automática** (no editable).
  - **BD** (`supabase/sql/plan_expiry.sql`, gitignored, YA APLICADO): columnas `users.plan_started_at` / `plan_expires_at`; backfill de las 14 activas (+1 mes desde hoy); `book_class_secure` con guard que **rechaza reservar si `plan_expires_at < now()`** (NULL = no bloquea, por seguridad).
  - **Sellado de fechas** (pago=ahora, vence=+1mes) en: `activatePlan` (AuthContext), `stripe-webhook` (web + nativo + renovación `invoice.payment_succeeded`), `stripe-membership-notify`, `admin-create-client`; al dar de baja/cancelar se limpia `plan_expires_at`. **3 edge functions REDEPLOYADAS.**
  - **Front:** `src/lib/membership.js` (helpers `isPlanExpired`/`formatPlanDate`/`daysUntilExpiry`). AuthContext expone `planStartedAt`/`planExpiresAt`. `Planes.jsx` ("Mi Membresía") muestra "Vence el X" / aviso ≤7 días / "Membresía vencida" en rojo. `AdminClientas.jsx`: chip "Vence/Vencido" en la tarjeta + fecha pago/vencimiento en el modal de "Clases"; `onReactivar` sella fechas nuevas, `onBaja` limpia. `Agenda.jsx` guard de UX (si venció → alert + manda a `/planes`).
- **(3) Sección "Be Fit Lab App" del sitio (`Landing.jsx`):** se reemplazó el **mockup falso** (`PhoneScreen`, datos inventados) por **carrusel real de capturas de clienta** (Home/Reservas/Evolución/Nutrición, en `public/screenshots/` — copiadas del portafolio). Auto-rota 3.2s con fundido, lista de features sincronizada (clickeable), puntos de paginación, pausa al hover. Texto nuevo ("Todo tu estudio, en la palma de tu mano."). **Solo web** (en nativo `/`→`/welcome`, no se ve). ⏭️ Opcional: optimizar las 4 PNG (~2.75MB) a webp.

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
- ✅ **RESUELTO (2026-06-24):** push a main hecho (web desplegada) e **iOS 1.4.0(7) subido**. ⏳ Falta solo el **AAB de Android**. El backend ya estaba en producción (aditivo, no afecta a ADMIN).

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
- [x] ~~Rebuild + resubir **iOS**~~ — HECHO: **iOS 1.4.0 (build 7)** subido a App Store Connect el 2026-06-24 (incluye todo del 15→24-jun). ⏳ Falta solo el **AAB de Android** (otra PC) con todo lo acumulado.
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

