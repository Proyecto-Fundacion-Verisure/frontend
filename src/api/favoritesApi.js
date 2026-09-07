import client from './axiosClient';

// Contrato nuevo: POST /api/favorites {activityId} y DELETE /api/favorites/{activityId}
// Mantener compat con antiguo /activities/{id}/favorite via activitiesApi alias

export const favoriteActivity = (activityId) => client.post('/favorites', { activityId });
export const unfavoriteActivity = (activityId) => client.delete(`/favorites/${activityId}`);

// Alias para compatibilidad: algunos componentes aún importan desde activitiesApi
export const favoriteActivityLegacy = (id) => client.post(`/activities/${id}/favorite`);
export const unfavoriteActivityLegacy = (id) => client.delete(`/activities/${id}/favorite`);
