import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Página de confirmación tras el checkout de cafetería. Muestra un mensaje claro
// y un botón "Volver a la app" (deep link befitlab://). NO auto-redirige por JS
// porque SFSafariViewController bloquea la navegación a esquemas sin gesto del
// usuario. Al cerrar el navegador, la app verifica el pago y muestra "¡Gracias!".
serve((req) => {
  const url = new URL(req.url);
  const status = url.searchParams.get('status') === 'cancel' ? 'cancel' : 'success';
  const deep = `befitlab://cafeteria?payment=${status}`;
  const ok = status === 'success';

  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Be Fit Lab</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;
       font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;background:#EFE9E4;color:#1A1C1E;text-align:center;padding:32px}
  .c{width:84px;height:84px;border-radius:50%;background:${ok ? 'linear-gradient(135deg,#FF914D,#E07A9C)' : '#9aa0a6'};
     display:flex;align-items:center;justify-content:center;margin-bottom:22px;box-shadow:0 12px 28px rgba(255,145,77,.35)}
  h1{font-size:1.6rem;margin:0 0 10px;font-weight:800}
  p{color:#6B7280;margin:0 0 28px;font-size:1rem;line-height:1.5;max-width:300px}
  a.btn{display:inline-block;background:#FF914D;color:#fff;text-decoration:none;font-weight:800;font-size:1.05rem;
        padding:16px 34px;border-radius:18px;box-shadow:0 10px 24px rgba(255,145,77,.4)}
</style></head><body>
  <div class="c">
    ${ok
      ? '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
      : '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'}
  </div>
  <h1>${ok ? '¡Pago completado!' : 'Pago cancelado'}</h1>
  <p>${ok ? 'Tu pedido está listo. Vuelve a la app para ver tu confirmación.' : 'No se realizó ningún cargo.'}</p>
  <a class="btn" href="${deep}">Volver a la app</a>
</body></html>`;

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
});
