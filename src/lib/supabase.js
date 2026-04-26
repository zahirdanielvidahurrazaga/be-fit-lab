import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validación estricta para evitar que la App se ponga en blanco si olvidaron poner la URL real
const isValidUrl = supabaseUrl && supabaseUrl.startsWith('http');
const finalUrl = isValidUrl ? supabaseUrl : 'https://placeholder.supabase.co';
const finalKey = supabaseAnonKey && supabaseAnonKey.length > 20 ? supabaseAnonKey : 'placeholder';

if (!isValidUrl) {
  console.warn("⚠️ Las variables de Supabase están vacías o son inválidas. Usando MODO SEGURO (Offline).")
}

export const supabase = createClient(finalUrl, finalKey)
