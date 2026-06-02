// APNs HTTP/2 push via JWT (ES256)

const APNS_HOST_PROD = 'https://api.push.apple.com';
const APNS_HOST_DEV  = 'https://api.sandbox.push.apple.com';

export async function sendAPNs(token: string, title: string, body: string, data: Record<string, unknown> = {}) {
  const keyId    = Deno.env.get('APNS_KEY_ID')!;
  const teamId   = Deno.env.get('APNS_TEAM_ID')!;
  const bundleId = Deno.env.get('APNS_BUNDLE_ID')!;
  const pemKey   = Deno.env.get('APNS_PRIVATE_KEY')!;

  const jwt  = await generateAPNsJWT(keyId, teamId, pemKey);

  const payload = {
    aps: {
      alert: { title, body },
      sound: 'default',
      badge: 1,
    },
    ...data,
  };

  const post = (host: string) => fetch(`${host}/3/device/${token}`, {
    method: 'POST',
    headers: {
      authorization: `bearer ${jwt}`,
      'apns-topic': bundleId,
      'apns-push-type': 'alert',
      'apns-priority': '10',
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  // Enviar a AMBOS entornos en paralelo: el token pertenece a uno (producción o
  // sandbox); el otro falla en silencio. Así el push llega sin importar si el
  // build es de Xcode (sandbox) o de TestFlight/App Store (producción), sin
  // depender del texto exacto del error. Se considera entregado si CUALQUIERA
  // de los dos responde ok.
  const settled = await Promise.allSettled([post(APNS_HOST_PROD), post(APNS_HOST_DEV)]);
  const ok = settled.some(r => r.status === 'fulfilled' && (r.value as Response).ok);
  if (ok) return;

  // Ambos fallaron → token muerto/ inválido. Recolectar el motivo para que
  // send-push pueda borrarlo (BadDeviceToken / Unregistered / 410).
  const reasons: string[] = [];
  for (const r of settled) {
    if (r.status === 'fulfilled') {
      const e = await (r.value as Response).json().catch(() => ({}));
      reasons.push(`${(r.value as Response).status}:${e?.reason ?? ''}`);
    } else {
      reasons.push(String((r as PromiseRejectedResult).reason));
    }
  }
  throw new Error(`APNs error ${reasons.join(' / ')}`);
}

async function generateAPNsJWT(keyId: string, teamId: string, pem: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const header  = base64url(JSON.stringify({ alg: 'ES256', kid: keyId }));
  const payload = base64url(JSON.stringify({ iss: teamId, iat: now }));
  const unsigned = `${header}.${payload}`;

  const privateKey = await importECKey(pem);
  const sigBuf = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    new TextEncoder().encode(unsigned),
  );

  return `${unsigned}.${base64url(sigBuf)}`;
}

async function importECKey(pem: string): Promise<CryptoKey> {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');
  const buf = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'pkcs8', buf,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false, ['sign'],
  );
}

function base64url(input: string | ArrayBuffer): string {
  const str = typeof input === 'string'
    ? btoa(input)
    : btoa(String.fromCharCode(...new Uint8Array(input)));
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
