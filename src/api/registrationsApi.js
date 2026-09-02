import client from './axiosClient';

const MOCK_MY_REGISTRATIONS = [
  { id: 101, activityId: 1, status: 'CONFIRMED' },
  { id: 102, activityId: 3, status: 'CANCELLED' },
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
      activity: { id: Number(activityId), title: 'Acompañamiento a mayores', spots: 1 },
      counters: {
        confirmed: registrations.filter((item) => item.status === 'CONFIRMED').length,
        waitlisted: registrations.filter((item) => item.status === 'WAITLISTED').length,
        acceptedWaitlisted: registrations.filter((item) => item.status === 'WAITLISTED' && item.accepted).length,
        unreviewed: registrations.filter((item) => item.status === 'WAITLISTED' && !item.accepted).length,
      },
      registrations,
    },
  });
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

const isMockEnabled = () => import.meta.env.DEV && import.meta.env.MODE !== 'test';

export const createRegistration = (activityId) => client.post('/registrations', { activityId });

export const getMyRegistrations = () =>
  isMockEnabled() ? mockGetMyRegistrations() : client.get('/registrations/me');

export const getActivityRegistrations = (activityId) =>
  isMockEnabled()
    ? mockGetActivityRegistrations(activityId)
    : client.get(`/activities/${activityId}/registrations`);

export const acceptRegistration = (registrationId) =>
  isMockEnabled()
    ? mockAcceptRegistration(registrationId)
    : client.patch(`/registrations/${registrationId}/accept`);

export const rejectRegistration = (registrationId) =>
  isMockEnabled()
    ? mockRejectRegistration(registrationId)
    : client.patch(`/registrations/${registrationId}/reject`);

export const cancelRegistration = (registrationId, reason) =>
  isMockEnabled()
    ? mockCancelRegistration(registrationId)
    : client.patch(`/registrations/${registrationId}/cancel`, reason ? { reason } : undefined);
