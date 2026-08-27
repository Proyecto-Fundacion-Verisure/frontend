import client from './axiosClient';

export const getPendingReports = (params) => client.get('/reports/pending', { params });
export const getReport = (reportId) => client.get(`/reports/${reportId}`);

// Backend uses this same collection endpoint for a new report (201) and for
// resubmitting a RETURNED report (200). The payload must include registrationId.
export const submitReport = (data) => client.post('/reports', data);

export const validateReport = (reportId, data) => (
  client.patch(`/reports/${reportId}/validate`, data)
);
export const returnReport = (reportId, data) => (
  client.patch(`/reports/${reportId}/return`, data)
);
export const getCertificate = (reportId) => client.get(`/reports/${reportId}/certificate`);
