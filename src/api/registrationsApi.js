import client from './axiosClient';

const MOCK_MY_REGISTRATIONS = [
  { id: 101, activityId: 1, status: 'CONFIRMED' },
  { id: 102, activityId: 3, status: 'CANCELLED' },
];

function mockGetMyRegistrations() {
  return Promise.resolve({ data: MOCK_MY_REGISTRATIONS });
}

const isMockEnabled = () => import.meta.env.DEV && import.meta.env.MODE !== 'test';

export const createRegistration = (activityId) => client.post('/registrations', { activityId });

export const getMyRegistrations = () =>
  isMockEnabled() ? mockGetMyRegistrations() : client.get('/registrations/me');

export const getActivityRegistrations = (activityId) => client.get(`/activities/${activityId}/registrations`);

export const acceptRegistration = (registrationId) => client.patch(`/registrations/${registrationId}/accept`);

export const rejectRegistration = (registrationId) => client.patch(`/registrations/${registrationId}/reject`);

export const cancelRegistration = (registrationId, reason) =>
  client.patch(`/registrations/${registrationId}/cancel`, reason ? { reason } : undefined);
