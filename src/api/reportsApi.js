import client from './axiosClient';

export const getReports = (params) => client.get('/reports', { params });
export const createReport = (data) => client.post('/reports', data);
export const updateReport = (id, data) => client.patch(`/reports/${id}`, data);
export const getCertificate = (id) => client.get(`/reports/${id}/certificate`);
