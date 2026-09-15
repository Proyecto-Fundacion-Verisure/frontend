import client from './axiosClient';
import { registerPartner, resendVerification } from './authApi';
import { getOrgDashboardMockData } from '../assets/mock/data/orgDashboard';
import { isDevelopmentMockEnabled as isModuleMockEnabled } from './mockConfig';
import { normalizeActivity, normalizeRequestResult, serializeActivityRequest } from './normalizers';

const isDevelopmentMockEnabled = () => isModuleMockEnabled('ORG');

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

// --- Almacén en memoria para el modo mock -----------------------------
// Simula la tabla de organizaciones con cuentas pendientes de validar.
let mockOrganizations = [
  {
    id: 'org-1',
    organizationName: 'Cruz Roja Barcelona',
    cif: 'Q2866001G',
    contactName: 'Marta Solé',
    email: 'marta.sole@cruzroja-bcn.org',
    phone: '+34 934 12 45 67',
    status: 'PENDING',
    requestedAt: '2026-08-28T09:14:00Z',
  },
  {
    id: 'org-2',
    organizationName: 'Banc dels Aliments',
    cif: 'G59198836',
    contactName: 'Jordi Ferran',
    email: 'jordi.ferran@bancdelsaliments.org',
    phone: '+34 933 46 43 06',
    status: 'PENDING',
    requestedAt: '2026-08-29T16:40:00Z',
  },
  {
    id: 'org-3',
    organizationName: 'Fundación Ared',
    cif: 'G80123456',
    contactName: 'Laura Gómez',
    email: 'laura.gomez@fundacionared.org',
    phone: '+34 911 22 33 44',
    status: 'PENDING',
    requestedAt: '2026-09-01T11:05:00Z',
  },
];

export const createOrganization = (data) => {
  if (isDevelopmentMockEnabled()) {
    console.info('[MOCK] createOrganization', data);
    const newOrg = {
      id: `org-${Date.now()}`,
      status: 'PENDING',
      requestedAt: new Date().toISOString(),
      ...data,
      organizationName: data.organizationName ?? data.name,
    };
    mockOrganizations = [newOrg, ...mockOrganizations];
    return simulateRequest({ data: { id: newOrg.id, status: 'PENDING' }, delay: 1200 });
  }
  return registerPartner(data);
};

export const resendOrganizationRegistrationEmail = (email) => {
  if (isDevelopmentMockEnabled()) {
    console.info('[MOCK] resendOrganizationConfirmationEmail', email);
    return simulateRequest({ data: { resent: true }, delay: 1000 });
  }
  return resendVerification(email);
};

// Devuelve las cuentas de organización pendientes de revisión por la admin.
export const getPendingOrganizations = ({ status = 'PENDING', page = 0 } = {}) => {
  if (isDevelopmentMockEnabled()) {
    console.info('[MOCK] getPendingOrganizations');
    const pending = mockOrganizations.filter((org) => org.status === status);
    return simulateRequest({
      data: {
        content: pending,
        number: page,
        size: pending.length,
        totalElements: pending.length,
        totalPages: pending.length ? 1 : 0,
      },
      delay: 300,
    });
  }
  return client.get('/admin/org-accounts', { params: { status, page } });
};

// Acepta la cuenta: la organización pasa a poder acceder a la plataforma.
export const approveOrganization = (id) => {
  if (isDevelopmentMockEnabled()) {
    console.info('[MOCK] approveOrganization', id);
    mockOrganizations = mockOrganizations.map((org) =>
      org.id === id ? { ...org, status: 'ACTIVE' } : org
    );
    return simulateRequest({ data: { id, status: 'ACTIVE' }, delay: 300 });
  }
  return client.patch(`/admin/org-accounts/${id}/approve`);
};

// Rechaza la cuenta. La seguridad la da la confirmación en el modal, no un motivo.
export const rejectOrganization = (id) => {
  if (isDevelopmentMockEnabled()) {
    console.info('[MOCK] rejectOrganization', id);
    mockOrganizations = mockOrganizations.map((org) =>
      org.id === id ? { ...org, status: 'REJECTED' } : org
    );
    return simulateRequest({ data: { id, status: 'REJECTED' }, delay: 300 });
  }
  return client.patch(`/admin/org-accounts/${id}/reject`);
};

const pickParams = (params = {}, allowed) => Object.fromEntries(
  Object.entries(params).filter(([key, value]) => (
    allowed.includes(key) && value !== undefined && value !== null && value !== ''
  )),
);

let mockOrgActivities = [];

function mockGetOrgActivities(params = {}) {
  const matching = params.status
    ? mockOrgActivities.filter((activity) => activity.status === params.status)
    : mockOrgActivities;
  const page = Math.max(0, Number(params.page) || 0);
  const size = 10;
  const content = matching.slice(page * size, (page + 1) * size);
  return Promise.resolve({
    data: {
      content,
      number: page,
      size,
      totalElements: matching.length,
      totalPages: Math.ceil(matching.length / size),
    },
  });
}

function mockCreateOrgActivity(data) {
  const activity = normalizeActivity({ id: Date.now(), ...data, status: 'DRAFT' });
  mockOrgActivities = [activity, ...mockOrgActivities];
  return Promise.resolve({ data: activity, status: 201 });
}

function mockGetOrgActivity(id) {
  const activity = mockOrgActivities.find((item) => String(item.id) === String(id));
  return activity
    ? Promise.resolve({ data: activity })
    : Promise.reject(Object.assign(new Error('Actividad no encontrada.'), { status: 404 }));
}

function mockUpdateOrgActivity(id, data) {
  let updated = null;
  mockOrgActivities = mockOrgActivities.map((activity) => {
    if (String(activity.id) !== String(id)) return activity;
    updated = normalizeActivity({ ...activity, ...data });
    return updated;
  });
  return updated
    ? Promise.resolve({ data: updated })
    : Promise.reject(Object.assign(new Error('Actividad no encontrada.'), { status: 404 }));
}

function mockSubmitOrgActivity(id) {
  return mockUpdateOrgActivity(id, { status: 'PENDING_APPROVAL' });
}

export const getOrgActivities = (params = {}) => (
  normalizeRequestResult(
    isDevelopmentMockEnabled()
      ? mockGetOrgActivities(params)
      : client.get('/org/activities', { params: pickParams(params, ['status', 'page']) }),
    normalizeActivity,
  )
);
export const getOrgActivity = (id) => normalizeRequestResult(
  isDevelopmentMockEnabled() ? mockGetOrgActivity(id) : client.get(`/org/activities/${id}`),
  normalizeActivity,
);
export const createOrgActivity = (data) => normalizeRequestResult(
  isDevelopmentMockEnabled()
    ? mockCreateOrgActivity(data)
    : client.post('/org/activities', serializeActivityRequest(data)),
  normalizeActivity,
);
export const updateOrgActivity = (id, data) => normalizeRequestResult(
  isDevelopmentMockEnabled()
    ? mockUpdateOrgActivity(id, data)
    : client.put(`/org/activities/${id}`, serializeActivityRequest(data)),
  normalizeActivity,
);
export const submitOrgActivity = (id) => normalizeRequestResult(
  isDevelopmentMockEnabled() ? mockSubmitOrgActivity(id) : client.patch(`/org/activities/${id}/submit`),
  normalizeActivity,
);

const MOCK_ORG_PROPOSALS = [
  {
    id: 101,
    title: 'Taller de mentoría laboral',
    description: 'Programa de mentoría para jóvenes en riesgo de exclusión social.',
    line: 'educar',
    status: 'PENDING_APPROVAL',
    estimatedVolunteers: 8,
    createdAt: '2026-08-20T10:00:00Z',
  },
  {
    id: 102,
    title: 'Acompañamiento semanal a mayores',
    description: 'Visitas semanales para combatir la soledad no deseada.',
    line: 'desoledad',
    status: 'ACCEPTED',
    activityId: 501,
    estimatedVolunteers: 12,
    createdAt: '2026-07-15T09:30:00Z',
  },
];

function mockGetOrgProposals(params = {}) {
  const page = Math.max(0, Number(params.page) || 0);
  const size = 10;
  const start = page * size;
  const content = MOCK_ORG_PROPOSALS.slice(start, start + size);
  return Promise.resolve({
    data: {
      content,
      number: page,
      size,
      totalElements: MOCK_ORG_PROPOSALS.length,
      totalPages: Math.ceil(MOCK_ORG_PROPOSALS.length / size),
    },
  });
}

export const getOrgProposals = (params = {}) =>
  isDevelopmentMockEnabled()
    ? mockGetOrgProposals(params)
    : client.get('/org/proposals', { params: pickParams(params, ['page']) });
export const createOrgProposal = (data) => {
  if (isDevelopmentMockEnabled()) {
    console.info('[MOCK] createOrgProposal', data);
    const proposal = {
      id: Date.now(),
      status: 'DRAFT',
      ...data,
      createdAt: new Date().toISOString(),
    };
    MOCK_ORG_PROPOSALS.unshift(proposal);
    return simulateRequest({
      data: proposal,
      delay: 400,
    });
  }
  return client.post('/org/proposals', data);
};
export const submitOrgProposal = (id) => {
  if (isDevelopmentMockEnabled()) {
    console.info('[MOCK] submitOrgProposal', id);
    const proposal = MOCK_ORG_PROPOSALS.find((item) => String(item.id) === String(id));
    if (proposal) proposal.status = 'PENDING_APPROVAL';
    return simulateRequest({ data: { id, status: 'PENDING_APPROVAL' }, delay: 400 });
  }
  return client.patch(`/org/proposals/${id}/submit`);
};
export const getOrgDashboard = (year) => {
  if (isDevelopmentMockEnabled()) return simulateRequest({ data: getOrgDashboardMockData() });
  return client.get('/org/dashboard', { params: year ? { year } : {} });
};
