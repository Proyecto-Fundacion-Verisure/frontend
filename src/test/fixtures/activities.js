// Activities fixtures — backend v2 contract
// Public detail: 200 only for PUBLISHED, FULL, IN_PROGRESS, FINISHED
// Admin detail: 200 for any status (including DRAFT, CANCELLED)

export const ActivityStatus = {
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  PUBLISHED: 'PUBLISHED',
  FULL: 'FULL',
  IN_PROGRESS: 'IN_PROGRESS',
  FINISHED: 'FINISHED',
  CANCELLED: 'CANCELLED',
};

export const PUBLIC_VISIBLE_STATUSES = new Set([
  ActivityStatus.PUBLISHED,
  ActivityStatus.FULL,
  ActivityStatus.IN_PROGRESS,
  ActivityStatus.FINISHED,
]);

export const ALL_STATUSES = Object.values(ActivityStatus);

export function isPublicVisible(status) {
  return PUBLIC_VISIBLE_STATUSES.has(status);
}

export const MOCK_ACTIVITIES_V2 = [
  {
    id: 1,
    title: 'Acompañamiento a mayores',
    description: 'Visitas semanales a personas mayores en situación de soledad no deseada.',
    line: 'desoledad',
    mode: 'PRESENCIAL',
    capacity: 20,
    registeredCount: 8,
    organizationName: 'Fundación Solitaria',
    location: 'Madrid',
    image: '/images/01-desoledad-linea-de-accion.png',
    favoritedByMe: true,
    status: ActivityStatus.PUBLISHED,
    startDate: '2026-09-10',
    endDate: '2026-09-17',
    hours: 8,
  },
  {
    id: 2,
    title: 'Taller educativo para jóvenes',
    description: 'Talleres de refuerzo escolar para menores en riesgo de exclusión.',
    line: 'educar',
    mode: 'ONLINE',
    capacity: 10,
    registeredCount: 10,
    organizationName: 'Educamos Juntos',
    location: 'Online',
    image: '/images/02-educar-linea-de-accion.png',
    favoritedByMe: false,
    status: ActivityStatus.FULL,
    startDate: '2026-09-12',
    endDate: '2026-09-13',
    hours: 6,
  },
  {
    id: 3,
    title: 'Prevención del acoso escolar',
    description: 'Campañas de sensibilización contra el acoso en centros educativos.',
    line: 'acoso',
    mode: 'PRESENCIAL',
    capacity: 15,
    registeredCount: 5,
    organizationName: 'Prevención Total',
    location: 'Barcelona',
    image: '/images/03-acoso-linea-de-accion.png',
    favoritedByMe: false,
    status: ActivityStatus.IN_PROGRESS,
    startDate: '2026-08-20',
    endDate: '2026-09-20',
    hours: 10,
  },
  {
    id: 4,
    title: 'Jornada de voluntariado ambiental',
    description: 'Jornadas de voluntariado corporativo en entornos naturales.',
    line: 'medio_ambiente',
    mode: 'MIXTO',
    capacity: 30,
    registeredCount: 12,
    organizationName: 'Voluntarios Activos',
    location: 'Valencia',
    image: '/images/04-voluntariado-linea-de-accion.png',
    favoritedByMe: true,
    status: ActivityStatus.FINISHED,
    startDate: '2026-07-01',
    endDate: '2026-07-02',
    hours: 8,
  },
  {
    id: 5,
    title: 'Mentoría laboral',
    description: 'Mentoría para el empleo: Renace, Reinicia y Despega.',
    line: 'educar',
    mode: 'PRESENCIAL',
    capacity: 12,
    registeredCount: 3,
    organizationName: 'Educamos Juntos',
    location: 'Sevilla',
    image: '/images/02-educar-linea-de-accion.png',
    favoritedByMe: false,
    status: ActivityStatus.DRAFT,
    startDate: '2026-10-01',
    endDate: '2026-10-02',
    hours: 6,
  },
  {
    id: 6,
    title: 'Acompañamiento telefónico',
    description: 'Llamadas semanales para combatir la soledad no deseada.',
    line: 'desoledad',
    mode: 'ONLINE',
    capacity: 25,
    registeredCount: 0,
    organizationName: 'Fundación Solitaria',
    location: 'Online',
    image: '/images/01-desoledad-linea-de-accion.png',
    favoritedByMe: false,
    status: ActivityStatus.CANCELLED,
    startDate: '2026-06-01',
    endDate: '2026-06-15',
    hours: 4,
  },
];

export function makeActivity(overrides = {}) {
  return {
    id: 999,
    title: 'Actividad de prueba',
    description: 'Descripción de prueba.',
    line: 'desoledad',
    mode: 'PRESENCIAL',
    capacity: 20,
    registeredCount: 5,
    organizationName: 'Org Test',
    location: 'Madrid',
    image: '/images/01-desoledad-linea-de-accion.png',
    favoritedByMe: false,
    status: ActivityStatus.PUBLISHED,
    startDate: '2026-09-10',
    endDate: '2026-09-17',
    hours: 8,
    ...overrides,
  };
}

// Simulates public vs admin visibility contract
export function publicDetailResponse(id) {
  const activity = MOCK_ACTIVITIES_V2.find((a) => String(a.id) === String(id));
  if (!activity || !isPublicVisible(activity.status)) return null;
  // Omit draft-only fields, keep ActivityDetailResponse shape (no registration inside)
  const { ...detail } = activity;
  return detail;
}

export function adminDetailResponse(id) {
  const activity = MOCK_ACTIVITIES_V2.find((a) => String(a.id) === String(id));
  if (!activity) return null;
  return { ...activity };
}
