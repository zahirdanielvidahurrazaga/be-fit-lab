import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// @ts-ignore — node-forge es CJS, default import necesario en Deno
import forge from 'npm:node-forge@1.3.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Colores de marca Be Fit Lab — paleta "durazno cálido" (degradado)
const ORANGE:      [number, number, number] = [255, 145, 77];  // #FF914D  ícono de marca
const PEACH:       [number, number, number] = [199, 93,  58];  // #C75D3A  fondo + base de la franja
const PEACH_LIGHT: [number, number, number] = [233, 149, 111]; // #E9956F  parte alta de la franja (degradado)

// Marca real Be Fit Lab en BLANCO (durazno + hoja, sin texto) — PNG 188×240 transparente.
// Se incrusta en base64 para usarla como logo.png del .pkpass (Apple) y, en Android,
// se sube al bucket para referenciarla como logo de Google Wallet.
const MARK_WHITE_B64 = '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';
const markWhitePng = Uint8Array.from(atob(MARK_WHITE_B64), c => c.charCodeAt(0));

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
    const status     = userData.membership_status === 'ACTIVE' ? 'Activa ✓' : 'Inactiva';
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
        const heroPng = await generatePNG(1032, 336, (_x, y) => lerpColor(PEACH_LIGHT, PEACH, y / 335));
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
          .upload('befit-mark-white.png', markWhitePng, { contentType: 'image/png', upsert: true });
        logoUri = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/wallet-passes/befit-mark-white.png`;
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
            hexBackgroundColor: '#C75D3A',
            logo: {
              sourceUri: { uri: logoUri },
              contentDescription: { defaultValue: { language: 'es', value: 'Be Fit Lab' } },
            },
            cardTitle:  { defaultValue: { language: 'es', value: 'BE FIT LAB'  } },
            subheader:  { defaultValue: { language: 'es', value: 'Membresía'   } },
            header:     { defaultValue: { language: 'es', value: memberName    } },
            textModulesData: [
              { id: 'plan',    header: 'PLAN',   body: plan   },
              { id: 'status',  header: 'ESTADO', body: status },
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
      foregroundColor: 'rgb(255, 255, 255)',
      backgroundColor: 'rgb(199, 93, 58)',
      labelColor:      'rgb(255, 233, 220)',
      logoText: 'BE FIT LAB',
      storeCard: {
        headerFields: [
          { key: 'plan', label: 'PLAN', value: plan },
        ],
        primaryFields: [
          { key: 'name', label: 'SOCIA', value: memberName },
        ],
        secondaryFields: [
          { key: 'status',  label: 'ESTADO', value: status },
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
    // logo.png/@2x — marca real en blanco (markWhitePng) junto al wordmark "BE FIT LAB"
    //  del logoText, en vez del cuadro naranja sólido que se veía genérico
    const [
      strip2x, strip1x,
      icon2x,  icon1x,
    ] = await Promise.all([
      generatePNG(624, 246, (_x, y) => lerpColor(PEACH_LIGHT, PEACH, y / 245)),
      generatePNG(312, 123, (_x, y) => lerpColor(PEACH_LIGHT, PEACH, y / 122)),
      generatePNG(58,  58,  () => ORANGE),
      generatePNG(29,  29,  () => ORANGE),
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
      sha1Hex(markWhitePng),
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
      ['logo.png',      markWhitePng],
      ['logo@2x.png',   markWhitePng],
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
