import client from './axiosClient';
import { isDevelopmentMockEnabled } from './mockConfig';
import { normalizeCertificate, normalizeRequestResult } from './normalizers';

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

const mockParticipationClosures = new Map();
const mockActivityClosures = new Map();

export const getClosure = (closureId) => {
  if (!isDevelopmentMockEnabled()) return client.get(`/closures/${closureId}`);
  const closure = mockParticipationClosures.get(String(closureId));
  return closure
    ? Promise.resolve({ data: closure })
    : Promise.reject(Object.assign(new Error('Cierre no encontrado.'), { status: 404 }));
};
export const submitClosure = (request, evidence = null) => {
  if (isDevelopmentMockEnabled()) {
    const closure = {
      id: Date.now(),
      ...request,
      evidenceName: evidence?.name ?? null,
      createdAt: new Date().toISOString(),
    };
    mockParticipationClosures.set(String(closure.id), closure);
    return Promise.resolve({ data: closure, status: 201 });
  }
  const body = new FormData();
  body.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }));
  if (evidence) body.append('evidence', evidence);
  return client.post('/closures', body, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const getCertificate = (closureId) =>
  normalizeRequestResult(
    isDevelopmentMockEnabled()
      ? mockGetCertificate(closureId)
      : client.get(`/closures/${closureId}/certificate`),
    normalizeCertificate,
  );

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
  isDevelopmentMockEnabled()
    ? mockGetPendingActivityClosures({ page })
    : client.get(
      '/admin/activities/pending-closure',
      { params: page === undefined || page === null ? {} : { page } },
    )
);
export const getActivityClosure = (activityId) => {
  if (!isDevelopmentMockEnabled()) return client.get(`/admin/activities/${activityId}/closure`);
  return Promise.resolve({
    data: mockActivityClosures.get(String(activityId)) ?? {
      activityId: Number(activityId),
      status: 'DRAFT',
      participants: [],
    },
  });
};
export const saveActivityClosure = (activityId, data) => {
  if (!isDevelopmentMockEnabled()) return client.put(`/admin/activities/${activityId}/closure`, data);
  const closure = { activityId: Number(activityId), status: 'DRAFT', ...data };
  mockActivityClosures.set(String(activityId), closure);
  return Promise.resolve({ data: closure });
};
export const finalizeActivityClosure = (activityId) => {
  if (!isDevelopmentMockEnabled()) return client.patch(`/admin/activities/${activityId}/closure/finalize`);
  const closure = {
    ...(mockActivityClosures.get(String(activityId)) ?? { activityId: Number(activityId) }),
    status: 'FINALIZED',
  };
  mockActivityClosures.set(String(activityId), closure);
  return Promise.resolve({ data: closure });
};
