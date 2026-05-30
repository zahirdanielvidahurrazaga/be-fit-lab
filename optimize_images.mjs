// Optimización de imágenes in-place con sharp.
// Recomprime y redimensiona manteniendo nombre y formato (no hay que tocar el código).
// Originales respaldados en ~/Desktop/be-fit-lab-IMAGENES-ORIGINALES-backup
import sharp from 'sharp';
import { readdir, stat, rename, unlink } from 'fs/promises';
import path from 'path';

const PUBLIC = path.resolve('public');

// No tocar: iconos, favicons, logos pequeños, manifest assets
const SKIP_NAMES = new Set(['favicon.png', 'logo.png', 'logo2.png', 'icons.svg']);
const SKIP_DIRS = new Set(['icons']);

// Límites de ancho por tipo de uso (heurística por carpeta)
function maxWidthFor(relPath) {
  if (relPath.includes('cafeteria')) return 800;   // tarjetas de producto
  if (/card\.png$/i.test(relPath)) return 900;      // tarjetas de clase
  return 1920;                                       // fotos hero / fondos
}

const JPG_Q = 82;
const PNG_Q = 80;

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      files.push(...await walk(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

function isRaster(f) {
  return /\.(jpe?g|png)$/i.test(f);
}

let totalBefore = 0, totalAfter = 0, count = 0, skipped = 0;

const files = await walk(PUBLIC);
for (const file of files) {
  const base = path.basename(file);
  const rel = path.relative(PUBLIC, file);
  if (!isRaster(file) || SKIP_NAMES.has(base)) { continue; }

  const before = (await stat(file)).size;
  const isPng = /\.png$/i.test(file);
  const maxW = maxWidthFor(rel);

  try {
    const img = sharp(file, { failOn: 'none' });
    const meta = await img.metadata();
    const pipeline = img.rotate(); // respeta orientación EXIF antes de strip
    if (meta.width && meta.width > maxW) {
      pipeline.resize({ width: maxW, withoutEnlargement: true });
    }
    if (isPng) {
      pipeline.png({ quality: PNG_Q, compressionLevel: 9, palette: true });
    } else {
      pipeline.jpeg({ quality: JPG_Q, mozjpeg: true });
    }
    const tmp = file + '.opt.tmp';
    await pipeline.toFile(tmp);
    const after = (await stat(tmp)).size;

    // Solo reemplazar si realmente quedó más chico
    if (after < before) {
      await rename(tmp, file);
      totalBefore += before; totalAfter += after; count++;
      const pct = ((1 - after / before) * 100).toFixed(0);
      console.log(`✓ ${rel}  ${(before/1e6).toFixed(2)}MB → ${(after/1e6).toFixed(2)}MB  (-${pct}%)`);
    } else {
      await unlink(tmp);
      skipped++;
    }
  } catch (err) {
    console.warn(`✗ ${rel}: ${err.message}`);
    skipped++;
  }
}

console.log(`\n=== Optimizadas ${count} imágenes | ${skipped} sin cambios ===`);
console.log(`Total: ${(totalBefore/1e6).toFixed(1)}MB → ${(totalAfter/1e6).toFixed(1)}MB  (ahorro ${((1-totalAfter/totalBefore)*100).toFixed(0)}%)`);
