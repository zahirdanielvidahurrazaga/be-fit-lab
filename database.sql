-- BEFIT LAB - SUPABASE SCHEMA FINAL

-- 1. Tabla de Usuarios y Roles (vinculada a auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'CLIENT' CHECK (role IN ('ADMIN', 'COACH', 'CLIENT')),
  classes_remaining INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Seguridad de Fila (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Políticas para la tabla users
DROP POLICY IF EXISTS "Usuarios ven su propio perfil" ON public.users;
CREATE POLICY "Usuarios ven su propio perfil" ON public.users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admin ve todo" ON public.users;
CREATE POLICY "Admin ve todo" ON public.users FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
);

-- 2. Tabla de Clases (Agenda Global)
CREATE TABLE IF NOT EXISTS public.classes (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  instructor TEXT NOT NULL,
  day INTEGER NOT NULL, -- Día del mes (1-31)
  time TEXT NOT NULL,
  level TEXT NOT NULL,
  spots INTEGER NOT NULL DEFAULT 10,
  color TEXT DEFAULT 'var(--primary)',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cualquiera ve clases" ON public.classes;
CREATE POLICY "Cualquiera ve clases" ON public.classes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff edita clases" ON public.classes;
CREATE POLICY "Staff edita clases" ON public.classes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('ADMIN', 'COACH'))
);

-- 3. Tabla de Reservas
CREATE TABLE IF NOT EXISTS public.reservations (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  class_id BIGINT REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  checked_in BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, class_id)
);

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios ven sus reservas" ON public.reservations;
CREATE POLICY "Usuarios ven sus reservas" ON public.reservations FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Staff ve todas las reservas" ON public.reservations;
CREATE POLICY "Staff ve todas las reservas" ON public.reservations FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('ADMIN', 'COACH'))
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_reservations_user ON public.reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_class ON public.reservations(class_id);

-- 4. TRIGGER: Crear perfil automático al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, classes_remaining)
  VALUES (new.id, new.email, 'CLIENT', 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Borrar trigger si ya existe para evitar errores
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. DATOS DE EJEMPLO (Obligatorio para que la App no esté vacía inicialmentte)
INSERT INTO public.classes (title, instructor, day, time, level, spots, color) VALUES 
('Reformer Pro', 'Valeria N.', EXTRACT(DAY FROM CURRENT_DATE), '07:00 AM', 'Avanzado', 10, 'var(--primary)'),
('Pilates Flow', 'Amanda T.', EXTRACT(DAY FROM CURRENT_DATE), '09:00 AM', 'Intermedio', 10, 'var(--accent)'),
('Fuerza y Control', 'Elena R.', EXTRACT(DAY FROM CURRENT_DATE), '06:00 PM', 'Todos los niveles', 10, '#76D8C3');
