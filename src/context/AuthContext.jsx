import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { registerPushToken, unregisterPushToken } from '../hooks/usePushNotifications';
import { scheduleClassReminder, cancelClassReminder, notifyReservationConfirmed, scheduleCancelDeadlineReminder, getNextClassOccurrence } from '../hooks/useLocalNotifications';
import { removeClassFromCalendar } from '../hooks/useCalendar';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

// El flag del tour se guarda en almacenamiento NATIVO (Preferences) porque el
// localStorage del WebView lo purga iOS entre lanzamientos → el tour reaparecía.
const hasSeenTour = async (userId) => {
  const key = `befit_tour_seen_${userId}`;
  const { value } = await Preferences.get({ key });
  if (value) return true;
  if (localStorage.getItem(key)) { await Preferences.set({ key, value: 'true' }); return true; } // migración
  return false;
};

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profileName, setProfileName] = useState('');
  const [role, setRole] = useState(null);
  const [plan, setPlan] = useState(null);
  const [membershipStatus, setMembershipStatus] = useState('INACTIVE');
  const [loading, setLoading] = useState(true);
  const [customBadges, setCustomBadges] = useState([]);
  const [badgeQueue, setBadgeQueue] = useState([]); // cola de insignias por animar
  const dismissBadge = () => setBadgeQueue(q => q.slice(1));
  const [showTour, setShowTour] = useState(false);

  // ESTADO GLOBAL DE RESERVAS (Supabase)
  const [badgeConfigs, setBadgeConfigs] = useState([]);
  const [classesRemaining, setClassesRemaining] = useState(0);
  const [globalClasses, setGlobalClasses] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [cafeProducts, setCafeProducts] = useState([]);
  // Flags de "ya hizo la 1ª carga" → para distinguir "cargando" de "vacío real"
  // y mostrar skeletons hasta que el dataset trajo respuesta del servidor.
  const [classesLoaded, setClassesLoaded] = useState(false);
  const [recipesLoaded, setRecipesLoaded] = useState(false);
  const [cafeProductsLoaded, setCafeProductsLoaded] = useState(false);
  const [myReservations, setMyReservations] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [classTemplates, setClassTemplates] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [monthlyGoal, setMonthlyGoal] = useState(0); // meta de clases/mes (users.target_monthly_classes)

  // Nutrición — favoritos persistentes + tracker de calorías consumidas (food_log)
  const [favoriteRecipeIds, setFavoriteRecipeIds] = useState(() => new Set()); // recipe_favorites
  const [todayLog, setTodayLog] = useState([]);              // food_log del día de hoy
  const [selfCalorieGoal, setSelfCalorieGoal] = useState(null); // users.calorie_goal (meta propia)
  const [planCalories, setPlanCalories] = useState(null);       // nutrition_plans.calories (objetivo Fit/Premium)

  // Centro de notificaciones in-app (tabla notification_logs en tiempo real)
  const [notifications, setNotifications] = useState([]);
  const unreadCount = notifications.filter(n => !n.read_at).length;
  // Panel de notificaciones abierto desde el menú de perfil
  const [notifOpen, setNotifOpen] = useState(false);

  // Flag para evitar que onAuthStateChange sobreescriba un plan recién activado
  const planJustActivatedRef = useRef(false);
  // Garantiza que la recarga de datos compartidos (clases, recetas, cafetería, etc.)
  // corra UNA vez por login, ya con la auth lista (evita el "no cargó hasta reabrir").
  const sharedLoadedForRef = useRef(null);

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
    setMonthlyGoal(0);
    setMyReservations([]);
    setCustomBadges([]);
    setBadgeConfigs([]);
    setLoading(false);
  };

  // Calcula TODAS las insignias ganadas leyendo datos frescos de la BD
  // (historial con check-in + perfil + insignias manuales). Cubre todos los
  // tipos, incluido PROFILE_COMPLETE.
  const computeEarnedBadges = async (userId) => {
    const [{ data: history }, { data: profile }] = await Promise.all([
      supabase.from('reservations').select('created_at, classes(instructor)').eq('user_id', userId).eq('checked_in', true),
      supabase.from('users').select('full_name, avatar_url, custom_badges').eq('id', userId).single(),
    ]);
    const count = history?.length || 0;
    const coachesSet = new Set((history || []).map(h => h.classes?.instructor).filter(Boolean));
    const weekCounts = {};
    (history || []).forEach(h => {
      const d = new Date(h.created_at);
      const weekKey = `${d.getFullYear()}-${Math.floor(d.getTime() / (1000 * 60 * 60 * 24 * 7))}`;
      weekCounts[weekKey] = (weekCounts[weekKey] || 0) + 1;
    });
    const maxWeekly = Math.max(0, ...Object.values(weekCounts));
    const profileComplete = !!(profile?.full_name && profile.full_name.trim() !== '' && profile?.avatar_url);
    const customLabels = (profile?.custom_badges || []).map(cb => cb.label).filter(Boolean);

    return (badgeConfigs || []).filter(rule => {
      if (customLabels.includes(rule.label)) return true;
      switch (rule.rule_type) {
        case 'TOTAL_CLASSES': return count >= rule.rule_value;
        case 'DIFFERENT_COACHES': return coachesSet.size >= rule.rule_value;
        case 'WEEKLY_CLASSES': return maxWeekly >= rule.rule_value;
        case 'PROFILE_COMPLETE': return profileComplete;
        default: return false; // MANUAL solo por customLabels
      }
    });
  };

  // Evalúa y encola para animar las insignias NUEVAS. La primera vez (sin
  // registro local) SIEMBRA en silencio para no animar insignias ya obtenidas
  // (p.ej. en un dispositivo nuevo).
  const evaluateBadgesForUnlock = async (userId) => {
    if (!userId || !badgeConfigs || badgeConfigs.length === 0) return;
    const earned = await computeEarnedBadges(userId);
    const key = `befit_earned_badges_${userId}`;
    const raw = localStorage.getItem(key);

    if (raw === null) {
      localStorage.setItem(key, JSON.stringify(earned.map(b => b.id)));
      return; // siembra silenciosa
    }

    const storedArr = JSON.parse(raw);
    const newBadges = earned.filter(b => !storedArr.includes(b.id));
    if (newBadges.length > 0) {
      setBadgeQueue(q => [...q, ...newBadges]);
      localStorage.setItem(key, JSON.stringify([...storedArr, ...newBadges.map(b => b.id)]));
    }
  };

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`public:reservations:user_${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations', filter: `user_id=eq.${user.id}` }, (payload) => {
        // Cualquier cambio en mis reservas (reserva, cancelación, check-in del admin)
        // refresca mi lista y mis clases restantes sin necesidad de recargar.
        fetchUserData(user);
        // Insignias al hacer check-in
        if (payload.eventType === 'UPDATE' && payload.new?.checked_in && !payload.old?.checked_in) {
           evaluateBadgesForUnlock(user.id);
        }
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user, badgeConfigs]);

  // Evalúa insignias cuando cambian perfil/insignias (dispara "Listos para
  // Arrancar" al completar el perfil) y SIEMBRA en silencio en el primer arranque.
  useEffect(() => {
    if (!user || !badgeConfigs || badgeConfigs.length === 0) return;
    evaluateBadgesForUnlock(user.id);
  }, [user, badgeConfigs, profileName, avatarUrl, customBadges]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mi registro de usuario en tiempo real: plan, clases restantes y estatus
  // se actualizan cuando el admin los modifica, sin recargar la app.
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`public:users:self_${user.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${user.id}` }, () => {
        // No pisar un plan recién activado localmente (race con activatePlan)
        if (planJustActivatedRef.current) return;
        fetchUserData(user);
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Centro de notificaciones en tiempo real
  useEffect(() => {
    if (!user) { setNotifications([]); return; }
    fetchNotifications(user.id);
    const channel = supabase.channel(`public:notifs:user_${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notification_logs', filter: `user_id=eq.${user.id}` }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notification_logs', filter: `user_id=eq.${user.id}` }, (payload) => {
        setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new : n));
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresca sesión y datos cuando la app vuelve al frente (nativa + PWA)
  useEffect(() => {
    let lastRefresh = 0;
    const THROTTLE_MS = 10_000; // máximo una vez cada 10 s para evitar ráfagas

    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      if (now - lastRefresh < THROTTLE_MS) return;
      lastRefresh = now;

      // 1. Leer la sesión vigente. autoRefreshToken renueva el token si expiró.
      const { data: { session } } = await supabase.auth.getSession();

      // NO cerramos sesión aquí ante una sesión ausente/errores transitorios
      // (p.ej. reabrir la app sin red): eso provocaba logouts indebidos.
      // La expiración real la maneja onAuthStateChange (evento SIGNED_OUT).
      if (!session) return;

      // 2. Re-cargar datos públicos que pueden estar desactualizados
      fetchGlobalClasses();
      fetchRecipes();

      // 3. Re-cargar datos del usuario si sigue logueado
      if (session.user) {
        fetchUserData(session.user);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Suscripción global en tiempo real a los cambios en clases
  useEffect(() => {
    const channel = supabase.channel('public:classes:all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, () => {
        fetchGlobalClasses();
      })
      .subscribe((status) => {
        // Al (re)conectar el socket sincronizamos clases y recetas. Cubre el
        // arranque en frío y las reconexiones tras perder red / volver del fondo,
        // que antes dejaban el calendario vacío hasta recargar la página.
        if (status === 'SUBSCRIBED') {
          fetchGlobalClasses();
          fetchRecipes();
        }
      });
    return () => supabase.removeChannel(channel);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Menú de cafetería en tiempo real (el admin cambia precios → se refleja ya)
  useEffect(() => {
    const channel = supabase.channel('public:cafe_products:all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cafe_products' }, () => {
        fetchCafeProducts();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') fetchCafeProducts();
      });
    return () => supabase.removeChannel(channel);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Admin / Coach: la lista de clientes se mantiene en vivo
  useEffect(() => {
    if (!user || (role !== 'ADMIN' && role !== 'COACH')) return;
    const channel = supabase.channel('public:users:all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        fetchAllUsers();
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user, role]); // eslint-disable-line react-hooks/exhaustive-deps

  // fetchCoaches moved to run after auth

  useEffect(() => {
    // Verificar sesión activa inicial
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const isNative = Capacitor.isNativePlatform();
      // En nativo siempre garantizar el flag para que futuras aperturas funcionen
      if (isNative && session?.user) {
        localStorage.setItem('befit_remember_me', '1');
      }
      // Si volvemos de un pago web (redirect a Stripe y de regreso), el sessionStorage
      // del tab pudo perderse en el viaje. Restaurar el flag para NO cerrar la sesión.
      if (!isNative && session?.user) {
        const payReturn = localStorage.getItem('befit_payment_return');
        if (payReturn && (Date.now() - Number(payReturn) < 15 * 60 * 1000)) {
          sessionStorage.setItem('befit_session_active', '1');
        }
        localStorage.removeItem('befit_payment_return');
      }
      // En web: auto-signout si el usuario no marcó "mantener sesión" y no hay sesión de tab activa
      if (!isNative && session?.user && !localStorage.getItem('befit_remember_me') && !sessionStorage.getItem('befit_session_active')) {
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }
      if (session?.user) {
        setUser(session.user);
        await fetchUserData(session.user); // carga también el avatar (DB → estado)
        registerPushToken(session.user.id);

        // Disparar tour solo en app nativa y solo si no se ha visto
        if (Capacitor.isNativePlatform()) {
          hasSeenTour(session.user.id).then(seen => { if (!seen) setTimeout(() => setShowTour(true), 1500); });
        }
      } else {
        setLoading(false);
      }
    });

    // Escuchar cambios (login, logout) reales
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        registerPushToken(session.user.id);
        // NO re-fetch si acabamos de activar un plan (evita sobreescribir con datos viejos de la BD)
        if (!planJustActivatedRef.current) {
          fetchUserData(session.user);
        }
        fetchAllUsers();
        fetchCoaches();

        if (Capacitor.isNativePlatform()) {
          hasSeenTour(session.user.id).then(seen => { if (!seen) setTimeout(() => setShowTour(true), 1500); });
        }
      } else {
        setRole(null);
        setPlan(null);
        setMembershipStatus('INACTIVE');
        setUser(null);
        sharedLoadedForRef.current = null;
        setGlobalClasses([]);
        setRecipes([]);
        setMyReservations([]);
        setClassesRemaining(0);
        setLoading(false);
      }
    });

    // Cargar datos globales públicos (disponibles sin sesión)
    fetchGlobalClasses();
    fetchRecipes();
    fetchCafeProducts();
    fetchBadgeConfigs();
    fetchCoaches();
    fetchCategories();
    fetchTemplates();

    return () => subscription.unsubscribe();
  }, []);

  const fetchBadgeConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('badges_config')
        .select('*')
        .order('created_at', { ascending: true });
      if (data) setBadgeConfigs(data);
    } catch (err) {
      console.error(err);
    }
  };

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

  const fetchCoaches = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, avatar_url, bio, experience')
        .eq('role', 'COACH')
        .order('full_name', { ascending: true });
        
      if (data) {
        setCoaches(data);
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
        .order('date', { ascending: true, nullsFirst: false })
        .order('day', { ascending: true })
        .order('time', { ascending: true });
        
      if (data) {
        setGlobalClasses(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setClassesLoaded(true);
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
    } finally {
      setRecipesLoaded(true);
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
      if (!error && data) setGlobalClasses(prev => [...prev, data].sort((a,b) => (a.date > b.date ? 1 : -1)));
      return { success: !error, error };
    } catch (err) {
      return { success: false, error: err };
    }
  };

  const addMultipleClasses = async (classesArray) => {
    try {
      const { data, error } = await supabase.from('classes').insert(classesArray).select();
      if (!error && data) {
        setGlobalClasses(prev => [...prev, ...data].sort((a,b) => (a.date > b.date ? 1 : -1)));
      }
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

  const updateClass = async (classId, fields) => {
    try {
      const { data, error } = await supabase.from('classes').update(fields).eq('id', classId).select().single();
      if (!error && data) setGlobalClasses(prev => prev.map(c => c.id === classId ? data : c));
      return { success: !error, error };
    } catch (err) {
      return { success: false, error: err };
    }
  };

  // ============================================
  // CATEGORÍAS DE CLASE (catálogo gestionable)
  // ============================================
  const fetchCategories = async () => {
    try {
      const { data } = await supabase.from('class_categories').select('*').order('name', { ascending: true });
      if (data) setCategories(data);
    } catch (err) { console.error(err); }
  };

  const addCategory = async (name, color) => {
    try {
      const { data, error } = await supabase.from('class_categories').insert({ name: name.trim(), color }).select().single();
      if (!error && data) setCategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      return { success: !error, error };
    } catch (err) { return { success: false, error: err }; }
  };

  // Renombra y/o recolorea una categoría y actualiza TODAS sus clases de golpe
  const updateCategory = async (id, { name, color, oldName }) => {
    try {
      const { error } = await supabase.from('class_categories').update({ name: name.trim(), color }).eq('id', id);
      if (error) return { success: false, error };
      await supabase.from('classes').update({ category: name.trim(), category_color: color }).eq('category', oldName);
      await Promise.all([fetchCategories(), fetchGlobalClasses()]);
      return { success: true };
    } catch (err) { return { success: false, error: err }; }
  };

  const deleteCategory = async (id) => {
    try {
      const { error } = await supabase.from('class_categories').delete().eq('id', id);
      if (!error) setCategories(prev => prev.filter(c => c.id !== id));
      return { success: !error, error };
    } catch (err) { return { success: false, error: err }; }
  };

  // ============================================
  // PLANTILLAS DE SEMANA
  // ============================================
  const fetchTemplates = async () => {
    try {
      const { data } = await supabase.from('class_templates').select('*').order('created_at', { ascending: false });
      if (data) setClassTemplates(data);
    } catch (err) { console.error(err); }
  };

  const saveTemplate = async (name, items) => {
    try {
      const { data, error } = await supabase.from('class_templates').insert({ name: name.trim(), items }).select().single();
      if (!error && data) setClassTemplates(prev => [data, ...prev]);
      return { success: !error, error };
    } catch (err) { return { success: false, error: err }; }
  };

  const deleteTemplate = async (id) => {
    try {
      const { error } = await supabase.from('class_templates').delete().eq('id', id);
      if (!error) setClassTemplates(prev => prev.filter(t => t.id !== id));
      return { success: !error, error };
    } catch (err) { return { success: false, error: err }; }
  };

  // Aplica una plantilla creando clases en cada día coincidente del rango
  const applyTemplate = async (items, startDateStr, endDateStr) => {
    try {
      const start = new Date(startDateStr + 'T12:00:00');
      const end = new Date(endDateStr + 'T12:00:00');
      const toCreate = [];
      let cur = new Date(start);
      while (cur <= end) {
        (items || []).forEach(it => {
          if (it.day === cur.getDay()) {
            toCreate.push({
              title: it.title, time: it.time, instructor: it.instructor || '', coach_id: it.coach_id || null,
              category: it.category || null, category_color: it.category_color || null,
              description: it.description || null, date: cur.toISOString().split('T')[0],
              day: cur.getDay(), spots: it.spots || 10, level: it.level || 'Todos los niveles',
            });
          }
        });
        cur.setDate(cur.getDate() + 1);
      }
      if (toCreate.length === 0) return { success: false, error: { message: 'No hay días coincidentes en el rango.' } };
      return await addMultipleClasses(toCreate);
    } catch (err) { return { success: false, error: err }; }
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

  // ============================================
  // CAFETERÍA (catálogo en BD — precios server-side)
  // ============================================
  const fetchCafeProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('cafe_products')
        .select('*')
        .order('category', { ascending: true })
        .order('sort_order', { ascending: true });
      if (!error && data) setCafeProducts(data);
    } catch (err) {
      console.error('Error cargando productos de cafetería:', err);
    } finally {
      setCafeProductsLoaded(true);
    }
  };

  const addCafeProduct = async (product) => {
    try {
      const { data, error } = await supabase.from('cafe_products').insert(product).select().single();
      if (!error && data) setCafeProducts(prev => [...prev, data]);
      return { success: !error, error };
    } catch (err) {
      return { success: false, error: err };
    }
  };

  const updateCafeProduct = async (id, updates) => {
    try {
      const { data, error } = await supabase.from('cafe_products').update(updates).eq('id', id).select().single();
      if (!error && data) setCafeProducts(prev => prev.map(p => p.id === id ? data : p));
      return { success: !error, error };
    } catch (err) {
      return { success: false, error: err };
    }
  };

  const deleteCafeProduct = async (id) => {
    try {
      const { error } = await supabase.from('cafe_products').delete().eq('id', id);
      if (!error) setCafeProducts(prev => prev.filter(p => p.id !== id));
      return { success: !error, error };
    } catch (err) {
      return { success: false, error: err };
    }
  };

  const createBadgeConfig = async (configData) => {
    try {
      const { data, error } = await supabase.from('badges_config').insert(configData).select().single();
      if (!error && data) setBadgeConfigs(prev => [...prev, data]);
      return { success: !error, error };
    } catch (err) {
      return { success: false, error: err };
    }
  };

  const updateBadgeConfig = async (badgeId, configData) => {
    try {
      const { data, error } = await supabase.from('badges_config').update(configData).eq('id', badgeId).select().single();
      if (!error && data) {
        setBadgeConfigs(prev => prev.map(b => b.id === badgeId ? data : b));
      }
      return { success: !error, error };
    } catch (err) {
      return { success: false, error: err };
    }
  };

  const deleteBadgeConfig = async (badgeId) => {
    try {
      const { error } = await supabase.from('badges_config').delete().eq('id', badgeId);
      if (!error) setBadgeConfigs(prev => prev.filter(b => b.id !== badgeId));
      return { success: !error, error };
    } catch (err) {
      return { success: false, error: err };
    }
  };

  const assignCustomBadge = async (userId, newBadge) => {
    try {
      const userObj = allUsers.find(u => u.id === userId);
      const currentBadges = userObj?.custom_badges || [];
      const updatedBadges = [...currentBadges, newBadge];
      
      const { error } = await supabase
        .from('users')
        .update({ custom_badges: updatedBadges })
        .eq('id', userId);
        
      if (!error) {
        setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, custom_badges: updatedBadges } : u));
      }
      return { success: !error, error };
    } catch (err) {
      return { success: false, error: err };
    }
  };

  const removeCustomBadge = async (userId, badgeLabelToRemove) => {
    try {
      const userObj = allUsers.find(u => u.id === userId);
      const currentBadges = userObj?.custom_badges || [];
      const updatedBadges = currentBadges.filter(b => b.label !== badgeLabelToRemove);
      
      const { error } = await supabase
        .from('users')
        .update({ custom_badges: updatedBadges })
        .eq('id', userId);
        
      if (!error) {
        setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, custom_badges: updatedBadges } : u));
      }
      return { success: !error, error };
    } catch (err) {
      return { success: false, error: err };
    }
  };

  // Meta de clases por mes — vive en users (no en auth metadata) para que se
  // cargue fresca con el resto del perfil y el staff pueda verla.
  const updateMonthlyGoal = async (newGoal) => {
    const goal = parseInt(newGoal, 10);
    if (!user?.id || !goal || goal < 1) return { success: false };
    const { error } = await supabase.from('users').update({ target_monthly_classes: goal }).eq('id', user.id);
    if (!error) setMonthlyGoal(goal);
    return { success: !error, error };
  };

  const fetchUserData = async (currentUser) => {
    try {
      // 1. Obtener rol y clases restantes
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, classes_remaining, membership_plan, membership_status, full_name, custom_badges, avatar_url, target_monthly_classes, calorie_goal')
        .eq('id', currentUser.id)
        .single();
        
      if (userError && userError.code === 'PGRST116') {
        // La fila no existe (posible error del trigger o usuario antiguo). La creamos ahora mismo.
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
        setMonthlyGoal(userData.target_monthly_classes || 0);
        setSelfCalorieGoal(userData.calorie_goal ?? null);
        setProfileName(userData.full_name || '');
        setCustomBadges(userData.custom_badges || []);

        // Avatar: la BD es la fuente de verdad. Se carga aquí (en TODAS las rutas
        // de auth: arranque, login, refresh, realtime), no solo en el getSession
        // inicial — eso causaba que "a veces cargara y a veces no".
        if (userData.avatar_url) {
          setAvatarUrl(userData.avatar_url);
          try { localStorage.setItem(`avatar_${currentUser.id}`, userData.avatar_url); } catch (e) {}
        } else {
          // BD sin avatar pero hay uno cacheado localmente → subirlo para que
          // otros perfiles (coach en reservas, etc.) también lo vean.
          const cached = localStorage.getItem(`avatar_${currentUser.id}`);
          if (cached) {
            setAvatarUrl(cached);
            supabase.from('users').update({ avatar_url: cached }).eq('id', currentUser.id);
          }
        }
      } else {
        setRole('CLIENT');
        setPlan('none');
        setMembershipStatus('INACTIVE');
      }

      // Cargar favoritos + diario + objetivo aquí garantiza auth lista (el query a
      // users ya pasó RLS) → evita que queden vacíos por carrera en arranque nativo.
      loadNutritionTracking(currentUser.id);
      // Recargar TODOS los datos compartidos (clases, recetas, cafetería, etc.) una
      // sola vez por login, ya con la auth lista. Soluciona de forma general el
      // "no cargó hasta reabrir" para todo lo que depende de realtime / RLS.
      if (sharedLoadedForRef.current !== currentUser.id) {
        sharedLoadedForRef.current = currentUser.id;
        loadSharedData();
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
          checkedIn: r.checked_in,
          calendarEventId: r.calendar_event_id ?? null
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

  // ──────────────────────────────────────────────────────────────────────────
  // Nutrición: favoritos persistentes + diario de calorías consumidas (food_log)
  // ──────────────────────────────────────────────────────────────────────────
  const localToday = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // ── SOLUCIÓN GENERAL al "no cargó hasta reabrir" ──────────────────────────
  // Recarga TODOS los datos compartidos/realtime con la auth ya lista. El fetch
  // del montaje puede correr sin sesión (varias tablas tienen RLS → vuelven
  // vacías) y el socket de realtime tarda/falla en conectar en arranque nativo,
  // así que no es fiable como única fuente. Esto se dispara una vez por login
  // desde fetchUserData (después de que el query a `users` ya pasó RLS).
  const loadSharedData = () => {
    fetchGlobalClasses();
    fetchRecipes();
    fetchCafeProducts();
    fetchBadgeConfigs();
    fetchCoaches();
    fetchCategories();
    fetchTemplates();
  };

  // Carga favoritos + registro del día + objetivo del plan. Se llama desde
  // fetchUserData (auth ya garantizada por el query previo a users) Y desde el
  // efecto de user.id, para que NUNCA se queden vacíos por una carrera en el
  // arranque nativo (la sesión se restaura async y un query temprano daba RLS vacío).
  const loadNutritionTracking = async (uid) => {
    if (!uid) return;
    const [{ data: favs }, { data: log }, { data: np }] = await Promise.all([
      supabase.from('recipe_favorites').select('recipe_id').eq('user_id', uid),
      supabase.from('food_log').select('*').eq('user_id', uid).eq('log_date', localToday()).order('created_at', { ascending: true }),
      supabase.from('nutrition_plans').select('calories').eq('user_id', uid).eq('is_active', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ]);
    setFavoriteRecipeIds(new Set((favs || []).map(f => f.recipe_id)));
    setTodayLog(log || []);
    setPlanCalories(np?.calories ?? null);
  };

  useEffect(() => {
    const uid = user?.id;
    if (!uid) {
      setFavoriteRecipeIds(new Set());
      setTodayLog([]);
      setPlanCalories(null);
      return;
    }
    loadNutritionTracking(uid);
  }, [user?.id]);

  // Marca/desmarca una receta como favorita (optimista + persistente).
  const toggleRecipeFavorite = async (recipeId) => {
    if (!user?.id || !recipeId) return;
    const isFav = favoriteRecipeIds.has(recipeId);
    setFavoriteRecipeIds(prev => {
      const next = new Set(prev);
      if (isFav) next.delete(recipeId); else next.add(recipeId);
      return next;
    });
    try {
      if (isFav) {
        await supabase.from('recipe_favorites').delete().eq('user_id', user.id).eq('recipe_id', recipeId);
      } else {
        await supabase.from('recipe_favorites').insert({ user_id: user.id, recipe_id: recipeId });
      }
    } catch (e) {
      // revertir si falla la persistencia
      setFavoriteRecipeIds(prev => {
        const next = new Set(prev);
        if (isFav) next.add(recipeId); else next.delete(recipeId);
        return next;
      });
    }
  };

  // Registra una comida consumida hoy en el diario (food_log). Devuelve la fila creada.
  const logFood = async ({ title, kcal = 0, source = 'recipe', recipe_id = null, meal_time = null }) => {
    if (!user?.id || !title) return null;
    const row = {
      user_id: user.id,
      log_date: localToday(),
      title,
      kcal: parseInt(kcal, 10) || 0,
      source,
      recipe_id,
      meal_time,
    };
    const { data, error } = await supabase.from('food_log').insert(row).select().single();
    if (!error && data) {
      setTodayLog(prev => [...prev, data]);
      return data;
    }
    return null;
  };

  // Quita un ítem del diario de hoy.
  const removeFoodLog = async (id) => {
    if (!id) return;
    setTodayLog(prev => prev.filter(r => r.id !== id));
    try { await supabase.from('food_log').delete().eq('id', id); } catch (e) {}
  };

  // Fija la meta de calorías propia (clientas sin plan personalizado).
  const updateCalorieGoal = async (n) => {
    if (!user?.id) return;
    const val = parseInt(n, 10);
    const goal = Number.isFinite(val) && val > 0 ? val : null;
    setSelfCalorieGoal(goal);
    try { await supabase.from('users').update({ calorie_goal: goal }).eq('id', user.id); } catch (e) {}
  };

  const todayConsumed = todayLog.reduce((s, r) => s + (r.kcal || 0), 0);
  const calorieGoal = planCalories ?? selfCalorieGoal ?? null; // objetivo efectivo del día

  const bookClass = async (classObj) => {
    if (!user) return false;
    
    if (classesRemaining > 0 && classObj.spots > 0) {
      try {
        // Optimistic UI Update — los planes ilimitados (sentinel ≥9000) NO descuentan.
        if (classesRemaining < 9000) setClassesRemaining(prev => prev - 1);
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
          checkedIn: false,
          calendarEventId: null,
        }]);

        // DB Updates via secure RPC
        const { error: rpcError } = await supabase.rpc('book_class_secure', { p_class_id: classObj.id });

        if (rpcError) throw rpcError;

        // Notificaciones locales
        const reservationForNotif = { classId: classObj.id, title: classObj.title, time: classObj.time, instructor: classObj.instructor };
        notifyReservationConfirmed(reservationForNotif);
        scheduleClassReminder(reservationForNotif, classObj.day);
        scheduleCancelDeadlineReminder(reservationForNotif, classObj.day);

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
    if (!user) return { success: false, reason: 'no_user' };

    const classObj = globalClasses.find(c => c.id === classId);

    // Bloquear cancelación si faltan 5 horas o menos para la clase
    if (classObj?.day !== undefined && classObj?.time) {
      const nextOccurrence = getNextClassOccurrence(classObj.day, classObj.time);
      const fiveHoursBefore = new Date(nextOccurrence.getTime() - 5 * 60 * 60 * 1000);
      if (new Date() >= fiveHoursBefore) {
        return { success: false, reason: 'too_late' };
      }
    }

    const reservation = myReservations.find(r => r.classId === classId);

    if (reservation?.calendarEventId) {
      removeClassFromCalendar(reservation.calendarEventId);
    }

    try {
      // Optimistic UI Update — los planes ilimitados (sentinel ≥9000) NO suman.
      if (classesRemaining < 9000) setClassesRemaining(prev => prev + 1);
      setMyReservations(prev => prev.filter(res => res.classId !== classId));
      if (classObj) {
        setGlobalClasses(prev => prev.map(c => 
          c.id === classId ? { ...c, spots: c.spots + 1 } : c
        ));
      }

      // DB Updates via secure RPC
      const { error } = await supabase.rpc('cancel_class_secure', { p_class_id: classId });

      if (error) throw error;

      // Cancelar el recordatorio programado
      cancelClassReminder(classId);

      return { success: true };
    } catch (err) {
      console.error("Error cancelando reserva:", err);
      fetchGlobalClasses();
      fetchUserData(user);
      return { success: false, reason: 'error' };
    }
  };

  const updateReservationCalendarId = (classId, eventId) => {
    setMyReservations(prev => prev.map(r =>
      r.classId === classId ? { ...r, calendarEventId: eventId } : r
    ));
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

        // --- LÓGICA DE INSIGNIAS Y PUSH NOTIFICATION ---
        try {
          const { data: history } = await supabase
            .from('reservations')
            .select('*, classes(instructor)')
            .eq('user_id', qrData)
            .eq('checked_in', true);
            
          const currentCustom = userObj?.custom_badges || [];
          const notifiedIds = currentCustom.filter(b => b._internal_notified_id).map(b => b._internal_notified_id);
          
          let newlyUnlocked = null;
          for (const rule of badgeConfigs) {
            if (notifiedIds.includes(rule.id) || rule.rule_type === 'MANUAL' || rule.rule_type === 'PROFILE_COMPLETE') continue;
            
            let isEarned = false;
            if (rule.rule_type === 'TOTAL_CLASSES') {
              isEarned = (history?.length || 0) >= rule.rule_value;
            } else if (rule.rule_type === 'DIFFERENT_COACHES') {
              const coaches = new Set((history || []).map(h => h.classes?.instructor).filter(Boolean));
              isEarned = coaches.size >= rule.rule_value;
            } else if (rule.rule_type === 'WEEKLY_CLASSES') {
              const weekCounts = {};
              (history || []).forEach(h => {
                 const d = new Date(h.created_at);
                 const weekKey = `${d.getFullYear()}-${Math.floor(d.getTime() / (1000*60*60*24*7))}`;
                 weekCounts[weekKey] = (weekCounts[weekKey] || 0) + 1;
              });
              const maxWeekly = Math.max(0, ...Object.values(weekCounts));
              isEarned = maxWeekly >= rule.rule_value;
            }
            
            if (isEarned) {
               newlyUnlocked = rule;
               break; // Solo notificar 1 a la vez
            }
          }
          
          if (newlyUnlocked) {
             const updatedCustom = [...currentCustom, { _internal_notified_id: newlyUnlocked.id }];
             await supabase.from('users').update({ custom_badges: updatedCustom }).eq('id', qrData);
             
             await supabase.functions.invoke('send-push', {
               body: {
                 userId: qrData,
                 title: `¡Insignia Desbloqueada! ${newlyUnlocked.icon}`,
                 body: `¡Felicidades ${clientInfo.name}! Acabas de ganar la insignia: ${newlyUnlocked.label}.`,
                 type: 'badge_unlocked'
               }
             });
          }
        } catch (badgeErr) {
          console.error("Error al evaluar insignias tras check-in:", badgeErr);
        }
        // ------------------------------------

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

  // ============================================
  // CENTRO DE NOTIFICACIONES
  // ============================================
  const fetchNotifications = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('notification_logs')
        .select('*')
        .eq('user_id', userId)
        .order('sent_at', { ascending: false })
        .limit(100);
      if (!error && data) setNotifications(data);
    } catch (err) {
      console.error('Error cargando notificaciones:', err);
    }
  };

  // Marca como leídas todas mis notificaciones (optimista + persiste)
  const markNotificationsRead = async () => {
    if (!user) return;
    const hasUnread = notifications.some(n => !n.read_at);
    if (!hasUnread) return;
    const now = new Date().toISOString();
    setNotifications(prev => prev.map(n => n.read_at ? n : { ...n, read_at: now }));
    try {
      await supabase
        .from('notification_logs')
        .update({ read_at: now })
        .eq('user_id', user.id)
        .is('read_at', null);
    } catch (err) {
      console.error('Error marcando notificaciones como leídas:', err);
    }
  };

  // Envía una notificación push (+ log in-app) a uno o varios usuarios.
  // Uso del admin: notificar a un cliente/coach concreto o a un grupo.
  const sendNotification = async ({ userIds, title, body, type = 'admin' }) => {
    const ids = (Array.isArray(userIds) ? userIds : [userIds]).filter(Boolean);
    if (ids.length === 0 || !title || !body) {
      return { success: false, sent: 0, total: 0, reason: 'datos_incompletos' };
    }
    const results = await Promise.allSettled(
      ids.map(id => supabase.functions.invoke('send-push', {
        body: { userId: id, title, body, type },
      }))
    );
    const sent = results.filter(r => r.status === 'fulfilled' && !r.value?.error).length;
    return { success: sent > 0, sent, total: ids.length };
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
    // 1) Limpiar el estado local PRIMERO. Así la UI redirige al login de inmediato
    //    aunque cualquier paso posterior (push token, signOut) falle o se cuelgue.
    sharedLoadedForRef.current = null;
    setUser(null);
    setRole(null);
    setPlan(null);
    setMembershipStatus('INACTIVE');
    setClassesRemaining(0);
    setGlobalClasses([]);
    setMyReservations([]);
    setAllUsers([]);
    setBadgeConfigs([]);
    setNotifications([]);
    localStorage.removeItem('befit_remember_me');
    sessionStorage.removeItem('befit_session_active');
    document.documentElement.setAttribute('data-theme', 'light');

    // 2) Desregistrar push (best-effort; nunca debe romper el logout).
    try { if (user) unregisterPushToken(user.id); } catch (e) {}

    // 3) Cerrar sesión SIN red (`scope: 'local'`): solo borra la sesión guardada,
    //    instantáneo y sin el cuelgue de Web Locks/red que dejaba la sesión viva
    //    (de ahí el "no me cierra sesión hasta refrescar"). Best-effort.
    try { await supabase.auth.signOut({ scope: 'local' }); } catch (e) {}

    // 4) Respaldo: borrar a mano cualquier token persistido por si signOut no alcanzó.
    try { Object.keys(localStorage).forEach(k => { if (k.startsWith('sb-')) localStorage.removeItem(k); }); } catch (e) {}
  };

  return (
    <AuthContext.Provider value={{
      user, role, plan, membershipStatus, loading, profileName,
      classesRemaining, myReservations, globalClasses, recipes, allUsers,
      classesLoaded, recipesLoaded, cafeProductsLoaded,
      avatarUrl, setAvatarUrl, customBadges, badgeConfigs,
      monthlyGoal, updateMonthlyGoal,
      favoriteRecipeIds, toggleRecipeFavorite,
      todayLog, todayConsumed, calorieGoal, planCalories, logFood, removeFoodLog, updateCalorieGoal,
      login, logout, forceCleanSession, fetchAllUsers, refreshUserData,
      bookClass, cancelClass, checkInClient, updateClassSpots, updateReservationCalendarId,
      activatePlan, addClass, deleteClass, addRecipe, deleteRecipe,
      fetchClassReservations, fetchClassesByDayOfWeek, fetchGlobalClasses,
      assignCustomBadge, removeCustomBadge, createBadgeConfig, updateBadgeConfig, deleteBadgeConfig,
      badgeQueue, dismissBadge,
      showTour, setShowTour,
      coaches, addMultipleClasses,
      notifications, unreadCount, fetchNotifications, markNotificationsRead, sendNotification,
      notifOpen, setNotifOpen,
      cafeProducts, fetchCafeProducts, addCafeProduct, updateCafeProduct, deleteCafeProduct,
      updateClass,
      categories, fetchCategories, addCategory, updateCategory, deleteCategory,
      classTemplates, fetchTemplates, saveTemplate, deleteTemplate, applyTemplate
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
