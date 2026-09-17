import client from './axiosClient';
import { ApiError } from './apiError';
import { registerPartner, resendVerification } from './authApi';
import { getOrgDashboardMockData } from '../assets/mock/data/orgDashboard';
import { isMockEnabled } from './mocks';

// Cuatro interruptores, uno por backend. `ORG_REGISTER`, `ORG_ACTIVITY` y
// `ORG_PROPOSAL` están integrados y sus mocks se quedan como escotilla para
// trabajar con el backend apagado; las cuentas de entidad (`ORG_ACCOUNT`) van
// siempre al backend; `ORG` sigue mockeado porque `/org/dashboard` no tiene
// controlador. Ver `src/api/mocks.js`.
const useDevelopmentMocks = () => isMockEnabled('ORG');
const useRegisterMocks = () => isMockEnabled('ORG_REGISTER');
const useActivityMocks = () => isMockEnabled('ORG_ACTIVITY');
const useProposalMocks = () => isMockEnabled('ORG_PROPOSAL');

function simulateRequest({ data, delay = 300, failRate = 0 } = {}) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < failRate) {
        reject(new Error('Simulated API error'));
      } else {
        resolve({ data });
      }
    }, delay);
  });
}

export const createOrganization = (data) => {
  if (useRegisterMocks()) {
    console.info('[MOCK] createOrganization', data);
    const newOrg = {
      id: `org-${Date.now()}`,
      status: 'PENDING',
      requestedAt: new Date().toISOString(),
      ...data,
      organizationName: data.organizationName ?? data.name,
    };
    return simulateRequest({ data: { id: newOrg.id, status: 'PENDING' }, delay: 1200 });
  }
  return registerPartner(data);
};

export const resendOrganizationRegistrationEmail = (email) => resendVerification(email);

// Cuentas de entidad pendientes de revisar por la administradora. `PENDING` lo
// traduce el backend a `PENDING_VERIFICATION + PENDING_APPROVAL`.
export const getPendingOrganizations = ({ status = 'PENDING', page = 0, size } = {}) => (
  client.get('/admin/org-accounts', {
    params: size === undefined || size === null ? { status, page } : { status, page, size },
  })
);

// Acepta la cuenta: la organización pasa a poder acceder a la plataforma.
export const approveOrganization = (id) => client.patch(`/admin/org-accounts/${id}/approve`);

// Rechaza la cuenta. La seguridad la da la confirmación en el modal, no un motivo.
export const rejectOrganization = (id) => client.patch(`/admin/org-accounts/${id}/reject`);

const pickParams = (params = {}, allowed) => Object.fromEntries(
  Object.entries(params).filter(([key, value]) => (
    allowed.includes(key) && value !== undefined && value !== null && value !== ''
  )),
);

function mockPage(items, params = {}, size = 10) {
  const page = Math.max(0, Number(params.page) || 0);
  const start = page * size;
  return Promise.resolve({
    data: {
      content: items.slice(start, start + size),
      number: page,
      size,
      totalElements: items.length,
      totalPages: Math.ceil(items.length / size),
    },
  });
}

// --- Actividades de la entidad · `B2-13` ---------------------------------
// Con la forma de `OrgActivityRow`: sin `partnerName` (la entidad ya sabe quién
// es), sin `favoriteCount` ni `description`, y con `reviewNote`, que es lo único
// que distingue una devuelta de un borrador. Las dos primeras son las de Cáritas
// Barcelona en `ActivitySeeder`.
let mockOrgActivities = [
  {
    id: 10,
    title: 'Visitas a residencias',
    line: 'desoledad',
    mode: 'PRESENCIAL',
    location: 'Barcelona',
    startDate: '2026-10-01',
    endDate: '2026-10-31',
    registrationDeadline: '2026-09-23',
    hours: 2,
    spots: 12,
    occupiedSpots: 12,
    status: 'FULL',
    reviewNote: null,
  },
  {
    id: 1,
    title: 'Acompañamiento a mayores',
    line: 'desoledad',
    mode: 'PRESENCIAL',
    location: 'Barcelona',
    startDate: '2026-03-02',
    endDate: '2026-03-27',
    registrationDeadline: '2026-02-20',
    hours: 8,
    spots: 20,
    occupiedSpots: 20,
    status: 'FINISHED',
    reviewNote: null,
  },
  {
    id: 901,
    title: 'Taller de memoria',
    line: 'desoledad',
    mode: 'PRESENCIAL',
    location: 'Barcelona',
    startDate: '2026-11-10',
    endDate: '2026-11-10',
    registrationDeadline: '2026-11-03',
    hours: 3,
    spots: 6,
    occupiedSpots: 0,
    status: 'DRAFT',
    reviewNote: 'Concreta el lugar y amplía la descripción del taller.',
  },
];

function mockGetOrgActivities(params = {}) {
  const results = params.status
    ? mockOrgActivities.filter((activity) => activity.status === params.status)
    : mockOrgActivities;
  return mockPage(results, params);
}

function toMockOrgActivityRow(id, data, previous = {}) {
  return {
    id,
    title: data.title,
    line: data.line,
    mode: data.mode,
    location: data.location ?? null,
    startDate: data.startDate,
    endDate: data.endDate,
    registrationDeadline: data.registrationDeadline,
    hours: data.hours,
    spots: data.spots,
    occupiedSpots: previous.occupiedSpots ?? 0,
    status: previous.status ?? 'DRAFT',
    reviewNote: previous.reviewNote ?? null,
  };
}

function mockCreateOrgActivity(data) {
  console.info('[MOCK] createOrgActivity', data);
  const row = toMockOrgActivityRow(Date.now(), data);
  mockOrgActivities = [row, ...mockOrgActivities];
  return simulateRequest({ data: row, delay: 400 });
}

function findMockOrgActivity(id) {
  const activity = mockOrgActivities.find((item) => String(item.id) === String(id));
  if (!activity) {
    return Promise.reject(
      new ApiError({ message: 'No se ha encontrado el recurso solicitado.', status: 404 }),
    );
  }
  if (activity.status !== 'DRAFT') {
    return Promise.reject(new ApiError({ status: 409, code: 'ACTIVITY_NOT_EDITABLE' }));
  }
  return Promise.resolve(activity);
}

async function mockUpdateOrgActivity(id, data) {
  console.info('[MOCK] updateOrgActivity', id, data);
  const previous = await findMockOrgActivity(id);
  const row = toMockOrgActivityRow(previous.id, data, previous);
  mockOrgActivities = mockOrgActivities.map((item) => (item.id === row.id ? row : item));
  return simulateRequest({ data: row, delay: 400 });
}

async function mockSubmitOrgActivity(id) {
  console.info('[MOCK] submitOrgActivity', id);
  const previous = await findMockOrgActivity(id);
  const row = { ...previous, status: 'PENDING_APPROVAL' };
  mockOrgActivities = mockOrgActivities.map((item) => (item.id === row.id ? row : item));
  return simulateRequest({ data: row, delay: 400 });
}

export const getOrgActivities = (params = {}) => (
  useActivityMocks()
    ? mockGetOrgActivities(params)
    : client.get('/org/activities', { params: pickParams(params, ['status', 'page', 'size']) })
);
export const createOrgActivity = (data) => (
  useActivityMocks() ? mockCreateOrgActivity(data) : client.post('/org/activities', data)
);
export const updateOrgActivity = (id, data) => (
  useActivityMocks() ? mockUpdateOrgActivity(id, data) : client.put(`/org/activities/${id}`, data)
);
export const submitOrgActivity = (id) => (
  useActivityMocks() ? mockSubmitOrgActivity(id) : client.patch(`/org/activities/${id}/submit`)
);

// --- Propuestas de la entidad · `B2-16` ----------------------------------
// Con la forma de `OrgProposalRow`: sin título ni imagen, tres estados (`NEW`,
// `ACCEPTED`, `REJECTED`) y `activityId` solo en las aceptadas. No hay
// borradores: la propuesta nace decidida.
let mockOrgProposals = [
  {
    id: 101,
    description: 'Programa de mentoría para jóvenes en riesgo de exclusión social.',
    suggestedLine: 'educar',
    estimatedVolunteers: 8,
    scope: 20,
    status: 'NEW',
    createdAt: '2026-08-20T10:00:00Z',
    activityId: null,
  },
  {
    id: 102,
    description: 'Visitas semanales para combatir la soledad no deseada.',
    suggestedLine: 'desoledad',
    estimatedVolunteers: 12,
    scope: null,
    status: 'ACCEPTED',
    createdAt: '2026-07-15T09:30:00Z',
    activityId: 10,
  },
];

function mockCreateOrgProposal(data) {
  console.info('[MOCK] createOrgProposal', data);
  const row = {
    id: Date.now(),
    description: data.description,
    suggestedLine: data.suggestedLine ?? null,
    estimatedVolunteers: data.estimatedVolunteers,
    scope: data.scope ?? null,
    status: 'NEW',
    createdAt: new Date().toISOString(),
    activityId: null,
  };
  mockOrgProposals = [row, ...mockOrgProposals];
  return simulateRequest({ data: row, delay: 400 });
}

export const getOrgProposals = (params = {}) => (
  useProposalMocks()
    ? mockPage(mockOrgProposals, params)
    : client.get('/org/proposals', { params: pickParams(params, ['page']) })
);
export const createOrgProposal = (data) => (
  useProposalMocks() ? mockCreateOrgProposal(data) : client.post('/org/proposals', data)
);

// `submitOrgProposal` vivía aquí y llamaba a `PATCH /org/proposals/{id}/submit`,
// que no existe: la propuesta nace `NEW` y no hay borradores que enviar.
export const getOrgDashboard = (year) => {
  if (useDevelopmentMocks()) return simulateRequest({ data: getOrgDashboardMockData() });
  return client.get('/org/dashboard', { params: year ? { year } : {} });
};
