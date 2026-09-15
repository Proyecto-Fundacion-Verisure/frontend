import client from './axiosClient';
import { isDevelopmentMockEnabled } from './mockConfig';

export const favoriteActivity = (activityId) => (
  isDevelopmentMockEnabled()
    ? Promise.resolve({ data: { activityId, favoritedByMe: true }, status: 201 })
    : client.post('/favorites', { activityId })
);
export const unfavoriteActivity = (activityId) => (
  isDevelopmentMockEnabled()
    ? Promise.resolve({ status: 204 })
    : client.delete(`/favorites/${activityId}`)
);
