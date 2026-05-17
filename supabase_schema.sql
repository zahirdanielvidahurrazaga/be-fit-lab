-- Be Fit Lab - Supabase Schema & Security Setup

-- 1. Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Crear tablas principales
CREATE TABLE IF NOT EXISTS public.users (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  role text default 'CLIENT', -- 'CLIENT', 'COACH', 'ADMIN'
  membership_status text default 'INACTIVE', -- 'ACTIVE', 'INACTIVE'
  membership_plan text, -- Nombre del plan
  classes_remaining integer default 0,
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
  user_id uuid references public.users(id) on delete cascade not null,
  class_id uuid references public.classes(id) on delete cascade not null,
  status text default 'confirmed',
  created_at timestamp with time zone default timezone('utc'::text, now()),
  UNIQUE(user_id, class_id) -- Evitar reservas duplicadas de la misma alumna en la misma clase
);

CREATE TABLE IF NOT EXISTS public.recipes (
  id uuid default gen_random_uuid() primary key,
  time text not null, -- e.g. "Desayuno", "Almuerzo", "Cena", "Snack"
  title text not null,
  kcal text,
  time_prep text,
  img text,
  ingredients text[] default '{}',
  steps text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Habilitar RLS (Row Level Security) para proteger los datos
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Seguridad (Policies)

-- USERS
-- Los usuarios solo pueden ver y editar su propio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- CLASSES
-- Cualquier usuario autenticado (o anónimo si la app es pública) puede ver las clases
DROP POLICY IF EXISTS "Anyone can view classes" ON public.classes;
CREATE POLICY "Anyone can view classes" ON public.classes FOR SELECT USING (true);

-- Los administradores pueden gestionar las clases
DROP POLICY IF EXISTS "Admins can manage classes" ON public.classes;
CREATE POLICY "Admins can manage classes" ON public.classes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
);

-- RECIPES
-- Cualquiera puede ver las recetas
DROP POLICY IF EXISTS "Anyone can view recipes" ON public.recipes;
CREATE POLICY "Anyone can view recipes" ON public.recipes FOR SELECT USING (true);

-- Los administradores pueden gestionar las recetas
DROP POLICY IF EXISTS "Admins can manage recipes" ON public.recipes;
CREATE POLICY "Admins can manage recipes" ON public.recipes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
);

-- RESERVATIONS
-- Las alumnas solo pueden ver sus propias reservas
DROP POLICY IF EXISTS "Users can view own reservations" ON public.reservations;
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
  FROM public.users
  WHERE id = auth.uid() FOR UPDATE;

  IF v_classes_remaining <= 0 THEN
    RAISE EXCEPTION 'No tienes clases disponibles en tu membresía.';
  END IF;

  -- 3. Procesar la transacción
  UPDATE public.classes SET spots = spots - 1 WHERE id = p_class_id;
  UPDATE public.users SET classes_remaining = classes_remaining - 1 WHERE id = auth.uid();
  INSERT INTO public.reservations (user_id, class_id) VALUES (auth.uid(), p_class_id);

  RETURN true;
END;
$$;

-- Función de Base de Datos Transaccional (RPC) para cancelar reserva de forma segura
CREATE OR REPLACE FUNCTION public.cancel_class_secure(p_class_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Eliminar reserva (si no existe, no hace nada pero no falla)
  DELETE FROM public.reservations WHERE user_id = auth.uid() AND class_id = p_class_id;
  
  -- 2. Devolver cupo a la clase
  UPDATE public.classes SET spots = spots + 1 WHERE id = p_class_id;
  
  -- 3. Devolver sesión a la alumna
  UPDATE public.users SET classes_remaining = classes_remaining + 1 WHERE id = auth.uid();

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
  INSERT INTO public.users (id, email, full_name, role, membership_status, membership_plan, classes_remaining)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    'CLIENT', 
    'INACTIVE',
    NULL,
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
INSERT INTO public.users (id, email, role, membership_status, classes_remaining)
SELECT id, email, 'CLIENT', 'INACTIVE', 0
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users);

-- ==========================================
-- SCRIPT DE CORRECCIÓN: AÑADIR COLUMNAS FALTANTES A USUARIOS
-- ==========================================
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS emergency_contact_name text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS emergency_contact_phone text;

-- ==========================================
-- SEGURIDAD: Columna checked_in para asistencia
-- ==========================================
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS checked_in boolean DEFAULT false;

-- ==========================================
-- SEGURIDAD: Políticas RLS para Admin
-- ==========================================

-- Admin puede ver todos los usuarios (necesario para panel de gestión)
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users" ON public.users 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
);

-- Admin puede actualizar cualquier usuario (necesario para activar planes)
DROP POLICY IF EXISTS "Admins can update any user" ON public.users;
CREATE POLICY "Admins can update any user" ON public.users 
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
);

-- Admin puede ver todas las reservaciones (necesario para check-in)
DROP POLICY IF EXISTS "Admins can view all reservations" ON public.reservations;
CREATE POLICY "Admins can view all reservations" ON public.reservations 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
);

-- Admin puede actualizar reservaciones (necesario para marcar asistencia)
DROP POLICY IF EXISTS "Admins can update reservations" ON public.reservations;
CREATE POLICY "Admins can update reservations" ON public.reservations 
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
);

