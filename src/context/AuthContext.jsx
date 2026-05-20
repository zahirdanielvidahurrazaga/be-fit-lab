import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profileName, setProfileName] = useState('');
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
  // NUEVA: Obtener alumnas reales inscritas en una clase
  // ============================================
  const fetchClassReservations = async (classId) => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*, users:user_id(id, full_name, email, phone, membership_plan, classes_remaining, membership_status)')
        .eq('class_id', classId);

      if (error) {
        console.error('Error fetching class reservations:', error);
        return [];
      }

      if (data) {
        return data.map(r => ({
          reservationId: r.id,
          userId: r.user_id,
          checkedIn: r.checked_in,
          name: r.users?.full_name || r.users?.email?.split('@')[0] || 'Sin nombre',
          email: r.users?.email || '',
          phone: r.users?.phone || '',
          plan: r.users?.membership_plan || 'Sin Plan',
          classesRemaining: r.users?.classes_remaining || 0,
          status: r.users?.membership_status || 'INACTIVE'
        }));
      }
      return [];
    } catch (err) {
      console.error('Error fetching class reservations:', err);
      return [];
    }
  };

  // ============================================
  // NUEVA: Obtener clases por día de la semana (0-6)
  // ============================================
  const fetchClassesByDayOfWeek = async (dayOfWeek) => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('day', dayOfWeek)
        .order('time', { ascending: true });

      if (error) {
        console.error('Error fetching classes by day:', error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.error(err);
      return [];
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
        .select('role, classes_remaining, membership_plan, membership_status, full_name')
        .eq('id', currentUser.id)
        .single();
        
      if (userError && userError.code === 'PGRST116') {
        // La fila no existe (posible error del trigger o usuario antiguo). La creamos ahora mismo.
        console.log("Fila de usuario no encontrada. Creando fila...");
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
        setProfileName(userData.full_name || '');
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

        // DB Updates via secure RPC
        const { error: rpcError } = await supabase.rpc('book_class_secure', { p_class_id: classObj.id });

        if (rpcError) throw rpcError;

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

      // DB Updates via secure RPC
      const { error } = await supabase.rpc('cancel_class_secure', { p_class_id: classId });
        
      if (error) throw error;

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
    await supabase.from('classes').update({ spots: newSpots }).eq('id', id);
  };

  // ============================================
  // MEJORADO: Check-in con info completa del cliente
  // ============================================
  const checkInClient = async (qrData) => {
    if (!qrData) return { success: false, message: "Código QR inválido.", clientInfo: null };

    try {
      // 1. Buscar al usuario escaneado
      const userObj = allUsers.find(u => u.id === qrData);
      
      // Si no lo encontramos en el cache, buscarlo directamente
      let clientInfo = null;
      if (userObj) {
        clientInfo = {
          id: userObj.id,
          name: userObj.full_name || userObj.email?.split('@')[0] || 'Sin nombre',
          email: userObj.email || '',
          phone: userObj.phone || 'N/A',
          plan: userObj.membership_plan || 'Sin Plan',
          classesRemaining: userObj.classes_remaining || 0,
          status: userObj.membership_status || 'INACTIVE'
        };
      } else {
        // Buscar directo en BD
        const { data: directUser } = await supabase
          .from('users')
          .select('*')
          .eq('id', qrData)
          .single();
        
        if (directUser) {
          clientInfo = {
            id: directUser.id,
            name: directUser.full_name || directUser.email?.split('@')[0] || 'Sin nombre',
            email: directUser.email || '',
            phone: directUser.phone || 'N/A',
            plan: directUser.membership_plan || 'Sin Plan',
            classesRemaining: directUser.classes_remaining || 0,
            status: directUser.membership_status || 'INACTIVE'
          };
        }
      }

      if (!clientInfo) {
        return { success: false, message: "Usuario no encontrado en el sistema.", clientInfo: null };
      }

      // 2. Obtener reservas pendientes del usuario escaneado
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

        return { 
          success: true, 
          message: `Asistencia de ${clientInfo.name} registrada.`, 
          clientInfo 
        };
      }
      return { 
        success: false, 
        message: "Sin reservas pendientes para hoy.", 
        clientInfo 
      };
    } catch (err) {
      console.error("Error al registrar asistencia:", err);
      return { success: false, message: "Error en la base de datos.", clientInfo: null };
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
      
      // Refrescar lista de usuarios para reflejar el cambio
      fetchAllUsers();
    }
  };

  // Manejar el Modo Oscuro por usuario de forma global
  useEffect(() => {
    if (user && role === 'CLIENT') {
      const savedDark = localStorage.getItem(`befit_darkmode_${user.id}`);
      if (savedDark === 'true') {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
      }
    } else {
      // Si no hay usuario, o el rol no es CLIENT, siempre forzar light mode
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [user, role]);

  const logout = async () => {
    setUser(null);
    setRole(null);
    setPlan(null);
    setGlobalClasses([]);
    setMyReservations([]);
    setAllUsers([]);
    // Forzar light mode al cerrar sesión
    document.documentElement.setAttribute('data-theme', 'light');
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ 
      user, role, plan, membershipStatus, loading, profileName,
      classesRemaining, myReservations, globalClasses, recipes, allUsers,
      login, logout, forceCleanSession, fetchAllUsers, refreshUserData,
      bookClass, cancelClass, checkInClient, updateClassSpots,
      activatePlan, addClass, deleteClass, addRecipe, deleteRecipe,
      fetchClassReservations, fetchClassesByDayOfWeek, fetchGlobalClasses
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
