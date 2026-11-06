import client from '../shared/api/axiosClient';

export const favoriteActivity = (activityId) => client.post('/favorites', { activityId });
export const unfavoriteActivity = (activityId) => client.delete(`/favorites/${activityId}`);
