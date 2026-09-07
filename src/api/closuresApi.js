import client from './axiosClient';

const isMockEnabled = () => import.meta.env.DEV && import.meta.env.MODE !== 'test';

function mockGetCertificate(closureId) {
  return Promise.resolve({
    data: {
      closureId: Number(closureId),
      fullName: 'María García López',
      activityTitle: 'Acompañamiento a mayores',
      partnerName: 'Fundación Solitaria',
      line: 'desoledad',
      startDate: '2026-05-10T09:00:00Z',
      endDate: '2026-06-21T12:00:00Z',
      actualHours: 18,
      issuedAt: '2026-07-01T10:00:00Z',
      reference: 'CERT-2026-0418',
    },
  });
}

export const getClosure = (closureId) => client.get(`/closures/${closureId}`);
export const submitClosure = (request, evidence = null) => {
  const body = new FormData();
  body.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }));
  if (evidence) body.append('evidence', evidence);
  return client.post('/closures', body, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const getCertificate = (closureId) =>
  isMockEnabled() ? mockGetCertificate(closureId) : client.get(`/closures/${closureId}/certificate`);

// Admin closures
export const getPendingActivityClosures = ({ page } = {}) => client.get(
  '/admin/activities/pending-closure',
  { params: page === undefined || page === null ? {} : { page } },
);
export const getActivityClosure = (activityId) => client.get(`/admin/activities/${activityId}/closure`);
export const saveActivityClosure = (activityId, data) => client.put(`/admin/activities/${activityId}/closure`, data);
export const finalizeActivityClosure = (activityId) => client.patch(`/admin/activities/${activityId}/closure/finalize`);
