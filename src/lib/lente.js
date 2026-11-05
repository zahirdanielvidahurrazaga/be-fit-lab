// Generador del lente de vidrio líquido (lo usan LenteVidrio y BarraGlass).

// Mapa de desplazamiento: en los bordes el fondo se "jala" hacia adentro
// (R = x, G = y; 128 = sin movimiento). Lo comparte la barra de vidrio.
export function mapaRefraccion(w, h, radio, borde) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const cx = Math.min(Math.max(x, radio), w - radio);
      const cy = Math.min(Math.max(y, radio), h - radio);
      let dx = x - cx, dy = y - cy;
      let dist = Math.hypot(dx, dy);
      let haciaBorde;
      if (dist > 0) haciaBorde = radio - dist;
      else {
        const dIzq = x, dDer = w - x, dArr = y, dAb = h - y;
        haciaBorde = Math.min(dIzq, dDer, dArr, dAb);
        if (haciaBorde === dArr) { dx = 0; dy = -1; } else if (haciaBorde === dAb) { dx = 0; dy = 1; }
        else if (haciaBorde === dIzq) { dx = -1; dy = 0; } else { dx = 1; dy = 0; }
        dist = 1;
      }
      const t = Math.max(0, 1 - haciaBorde / borde);
      const fuerza = t * t;
      const nx = dx / (dist || 1), ny = dy / (dist || 1);
      const i = (y * w + x) * 4;
      img.data[i] = 128 - nx * fuerza * 127;
      img.data[i + 1] = 128 - ny * fuerza * 127;
      img.data[i + 2] = 128;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL();
}
