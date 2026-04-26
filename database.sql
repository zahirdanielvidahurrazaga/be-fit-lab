-- =========================================================
-- ESTRUCTURA BEFIT LAB: Supabase PostgreSQL
-- =========================================================

-- 1. Tabla de Usuarios (Dueñas y Alumnas)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT CHECK (role IN ('ADMIN', 'CLIENT')) DEFAULT 'CLIENT',
  phone TEXT,
  subscription_status TEXT CHECK (subscription_status IN ('ACTIVE', 'PENDING', 'INACTIVE')) DEFAULT 'INACTIVE',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de Clases (Catálogo de Disciplinas)
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  instructor TEXT NOT NULL,
  capacity INT NOT NULL DEFAULT 15,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  type TEXT CHECK (type IN ('Reformer', 'Yoga', 'Strength', 'Recovery')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de Reservas (Bookings)
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('CONFIRMED', 'CANCELLED', 'ATTENDED')) DEFAULT 'CONFIRMED',
  booked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabla de Planes Nutricionales (Nutrition Plans)
CREATE TABLE nutrition_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  calories INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================================
-- DATOS SEMILLA (PRUEBA PARA LA JUNTA)
-- =========================================================

-- Insertar Dueña y 3 Clientas de prueba
INSERT INTO users (id, email, full_name, role, phone, subscription_status) VALUES 
('11111111-1111-1111-1111-111111111111', 'admin@befitlab.com', 'Amanda (Dueña)', 'ADMIN', '555-0000', 'ACTIVE'),
('22222222-2222-2222-2222-222222222222', 'cliente1@correo.com', 'Valeria Martínez', 'CLIENT', '555-1234', 'ACTIVE'),
('33333333-3333-3333-3333-333333333333', 'cliente2@correo.com', 'Sofía Castro', 'CLIENT', '555-5678', 'PENDING'),
('44444444-4444-4444-4444-444444444444', 'cliente3@correo.com', 'Regina Díaz', 'CLIENT', '555-9012', 'ACTIVE');

-- Insertar Catálogo de Clases
INSERT INTO classes (id, title, instructor, capacity, scheduled_at, type) VALUES 
('aaaa1111-1111-1111-1111-111111111111', 'Reformer Avanzado', 'Coach Mariana', 8, NOW() + INTERVAL '1 day', 'Reformer'),
('aaaa2222-2222-2222-2222-222222222222', 'Power Yoga Flow', 'Coach Luis', 15, NOW() + INTERVAL '2 days', 'Yoga'),
('aaaa3333-3333-3333-3333-333333333333', 'Glúteo + Core', 'Coach Daniela', 12, NOW() + INTERVAL '1 day 5 hours', 'Strength');

-- Crear reservas de prueba (Bookings)
INSERT INTO bookings (user_id, class_id, status) VALUES 
('22222222-2222-2222-2222-222222222222', 'aaaa1111-1111-1111-1111-111111111111', 'CONFIRMED'),
('33333333-3333-3333-3333-333333333333', 'aaaa1111-1111-1111-1111-111111111111', 'CONFIRMED'),
('44444444-4444-4444-4444-444444444444', 'aaaa2222-2222-2222-2222-222222222222', 'CONFIRMED');

-- Asignar Plan Nutricional de prueba
INSERT INTO nutrition_plans (user_id, plan_name, calories) VALUES 
('22222222-2222-2222-2222-222222222222', 'Déficit Magro', 1400),
('44444444-4444-4444-4444-444444444444', 'Mantenimiento Fit', 1800);
