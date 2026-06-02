// FCM HTTP v1 via service account OAuth2 (RS256)

const FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

export async function sendFCM(token: string, title: string, body: string, data: Record<string, string> = {}) {
  const projectId   = Deno.env.get('FCM_PROJECT_ID')!;
  const clientEmail = Deno.env.get('FCM_CLIENT_EMAIL')!;
  const privateKey  = Deno.env.get('FCM_PRIVATE_KEY')!.replace(/\\n/g, '\n');

  const accessToken = await getGoogleAccessToken(clientEmail, privateKey);

  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body },
          android: { priority: 'high' },
          data: Object.fromEntries(
            Object.entries(data).map(([k, v]) => [k, String(v)])
          ),
        },
      }),
    },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`FCM error ${res.status}: ${JSON.stringify(err)}`);
  }
}

async function getGoogleAccessToken(email: string, pem: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const header  = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({
    iss: email,
    scope: FCM_SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${payload}`;

  const key = await importRSAKey(pem);
  const sigBuf = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(unsigned),
  );

  const jwt = `${unsigned}.${base64url(sigBuf)}`;

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  const json = await res.json();
  if (!json.access_token) throw new Error(`OAuth2 error: ${JSON.stringify(json)}`);
  return json.access_token;
}

async function importRSAKey(pem: string): Promise<CryptoKey> {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');
  const buf = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'pkcs8', buf,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign'],
  );
}

function base64url(input: string | ArrayBuffer): string {
  const str = typeof input === 'string'
    ? btoa(input)
    : btoa(String.fromCharCode(...new Uint8Array(input)));
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
