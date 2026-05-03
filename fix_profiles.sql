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
