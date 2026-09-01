import client from './axiosClient';

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
    image: '/images/01-desoledad-linea-de-accion.png',
    favoritedByMe: true,
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
    image: '/images/02-educar-linea-de-accion.png',
    favoritedByMe: false,
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
    image: '/images/03-acoso-linea-de-accion.png',
    favoritedByMe: false,
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
    image: '/images/04-voluntariado-linea-de-accion.png',
    favoritedByMe: true,
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
    image: '/images/02-educar-linea-de-accion.png',
    favoritedByMe: false,
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
    image: '/images/01-desoledad-linea-de-accion.png',
    favoritedByMe: false,
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
        a.organizationName.toLowerCase().includes(q),
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

const isMockEnabled = () => import.meta.env.DEV && import.meta.env.MODE !== 'test';

export const getAdminActivities = (params) => client.get('/activities', { params });
export const getPublishedActivities = (params) =>
  isMockEnabled() ? mockGetPublishedActivities(params) : client.get('/activities/published', { params });
export const getActivityDetail = (id) => client.get(`/activities/${id}`);
export const getAdminActivity = (id) => client.get(`/admin/activities/${id}`);
export const createActivity = (data) => client.post('/activities', data);
export const updateActivity = (id, data) => client.put(`/activities/${id}`, data);
export const publishActivity = (id) => client.patch(`/activities/${id}/publish`);
export const cancelActivity = (id) => client.patch(`/activities/${id}/cancel`);

export const favoriteActivity = (id) => client.post(`/activities/${id}/favorite`);
export const unfavoriteActivity = (id) => client.delete(`/activities/${id}/favorite`);
