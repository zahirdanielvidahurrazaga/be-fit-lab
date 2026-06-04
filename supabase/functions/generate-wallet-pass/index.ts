import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// @ts-ignore — node-forge es CJS, default import necesario en Deno
import forge from 'npm:node-forge@1.3.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Colores de marca Be Fit Lab — paleta "crema + acento durazno" (degradado suave)
const CREAM: [number, number, number] = [243, 234, 223]; // #F3EADF  fondo crema (dominante)
const PEACH: [number, number, number] = [236, 190, 158]; // #ECBE9E  acento durazno SUAVE (velo arriba)
const ICON:  [number, number, number] = [199, 93,  58];  // #C75D3A  terracota: ícono + etiquetas

// Marca real Be Fit Lab a COLOR (durazno + hoja, sin texto) — PNG 188×240 transparente.
// Se incrusta en base64 para usarla como logo.png del .pkpass (Apple) y, en Android,
// se sube al bucket para referenciarla como logo de Google Wallet.
const MARK_B64 = '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';
const markPng = Uint8Array.from(atob(MARK_B64), c => c.charCodeAt(0));

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { userId, platform } = await req.json();
    if (!userId) throw new Error('userId requerido');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('full_name, email, membership_plan, classes_remaining, membership_status')
      .eq('id', userId)
      .single();

    if (userError || !userData) throw new Error('Usuario no encontrado');

    const memberName = userData.full_name || userData.email.split('@')[0];
    const plan       = userData.membership_plan || 'Sin Plan';
    const classes    = String(userData.classes_remaining ?? 0);
    const status     = userData.membership_status === 'ACTIVE' ? 'Activa' : 'Inactiva';
    const serial     = `BEFIT-${userId.substring(0, 8).toUpperCase()}`;

    // ── Android: Google Wallet JWT ────────────────────────────────────────────
    if (platform === 'android') {
      const serviceEmail = Deno.env.get('GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL');
      const privateKeyPem = Deno.env.get('GOOGLE_WALLET_PRIVATE_KEY')?.replace(/\\n/g, '\n');
      const issuerId = Deno.env.get('GOOGLE_WALLET_ISSUER_ID');

      if (!serviceEmail || !privateKeyPem || !issuerId) {
        throw new Error('Faltan secrets: GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL, GOOGLE_WALLET_PRIVATE_KEY, GOOGLE_WALLET_ISSUER_ID');
      }

      const classId  = `${issuerId}.befitlab_membership`;
      const objectId = `${issuerId}.${serial}`;
      const now      = Math.floor(Date.now() / 1000);

      // Hero con degradado durazno (#E9956F → #C75D3A) subido al bucket público.
      // Si el upload falla, se usa el hero anterior para no romper el pase.
      let heroUri = 'https://fifaowaiokauhuqklzwe.supabase.co/storage/v1/object/public/wallet-passes/befit-hero.png';
      try {
        const heroPng = await generatePNG(1032, 336, (_x, y) => lerpColor(PEACH, CREAM, Math.min((y / 335) / 0.20, 1)));
        await supabase.storage
          .from('wallet-passes')
          .upload('befit-hero-gradient.png', heroPng, { contentType: 'image/png', upsert: true });
        heroUri = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/wallet-passes/befit-hero-gradient.png`;
      } catch (_e) { /* fallback al hero anterior */ }

      // Logo: marca real en blanco subida al bucket (fallback al logo anterior).
      let logoUri = 'https://fifaowaiokauhuqklzwe.supabase.co/storage/v1/object/public/wallet-passes/befit-logo.png';
      try {
        await supabase.storage
          .from('wallet-passes')
          .upload('befit-mark.png', markPng, { contentType: 'image/png', upsert: true });
        logoUri = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/wallet-passes/befit-mark.png`;
      } catch (_e) { /* fallback al logo anterior */ }

      const jwtPayload = {
        iss: serviceEmail,
        aud: 'google',
        typ: 'savetowallet',
        iat: now,
        origins: [],
        payload: {
          genericObjects: [{
            id: objectId,
            classId,
            genericType: 'GENERIC_TYPE_UNSPECIFIED',
            state: 'ACTIVE',
            hexBackgroundColor: '#F3EADF',
            logo: {
              sourceUri: { uri: logoUri },
              contentDescription: { defaultValue: { language: 'es', value: 'Be Fit Lab' } },
            },
            cardTitle:  { defaultValue: { language: 'es', value: 'BE FIT LAB'  } },
            subheader:  { defaultValue: { language: 'es', value: 'Membresía'   } },
            header:     { defaultValue: { language: 'es', value: memberName    } },
            textModulesData: [
              { id: 'status',  header: 'ESTADO', body: status },
              { id: 'plan',    header: 'PLAN',   body: plan   },
            ],
            barcode: {
              type: 'QR_CODE',
              value: userId,
              alternateText: serial,
            },
            heroImage: {
              sourceUri: { uri: heroUri },
              contentDescription: { defaultValue: { language: 'es', value: 'Be Fit Lab' } },
            },
          }],
        },
      };

      const token = await signRS256JWT(jwtPayload, privateKeyPem);
      const saveUrl = `https://pay.google.com/gp/v/save/${token}`;

      return new Response(
        JSON.stringify({ saveUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const p12Base64   = Deno.env.get('WALLET_P12_BASE64');
    const p12Password = Deno.env.get('WALLET_P12_PASSWORD');
    const passTypeId  = Deno.env.get('WALLET_PASS_TYPE_ID');
    const teamId      = Deno.env.get('WALLET_TEAM_ID');
    const wwdrPem     = Deno.env.get('WALLET_WWDR_PEM');

    if (!p12Base64 || !p12Password || !passTypeId || !teamId || !wwdrPem) {
      throw new Error('Faltan secrets: WALLET_P12_BASE64, WALLET_P12_PASSWORD, WALLET_PASS_TYPE_ID, WALLET_TEAM_ID, WALLET_WWDR_PEM');
    }

    const serialNumber = serial;

    // ── 1. pass.json ─────────────────────────────────────────────────────────────
    const passJson = JSON.stringify({
      formatVersion: 1,
      passTypeIdentifier: passTypeId,
      serialNumber,
      teamIdentifier: teamId,
      organizationName: 'Be Fit Lab',
      description: 'Membresía Be Fit Lab',
      foregroundColor: 'rgb(61, 51, 44)',
      backgroundColor: 'rgb(243, 234, 223)',
      labelColor:      'rgb(140, 111, 90)',
      logoText: 'BE FIT LAB',
      storeCard: {
        headerFields: [
          { key: 'status', label: 'ESTADO', value: status },
        ],
        primaryFields: [
          { key: 'name', label: 'SOCIA', value: memberName },
        ],
        secondaryFields: [
          { key: 'plan', label: 'PLAN', value: plan },
        ],
        backFields: [
          {
            key: 'info',
            label: 'Be Fit Lab',
            value: 'Presenta este pase en el mostrador para registrar tu asistencia.\n\nPuedes actualizar tus clases tocando "Actualizar Wallet" en la app.\n\nbefitlab.com',
          },
          { key: 'serial', label: 'ID de membresía', value: serialNumber },
        ],
      },
      barcode: {
        message: userId,
        format: 'PKBarcodeFormatQR',
        messageEncoding: 'iso-8859-1',
        altText: serialNumber,
      },
      barcodes: [
        {
          message: userId,
          format: 'PKBarcodeFormatQR',
          messageEncoding: 'iso-8859-1',
          altText: serialNumber,
        },
      ],
    });

    // ── 2. Imágenes de marca (PNG generados programáticamente) ───────────────────
    // strip@2x  — banner con degradado durazno #E9956F→#C75D3A (624×246 px, storeCard)
    // strip     — versión 1x (312×123 px)
    // icon@2x   — durazno de marca sólido (58×58 px) — se ve en notificaciones/lock
    // icon      — durazno de marca sólido (29×29 px)
    // logo.png/@2x — marca real a color (markPng) junto al wordmark "BE FIT LAB"
    //  del logoText, en vez del cuadro naranja sólido que se veía genérico
    const [
      strip2x, strip1x,
      icon2x,  icon1x,
    ] = await Promise.all([
      generatePNG(624, 246, (_x, y) => lerpColor(PEACH, CREAM, Math.min((y / 245) / 0.20, 1))),
      generatePNG(312, 123, (_x, y) => lerpColor(PEACH, CREAM, Math.min((y / 122) / 0.20, 1))),
      generatePNG(58,  58,  () => ICON),
      generatePNG(29,  29,  () => ICON),
    ]);

    // ── 3. SHA-1 de cada archivo (Web Crypto) ────────────────────────────────────
    const sha1Hex = async (data: Uint8Array): Promise<string> => {
      const buf = await crypto.subtle.digest('SHA-1', data);
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const enc = new TextEncoder();
    const passJsonBytes = enc.encode(passJson);

    const [
      passHash, strip2xHash, strip1xHash,
      icon2xHash, icon1xHash, logoHash,
    ] = await Promise.all([
      sha1Hex(passJsonBytes),
      sha1Hex(strip2x), sha1Hex(strip1x),
      sha1Hex(icon2x),  sha1Hex(icon1x),
      sha1Hex(markPng),
    ]);

    const manifest = JSON.stringify({
      'pass.json':    passHash,
      'strip.png':    strip1xHash,
      'strip@2x.png': strip2xHash,
      'icon.png':     icon1xHash,
      'icon@2x.png':  icon2xHash,
      'logo.png':     logoHash,
      'logo@2x.png':  logoHash,
    });

    // ── 4. Firma PKCS#7 ──────────────────────────────────────────────────────────
    const p12Der  = forge.util.decode64(p12Base64);
    const p12Asn1 = forge.asn1.fromDer(p12Der);
    const p12Obj  = forge.pkcs12.pkcs12FromAsn1(p12Asn1, p12Password);

    const keyBags  = p12Obj.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
    const certBags = p12Obj.getBags({ bagType: forge.pki.oids.certBag });

    const privateKey  = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]![0].key!;
    const certificate = certBags[forge.pki.oids.certBag]![0].cert!;
    const wwdrCert    = forge.pki.certificateFromPem(wwdrPem);

    const p7 = forge.pkcs7.createSignedData();
    p7.content = forge.util.createBuffer(manifest);
    p7.addCertificate(certificate);
    p7.addCertificate(wwdrCert);
    p7.addSigner({
      key: privateKey,
      certificate,
      digestAlgorithm: forge.pki.oids.sha1,
      authenticatedAttributes: [
        { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
        { type: forge.pki.oids.messageDigest },
        { type: forge.pki.oids.signingTime, value: new Date() },
      ],
    });
    p7.sign({ detached: true });

    const signatureDer   = forge.asn1.toDer(p7.toAsn1()).getBytes();
    const signatureBytes = Uint8Array.from(signatureDer, c => c.charCodeAt(0));

    // ── 5. Ensamblar .pkpass (ZIP sin compresión) ─────────────────────────────────
    const files: Array<[string, Uint8Array]> = [
      ['pass.json',     passJsonBytes],
      ['manifest.json', enc.encode(manifest)],
      ['signature',     signatureBytes],
      ['strip.png',     strip1x],
      ['strip@2x.png',  strip2x],
      ['icon.png',      icon1x],
      ['icon@2x.png',   icon2x],
      ['logo.png',      markPng],
      ['logo@2x.png',   markPng],
    ];

    const zipBytes = buildZip(files);

    // ── 6. Subir a Storage y devolver URL firmada ────────────────────────────────
    const fileName = `passes/${userId}.pkpass`;

    const { error: uploadError } = await supabase.storage
      .from('wallet-passes')
      .upload(fileName, zipBytes, {
        contentType: 'application/vnd.apple.pkpass',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: signedData } = await supabase.storage
      .from('wallet-passes')
      .createSignedUrl(fileName, 300);

    if (!signedData?.signedUrl) throw new Error('No se pudo generar URL firmada');

    await supabase.from('users').update({
      wallet_pass_serial:     serialNumber,
      wallet_pass_updated_at: new Date().toISOString(),
    }).eq('id', userId);

    return new Response(
      JSON.stringify({ passUrl: signedData.signedUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Error generando pass:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ── Generador de PNG (zlib/deflate + raw pixel data RGB) ─────────────────────
function lerpColor(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

async function generatePNG(
  width: number,
  height: number,
  getPixel: (x: number, y: number) => [number, number, number]
): Promise<Uint8Array> {
  // Raw scanlines: 1 filter byte + RGB per pixel per row
  const rowBytes = 1 + width * 3;
  const raw = new Uint8Array(rowBytes * height);
  for (let y = 0; y < height; y++) {
    raw[y * rowBytes] = 0; // filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b] = getPixel(x, y);
      const off = y * rowBytes + 1 + x * 3;
      raw[off] = r; raw[off + 1] = g; raw[off + 2] = b;
    }
  }

  // Compress scanlines with zlib (what PNG IDAT expects)
  const cs = new CompressionStream('deflate');
  const w = cs.writable.getWriter();
  w.write(raw);
  w.close();
  const parts: Uint8Array[] = [];
  const reader = cs.readable.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    parts.push(value);
  }
  const compressed = concat(parts);

  // PNG signature
  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR (13 bytes)
  const ihdr = new Uint8Array(13);
  const hv = new DataView(ihdr.buffer);
  hv.setUint32(0, width); hv.setUint32(4, height);
  ihdr[8] = 8; ihdr[9] = 2; // bit depth 8, color type RGB

  const mkChunk = (type: string, data: Uint8Array): Uint8Array => {
    const t = new TextEncoder().encode(type);
    const lenBuf = new Uint8Array(4);
    new DataView(lenBuf.buffer).setUint32(0, data.length);
    const crcInput = concat([t, data]);
    const crcVal = crc32(crcInput);
    const crcBuf = new Uint8Array(4);
    new DataView(crcBuf.buffer).setUint32(0, crcVal);
    return concat([lenBuf, t, data, crcBuf]);
  };

  return concat([sig, mkChunk('IHDR', ihdr), mkChunk('IDAT', compressed), mkChunk('IEND', new Uint8Array(0))]);
}

// ── ZIP builder (STORE, sin compresión) ──────────────────────────────────────
function buildZip(files: Array<[string, Uint8Array]>): Uint8Array {
  const enc = new TextEncoder();
  const parts: Uint8Array[] = [];
  const centralDir: Uint8Array[] = [];
  let offset = 0;

  for (const [name, data] of files) {
    const nameBytes = enc.encode(name);
    const crc = crc32(data);
    const localHeader = makeLocalHeader(nameBytes, data.length, crc);
    parts.push(localHeader, data);
    centralDir.push(makeCentralDirEntry(nameBytes, data.length, crc, offset));
    offset += localHeader.length + data.length;
  }

  const cdBytes = concat(centralDir);
  return concat([...parts, cdBytes, makeEOCD(files.length, cdBytes.length, offset)]);
}

function makeLocalHeader(name: Uint8Array, size: number, crc: number): Uint8Array {
  const buf = new ArrayBuffer(30 + name.length);
  const v = new DataView(buf);
  v.setUint32(0, 0x04034b50, true);
  v.setUint16(4, 20, true); v.setUint16(6, 0, true); v.setUint16(8, 0, true);
  v.setUint16(10, 0, true); v.setUint16(12, 0, true);
  v.setUint32(14, crc, true); v.setUint32(18, size, true); v.setUint32(22, size, true);
  v.setUint16(26, name.length, true); v.setUint16(28, 0, true);
  new Uint8Array(buf).set(name, 30);
  return new Uint8Array(buf);
}

function makeCentralDirEntry(name: Uint8Array, size: number, crc: number, offset: number): Uint8Array {
  const buf = new ArrayBuffer(46 + name.length);
  const v = new DataView(buf);
  v.setUint32(0, 0x02014b50, true);
  v.setUint16(4, 20, true); v.setUint16(6, 20, true); v.setUint16(8, 0, true);
  v.setUint16(10, 0, true); v.setUint16(12, 0, true); v.setUint16(14, 0, true);
  v.setUint32(16, crc, true); v.setUint32(20, size, true); v.setUint32(24, size, true);
  v.setUint16(28, name.length, true);
  v.setUint16(30, 0, true); v.setUint16(32, 0, true);
  v.setUint16(34, 0, true); v.setUint16(36, 0, true);
  v.setUint32(38, 0, true); v.setUint32(42, offset, true);
  new Uint8Array(buf).set(name, 46);
  return new Uint8Array(buf);
}

function makeEOCD(count: number, cdSize: number, cdOffset: number): Uint8Array {
  const buf = new ArrayBuffer(22);
  const v = new DataView(buf);
  v.setUint32(0, 0x06054b50, true);
  v.setUint16(4, 0, true); v.setUint16(6, 0, true);
  v.setUint16(8, count, true); v.setUint16(10, count, true);
  v.setUint32(12, cdSize, true); v.setUint32(16, cdOffset, true);
  v.setUint16(20, 0, true);
  return new Uint8Array(buf);
}

function concat(arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((s, a) => s + a.length, 0);
  const out = new Uint8Array(total);
  let pos = 0;
  for (const a of arrays) { out.set(a, pos); pos += a.length; }
  return out;
}

function crc32(data: Uint8Array): number {
  let crc = 0xFFFFFFFF;
  for (const byte of data) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// ── Google Wallet JWT (RS256) ─────────────────────────────────────────────────
async function signRS256JWT(payload: object, privateKeyPem: string): Promise<string> {
  const enc = new TextEncoder();
  const header  = b64url(enc.encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const body    = b64url(enc.encode(JSON.stringify(payload)));
  const unsigned = `${header}.${body}`;

  const pemB64 = privateKeyPem
    .replace(/-----BEGIN (?:RSA )?PRIVATE KEY-----/g, '')
    .replace(/-----END (?:RSA )?PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '');
  const keyBytes = Uint8Array.from(atob(pemB64), c => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    'pkcs8', keyBytes,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign'],
  );
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(unsigned));
  return `${unsigned}.${b64url(new Uint8Array(sig))}`;
}

function b64url(input: Uint8Array): string {
  return btoa(String.fromCharCode(...input))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
