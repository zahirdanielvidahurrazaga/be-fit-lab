import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [plan, setPlan] = useState(null);
  const [membershipStatus, setMembershipStatus] = useState('INACTIVE');
  const [loading, setLoading] = useState(true);

  // ESTADO GLOBAL DE RESERVAS (Supabase)
  const [classesRemaining, setClassesRemaining] = useState(0);
  const [globalClasses, setGlobalClasses] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [myReservations, setMyReservations] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  // Flag para evitar que onAuthStateChange sobreescriba un plan recién activado
  const planJustActivatedRef = useRef(false);

  // Función para limpiar sesión fantasma por completo
  const forceCleanSession = async () => {
    try { await supabase.auth.signOut(); } catch(e) {}
    // Limpiar manualmente tokens de Supabase del localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-')) localStorage.removeItem(key);
    });
    setUser(null);
    setRole(null);
    setPlan(null);
    setMembershipStatus('INACTIVE');
    setClassesRemaining(0);
    setMyReservations([]);
    setLoading(false);
  };

  useEffect(() => {
    // Verificar sesión activa inicial
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        await fetchUserData(session.user);

        // fetchUserData ya carga las reservas y maneja el loading state
      } else {
        setLoading(false);
      }
    });

    // Escuchar cambios (login, logout) reales
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        // NO re-fetch si acabamos de activar un plan (evita sobreescribir con datos viejos de la BD)
        if (!planJustActivatedRef.current) {
          fetchUserData(session.user);
        }
      } else {
        setRole(null);
        setPlan(null);
        setMembershipStatus('INACTIVE');
        setUser(null);
        setGlobalClasses([]);
        setRecipes([]);
        setMyReservations([]);
        setClassesRemaining(0);
        setLoading(false);
      }
    });

    // Cargar datos globales
    fetchGlobalClasses();
    fetchRecipes();
    fetchAllUsers();

    return () => subscription.unsubscribe();
  }, []);

  const fetchAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'CLIENT')
        .order('full_name', { ascending: true });
        
      if (data) {
        setAllUsers(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGlobalClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('day', { ascending: true })
        .order('time', { ascending: true });
        
      if (data) {
        setGlobalClasses(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecipes = async () => {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: true });
        
      if (data) {
        setRecipes(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ============================================
  // ADMIN CRUD OPERATIONS
  // ============================================
  const addClass = async (classData) => {
    try {
      const { data, error } = await supabase.from('classes').insert(classData).select().single();
      if (!error && data) setGlobalClasses(prev => [...prev, data]);
      return { success: !error, error };
    } catch (err) {
      return { success: false, error: err };
    }
  };

  const deleteClass = async (classId) => {
    try {
      const { error } = await supabase.from('classes').delete().eq('id', classId);
      if (!error) setGlobalClasses(prev => prev.filter(c => c.id !== classId));
      return { success: !error, error };
    } catch (err) {
      return { success: false, error: err };
    }
  };

  const addRecipe = async (recipeData) => {
    try {
      const { data, error } = await supabase.from('recipes').insert(recipeData).select().single();
      if (!error && data) setRecipes(prev => [...prev, data]);
      return { success: !error, error };
    } catch (err) {
      return { success: false, error: err };
    }
  };

  const deleteRecipe = async (recipeId) => {
    try {
      const { error } = await supabase.from('recipes').delete().eq('id', recipeId);
      if (!error) setRecipes(prev => prev.filter(r => r.id !== recipeId));
      return { success: !error, error };
    } catch (err) {
      return { success: false, error: err };
    }
  };

  const fetchUserData = async (currentUser) => {
    try {
      // 1. Obtener rol y clases restantes
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, classes_remaining, membership_plan, membership_status')
        .eq('id', currentUser.id)
        .single();
        
      if (userError && userError.code === 'PGRST116') {
        // La fila no existe (posible error del trigger o usuario antiguo). La creamos ahora mismo.
        console.log("Fila de usuario no encontrada. Creando fila...");
        // Intentar crear la fila (fallará silenciosamente si RLS no lo permite, pero es mejor intentarlo)
        const newRow = {
          id: currentUser.id,
          email: currentUser.email,
          full_name: currentUser.user_metadata?.full_name || '',
          role: 'CLIENT',
          membership_status: 'INACTIVE',
          classes_remaining: 0
        };
        await supabase.from('users').insert(newRow);
        
        setRole('CLIENT');
        setPlan('none');
        setMembershipStatus('INACTIVE');
        setClassesRemaining(0);
      } else if (userData) {
        setRole((userData.role || 'CLIENT').toUpperCase());
        setPlan(userData.membership_plan);
        setMembershipStatus(userData.membership_status || 'INACTIVE');
        setClassesRemaining(userData.classes_remaining || 0);
      } else {
        setRole('CLIENT');
        setPlan('none');
        setMembershipStatus('INACTIVE');
      }

      // 2. Obtener mis reservas
      const { data: resData, error: resError } = await supabase
        .from('reservations')
        .select('*, classes(*)')
        .eq('user_id', currentUser.id);

      if (resData) {
        // Formatear al estilo esperado por el frontend
        const formattedReservations = resData.map(r => ({
          id: r.id,
          classId: r.class_id,
          title: r.classes?.title,
          time: r.classes?.time,
          instructor: r.classes?.instructor,
          color: r.classes?.color,
          checkedIn: r.checked_in
        }));
        setMyReservations(formattedReservations);
      }
    } catch (err) {
      console.error("Error obteniendo datos del usuario:", err);
      setRole('CLIENT');
      setPlan('none');
      setMembershipStatus('INACTIVE');
    } finally {
      setLoading(false);
    }
  };

  const bookClass = async (classObj) => {
    if (!user) return false;
    
    if (classesRemaining > 0 && classObj.spots > 0) {
      try {
        // Optimistic UI Update
        setClassesRemaining(prev => prev - 1);
        setGlobalClasses(prev => prev.map(c => 
          c.id === classObj.id ? { ...c, spots: c.spots - 1 } : c
        ));
        setMyReservations(prev => [...prev, { 
          id: Date.now(), // temporary id
          classId: classObj.id, 
          title: classObj.title, 
          time: classObj.time, 
          instructor: classObj.instructor, 
          color: classObj.color, 
          checkedIn: false 
        }]);

        // DB Updates
        const { error: resError } = await supabase.from('reservations').insert({
          user_id: user.id,
          class_id: classObj.id
        });

        if (resError) throw resError;

        await supabase.from('classes').update({ spots: classObj.spots - 1 }).eq('id', classObj.id);
        await supabase.from('users').update({ classes_remaining: classesRemaining - 1 }).eq('id', user.id);

        return true;
      } catch (err) {
        console.error("Error reservando clase:", err);
        // Rollback
        fetchGlobalClasses();
        fetchUserData(user);
        return false;
      }
    }
    return false;
  };

  const cancelClass = async (classId) => {
    if (!user) return;
    
    const classObj = globalClasses.find(c => c.id === classId);
    
    try {
      // Optimistic UI Update
      setClassesRemaining(prev => prev + 1);
      setMyReservations(prev => prev.filter(res => res.classId !== classId));
      if (classObj) {
        setGlobalClasses(prev => prev.map(c => 
          c.id === classId ? { ...c, spots: c.spots + 1 } : c
        ));
      }

      // DB Updates
      const { error } = await supabase.from('reservations').delete()
        .eq('user_id', user.id)
        .eq('class_id', classId);
        
      if (error) throw error;

      if (classObj) {
        await supabase.from('classes').update({ spots: classObj.spots + 1 }).eq('id', classId);
      }
      await supabase.from('users').update({ classes_remaining: classesRemaining + 1 }).eq('id', user.id);

    } catch (err) {
      console.error("Error cancelando reserva:", err);
      fetchGlobalClasses();
      fetchUserData(user);
    }
  };

  const updateClassSpots = async (id, newSpots) => {
    setGlobalClasses(prev => prev.map(c => 
      c.id === id ? { ...c, spots: newSpots } : c
    ));
    // Falta permisos en BD si no es admin, pero asumiendo que lo es:
    await supabase.from('classes').update({ spots: newSpots }).eq('id', id);
  };

  const checkInClient = async (qrData) => {
    if (!qrData) return { success: false, message: "Código QR inválido." };

    try {
      // Obtener reservas pendientes del usuario escaneado
      const { data: resData, error: resError } = await supabase
        .from('reservations')
        .select('*')
        .eq('user_id', qrData)
        .eq('checked_in', false);

      if (resError) throw resError;

      if (resData && resData.length > 0) {
        // Marcar la primera reserva pendiente como asistida
        const resToUpdate = resData[0];
        const { error: updateError } = await supabase
          .from('reservations')
          .update({ checked_in: true })
          .eq('id', resToUpdate.id);
          
        if (updateError) throw updateError;
        
        // Obtener nombre para mensaje personalizado
        const userObj = allUsers.find(u => u.id === qrData);
        const name = userObj ? (userObj.full_name || userObj.email.split('@')[0]) : 'Socia';

        return { success: true, message: `Asistencia de ${name} registrada.` };
      }
      return { success: false, message: "Sin reservas pendientes." };
    } catch (err) {
      console.error("Error al registrar asistencia:", err);
      return { success: false, message: "Error en la base de datos." };
    }
  };

  const login = async (email, password) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  // Función para refrescar datos del usuario desde la BD
  const refreshUserData = async () => {
    if (user) {
      await fetchUserData(user);
    }
  };

  // Activar plan: actualiza estado local INMEDIATAMENTE + intenta persistir en BD
  // Patrón Santuario: la UI se actualiza sin depender de que la BD responda
  const activatePlan = async (planTitle, classCount, specificUserId = null) => {
    // Bloquear re-fetch automático por 10 segundos para evitar race condition
    planJustActivatedRef.current = true;
    setTimeout(() => { planJustActivatedRef.current = false; }, 10000);

    // 1. Actualizar estado local de inmediato (la UI cambia al instante)
    setPlan(planTitle);
    setMembershipStatus('ACTIVE');
    setClassesRemaining(classCount);

    // 2. Intentar persistir en la BD de forma segura
    const { data: { session } } = await supabase.auth.getSession();
    const targetId = specificUserId || session?.user?.id || user?.id;
    
    if (targetId) {
      const { error } = await supabase.from('users').update({ 
        membership_plan: planTitle, 
        membership_status: 'ACTIVE',
        classes_remaining: classCount 
      }).eq('id', targetId);
      
      if (error) {
        console.error('Error guardando plan en BD:', error);
      }
    }
  };

  const logout = async () => {
    setUser(null);
    setRole(null);
    setPlan(null);
    setGlobalClasses([]);
    setMyReservations([]);
    setAllUsers([]);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ 
      user, role, plan, membershipStatus, loading, 
      classesRemaining, myReservations, globalClasses, recipes, allUsers,
      login, logout, forceCleanSession, fetchAllUsers,
      bookClass, cancelClass, checkInClient, updateClassSpots,
      activatePlan, addClass, deleteClass, addRecipe, deleteRecipe
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
