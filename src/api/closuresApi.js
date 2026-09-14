import client from './axiosClient';
import { isMockEnabled as isModuleMockEnabled } from './mocks';

const isMockEnabled = () => isModuleMockEnabled('CLOSURE');

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

const MOCK_PENDING_ACTIVITY_CLOSURES = [
  {
    activityId: 3,
    activityTitle: 'Prevención del acoso escolar',
    endDate: '2026-07-30T17:00:00Z',
    expectedHours: 15,
    reportedHours: 11,
    closuresReceived: 6,
  },
  {
    activityId: 4,
    activityTitle: 'Jornada de voluntariado ambiental',
    endDate: '2026-08-14T18:00:00Z',
    expectedHours: 30,
    reportedHours: 24,
    closuresReceived: 9,
  },
];

function mockGetPendingActivityClosures({ page = 0 } = {}) {
  const pageNumber = Math.max(0, Number(page) || 0);
  const size = 10;
  const start = pageNumber * size;
  const content = MOCK_PENDING_ACTIVITY_CLOSURES.slice(start, start + size);

  return Promise.resolve({
    data: {
      content,
      number: pageNumber,
      size,
      totalElements: MOCK_PENDING_ACTIVITY_CLOSURES.length,
      totalPages: Math.ceil(MOCK_PENDING_ACTIVITY_CLOSURES.length / size),
    },
  });
}

// Admin closures
export const getPendingActivityClosures = ({ page } = {}) => (
  isMockEnabled()
    ? mockGetPendingActivityClosures({ page })
    : client.get(
      '/admin/activities/pending-closure',
      { params: page === undefined || page === null ? {} : { page } },
    )
);
export const getActivityClosure = (activityId) => client.get(`/admin/activities/${activityId}/closure`);
export const saveActivityClosure = (activityId, data) => client.put(`/admin/activities/${activityId}/closure`, data);
export const finalizeActivityClosure = (activityId) => client.patch(`/admin/activities/${activityId}/closure/finalize`);
