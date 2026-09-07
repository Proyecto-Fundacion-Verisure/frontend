import client from './axiosClient';

const isMockEnabled = () => import.meta.env.DEV && import.meta.env.MODE !== 'test';

function mockGetCertificate(closureId) {
  return Promise.resolve({
    data: {
      closureId: Number(closureId),
      reportId: Number(closureId),
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

// Nuevo contrato: /api/closures
export const getPendingClosures = (params) => client.get('/closures/pending', { params });
export const getClosure = (closureId) => client.get(`/closures/${closureId}`);
export const submitClosure = (data) => client.post('/closures', data);
export const validateClosure = (closureId, data) => client.patch(`/closures/${closureId}/validate`, data);
export const returnClosure = (closureId, data) => client.patch(`/closures/${closureId}/return`, data);
export const getCertificate = (closureId) =>
  isMockEnabled() ? mockGetCertificate(closureId) : client.get(`/closures/${closureId}/certificate`);

// Aliases legacy reportsApi para compatibilidad (frontend aún usa /reports en algunos lugares)
export const getPendingReports = getPendingClosures;
export const getReport = getClosure;
export const submitReport = submitClosure;
export const validateReport = validateClosure;
export const returnReport = returnClosure;

// Admin closures
export const getPendingActivityClosures = (params) => client.get('/admin/activities/pending-closure', { params });
export const getActivityClosure = (activityId) => client.get(`/admin/activities/${activityId}/closure`);
export const saveActivityClosure = (activityId, data) => client.put(`/admin/activities/${activityId}/closure`, data);
export const finalizeActivityClosure = (activityId) => client.patch(`/admin/activities/${activityId}/closure/finalize`);
