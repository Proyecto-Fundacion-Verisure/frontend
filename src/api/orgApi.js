import client from './axiosClient';

const USE_MOCK_API = true;

function simulateRequest({ data, delay = 1000, failRate = 0 } = {}) {
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
    status: 'pending',
    requestedAt: '2026-08-28T09:14:00Z',
  },
  {
    id: 'org-2',
    organizationName: 'Banc dels Aliments',
    cif: 'G59198836',
    contactName: 'Jordi Ferran',
    email: 'jordi.ferran@bancdelsaliments.org',
    phone: '+34 933 46 43 06',
    status: 'pending',
    requestedAt: '2026-08-29T16:40:00Z',
  },
  {
    id: 'org-3',
    organizationName: 'Fundación Ared',
    cif: 'G80123456',
    contactName: 'Laura Gómez',
    email: 'laura.gomez@fundacionared.org',
    phone: '+34 911 22 33 44',
    status: 'pending',
    requestedAt: '2026-09-01T11:05:00Z',
  },
];

export const createOrganization = (data) => {
  if (USE_MOCK_API) {
    console.info('[MOCK] createOrganization', data);
    const newOrg = {
      id: `org-${Date.now()}`,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      ...data,
    };
    mockOrganizations = [newOrg, ...mockOrganizations];
    return simulateRequest({ data: { id: newOrg.id, status: 'pending' }, delay: 1200 });
  }
  return client.post('/organizations', data);
};

export const resendOrganizationRegistrationEmail = (email) => {
  if (USE_MOCK_API) {
    console.info('[MOCK] resendOrganizationConfirmationEmail', email);
    return simulateRequest({ data: { resent: true }, delay: 1000 });
  }
  return client.post('/organizations/resend-registration', { email });
};

// Devuelve las cuentas de organización pendientes de revisión por la admin.
export const getPendingOrganizations = () => {
  if (USE_MOCK_API) {
    console.info('[MOCK] getPendingOrganizations');
    const pending = mockOrganizations.filter((org) => org.status === 'pending');
    return simulateRequest({ data: pending, delay: 900, failRate: 0.1 });
  }
  return client.get('/organizations', { params: { status: 'pending' } });
};

// Acepta la cuenta: la organización pasa a poder acceder a la plataforma.
export const approveOrganization = (id) => {
  if (USE_MOCK_API) {
    console.info('[MOCK] approveOrganization', id);
    mockOrganizations = mockOrganizations.map((org) =>
      org.id === id ? { ...org, status: 'accepted' } : org
    );
    return simulateRequest({ data: { id, status: 'accepted' }, delay: 800, failRate: 0.1 });
  }
  return client.patch(`/organizations/${id}/accept`);
};

// Rechaza la cuenta. La seguridad la da la confirmación en el modal, no un motivo.
export const rejectOrganization = (id) => {
  if (USE_MOCK_API) {
    console.info('[MOCK] rejectOrganization', id);
    mockOrganizations = mockOrganizations.map((org) =>
      org.id === id ? { ...org, status: 'rejected' } : org
    );
    return simulateRequest({ data: { id, status: 'rejected' }, delay: 800, failRate: 0.1 });
  }
  return client.patch(`/organizations/${id}/reject`);
};