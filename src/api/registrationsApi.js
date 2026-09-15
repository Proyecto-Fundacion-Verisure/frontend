import client from './axiosClient';
import { isDevelopmentMockEnabled } from './mockConfig';
import { normalizeRegistration, normalizeRequestResult } from './normalizers';

const MOCK_MY_REGISTRATIONS_ACTIVE = [
  {
    registrationId: 101,
    activity: { id: 1, title: 'Acompañamiento a mayores', partner: 'Fundación Solitaria', startDate: '2027-09-10', endDate: '2027-09-17', hours: 8 },
    status: 'WAITLISTED',
    accepted: false,
    queuePosition: 3,
    closureId: null,
    activityClosed: false,
  },
  {
    registrationId: 102,
    activity: { id: 2, title: 'Taller educativo', partner: 'Educamos Juntos', startDate: '2027-09-12', endDate: '2027-09-13', hours: 6 },
    status: 'CONFIRMED',
    accepted: true,
    queuePosition: null,
    closureId: null,
    activityClosed: false,
  },
  {
    registrationId: 103,
    activity: { id: 4, title: 'Jornada ambiental', partner: 'Voluntarios Activos', startDate: '2026-07-01', endDate: '2026-07-02', hours: 8 },
    status: 'PENDING_CLOSURE',
    accepted: true,
    queuePosition: null,
    closureId: null,
    activityClosed: false,
  },
];

const MOCK_MY_REGISTRATIONS_CLOSED = [
  {
    registrationId: 104,
    activity: { id: 4, title: 'Jornada ambiental', partner: 'Voluntarios Activos', startDate: '2026-07-01', endDate: '2026-07-02', hours: 8 },
    status: 'CLOSED',
    accepted: true,
    queuePosition: null,
    closureId: 501,
    activityClosed: true,
  },
];

const MOCK_MY_REGISTRATIONS = [
  ...MOCK_MY_REGISTRATIONS_ACTIVE,
  ...MOCK_MY_REGISTRATIONS_CLOSED,
];

const MOCK_ACTIVITY_REGISTRATIONS = [
  { registrationId: 201, name: 'Ana Torres', department: 'Tecnología', organization: 'VERISURE_ES', yearHours: 12, status: 'WAITLISTED', accepted: false, queuePosition: 2 },
  { registrationId: 202, name: 'Luis Martín', department: 'Personas', organization: 'VERISURE_GROUP', yearHours: 8, status: 'WAITLISTED', accepted: true, queuePosition: 1 },
  { registrationId: 203, name: 'Marta Ruiz', department: 'Operaciones', organization: 'VERISURE_ES', yearHours: 16, status: 'CONFIRMED', accepted: true },
];

function mockGetMyRegistrations() {
  return Promise.resolve({ data: MOCK_MY_REGISTRATIONS });
}

function mockGetActivityRegistrations(activityId) {
  const registrations = MOCK_ACTIVITY_REGISTRATIONS.map((registration) => ({ ...registration }));
  return Promise.resolve({
    data: {
      content: registrations,
      number: 0,
      size: registrations.length,
      totalElements: registrations.length,
      totalPages: registrations.length ? 1 : 0,
    },
  });
}

function mockGetRegistrationCounts() {
  const confirmed = MOCK_ACTIVITY_REGISTRATIONS.filter(
    (registration) => registration.status === 'CONFIRMED',
  ).length;
  const waitlisted = MOCK_ACTIVITY_REGISTRATIONS.filter(
    (registration) => registration.status === 'WAITLISTED',
  ).length;
  const unreviewed = MOCK_ACTIVITY_REGISTRATIONS.filter(
    (registration) => registration.status === 'WAITLISTED' && !registration.accepted,
  ).length;

  return Promise.resolve({ data: { confirmed, waitlisted, unreviewed } });
}

function findMockRegistration(registrationId) {
  return MOCK_ACTIVITY_REGISTRATIONS.find(
    (registration) => String(registration.registrationId) === String(registrationId),
  );
}

function mockAcceptRegistration(registrationId) {
  const registration = findMockRegistration(registrationId);
  if (!registration) return Promise.reject(new Error('Inscripción no encontrada.'));
  const hasSpot = !MOCK_ACTIVITY_REGISTRATIONS.some((item) => item.status === 'CONFIRMED');
  Object.assign(registration, {
    accepted: true,
    status: hasSpot ? 'CONFIRMED' : 'WAITLISTED',
  });
  return Promise.resolve({ data: { ...registration } });
}

function mockRejectRegistration(registrationId) {
  const registration = findMockRegistration(registrationId);
  if (!registration) return Promise.reject(new Error('Inscripción no encontrada.'));
  Object.assign(registration, { accepted: false, status: 'REJECTED' });
  return Promise.resolve({ data: { ...registration } });
}

function mockCancelRegistration(registrationId) {
  const registration = findMockRegistration(registrationId);
  if (!registration) return Promise.reject(new Error('Inscripción no encontrada.'));
  registration.status = 'CANCELLED';

  const promoted = MOCK_ACTIVITY_REGISTRATIONS
    .filter((item) => item.status === 'WAITLISTED' && item.accepted)
    .sort((first, second) => first.queuePosition - second.queuePosition)[0];
  if (promoted) promoted.status = 'CONFIRMED';

  return Promise.resolve({ data: { ...registration } });
}

const normalized = (request) => normalizeRequestResult(request, normalizeRegistration);

function mockCreateRegistration(activityId) {
  const registration = {
    id: Date.now(),
    activityId: Number(activityId),
    status: 'WAITLISTED',
    accepted: false,
    queuePosition: 1,
    createdAt: new Date().toISOString(),
  };
  return Promise.resolve({ data: registration, status: 201 });
}

export const createRegistration = (activityId) => normalized(
  isDevelopmentMockEnabled()
    ? mockCreateRegistration(activityId)
    : client.post('/registrations', { activityId }),
);

export const getMyRegistrations = () =>
  normalized(isDevelopmentMockEnabled() ? mockGetMyRegistrations() : client.get('/registrations/me'));

export const getActivityRegistrations = (activityId, { status, page } = {}) =>
  normalized(isDevelopmentMockEnabled()
    ? mockGetActivityRegistrations(activityId)
    : client.get('/admin/registrations', {
      params: Object.fromEntries(Object.entries({ activityId, status, page }).filter(([, value]) => (
        value !== undefined && value !== null && value !== ''
      ))),
    }));

export const getRegistrationCounts = (activityId) => (
  isDevelopmentMockEnabled()
    ? mockGetRegistrationCounts()
    : client.get('/admin/registrations/counts', { params: { activityId } })
);

export const acceptRegistration = (registrationId) =>
  normalized(isDevelopmentMockEnabled()
    ? mockAcceptRegistration(registrationId)
    : client.patch(`/registrations/${registrationId}/accept`));

export const rejectRegistration = (registrationId) =>
  normalized(isDevelopmentMockEnabled()
    ? mockRejectRegistration(registrationId)
    : client.patch(`/registrations/${registrationId}/reject`));

export const cancelRegistration = (registrationId, reason) =>
  normalized(isDevelopmentMockEnabled()
    ? mockCancelRegistration(registrationId)
    : client.patch(`/registrations/${registrationId}/cancel`, reason ? { reason } : undefined));
