import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// @ts-ignore — node-forge es CJS, default import necesario en Deno
import forge from 'npm:node-forge@1.3.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Colores de marca Be Fit Lab
const ORANGE: [number, number, number] = [255, 139, 66];
const DARK:   [number, number, number] = [28,  28,  26];

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { userId } = await req.json();
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

    const p12Base64   = Deno.env.get('WALLET_P12_BASE64');
    const p12Password = Deno.env.get('WALLET_P12_PASSWORD');
    const passTypeId  = Deno.env.get('WALLET_PASS_TYPE_ID');
    const teamId      = Deno.env.get('WALLET_TEAM_ID');
    const wwdrPem     = Deno.env.get('WALLET_WWDR_PEM');

    if (!p12Base64 || !p12Password || !passTypeId || !teamId || !wwdrPem) {
      throw new Error('Faltan secrets: WALLET_P12_BASE64, WALLET_P12_PASSWORD, WALLET_PASS_TYPE_ID, WALLET_TEAM_ID, WALLET_WWDR_PEM');
    }

    const serialNumber = `BEFIT-${userId.substring(0, 8).toUpperCase()}`;
    const memberName   = userData.full_name || userData.email.split('@')[0];
    const plan         = userData.membership_plan || 'Sin Plan';
    const classes      = String(userData.classes_remaining ?? 0);
    const status       = userData.membership_status === 'ACTIVE' ? 'Activa ✓' : 'Inactiva';

    // ── 1. pass.json ─────────────────────────────────────────────────────────────
    const passJson = JSON.stringify({
      formatVersion: 1,
      passTypeIdentifier: passTypeId,
      serialNumber,
      teamIdentifier: teamId,
      organizationName: 'Be Fit Lab',
      description: 'Membresía Be Fit Lab',
      foregroundColor: 'rgb(255, 255, 255)',
      backgroundColor: 'rgb(28, 28, 26)',
      labelColor:      'rgb(255, 139, 66)',
      logoText: 'BE FIT LAB',
      storeCard: {
        headerFields: [
          { key: 'plan', label: 'PLAN', value: plan },
        ],
        primaryFields: [
          { key: 'name', label: 'SOCIA', value: memberName },
        ],
        secondaryFields: [
          { key: 'classes', label: 'CLASES RESTANTES', value: classes },
          { key: 'status',  label: 'ESTADO',           value: status  },
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
    // strip@2x  — banner naranja→oscuro (624×246 px, storeCard)
    // strip     — versión 1x (312×123 px)
    // icon@2x   — naranja sólido  (58×58 px)
    // icon      — naranja sólido  (29×29 px)
    // logo@2x   — naranja sólido  (160×50 px)
    // logo      — naranja sólido  (80×25 px)
    const [
      strip2x, strip1x,
      icon2x,  icon1x,
      logo2x,  logo1x,
    ] = await Promise.all([
      generatePNG(624, 246, (_x, y) => lerpColor(ORANGE, DARK, y / 245)),
      generatePNG(312, 123, (_x, y) => lerpColor(ORANGE, DARK, y / 122)),
      generatePNG(58,  58,  () => ORANGE),
      generatePNG(29,  29,  () => ORANGE),
      generatePNG(160, 50,  () => ORANGE),
      generatePNG(80,  25,  () => ORANGE),
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
      icon2xHash, icon1xHash, logo2xHash, logo1xHash,
    ] = await Promise.all([
      sha1Hex(passJsonBytes),
      sha1Hex(strip2x), sha1Hex(strip1x),
      sha1Hex(icon2x),  sha1Hex(icon1x),
      sha1Hex(logo2x),  sha1Hex(logo1x),
    ]);

    const manifest = JSON.stringify({
      'pass.json':    passHash,
      'strip.png':    strip1xHash,
      'strip@2x.png': strip2xHash,
      'icon.png':     icon1xHash,
      'icon@2x.png':  icon2xHash,
      'logo.png':     logo1xHash,
      'logo@2x.png':  logo2xHash,
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
      ['logo.png',      logo1x],
      ['logo@2x.png',   logo2x],
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
