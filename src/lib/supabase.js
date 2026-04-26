import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Asegura de mostrar un error si falta el .env para facilitar el debug en la junta
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Faltan variables de entorno de Supabase. Asegúrate de configurar tu archivo .env local.")
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder')
