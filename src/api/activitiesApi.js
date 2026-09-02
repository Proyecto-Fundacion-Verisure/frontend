import client from './axiosClient';
import { ApiError } from './apiError';

const MOCK_ACTIVITIES = [
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
    favoriteCount: 14,
    status: 'PUBLISHED',
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
    favoriteCount: 8,
    status: 'FULL',
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
    favoriteCount: 5,
    status: 'IN_PROGRESS',
  },
  {
    id: 4,
    title: 'Jornada de voluntariado ambiental',
    description: 'Jornadas de voluntariado corporativo en entornos naturales.',
    line: 'voluntariado',
    mode: 'MIXTO',
    capacity: 30,
    registeredCount: 12,
    organizationName: 'Voluntarios Activos',
    location: 'Valencia',
    image: '/images/04-voluntariado-linea-de-accion.png',
    favoritedByMe: true,
    favoriteCount: 21,
    status: 'FINISHED',
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
    favoriteCount: 3,
    status: 'DRAFT',
  },
  {
    id: 6,
    title: 'Acompañamiento telefónico',
    description: 'Llamadas semanales para combatir la soledad no deseada.',
    line: 'desoledad',
    mode: 'ONLINE',
    capacity: 25,
    registeredCount: 18,
    organizationName: 'Fundación Solitaria',
    location: 'Online',
    image: '/images/01-desoledad-linea-de-accion.png',
    favoritedByMe: false,
    favoriteCount: 2,
    status: 'CANCELLED',
  },
];

function mockGetPublishedActivities(params = {}) {
  let results = [...MOCK_ACTIVITIES];

  if (params.line) {
    results = results.filter((a) => a.line === params.line);
  }
  if (params.mode) {
    results = results.filter((a) => a.mode === params.mode);
  }
  if (params.q) {
    const q = params.q.toLowerCase();
    results = results.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.organizationName.toLowerCase().includes(q) ||
        (a.location && a.location.toLowerCase().includes(q)),
    );
  }

  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 12;
  const start = (page - 1) * limit;
  const paged = results.slice(start, start + limit);

  return Promise.resolve({
    data: paged,
    headers: { 'x-total-count': String(results.length) },
  });
}

function mockGetAdminActivities(params = {}) {
  let results = [...MOCK_ACTIVITIES];

  if (params.status) {
    results = results.filter((activity) => activity.status === params.status);
  }
  if (params.q) {
    const query = params.q.toLowerCase();
    results = results.filter((activity) =>
      activity.title.toLowerCase().includes(query)
      || activity.organizationName.toLowerCase().includes(query));
  }

  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 10;
  const start = (page - 1) * limit;
  const content = results.slice(start, start + limit);

  return Promise.resolve({
    data: {
      content,
      number: page - 1,
      size: limit,
      totalElements: results.length,
      totalPages: Math.ceil(results.length / limit),
    },
  });
}

function mockGetActivityDetail(id) {
  const activity = MOCK_ACTIVITIES.find((a) => String(a.id) === String(id));
  if (!activity) {
    return Promise.reject(
      new ApiError({ message: 'No se ha encontrado el recurso solicitado.', status: 404 }),
    );
  }
  return Promise.resolve({ data: activity });
}

function mockCancelActivity(id) {
  const activity = MOCK_ACTIVITIES.find((item) => String(item.id) === String(id));
  if (!activity) {
    return Promise.reject(
      new ApiError({ message: 'No se ha encontrado el recurso solicitado.', status: 404 }),
    );
  }
  if (activity.status === 'FINISHED') {
    return Promise.reject(
      new ApiError({
        message: 'La actividad ya ha finalizado.',
        status: 409,
        code: 'ACTIVITY_FINISHED',
      }),
    );
  }
  activity.status = 'CANCELLED';
  activity.registeredCount = 0;
  return Promise.resolve({ status: 204 });
}

const isMockEnabled = () => import.meta.env.DEV && import.meta.env.MODE !== 'test';

export const getAdminActivities = (params) =>
  isMockEnabled() ? mockGetAdminActivities(params) : client.get('/activities', { params });
export const getPublishedActivities = (params) =>
  isMockEnabled() ? mockGetPublishedActivities(params) : client.get('/activities/published', { params });
export const getActivityDetail = (id) =>
  isMockEnabled() ? mockGetActivityDetail(id) : client.get(`/activities/${id}`);
export const getAdminActivity = (id) =>
  isMockEnabled() ? mockGetActivityDetail(id) : client.get(`/admin/activities/${id}`);
export const createActivity = (data) => client.post('/activities', data);
export const updateActivity = (id, data) => client.put(`/activities/${id}`, data);
export const publishActivity = (id) => client.patch(`/activities/${id}/publish`);
export const cancelActivity = (id) =>
  isMockEnabled() ? mockCancelActivity(id) : client.patch(`/activities/${id}/cancel`);

export const favoriteActivity = (id) => client.post(`/activities/${id}/favorite`);
export const unfavoriteActivity = (id) => client.delete(`/activities/${id}/favorite`);
