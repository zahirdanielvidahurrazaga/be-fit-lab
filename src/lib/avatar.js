import { supabase } from './supabase';

// Sube un avatar (data URL o Blob) a Supabase Storage en avatars/{userId}/avatar.jpg
// y devuelve la URL pública con cache-busting (?v=timestamp), ya que la ruta es
// fija y el navegador/CDN cachearía la imagen anterior.
export async function uploadAvatar(userId, source) {
  if (!userId || !source) return { url: null, error: 'datos_incompletos' };

  let blob;
  try {
    blob = source instanceof Blob ? source : await (await fetch(source)).blob();
  } catch (e) {
    return { url: null, error: e };
  }

  const path = `${userId}/avatar.jpg`;
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, blob, { upsert: true, contentType: 'image/jpeg', cacheControl: '3600' });

  if (error) return { url: null, error };

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  const url = `${data.publicUrl}?v=${Date.now()}`;
  return { url, error: null };
}

// ¿La cadena es un avatar base64 heredado (modelo viejo) que conviene migrar?
export const isLegacyDataUrl = (s) => typeof s === 'string' && s.startsWith('data:');
