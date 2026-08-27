import client from './axiosClient';

export const createRegistration = (activityId) => (
  client.post('/registrations', { activityId })
);

export const getMyRegistrations = () => client.get('/registrations/me');

export const getActivityRegistrations = (activityId) => (
  client.get(`/activities/${activityId}/registrations`)
);

export const acceptRegistration = (registrationId) => (
  client.patch(`/registrations/${registrationId}/accept`)
);

export const rejectRegistration = (registrationId) => (
  client.patch(`/registrations/${registrationId}/reject`)
);

export const cancelRegistration = (registrationId, reason) => (
  client.patch(
    `/registrations/${registrationId}/cancel`,
    reason ? { reason } : undefined,
  )
);
