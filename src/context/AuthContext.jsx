import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // ESTADO GLOBAL DE RESERVAS (Mock BD)
  const [classesRemaining, setClassesRemaining] = useState(12);
  
  // Generar días para la semana actual
  const todayDate = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.getDate();
  });

  const [globalClasses, setGlobalClasses] = useState(() => {
    const d0 = weekDays[0], d1 = weekDays[1], d2 = weekDays[2], d3 = weekDays[3], d4 = weekDays[4], d5 = weekDays[5], d6 = weekDays[6];
    return [
      // Hoy
      { id: 1, day: d0, title: "Reformer Pro", time: "06:00 AM", instructor: "Valeria N.", level: "Avanzado", spots: 2, color: "var(--primary)" },
      { id: 2, day: d0, title: "Pilates Flow", time: "07:00 AM", instructor: "Amanda T.", level: "Intermedio", spots: 0, color: "var(--accent)" },
      { id: 3, day: d0, title: "Fuerza y Control", time: "08:30 AM", instructor: "Elena R.", level: "Todos los niveles", spots: 5, color: "#76D8C3" },
      { id: 4, day: d0, title: "Reformer Básico", time: "06:00 PM", instructor: "Valeria N.", level: "Principiante", spots: 1, color: "var(--primary)" },
      // Mañana
      { id: 5, day: d1, title: "Mat Pilates", time: "07:00 AM", instructor: "Elena R.", level: "Todos los niveles", spots: 6, color: "#76D8C3" },
      { id: 6, day: d1, title: "Reformer Intenso", time: "09:00 AM", instructor: "Valeria N.", level: "Avanzado", spots: 3, color: "var(--primary)" },
      { id: 7, day: d1, title: "Fuerza y Glúteo", time: "06:00 PM", instructor: "Amanda T.", level: "Intermedio", spots: 4, color: "var(--accent)" },
      // Día 3
      { id: 8, day: d2, title: "Reformer Pro", time: "06:00 AM", instructor: "Valeria N.", level: "Avanzado", spots: 2, color: "var(--primary)" },
      { id: 9, day: d2, title: "Stretching Profundo", time: "08:00 AM", instructor: "Elena R.", level: "Todos los niveles", spots: 8, color: "#76D8C3" },
      { id: 10, day: d2, title: "Pilates Flow", time: "05:30 PM", instructor: "Amanda T.", level: "Intermedio", spots: 1, color: "var(--accent)" },
      // Día 4
      { id: 11, day: d3, title: "Reformer Básico", time: "07:00 AM", instructor: "Valeria N.", level: "Principiante", spots: 5, color: "var(--primary)" },
      { id: 12, day: d3, title: "Core & Balance", time: "09:30 AM", instructor: "Elena R.", level: "Intermedio", spots: 3, color: "#76D8C3" },
      { id: 13, day: d3, title: "Reformer Intenso", time: "06:00 PM", instructor: "Amanda T.", level: "Avanzado", spots: 0, color: "var(--accent)" },
      // Día 5
      { id: 14, day: d4, title: "Mat Pilates", time: "06:00 AM", instructor: "Elena R.", level: "Todos los niveles", spots: 7, color: "#76D8C3" },
      { id: 15, day: d4, title: "Fuerza y Glúteo", time: "08:30 AM", instructor: "Valeria N.", level: "Intermedio", spots: 2, color: "var(--primary)" },
      { id: 16, day: d4, title: "Reformer Pro", time: "05:00 PM", instructor: "Amanda T.", level: "Avanzado", spots: 1, color: "var(--accent)" },
      // Día 6
      { id: 17, day: d5, title: "Pilates Flow", time: "08:00 AM", instructor: "Amanda T.", level: "Intermedio", spots: 4, color: "var(--accent)" },
      { id: 18, day: d5, title: "Stretching Profundo", time: "10:00 AM", instructor: "Elena R.", level: "Todos los niveles", spots: 6, color: "#76D8C3" },
      // Día 7
      { id: 19, day: d6, title: "Reformer Básico", time: "09:00 AM", instructor: "Valeria N.", level: "Principiante", spots: 5, color: "var(--primary)" },
      { id: 20, day: d6, title: "Core & Balance", time: "11:00 AM", instructor: "Elena R.", level: "Intermedio", spots: 3, color: "#76D8C3" },
    ];
  });

  const [myReservations, setMyReservations] = useState([
    { id: 101, classId: 2, title: "Pilates Flow", time: "07:00 AM", instructor: "Amanda T.", color: "var(--accent)", checkedIn: false }
  ]);

  const bookClass = (classObj) => {
    if (classesRemaining > 0 && classObj.spots > 0) {
      // 1. Restar de mis clases
      setClassesRemaining(prev => prev - 1);
      
      // 2. Agregar a mis reservas
      setMyReservations(prev => [...prev, { ...classObj, classId: classObj.id, id: Date.now(), checkedIn: false }]);
      
      // 3. Restar lugares de la clase global
      setGlobalClasses(prev => prev.map(c => 
        c.id === classObj.id ? { ...c, spots: c.spots - 1 } : c
      ));
      return true;
    }
    return false;
  };

  const cancelClass = (classId) => {
    const reservationToCancel = myReservations.find(res => res.classId === classId);
    if (reservationToCancel) {
      setClassesRemaining(prev => prev + 1);
      setMyReservations(prev => prev.filter(res => res.classId !== classId));
      
      // Devolver lugar a la clase
      setGlobalClasses(prev => prev.map(c => 
        c.id === classId ? { ...c, spots: c.spots + 1 } : c
      ));
    }
  };

  const updateClassSpots = (id, newSpots) => {
    setGlobalClasses(prev => prev.map(c => 
      c.id === id ? { ...c, spots: newSpots } : c
    ));
  };

  const checkInClient = (qrData) => {
    // Si el QR tiene datos y el cliente tiene reserva para hoy, lo marcamos como checkedIn.
    // Esto simularía buscar en la BD.
    if (myReservations.length > 0) {
      setMyReservations(prev => prev.map(res => 
        res.checkedIn === false ? { ...res, checkedIn: true } : res
      ));
      return { success: true, message: "Asistencia registrada correctamente." };
    }
    return { success: false, message: "El usuario no tiene reservas pendientes." };
  };



  useEffect(() => {
    // Verificar sesión activa inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchUserRole(session.user.email);
      } else {
        // Checar si hay mock session
        const mockUser = localStorage.getItem('mockUser');
        if (mockUser) {
           const parsed = JSON.parse(mockUser);
           setUser(parsed);
           fetchUserRole(parsed.email);
        } else {
           setLoading(false);
        }
      }
    });

    // Escuchar cambios (login, logout) reales
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchUserRole(session.user.email);
      } else {
        // Solo resetear si no estamos en mock
        if (!localStorage.getItem('mockUser')) {
          setRole(null);
          setUser(null);
          setLoading(false);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (email) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('email', email)
        .single();
        
      if (data) {
        setRole(data.role);
      } else {
        // Fallback robusto para pruebas locales
        let fallbackRole = 'CLIENT';
        if (email?.includes('admin') || email?.includes('brenda')) fallbackRole = 'ADMIN';
        if (email?.includes('coach') || email?.includes('valeria')) fallbackRole = 'COACH';
        setRole(fallbackRole);
      }
    } catch (err) {
      console.error("Error obteniendo rol:", err);
      let fallbackRole = 'CLIENT';
      if (email?.includes('admin') || email?.includes('brenda')) fallbackRole = 'ADMIN';
      if (email?.includes('coach') || email?.includes('valeria')) fallbackRole = 'COACH';
      setRole(fallbackRole);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    // Si es contraseña de prueba, hacer bypass INMEDIATO para evitar demoras de red
    if (password === 'client123' || password === 'admin123' || password === 'coach123') {
        console.warn("Usando bypass de autenticación local.");
        const fakeUser = { id: 'mock-local-id', email };
        localStorage.setItem('mockUser', JSON.stringify(fakeUser));
        setUser(fakeUser);
        await fetchUserRole(email);
        return { data: { user: fakeUser }, error: null };
    }

    // Si no es prueba, intentar login real
    const res = await supabase.auth.signInWithPassword({ email, password });
    return res;
  };

  const logout = async () => {
    localStorage.removeItem('mockUser');
    setUser(null);
    setRole(null);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ 
      user, role, loading, login, logout, 
      classesRemaining, myReservations, globalClasses, 
      bookClass, cancelClass, updateClassSpots, checkInClient 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
