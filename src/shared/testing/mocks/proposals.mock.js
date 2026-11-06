import { createApiError } from '../fixtures/apiErrors';
import { MOCK_PROPOSALS_V2, ProposalStatus } from '../fixtures/proposals';

let store = [...MOCK_PROPOSALS_V2.map((p) => ({ ...p }))];

export function resetProposalsMock() {
  store = [...MOCK_PROPOSALS_V2.map((p) => ({ ...p }))];
}

export function mockGetProposals(params = {}) {
  let results = [...store];
  if (params.status) results = results.filter((p) => p.status === params.status);
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 10;
  const start = (page - 1) * limit;
  const paged = results.slice(start, start + limit);
  return Promise.resolve({ data: paged, headers: { 'x-total-count': String(results.length) }, status: 200 });
}

export function mockGetProposal(id) {
  const proposal = store.find((p) => String(p.id) === String(id));
  if (!proposal) return Promise.reject(createApiError({ status: 404, message: 'No se ha encontrado el recurso solicitado.' }));
  return Promise.resolve({ data: { ...proposal }, status: 200 });
}

export function mockAcceptProposal(id) {
  const proposal = store.find((p) => String(p.id) === String(id));
  if (!proposal) return Promise.reject(createApiError({ status: 404, message: 'No se ha encontrado el recurso solicitado.' }));
  if (proposal.status !== ProposalStatus.NEW) {
    return Promise.reject(createApiError({ status: 409, code: 'PROPOSAL_ALREADY_DECIDED', message: 'La propuesta ya ha sido decidida.' }));
  }
  proposal.status = ProposalStatus.ACCEPTED;
  return Promise.resolve({ data: { id: Number(id), activityId: 100 + Number(id), status: 'DRAFT' }, status: 201 });
}

export function mockRejectProposal(id) {
  const proposal = store.find((p) => String(p.id) === String(id));
  if (!proposal) return Promise.reject(createApiError({ status: 404, message: 'No se ha encontrado el recurso solicitado.' }));
  if (proposal.status !== ProposalStatus.NEW) {
    return Promise.reject(createApiError({ status: 409, code: 'PROPOSAL_ALREADY_DECIDED', message: 'La propuesta ya ha sido decidida.' }));
  }
  proposal.status = ProposalStatus.REJECTED;
  return Promise.resolve({ data: { id: Number(id), status: ProposalStatus.REJECTED }, status: 200 });
}

export function mockCreateProposal(data) {
  const fieldErrors = {};
  if (!data.organizationName?.trim()) fieldErrors.organizationName = 'Requerido';
  if (!data.cif?.trim()) fieldErrors.cif = 'Requerido';
  if (!data.contactName?.trim()) fieldErrors.contactName = 'Requerido';
  if (!/^\S+@\S+\.\S+$/.test(data.email?.trim() ?? '')) fieldErrors.email = 'Correo inválido';
  if (!data.phone?.trim()) fieldErrors.phone = 'Requerido';
  if (!data.description?.trim()) fieldErrors.description = 'Requerido';
  if (!data.consent) fieldErrors.consent = 'Requerido';
  if (Object.keys(fieldErrors).length) {
    return Promise.reject(createApiError({ status: 400, code: 'VALIDATION_ERROR', message: 'La solicitud no es válida.', fieldErrors }));
  }
  const email = data.email.toLowerCase();
  if (email.includes('error')) return Promise.reject(createApiError({ status: 500, message: 'Ha ocurrido un error en el servidor. Inténtalo más tarde.' }));
  if (email.includes('rate') || email.includes('limit')) return Promise.reject(createApiError({ status: 429, message: 'Se han realizado demasiadas solicitudes. Inténtalo más tarde.' }));
  return Promise.resolve({ data: { id: Math.floor(Math.random() * 10000) + 1, status: ProposalStatus.NEW, ...data, estimatedVolunteers: Number(data.estimatedVolunteers) || null, createdAt: new Date().toISOString() }, status: 201 });
}

export const _store = {
  get all() {
    return store;
  },
};
