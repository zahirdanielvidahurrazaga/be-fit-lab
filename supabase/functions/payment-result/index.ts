import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const url = new URL(req.url);
  const isSuccess = url.searchParams.get('status') === 'success';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isSuccess ? 'Pago Exitoso' : 'Pago Cancelado'} - Be Fit Lab</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: ${isSuccess ? '#fff8f0' : '#f9fafb'};
      padding: 2rem;
      text-align: center;
    }
    .icon {
      width: 90px; height: 90px;
      border-radius: 50%;
      background: ${isSuccess ? 'rgba(255,139,66,0.12)' : '#f3f4f6'};
      display: flex; align-items: center; justify-content: center;
      font-size: 2.8rem;
      margin-bottom: 1.5rem;
    }
    h1 {
      font-size: 1.9rem; color: #111;
      margin-bottom: 0.75rem; font-weight: 800;
    }
    p { color: #666; font-size: 1rem; line-height: 1.6; max-width: 320px; }
    .badge {
      display: inline-block;
      margin-top: 1.5rem;
      padding: 0.55rem 1.4rem;
      background: ${isSuccess ? '#ff8b42' : '#6b7280'};
      color: white;
      border-radius: 100px;
      font-weight: 700; font-size: 0.9rem;
    }
    .note { margin-top: 2rem; font-size: 0.8rem; color: #aaa; }
  </style>
</head>
<body>
  <div class="icon">${isSuccess ? '🎉' : '↩️'}</div>
  <h1>${isSuccess ? '¡Pago exitoso!' : 'Pago cancelado'}</h1>
  <p>${isSuccess
    ? 'Tu membresía Be Fit Lab ya está activa. Regresa a la app para reservar tus clases.'
    : 'No se realizó ningún cargo. Regresa a la app cuando quieras intentarlo de nuevo.'
  }</p>
  <div class="badge">${isSuccess ? '¡Bienvenida al equipo! 💪' : 'Sin cargos realizados'}</div>
  <p class="note">Puedes cerrar esta ventana y regresar a Be Fit Lab.</p>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
});
