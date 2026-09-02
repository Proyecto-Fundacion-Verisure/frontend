import client from './axiosClient';

const isMockEnabled = () => import.meta.env.DEV && import.meta.env.MODE !== 'test';

function mockGetCertificate(reportId) {
  return Promise.resolve({
    data: {
      reportId: Number(reportId),
      fullName: 'María García López',
      activityTitle: 'Acompañamiento a mayores',
      partnerName: 'Fundación Solitaria',
      line: 'desoledad',
      startDate: '2026-05-10T09:00:00Z',
      endDate: '2026-06-21T12:00:00Z',
      validatedHours: 18,
      issuedAt: '2026-07-01T10:00:00Z',
      reference: 'CERT-2026-0418',
    },
  });
}

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
export const getCertificate = (reportId) =>
  isMockEnabled()
    ? mockGetCertificate(reportId)
    : client.get(`/reports/${reportId}/certificate`);
