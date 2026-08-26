import client from './axiosClient';

export const getProposals = (params) => client.get('/proposals', { params });
export const getProposal = (id) => client.get(`/proposals/${id}`);
export const createProposal = (data) => client.post('/proposals', data);
export const acceptProposal = (id) => client.post(`/proposals/${id}/accept`);
export const rejectProposal = (id) => client.patch(`/proposals/${id}/reject`);
