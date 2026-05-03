import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  // ESTADO GLOBAL DE RESERVAS (Supabase)
  const [classesRemaining, setClassesRemaining] = useState(0);
  const [globalClasses, setGlobalClasses] = useState([]);
  const [myReservations, setMyReservations] = useState([]);

  useEffect(() => {
    // Verificar sesión activa inicial
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        // Verificar que el usuario no haya sido borrado de la base de datos (sesión fantasma)
        const { data: { user: verifiedUser }, error } = await supabase.auth.getUser();
        if (error || !verifiedUser) {
          await supabase.auth.signOut();
          setUser(null);
          setLoading(false);
          return;
        }
        setUser(session.user);
        fetchUserData(session.user);
      } else {
        setLoading(false);
      }
    });

    // Escuchar cambios (login, logout) reales
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchUserData(session.user);
      } else {
        setRole(null);
        setUser(null);
        setGlobalClasses([]);
        setMyReservations([]);
        setClassesRemaining(0);
        setLoading(false);
      }
    });

    // Cargar clases globales
    fetchGlobalClasses();

    return () => subscription.unsubscribe();
  }, []);

  const fetchGlobalClasses = async () => {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .order('day', { ascending: true })
      .order('time', { ascending: true });
      
    if (data) {
      setGlobalClasses(data);
    }
  };

  const fetchUserData = async (currentUser) => {
    try {
      // 1. Obtener rol y clases restantes
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('role, classes_remaining, plan')
        .eq('id', currentUser.id)
        .single();
        
      if (userData) {
        setRole(userData.role);
        setPlan(userData.plan);
        setClassesRemaining(userData.classes_remaining || 0);
      } else {
        setRole('CLIENT');
        setPlan('none');
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
        await supabase.from('profiles').update({ classes_remaining: classesRemaining - 1 }).eq('id', user.id);

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
      await supabase.from('profiles').update({ classes_remaining: classesRemaining + 1 }).eq('id', user.id);

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
    if (!user) return { success: false, message: "No autenticado" };
    // MOCK: En un sistema real el QR traería el reservation_id o user_id.
    // Por ahora simulamos que marca TODAS las reservas de HOY como asistidas.
    if (myReservations.length > 0) {
      setMyReservations(prev => prev.map(res => 
        res.checkedIn === false ? { ...res, checkedIn: true } : res
      ));
      
      // Update DB (marcando la primera reserva activa que encontremos)
      const resToUpdate = myReservations.find(r => !r.checkedIn);
      if (resToUpdate) {
         await supabase.from('reservations').update({ checked_in: true }).eq('user_id', user.id).eq('class_id', resToUpdate.classId);
      }
      return { success: true, message: "Asistencia registrada correctamente." };
    }
    return { success: false, message: "El usuario no tiene reservas pendientes." };
  };

  const login = async (email, password) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const logout = async () => {
    setUser(null);
    setRole(null);
    setGlobalClasses([]);
    setMyReservations([]);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ 
      user, role, plan, loading, login, logout, 
      classesRemaining, myReservations, globalClasses, 
      bookClass, cancelClass, updateClassSpots, checkInClient 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

