import client from './axiosClient';
import { registerPartner, resendVerification } from './authApi';
import { getOrgDashboardMockData } from '../assets/mock/data/orgDashboard';
import { isMockEnabled } from './mocks';

// Solo `/org/dashboard` sigue en mock: no tiene controlador en el backend. El
// resto del módulo va siempre contra el backend real. Ver `src/api/mocks.js`.
const useDevelopmentMocks = () => isMockEnabled('ORG');

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

export const createOrganization = (data) => registerPartner(data);

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

export const getOrgActivities = (params = {}) => (
  client.get('/org/activities', { params: pickParams(params, ['status', 'page', 'size']) })
);
export const createOrgActivity = (data) => client.post('/org/activities', data);
export const updateOrgActivity = (id, data) => client.put(`/org/activities/${id}`, data);
export const submitOrgActivity = (id) => client.patch(`/org/activities/${id}/submit`);

// --- Propuestas de la entidad · `B2-16` ----------------------------------
// Con la forma de `OrgProposalRow`: sin título ni imagen, tres estados (`NEW`,
// `ACCEPTED`, `REJECTED`) y `activityId` solo en las aceptadas. No hay
// borradores: la propuesta nace decidida.
export const getOrgProposals = (params = {}) => (
  client.get('/org/proposals', { params: pickParams(params, ['page']) })
);
export const createOrgProposal = (data) => client.post('/org/proposals', data);

// `submitOrgProposal` vivía aquí y llamaba a `PATCH /org/proposals/{id}/submit`,
// que no existe: la propuesta nace `NEW` y no hay borradores que enviar.
export const getOrgDashboard = (year) => {
  if (useDevelopmentMocks()) return simulateRequest({ data: getOrgDashboardMockData() });
  return client.get('/org/dashboard', { params: year ? { year } : {} });
};
