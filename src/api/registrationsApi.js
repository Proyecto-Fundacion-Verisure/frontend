import client from './axiosClient';

const MOCK_MY_REGISTRATIONS = [
  { id: 101, activityId: 1, status: 'CONFIRMED' },
  { id: 102, activityId: 3, status: 'CANCELLED' },
];

function mockGetMyRegistrations() {
  return Promise.resolve({ data: MOCK_MY_REGISTRATIONS });
}

function mockGetActivityRegistrations(activityId) {
  return Promise.resolve({
    data: {
      activity: { id: Number(activityId), title: 'Acompañamiento a mayores', spots: 12 },
      counters: { confirmed: 1, waitlisted: 2, acceptedWaitlisted: 1, unreviewed: 1 },
      registrations: [
        { registrationId: 201, name: 'Ana Torres', department: 'Tecnología', organization: 'VERISURE_ES', yearHours: 12, status: 'WAITLISTED', accepted: false, queuePosition: 2 },
        { registrationId: 202, name: 'Luis Martín', department: 'Personas', organization: 'VERISURE_GROUP', yearHours: 8, status: 'WAITLISTED', accepted: true, queuePosition: 1 },
        { registrationId: 203, name: 'Marta Ruiz', department: 'Operaciones', organization: 'VERISURE_ES', yearHours: 16, status: 'CONFIRMED', accepted: true },
      ],
    },
  });
}

const isMockEnabled = () => import.meta.env.DEV && import.meta.env.MODE !== 'test';

export const createRegistration = (activityId) => client.post('/registrations', { activityId });

export const getMyRegistrations = () =>
  isMockEnabled() ? mockGetMyRegistrations() : client.get('/registrations/me');

export const getActivityRegistrations = (activityId) =>
  isMockEnabled()
    ? mockGetActivityRegistrations(activityId)
    : client.get(`/activities/${activityId}/registrations`);

export const acceptRegistration = (registrationId) => client.patch(`/registrations/${registrationId}/accept`);

export const rejectRegistration = (registrationId) => client.patch(`/registrations/${registrationId}/reject`);

export const cancelRegistration = (registrationId, reason) =>
  client.patch(`/registrations/${registrationId}/cancel`, reason ? { reason } : undefined);
