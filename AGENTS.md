# AGENTS.md

El contexto completo del proyecto **Be Fit Lab** vive en **[`CLAUDE.md`](./CLAUDE.md)**.

👉 **Lee `CLAUDE.md` primero**: stack, comandos (`npm run dev`, `build`, `npx cap sync`),
arquitectura de push (insertar en `notification_logs` → trigger → `push-deliver`),
pagos Stripe, fotos de progreso (wizard + siluetas), báscula VeSync, roles,
estética liquid glass y la lista de pendientes / dónde nos quedamos.

Flujo de despliegue: `git push origin main` autodespliega la web en Cloudflare.
Para nativo: `npm run build && npx cap sync` y build desde Xcode/Android Studio.
