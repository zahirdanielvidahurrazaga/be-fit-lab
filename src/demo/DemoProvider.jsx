import { useState, useMemo, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { generarDatosDemo } from './datosDemo';
import { PRODUCTOS_CAFE } from './supabaseDemo';

// Fuera del componente a propósito: identidad estable en cada render, para que
// los efectos que dependan de estas listas no se disparen en bucle.
const VACIO = [];
// ⚠️ favoriteRecipeIds es un Set en AuthContext, no un arreglo: Nutrición hace
// .has() y pasarle [] tumbaba React entero al abrir la pestaña de Comida.
const SIN_FAVORITOS = new Set();

// ─────────────────────────────────────────────────────────────────────────────
// PROVEEDOR DE LA DEMO
//
// Sirve exactamente la misma forma que AuthContext, pero con datos en memoria.
// Portal y Agenda no se enteran de nada: siguen llamando useAuth() igual.
//
// Reservar y cancelar funcionan de verdad contra el estado local, porque una
// demo donde los botones no hacen nada no vende. Al recargar vuelve a empezar.
// ─────────────────────────────────────────────────────────────────────────────

export default function DemoProvider({ cfg, children }) {
  const semilla = useMemo(() => generarDatosDemo(cfg), [cfg]);

  const [clases, setClases] = useState(semilla.clases);
  const [reservas, setReservas] = useState(semilla.reservas);
  const [restantes, setRestantes] = useState(semilla.clasesRestantes);
  const [enEspera, setEnEspera] = useState({});

  const buscarClase = useCallback((id) => clases.find((c) => c.id === id), [clases]);

  const bookClass = useCallback(async (classId) => {
    const clase = buscarClase(classId);
    if (!clase) return { error: 'Clase no encontrada' };

    if (reservas.some((r) => r.classId === classId)) {
      return { error: 'Ya tienes lugar en esta clase' };
    }
    if (restantes <= 0) {
      return { error: 'Ya no te quedan clases en tu paquete' };
    }

    // Clase llena: se forma en lista de espera, y NO se le descuenta nada —
    // igual que en el sistema real, donde el cobro ocurre al aceptar el lugar.
    if (clase.ocupados >= clase.spots) {
      setEnEspera((p) => ({ ...p, [classId]: Object.keys(p).length + 1 }));
      return { waitlisted: true, position: Object.keys(enEspera).length + 1 };
    }

    setClases((prev) => prev.map((c) => (c.id === classId ? { ...c, ocupados: c.ocupados + 1 } : c)));
    setRestantes((n) => n - 1);
    setReservas((prev) => [...prev, {
      id: `demo-reserva-${classId}`,
      classId,
      title: clase.title,
      time: clase.time,
      date: clase.date,
      instructor: clase.instructor,
      coachId: clase.coach_id,
      color: null,
      checkedIn: false,
      status: 'confirmed',
      offerExpiresAt: null,
      autoClaim: true,
      promotedAt: null,
      calendarEventId: null,
    }]);
    return { success: true };
  }, [buscarClase, reservas, restantes, enEspera]);

  // Portal cancela pasando el classId de la reserva, no el id de la reserva.
  const cancelClass = useCallback(async (classId) => {
    const reserva = reservas.find((r) => r.classId === classId || r.id === classId);
    if (!reserva) return { error: 'Reserva no encontrada' };
    setClases((prev) => prev.map((c) => (
      c.id === reserva.classId ? { ...c, ocupados: Math.max(0, c.ocupados - 1) } : c
    )));
    setReservas((prev) => prev.filter((r) => r.id !== reserva.id));
    setRestantes((n) => n + 1);
    return { success: true };
  }, [reservas]);

  // Asistentes falsas para que el cupo de cada clase se vea poblado.
  const fetchClassReservations = useCallback(async (classId) => {
    const clase = buscarClase(classId);
    if (!clase) return [];
    return semilla.clientas.slice(0, clase.ocupados).map((c) => ({
      id: `demo-res-${classId}-${c.id}`,
      user_id: c.id,
      status: 'confirmed',
      users: { full_name: c.full_name, avatar_url: null },
    }));
  }, [buscarClase, semilla.clientas]);

  const nada = useCallback(async () => ({ success: true }), []);

  const valor = useMemo(() => ({
    // Sesión simulada
    user: semilla.yo,
    role: 'CLIENT',
    profileName: semilla.yo.full_name,
    avatarUrl: null,
    loading: false,

    // Membresía
    plan: semilla.plan,
    membershipStatus: 'ACTIVE',
    planExpiresAt: semilla.planExpiresAt,
    planStartedAt: semilla.planStartedAt,
    classesRemaining: restantes,
    membershipRenewal: 'active',
    hasSubscription: false,

    // Clases y reservas
    globalClasses: clases,
    classesLoaded: true,
    myReservations: reservas,
    waitlistPositions: enEspera,
    coaches: semilla.coaches,
    allUsers: semilla.clientas,
    bookClass,
    cancelClass,
    fetchClassReservations,
    acceptOffer: nada,
    declineOffer: nada,
    setWaitlistAutoClaim: nada,
    updateReservationCalendarId: nada,

    // Historial que alimenta la gráfica "Tu semana"
    demoHistorial: semilla.historial,

    // Lo que la demo no necesita, pero que la app pide al renderizar
    badgeConfigs: VACIO,
    customBadges: VACIO,
    badgeQueue: VACIO,
    dismissBadge: () => {},
    notifications: VACIO,
    unreadCount: 0,
    notifOpen: false,
    setNotifOpen: () => {},
    recipes: semilla.recetas,
    recipesLoaded: true,
    cafeProducts: PRODUCTOS_CAFE,
    cafeProductsLoaded: true,
    disciplines: VACIO,
    disciplinesLoaded: true,
    categories: VACIO,
    favoriteRecipeIds: SIN_FAVORITOS,
    showTour: false,
    setShowTour: () => {},
    monthlyGoal: 12,
    updateMonthlyGoal: nada,
    toggleRecipeFavorite: nada,
    logFood: nada,
    removeFoodLog: nada,
    updateCalorieGoal: nada,
    todayLog: VACIO,
    todayConsumed: 0,
    calorieGoal: 1800,
    planCalories: 1800,
    logout: () => { window.location.href = '/'; },

    // Bandera para que cualquier pantalla pueda saber que está en modo demo
    esDemo: true,
  }), [semilla, clases, reservas, restantes, enEspera, bookClass, cancelClass, fetchClassReservations, nada]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
