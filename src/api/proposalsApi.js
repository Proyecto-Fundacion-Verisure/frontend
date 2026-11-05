import client from './axiosClient';

const pickAdminParams = (params = {}) => Object.fromEntries(
  Object.entries(params).filter(([key, value]) => (
    ['status', 'page', 'size'].includes(key) && value !== undefined && value !== null && value !== ''
  )),
);

export const getProposals = (params = {}) => (
  client.get('/admin/proposals', { params: pickAdminParams(params) })
);

export const getProposal = (id) => client.get(`/admin/proposals/${id}`);

export const acceptProposal = (id) => client.post(`/admin/proposals/${id}/accept`);

export const rejectProposal = (id) => client.patch(`/admin/proposals/${id}/reject`);

// El formulario público de la landing: no lleva token.
export const createProposal = (data) => client.post('/proposals', data);
