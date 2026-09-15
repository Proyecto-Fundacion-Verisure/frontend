import client from './axiosClient';
import { ApiError } from './apiError';
import { isDevelopmentMockEnabled as isModuleMockEnabled } from './mockConfig';
import {
  normalizeActivity,
  normalizeRequestResult,
  serializeActivityLine,
  serializeActivityRequest,
} from './normalizers';

const isDevelopmentMockEnabled = () => isModuleMockEnabled('ACTIVITY');

// Ids, títulos y entidades copiados de `ActivitySeeder` del backend.
//
// El catálogo sigue mockeado porque `GET /api/activities` es de BE2 y no existe
// todavía, pero el módulo de inscripciones ya es real: `RegistrationsProvider`
// cruza estos ids con los que devuelve `/registrations/me` para marcar el «ya
// inscrito», y `RegisterButton` manda el id a `POST /registrations` de verdad.
// Con ids inventados el corazón se pintaba mal e inscribirse daba 404. Cuando
// llegue `B2-07`, este bloque desaparece.
//
// Los nombres de campo siguen siendo los del mock —`capacity`, `organizationName`,
// `image`— y no los del contrato —`spots`, `partnerName`, `imageUrl`—: renombrarlos
// toca el pintado de las pantallas de BE2, y eso va con su integración.
const MOCK_ACTIVITIES = [
  {
    id: 5,
    title: 'Refuerzo escolar',
    description: 'Apoyo escolar para menores en riesgo de exclusión.',
    line: 'educar',
    mode: 'PRESENCIAL',
    capacity: 6,
    registeredCount: 0,
    organizationName: 'Educamos Juntos',
    location: 'Madrid',
    image: '/images/02-educar-linea-de-accion.png',
    favoritedByMe: false,
    favoriteCount: 5,
    status: 'IN_PROGRESS',
  },
  {
    id: 6,
    title: 'Mentoría online para jóvenes',
    description: 'Acompañamiento individual en la búsqueda del primer empleo.',
    line: 'educar',
    mode: 'ONLINE',
    capacity: 4,
    registeredCount: 0,
    organizationName: 'Educamos Juntos',
    location: 'Online',
    image: '/images/02-educar-linea-de-accion.png',
    favoritedByMe: false,
    favoriteCount: 3,
    status: 'IN_PROGRESS',
  },
  {
    id: 7,
    title: 'Limpieza de playas',
    description: 'Jornada de recogida de residuos en el litoral.',
    line: 'medioambiente',
    mode: 'PRESENCIAL',
    capacity: 8,
    registeredCount: 0,
    organizationName: 'Cruz Roja Valencia',
    location: 'Valencia',
    image: '/images/04-voluntariado-linea-de-accion.png',
    favoritedByMe: true,
    favoriteCount: 14,
    status: 'PUBLISHED',
  },
  {
    id: 8,
    title: 'Reparto del banco de alimentos',
    description: 'Clasificación y reparto de alimentos a familias en situación vulnerable.',
    line: 'medioambiente',
    mode: 'PRESENCIAL',
    capacity: 6,
    registeredCount: 0,
    organizationName: 'Banco de Alimentos',
    location: 'Valencia',
    image: '/images/04-voluntariado-linea-de-accion.png',
    favoritedByMe: false,
    favoriteCount: 8,
    status: 'PUBLISHED',
  },
  {
    id: 9,
    title: 'Charlas de prevención',
    description: 'Charlas en institutos sobre convivencia y prevención del acoso.',
    line: 'acoso',
    mode: 'MIXTO',
    capacity: 5,
    registeredCount: 0,
    organizationName: 'Prevención Total',
    location: 'Barcelona',
    image: '/images/03-acoso-linea-de-accion.png',
    favoritedByMe: false,
    favoriteCount: 2,
    status: 'PUBLISHED',
  },
  {
    // Aforo 2 y lleno: es la que manda a la cola, y la que abre el tablero.
    id: 10,
    title: 'Visitas a residencias',
    description: 'Visitas de acompañamiento en residencias de mayores.',
    line: 'desoledad',
    mode: 'PRESENCIAL',
    capacity: 2,
    registeredCount: 2,
    organizationName: 'Cáritas Barcelona',
    location: 'Barcelona',
    image: '/images/01-desoledad-linea-de-accion.png',
    favoritedByMe: true,
    favoriteCount: 21,
    status: 'FULL',
  },
];

const PUBLIC_ACTIVITY_STATUSES = new Set([
  'PUBLISHED',
  'FULL',
  'IN_PROGRESS',
  'FINISHED',
]);

function mockGetPublishedActivities(params = {}) {
  let results = MOCK_ACTIVITIES.filter((activity) => PUBLIC_ACTIVITY_STATUSES.has(activity.status));

  if (params.line) {
    const line = serializeActivityLine(params.line);
    results = results.filter((a) => a.line === line);
  }
  if (params.mode) {
    results = results.filter((a) => a.mode === params.mode);
  }
  const page = Math.max(0, Number(params.page) || 0);
  const size = Number(params.size) || 12;
  const start = page * size;
  const paged = results.slice(start, start + size);

  return Promise.resolve({
    data: {
      content: paged,
      number: page,
      size,
      totalElements: results.length,
      totalPages: Math.ceil(results.length / size),
    },
  });
}

function mockGetAdminActivities(params = {}) {
  let results = [...MOCK_ACTIVITIES];

  if (params.status) {
    results = results.filter((activity) => activity.status === params.status);
  }
  const page = Math.max(0, Number(params.page) || 0);
  const size = Number(params.size) || 10;
  const start = page * size;
  const content = results.slice(start, start + size);

  return Promise.resolve({
    data: {
      content,
      number: page,
      size,
      totalElements: results.length,
      totalPages: Math.ceil(results.length / size),
    },
  });
}

function getPartnerOrganizationName() {
  try {
    const serializedUser = localStorage.getItem('user');
    if (!serializedUser) return null;
    const user = JSON.parse(serializedUser);
    return user?.organization ?? user?.name ?? null;
  } catch {
    return null;
  }
}

function mockGetPartnerActivities(params = {}) {
  const partnerName = getPartnerOrganizationName();
  let results = partnerName
    ? MOCK_ACTIVITIES.filter((a) => a.organizationName === partnerName)
    : [...MOCK_ACTIVITIES];

  if (params.status) {
    results = results.filter((activity) => activity.status === params.status);
  }
  const page = Math.max(0, Number(params.page) || 0);
  const size = Number(params.size) || 10;
  const start = page * size;
  const content = results.slice(start, start + size);

  return Promise.resolve({
    data: {
      content,
      number: page,
      size,
      totalElements: results.length,
      totalPages: Math.ceil(results.length / size),
    },
  });
}

function mockGetActivityDetail(id) {
  const activity = MOCK_ACTIVITIES.find((a) => (
    String(a.id) === String(id) && PUBLIC_ACTIVITY_STATUSES.has(a.status)
  ));
  if (!activity) {
    return Promise.reject(
      new ApiError({ message: 'No se ha encontrado el recurso solicitado.', status: 404 }),
    );
  }
  return Promise.resolve({ data: activity });
}

async function mockGetAdminActivity(id) {
  const activity = MOCK_ACTIVITIES.find((item) => String(item.id) === String(id));
  if (!activity) {
    throw new ApiError({ message: 'No se ha encontrado el recurso solicitado.', status: 404 });
  }
  return {
    data: {
      ...activity,
      modality: activity.mode,
      maxParticipants: activity.capacity,
      hours: 3,
      startDate: '2026-10-10T09:00:00Z',
      endDate: '2026-10-10T12:00:00Z',
      registrationDeadline: '2026-10-08T21:59:00Z',
      imageUrl: activity.image,
      status: 'DRAFT',
    },
  };
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

const pickParams = (params = {}, allowed = []) => Object.fromEntries(
  Object.entries(params).filter(([key, value]) => (
    allowed.includes(key) && value !== undefined && value !== null && value !== ''
  )),
);

const normalized = (request) => normalizeRequestResult(request, normalizeActivity);

function mockCreateActivity(data, { partner = false } = {}) {
  const id = Math.max(...MOCK_ACTIVITIES.map((activity) => Number(activity.id) || 0), 0) + 1;
  const activity = normalizeActivity({
    id,
    ...data,
    status: 'DRAFT',
    partnerName: partner ? getPartnerOrganizationName() : data.partnerName,
  });
  MOCK_ACTIVITIES.push(activity);
  return Promise.resolve({ data: activity, status: 201 });
}

function mockUpdateActivity(id, data) {
  const index = MOCK_ACTIVITIES.findIndex((activity) => String(activity.id) === String(id));
  if (index < 0) {
    return Promise.reject(new ApiError({ message: 'No se ha encontrado el recurso solicitado.', status: 404 }));
  }
  MOCK_ACTIVITIES[index] = normalizeActivity({ ...MOCK_ACTIVITIES[index], ...data });
  return Promise.resolve({ data: MOCK_ACTIVITIES[index] });
}

function mockChangeActivityStatus(id, status) {
  const activity = MOCK_ACTIVITIES.find((item) => String(item.id) === String(id));
  if (!activity) {
    return Promise.reject(new ApiError({ message: 'No se ha encontrado el recurso solicitado.', status: 404 }));
  }
  activity.status = status;
  return Promise.resolve({ data: normalizeActivity(activity) });
}

export const getAdminActivities = (params) =>
  normalized(isDevelopmentMockEnabled()
    ? mockGetAdminActivities(params)
    : client.get('/admin/activities', { params: pickParams(params, ['status', 'page']) }));
export const getActivities = (params = {}) => (
  normalized(isDevelopmentMockEnabled()
    ? mockGetPublishedActivities(params)
    : client.get('/activities', {
      params: pickParams(
        { ...params, line: serializeActivityLine(params.line) },
        ['line', 'mode', 'from', 'to', 'page', 'size'],
      ),
    }))
);
export const getPublishedActivities = getActivities;
export const getActivityDetail = (id) =>
  normalized(isDevelopmentMockEnabled() ? mockGetActivityDetail(id) : client.get(`/activities/${id}`));
export const getAdminActivity = (id) =>
  normalized(isDevelopmentMockEnabled() ? mockGetAdminActivity(id) : client.get(`/admin/activities/${id}`));
export const createActivity = (data) => normalized(
  isDevelopmentMockEnabled()
    ? mockCreateActivity(data)
    : client.post('/admin/activities', serializeActivityRequest(data)),
);
export const updateActivity = (id, data) => normalized(
  isDevelopmentMockEnabled()
    ? mockUpdateActivity(id, data)
    : client.put(`/admin/activities/${id}`, serializeActivityRequest(data)),
);
export const publishActivity = (id) => normalized(
  isDevelopmentMockEnabled()
    ? mockChangeActivityStatus(id, 'PUBLISHED')
    : client.patch(`/admin/activities/${id}/publish`),
);
export const cancelActivity = (id) =>
  normalized(isDevelopmentMockEnabled() ? mockCancelActivity(id) : client.patch(`/admin/activities/${id}/cancel`));

export const uploadActivityImage = (image) => {
  if (isDevelopmentMockEnabled()) {
    return Promise.resolve({ data: { url: `/uploads/${encodeURIComponent(image.name)}` }, status: 201 });
  }
  const body = new FormData();
  body.append('image', image);
  return client.post('/admin/activity-images', body, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getPendingActivities = (params = {}) => (
  normalized(isDevelopmentMockEnabled()
    ? mockGetAdminActivities({ ...params, status: 'PENDING_APPROVAL' })
    : client.get('/admin/activities/pending', { params: pickParams(params, ['page']) }))
);
export const approveActivity = (id) => normalized(
  isDevelopmentMockEnabled()
    ? mockChangeActivityStatus(id, 'PUBLISHED')
    : client.patch(`/admin/activities/${id}/approve`),
);
export const returnActivity = (id, note) => (
  normalized(isDevelopmentMockEnabled()
    ? mockChangeActivityStatus(id, 'DRAFT')
    : client.patch(`/admin/activities/${id}/return`, { note }))
);

export const getPartnerActivities = (params = {}) =>
  normalized(isDevelopmentMockEnabled()
    ? mockGetPartnerActivities(params)
    : client.get('/org/activities', { params: pickParams(params, ['status', 'page']) }));
