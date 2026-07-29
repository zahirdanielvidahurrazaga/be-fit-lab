// Respaldo por CORREO cuando el push no puede llegar.
//
// Por qué existe: 46 de 157 socias activas (29%) no tienen NINGÚN token de
// dispositivo registrado — usan la web/PWA o nunca dieron permiso de
// notificaciones. Para ellas un aviso por push es literalmente invisible, y el
// 29-jul eso le costó su lugar a una clienta dos veces seguidas (la oferta de
// lista de espera vencía sola sin que ella supiera que existía).
//
// Si no hay RESEND_API_KEY no truena: simplemente no manda correo.

const FROM = 'Be Fit Lab <hola@befitlab.app>';
const WEB = 'https://befitlab.app';
const LOGO = 'https://fifaowaiokauhuqklzwe.supabase.co/storage/v1/object/public/wallet-passes/befit-mark.png';

const esc = (s: string) => String(s ?? '').replace(/[<>&"]/g, (c) =>
  ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c] as string));

export async function sendNotificationEmail(opts: {
  to: string;
  nombre?: string | null;
  title: string;
  body: string;
  cta?: string | null;
}): Promise<boolean> {
  const key = Deno.env.get('RESEND_API_KEY');
  if (!key) return false;

  const saludo = opts.nombre ? `Hola ${esc(String(opts.nombre).trim().split(' ')[0])},` : 'Hola,';
  const cta = opts.cta || `${WEB}/agenda`;

  // ⚠️ Outlook no soporta degradados: siempre background-color de respaldo.
  const html = `<!doctype html><html><body style="margin:0;padding:0;background-color:#f6f1ec;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6f1ec;padding:28px 12px;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:20px;overflow:hidden;font-family:Helvetica,Arial,sans-serif;">
    <tr><td align="center" style="background-color:#FF914D;background-image:linear-gradient(135deg,#FF914D 0%,#E68245 100%);padding:26px 24px;">
      <img src="${LOGO}" width="46" height="46" alt="Be Fit Lab" style="display:block;border:0;margin-bottom:10px;" />
      <div style="color:#ffffff;font-size:19px;font-weight:bold;line-height:1.25;">${esc(opts.title)}</div>
    </td></tr>
    <tr><td style="padding:26px 26px 8px;color:#15110E;font-size:15px;line-height:1.55;">
      <p style="margin:0 0 12px;">${saludo}</p>
      <p style="margin:0;">${esc(opts.body)}</p>
    </td></tr>
    <tr><td align="center" style="padding:22px 26px 28px;">
      <a href="${cta}" style="display:inline-block;background-color:#FF914D;color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:13px 26px;border-radius:12px;">Abrir Be Fit Lab</a>
    </td></tr>
    <tr><td align="center" style="padding:0 26px 24px;color:#8a7f76;font-size:12px;line-height:1.5;">
      Te llega por correo porque tu teléfono no tiene activadas las notificaciones de la app.<br/>
      Actívalas para enterarte al momento.
    </td></tr>
  </table>
</td></tr></table></body></html>`;

  const texto = `${opts.title}\n\n${saludo}\n${opts.body}\n\n${cta}`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [opts.to], subject: opts.title, html, text: texto }),
    });
    if (!res.ok) {
      console.error('Resend respondió', res.status, await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error('Error mandando correo de respaldo:', e);
    return false;
  }
}
