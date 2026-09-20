import client from './axiosClient';

export const createRegistration = (activityId) => client.post('/registrations', { activityId });

export const getMyRegistrations = () => client.get('/registrations/me');

export const getActivityRegistrations = (activityId, { status, page } = {}) => (
  client.get('/admin/registrations', {
    params: Object.fromEntries(Object.entries({ activityId, status, page }).filter(([, value]) => (
      value !== undefined && value !== null && value !== ''
    ))),
  })
);

// Los contadores van en su propia ruta y no dentro del tablero: la respuesta de
// `/admin/registrations` es el Page de Spring, y ahí no caben tres cifras que
// además son de toda la actividad y no de la página. `activityId` es obligatorio.
export const getRegistrationCounts = (activityId) => (
  client.get('/admin/registrations/counts', { params: { activityId } })
);

export const acceptRegistration = (registrationId) => client.patch(`/registrations/${registrationId}/accept`);

export const rejectRegistration = (registrationId) => client.patch(`/registrations/${registrationId}/reject`);

export const cancelRegistration = (registrationId, reason) => (
  client.patch(`/registrations/${registrationId}/cancel`, reason ? { reason } : undefined)
);
