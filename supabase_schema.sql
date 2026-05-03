-- Be Fit Lab - Supabase Schema & Security Setup

-- 1. Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Crear tablas principales
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  plan text default 'none',
  classes_remaining integer default 0,
  role text default 'client', -- 'client', 'coach', 'admin'
  created_at timestamp with time zone default timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.classes (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  time text not null,
  day integer not null,
  instructor text,
  level text,
  spots integer default 10,
  color text,
  status text default 'active'
);

CREATE TABLE IF NOT EXISTS public.reservations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  class_id uuid references public.classes(id) on delete cascade not null,
  status text default 'confirmed',
  created_at timestamp with time zone default timezone('utc'::text, now()),
  UNIQUE(user_id, class_id) -- Evitar reservas duplicadas de la misma alumna en la misma clase
);

-- 3. Habilitar RLS (Row Level Security) para proteger los datos
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Seguridad (Policies)

-- PROFILES
-- Los usuarios solo pueden ver y editar su propio perfil
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- CLASSES
-- Cualquier usuario autenticado (o anónimo si la app es pública) puede ver las clases
CREATE POLICY "Anyone can view classes" ON public.classes FOR SELECT USING (true);

-- RESERVATIONS
-- Las alumnas solo pueden ver sus propias reservas
CREATE POLICY "Users can view own reservations" ON public.reservations FOR SELECT USING (auth.uid() = user_id);

-- 5. Función de Base de Datos Transaccional (RPC) para reservar de forma segura
-- Esto asegura que dos alumnas no puedan tomar el mismo lugar exacto al mismo tiempo (Race condition)
CREATE OR REPLACE FUNCTION public.book_class_secure(p_class_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Se ejecuta con permisos de admin para modificar tablas
AS $$
DECLARE
  v_spots_available int;
  v_classes_remaining int;
BEGIN
  -- 1. Bloquear y verificar cupos en la clase seleccionada
  SELECT spots INTO v_spots_available 
  FROM public.classes 
  WHERE id = p_class_id FOR UPDATE;
  
  IF v_spots_available <= 0 THEN
    RAISE EXCEPTION 'La clase ya no tiene cupos disponibles.';
  END IF;

  -- 2. Bloquear y verificar el saldo de la alumna
  SELECT classes_remaining INTO v_classes_remaining 
  FROM public.profiles 
  WHERE id = auth.uid() FOR UPDATE;

  IF v_classes_remaining <= 0 THEN
    RAISE EXCEPTION 'No tienes clases disponibles en tu membresía.';
  END IF;

  -- 3. Procesar la transacción
  UPDATE public.classes SET spots = spots - 1 WHERE id = p_class_id;
  UPDATE public.profiles SET classes_remaining = classes_remaining - 1 WHERE id = auth.uid();
  INSERT INTO public.reservations (user_id, class_id) VALUES (auth.uid(), p_class_id);

  RETURN true;
END;
$$;
-- ==========================================
-- SCRIPT DE CORRECCIÓN: TRIGGER DE USUARIOS
-- ==========================================

-- 1. Crear la función que copia automáticamente los datos del nuevo usuario a la tabla 'profiles'
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, plan, classes_remaining)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    'client', 
    'none', 
    0
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Asignar el trigger a la tabla interna de autenticación (auth.users)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. [Opcional pero Recomendado] Arreglar los usuarios que ya creaste durante tus pruebas
-- Esto insertará un perfil en blanco para cualquier usuario que te haya dado error hoy.
INSERT INTO public.profiles (id, email, role, plan, classes_remaining)
SELECT id, email, 'client', 'none', 0
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);
