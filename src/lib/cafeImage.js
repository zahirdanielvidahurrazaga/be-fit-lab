import { supabase } from './supabase';

// Comprime una imagen (File/Blob/data URL) a JPEG ~max 900px, calidad 0.82.
// Devuelve un Blob listo para subir (evita subir fotos de 5MB del teléfono).
export function compressCafeImage(source, maxSize = 900, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const url = source instanceof Blob ? URL.createObjectURL(source) : source;
    const img = new Image();
    img.onerror = () => { if (source instanceof Blob) URL.revokeObjectURL(url); reject(new Error('no_image')); };
    img.onload = () => {
      const ratio = Math.min(1, maxSize / Math.max(img.width, img.height));
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      if (source instanceof Blob) URL.revokeObjectURL(url);
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('no_blob')), 'image/jpeg', quality);
    };
    img.src = url;
  });
}

// Sube una imagen de producto a Storage (bucket público cafe-products) con un
// nombre único y devuelve su URL pública. RLS: solo admin puede escribir.
export async function uploadCafeImage(source) {
  if (!source) return { url: null, error: 'sin_imagen' };
  let blob;
  try { blob = await compressCafeImage(source); }
  catch (e) { return { url: null, error: e }; }

  const id = (crypto?.randomUUID?.() || String(Date.now() + Math.random())).replace(/[^a-z0-9-]/gi, '');
  const path = `${id}.jpg`;
  const { error } = await supabase.storage
    .from('cafe-products')
    .upload(path, blob, { upsert: true, contentType: 'image/jpeg', cacheControl: '3600' });
  if (error) return { url: null, error };

  const { data } = supabase.storage.from('cafe-products').getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}
