// Correo del boleto (Resend). Si no hay RESEND_API_KEY configurada, no truena:
// simplemente no manda correo — la compra y el boleto ya existen en la BD y la
// persona los ve en pantalla al terminar de pagar.
const FROM = 'Be Fit Lab <hola@befitlab.app>';
const WEB = 'https://befitlab.app';
// El durazno de la marca en blanco (el mismo del pase de Apple Wallet). Vive en
// Storage público: no depende de que la web esté desplegada.
const LOGO = 'https://fifaowaiokauhuqklzwe.supabase.co/storage/v1/object/public/wallet-passes/befit-mark.png';

const fmtFecha = (iso: string | null) => {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('es-MX', {
      weekday: 'long', day: 'numeric', month: 'long',
      hour: 'numeric', minute: '2-digit', timeZone: 'America/Mexico_City',
    }).format(new Date(iso));
  } catch (_) { return ''; }
};

const esc = (s: string) => String(s ?? '').replace(/[<>&"]/g, (c) =>
  ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c] as string));

export type Boleto = { ticket_code: string; holder_name: string | null };

export async function sendTicketEmail(opts: {
  to: string;
  buyerName: string;
  eventTitle: string;
  eventDate: string | null;
  eventLocation: string | null;
  tickets: Boleto[];
}): Promise<{ sent: boolean; error?: string }> {
  const key = Deno.env.get('RESEND_API_KEY');
  if (!key) { console.log('RESEND_API_KEY no configurada — boleto sin correo'); return { sent: false, error: 'sin_api_key' }; }
  if (!opts.to) return { sent: false, error: 'sin_correo' };

  const fecha = fmtFecha(opts.eventDate);
  const plural = opts.tickets.length > 1;

  const bloques = opts.tickets.map((t) => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px">
      <tr><td style="border:1px solid #F0E6DC;border-radius:16px;padding:18px 20px;background:#FFFBF7">
        <div style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#B0846A">Boleto</div>
        <div style="font-size:17px;font-weight:700;color:#2D2928;margin:2px 0 10px">${esc(t.holder_name || opts.buyerName)}</div>
        <div style="font-family:'SF Mono',Menlo,monospace;font-size:30px;font-weight:800;letter-spacing:.16em;color:#FF914D">${esc(t.ticket_code)}</div>
        <a href="${WEB}/boleto/${encodeURIComponent(t.ticket_code)}" style="display:inline-block;margin-top:12px;font-size:14px;font-weight:700;color:#FF914D;text-decoration:none">Ver mi boleto con QR →</a>
      </td></tr>
    </table>`).join('');

  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#F7F2ED;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 14px">
    <table role="presentation" width="100%" style="max-width:520px;background:#fff;border-radius:22px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,.06)">
      <tr><td bgcolor="#FF914D" style="background-color:#FF914D;background:linear-gradient(135deg,#FF914D,#E07A9C);padding:28px 26px 30px;text-align:center">
        <img src="${LOGO}" width="42" alt="Be Fit Lab" style="display:block;width:42px;height:auto;margin:0 auto 12px;border:0;outline:none;text-decoration:none">
        <div style="font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.85)">Be Fit Lab</div>
        <div style="font-size:25px;font-weight:800;color:#fff;margin-top:6px;line-height:1.2">${esc(opts.eventTitle)}</div>
      </td></tr>
      <tr><td style="padding:26px">
        <p style="margin:0 0 18px;font-size:16px;color:#2D2928;line-height:1.55">
          ¡Hola ${esc(opts.buyerName.split(' ')[0])}! Tu lugar está apartado.
          ${plural ? `Aquí están tus <strong>${opts.tickets.length} boletos</strong>.` : 'Aquí está tu boleto.'}
        </p>
        ${fecha ? `<div style="font-size:15px;color:#5C534E;margin:0 0 6px"><strong style="color:#2D2928">Cuándo:</strong> ${esc(fecha)}</div>` : ''}
        ${opts.eventLocation ? `<div style="font-size:15px;color:#5C534E;margin:0 0 20px"><strong style="color:#2D2928">Dónde:</strong> ${esc(opts.eventLocation)}</div>` : '<div style="height:14px"></div>'}
        ${bloques}
        <p style="margin:18px 0 0;font-size:13px;color:#8A7F78;line-height:1.6">
          Muestra el código (o el QR) en la entrada. Guarda este correo: es tu comprobante.
          Si tienes dudas, escríbenos por WhatsApp al +52 221 266 4253.
        </p>
      </td></tr>
      <tr><td style="padding:16px 26px 26px;text-align:center;color:#B0A79F;font-size:12px">Be Fit Lab · Blvrd 22 Sur 5123, Villa Carmel, Puebla</td></tr>
    </table>
  </td></tr></table></body></html>`;

  const texto = [
    `¡Hola ${opts.buyerName.split(' ')[0]}! Tu lugar en ${opts.eventTitle} está apartado.`,
    fecha ? `Cuándo: ${fecha}` : '',
    opts.eventLocation ? `Dónde: ${opts.eventLocation}` : '',
    '',
    ...opts.tickets.map((t) => `${t.holder_name || opts.buyerName}: ${t.ticket_code} — ${WEB}/boleto/${t.ticket_code}`),
    '',
    'Muestra el código en la entrada.',
  ].filter(Boolean).join('\n');

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: [opts.to],
        subject: `${plural ? 'Tus boletos' : 'Tu boleto'} · ${opts.eventTitle}`,
        html,
        text: texto,
      }),
    });
    if (!res.ok) {
      const detalle = await res.text();
      console.error('Resend error:', res.status, detalle);
      return { sent: false, error: `resend_${res.status}` };
    }
    return { sent: true };
  } catch (e) {
    console.error('Resend excepción:', e);
    return { sent: false, error: String(e) };
  }
}
