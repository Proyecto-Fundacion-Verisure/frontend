import client from './axiosClient';

export const getDashboard = (params) => client.get('/dashboard', { params });

const csvConfig = (params) => ({ params, responseType: 'blob' });

export const exportParticipationsCsv = (params) => (
  client.get('/dashboard/export/participations.csv', csvConfig(params))
);

export const exportPartnersCsv = (params) => (
  client.get('/dashboard/export/partners.csv', csvConfig(params))
);
