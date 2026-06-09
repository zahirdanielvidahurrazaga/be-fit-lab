// Optimiza las imágenes de la cafetería: las fuentes son PNG 1024x1024 (~300KB)
// pero en la UI se muestran a 90px (card) / 180px (ficha) y el banner a ancho completo.
// Genera WebP redimensionados (mantiene los PNG originales como respaldo).
//   node optimize_cafe_images.cjs
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, 'public', 'cafeteria');

// Productos del menú (fondo blanco, se usan con mix-blend multiply). 512px cubre
// la ficha de 180px en pantallas retina 3x con margen de sobra.
const PRODUCTS = [
  'mango_matcha', 'mango_protein', 'horchata_protein', 'arroz_con_leche',
  'banana_mani', 'chai_frambuesa', 'choco_banana', 'dubai_protein',
  'mazapan', 'fit_colada',
];

async function run() {
  let before = 0, after = 0;
  for (const name of PRODUCTS) {
    const src = path.join(DIR, `${name}.png`);
    const out = path.join(DIR, `${name}.webp`);
    if (!fs.existsSync(src)) { console.warn('  ⚠ falta', src); continue; }
    await sharp(src)
      .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(out);
    const b = fs.statSync(src).size, a = fs.statSync(out).size;
    before += b; after += a;
    console.log(`  ${name}: ${(b/1024).toFixed(0)}KB → ${(a/1024).toFixed(0)}KB`);
  }

  // Banner promocional: se muestra a ancho completo (aspect 4/5). 1080px de ancho
  // basta para móvil retina; quality un poco menor porque es decorativo.
  const promoSrc = path.join(DIR, 'Promocional.png');
  if (fs.existsSync(promoSrc)) {
    const out = path.join(DIR, 'Promocional.webp');
    await sharp(promoSrc).resize(1080, null, { withoutEnlargement: true }).webp({ quality: 80 }).toFile(out);
    const b = fs.statSync(promoSrc).size, a = fs.statSync(out).size;
    before += b; after += a;
    console.log(`  Promocional: ${(b/1024).toFixed(0)}KB → ${(a/1024).toFixed(0)}KB`);
  }

  console.log(`\nTotal: ${(before/1024/1024).toFixed(2)}MB → ${(after/1024/1024).toFixed(2)}MB (-${(100*(1-after/before)).toFixed(0)}%)`);
}
run().catch(e => { console.error(e); process.exit(1); });
