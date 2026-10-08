# Demos de venta de KaiZen — estado y lo que sigue

> Las demos viven **temporalmente** en este repo de Be Fit Lab. Son de KaiZen, no
> de la clienta. **Plan acordado (8-oct-2026): mudarlas a un repo propio**
> (`kaizen-demos`). Ver "Lo que sigue".

## Cómo correrlas

```bash
git pull
npm install
npm run dev:demos -- --port 5199   # = vite --mode demos
```

- `http://localhost:5199/` → índice de demos (marca KaiZen).
- `/demo/alma` → **Studio Alma** (pilates): la app real de Be Fit pintada con otra marca.
- `/pedidos/hoja` → **Hoja · cocina fit** (pedidos en línea: recoger, a domicilio, en mesa con QR).
- `.env.demos` ya está versionado (llave pública de Supabase "Demos"; Stripe vacío a propósito).
- **Todavía NO están publicadas en internet**: solo corren en local.

## Piezas

| Qué | Dónde |
|---|---|
| Entrada en modo demos | `src/AppDemos.jsx` (se activa con `VITE_DEMOS=true`) |
| Índice | `src/pages/IndiceDemos.jsx` + `src/demo/catalogo.js` |
| Studio Alma | `src/pages/Demo.jsx`, `src/demo/estudiosDemo.js`, `recolorearDemo.js`, `GuiaDemo.jsx` |
| Hoja (pedidos) | `src/demo/pedidos/*` — **no usa nada de Be Fit** |
| Marca KaiZen y barra superior compartida | `src/demo/kaizen/marca.jsx`, `src/demo/kaizen/BarraDemo.jsx` |
| Pasarela de pago de PRUEBA (sin Stripe) | `src/demo/PasarelaPrueba.jsx`; tarjeta `4242…` aprueba, `4000000000000002` rechaza |
| SQL de la base Demos | `supabase/demos/*.sql` (`10_pedidos.sql`, `11_pedidos_hoja.sql`, `02_demo_reset.sql`…) |
| Edge functions de la base Demos | `supabase/demos/functions/` (`stripe-cafe-checkout` versión demo, `pago-prueba`) |

### Base de datos
- Supabase **"Demos"**, ref `qwqrbckivrkmeykiukug`. **Nunca** la de Be Fit (`fifaowaiokauhuqklzwe`).
- Consultas: `supabase/demos/consulta.sh demos <archivo.sql|->` (PAT en el llavero "Supabase DEMOS"; esa cuenta también es la del POS → verificar el ref antes de correr nada).
- Edge functions: se despliegan por la Management API con curl (el CLI viejo rechaza tokens `sbp_v0_`):
  `POST https://api.supabase.com/v1/projects/<ref>/functions/deploy?slug=<nombre>` multipart (`metadata` + `file`).
- Se reinician solas cada noche por pg_cron (`demo_reset` de Alma y `pedidos_reset_nocturno` de Hoja, 3:10 am MX).
- Cuentas demo: contraseña `StudioAlma-Demo-2026` (Alma y `*@demo.hoja.mx`); el reset las restaura.

### Reglas
- Cambios de demos **no tocan archivos de Be Fit**. Excepciones ya autorizadas: `src/lib/supabase.js` (sesión en memoria por pestaña en modo demos) y `src/pages/Cafeteria.jsx` (fix real de Be Fit).
- El build de Be Fit no debe incluir nada de las demos: tras `npm run build`, `grep -l Familjen dist/assets/*` debe salir vacío.
- Cada push a `main` redespliega la web de Be Fit (motivo principal para mudarlas).

## Lo que sigue

1. **Pendiente de verificar a ojo:** la barra KaiZen dentro de `/demo/alma` y `/pedidos/hoja`, en compu y en celular (el índice ya se revisó).
2. **Mudar a repo propio `kaizen-demos`** (acordado, falta hacerlo):
   - Crear el repo como copia de este (Alma necesita la app completa de Be Fit).
   - En el repo nuevo, dejar solo el modo demos como entrada; quitar despliegues/iOS/Android que no aplican.
   - Moverle `supabase/demos/`.
   - Proyecto de Cloudflare Pages aparte + dominio → **así quedan publicadas en internet**.
   - Quitar de `be-fit-lab` las demos (`src/demo/`, `AppDemos.jsx`, `IndiceDemos.jsx`, `Demo.jsx`, `.env.demos`, scripts `*:demos`, `supabase/demos/`) **después** de comprobar que el repo nuevo funciona.
   - Ojo: desde ahí los arreglos de Be Fit ya no llegan solos a Alma; se copian a mano cuando valga la pena.
3. Opcionales ya platicados (no pedidos todavía): ejemplo de restaurante; en Alma, Reportes (`admin-analytics` no está desplegada en Demos y `AdminReportes` no tiene guardia), pasarela de prueba para membresías/eventos, `admin-create-client`.
4. Bugs de Be Fit vistos en la demo (sin tocar): en `Coach.jsx`, "Alumnas hoy" muestra el día seleccionado y la lista de clases no se ordena por hora.
