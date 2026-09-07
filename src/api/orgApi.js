import client from './axiosClient';
import { registerPartner, resendVerification } from './authApi';

const USE_MOCK_API = import.meta.env.DEV && import.meta.env.MODE !== 'test';

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
  if (USE_MOCK_API) {
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
  if (USE_MOCK_API) {
    console.info('[MOCK] resendOrganizationConfirmationEmail', email);
    return simulateRequest({ data: { resent: true }, delay: 1000 });
  }
  return resendVerification(email);
};

// Devuelve las cuentas de organización pendientes de revisión por la admin.
export const getPendingOrganizations = ({ status = 'PENDING', page = 0 } = {}) => {
  if (USE_MOCK_API) {
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
  if (USE_MOCK_API) {
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
  if (USE_MOCK_API) {
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

export const getOrgActivities = (params = {}) => (
  client.get('/org/activities', { params: pickParams(params, ['status', 'page']) })
);
export const createOrgActivity = (data) => client.post('/org/activities', data);
export const updateOrgActivity = (id, data) => client.put(`/org/activities/${id}`, data);
export const submitOrgActivity = (id) => client.patch(`/org/activities/${id}/submit`);

export const getOrgProposals = (params = {}) => (
  client.get('/org/proposals', { params: pickParams(params, ['page']) })
);
export const createOrgProposal = (data) => client.post('/org/proposals', data);
export const getOrgDashboard = (year) => (
  client.get('/org/dashboard', { params: year ? { year } : {} })
);
