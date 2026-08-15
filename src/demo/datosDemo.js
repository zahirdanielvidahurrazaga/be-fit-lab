// ─────────────────────────────────────────────────────────────────────────────
// DATOS DE LA DEMO
//
// Genera un estudio entero en memoria a partir de la configuración: clases de
// las próximas dos semanas, clientas, reservas y ocupación creíble. No toca
// Supabase, no cuesta nada y se reinicia al recargar, así que ninguna prospecta
// puede romper nada por más que le pique.
//
// La ocupación no es aleatoria de verdad: usa una semilla fija para que la demo
// se vea IGUAL cada vez que se abra. Si cambiara en cada carga, enseñarla en una
// junta sería una lotería.
// ─────────────────────────────────────────────────────────────────────────────

const NOMBRES = [
  'Regina', 'Valeria', 'Ximena', 'Fernanda', 'Andrea', 'Paulina', 'Mariana',
  'Daniela', 'Isabela', 'Natalia', 'Carolina', 'Renata', 'Emilia', 'Julieta',
  'Alejandra', 'Sofía', 'Camila', 'Victoria', 'Lucía', 'Elena',
];

const APELLIDOS = [
  'Ramírez', 'Torres', 'Vega', 'Herrera', 'Lozano', 'Cárdenas', 'Ibarra',
  'Del Valle', 'Sandoval', 'Quintero', 'Moreno', 'Bautista',
];

// Generador con semilla: mismos números en cada carga.
function aleatorio(semilla) {
  let s = semilla;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const iso = (d) => d.toISOString().slice(0, 10);

export function generarDatosDemo(cfg) {
  const rnd = aleatorio(20260815);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // ── Clientas ───────────────────────────────────────────────────────────────
  const clientas = NOMBRES.map((nombre, i) => ({
    id: `demo-cliente-${i}`,
    full_name: `${nombre} ${APELLIDOS[i % APELLIDOS.length]}`,
    email: `${nombre.toLowerCase()}@ejemplo.mx`,
    role: 'CLIENT',
    classes_remaining: Math.floor(rnd() * 12),
    membership_status: rnd() > 0.15 ? 'ACTIVE' : 'EXPIRED',
    plan: 'Plan 12 clases',
  }));

  const coaches = (cfg.coaches || []).map((nombre, i) => ({
    id: `demo-coach-${i}`,
    full_name: nombre,
    role: 'COACH',
  }));

  // ── Clases de las próximas dos semanas ─────────────────────────────────────
  const clases = [];
  for (let dia = 0; dia < 14; dia++) {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() + dia);
    const diaSemana = fecha.getDay();
    if (diaSemana === 0) continue;                       // domingo cerrado
    const horarios = diaSemana === 6 ? cfg.horarios.slice(0, 3) : cfg.horarios;

    horarios.forEach((hora, h) => {
      const disciplina = cfg.disciplinas[(dia + h) % cfg.disciplinas.length];
      const coach = coaches[(dia + h) % coaches.length];
      // Las de 7am y 6pm son las codiciadas: casi siempre llenas.
      const pico = hora === '07:00' || hora === '18:10';
      const base = pico ? 0.85 : 0.45;
      const ocupados = Math.min(
        cfg.lugares,
        Math.round(cfg.lugares * (base + rnd() * 0.3)),
      );
      clases.push({
        id: `demo-clase-${dia}-${h}`,
        title: disciplina.titulo,
        level: disciplina.nivel,
        instructor: coach?.full_name || '',
        coach_id: coach?.id || null,
        date: iso(fecha),
        day_of_week: diaSemana,
        time: hora,
        spots: cfg.lugares,
        max_spots: cfg.lugares,
        ocupados,
        category: disciplina.titulo,
        category_color: cfg.colores.primario,
        is_special: false,
      });
    });
  }

  // ── Una clase llena a propósito, mañana en horario pico ────────────────────
  // Es la que deja enseñar la lista de espera, que es el argumento de venta más
  // fuerte: la clase se vuelve a llenar sola cuando alguien cancela.
  const manana = iso(new Date(hoy.getTime() + 86400000));
  const claseLlena = clases.find((c) => c.date === manana && c.time === '18:10')
    || clases.find((c) => c.date === manana);
  if (claseLlena) claseLlena.ocupados = claseLlena.spots;

  // ── Reservas de la clienta que abre la demo ────────────────────────────────
  const proximas = clases
    .filter((c) => c.date >= iso(hoy) && c.ocupados < c.spots)
    .slice(0, 3);

  // ⚠️ La forma tiene que ser la MISMA que arma AuthContext (camelCase, con
  // `classId`), no la de la tabla. Portal busca la clase con `res.classId` y
  // cancela con `res.classId`: si aquí se pone `class_id`, la demo se abre con
  // "Próximas clases" vacío y no se nota hasta enseñarla.
  const reservas = proximas.map((c, i) => ({
    id: `demo-reserva-${i}`,
    classId: c.id,
    title: c.title,
    time: c.time,
    date: c.date,
    instructor: c.instructor,
    coachId: c.coach_id,
    color: null,
    checkedIn: false,
    status: 'confirmed',
    offerExpiresAt: null,
    autoClaim: true,
    promotedAt: null,
    calendarEventId: null,
  }));

  // ── Historial de asistencias (alimenta la gráfica "Tu semana") ─────────────
  const historial = [];
  for (let i = 1; i <= 18; i++) {
    const f = new Date(hoy);
    f.setDate(hoy.getDate() - i);
    if (f.getDay() === 0 || rnd() > 0.55) continue;
    historial.push({ created_at: f.toISOString(), classes: { date: iso(f) } });
  }

  return {
    yo: {
      id: 'demo-yo',
      full_name: `${cfg.clienta.nombre} ${APELLIDOS[0]}`,
      email: `${cfg.clienta.nombre.toLowerCase()}@ejemplo.mx`,
      role: 'CLIENT',
    },
    clientas,
    coaches,
    clases,
    reservas,
    historial,
    claseLlenaId: claseLlena?.id || null,
    clasesRestantes: cfg.clienta.clasesRestantes,
    plan: cfg.clienta.plan,
    // Se calculan aquí y no en el proveedor: allá viven dentro de un useMemo y
    // leer el reloj ahí es una función impura (react-hooks/purity).
    planStartedAt: new Date(hoy.getTime() - 15 * 86400000).toISOString(),
    planExpiresAt: new Date(hoy.getTime() + 45 * 86400000).toISOString(),
  };
}
