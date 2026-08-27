import client from './axiosClient';

export const getAdminActivities = (params) => client.get('/activities', { params });
export const getPublishedActivities = (params) => client.get('/activities/published', { params });
export const getActivityDetail = (id) => client.get(`/activities/${id}`);
export const getAdminActivity = (id) => client.get(`/admin/activities/${id}`);
export const createActivity = (data) => client.post('/activities', data);
export const updateActivity = (id, data) => client.put(`/activities/${id}`, data);
export const publishActivity = (id) => client.patch(`/activities/${id}/publish`);
export const cancelActivity = (id) => client.patch(`/activities/${id}/cancel`);

export const favoriteActivity = (id) => client.post(`/activities/${id}/favorite`);
export const unfavoriteActivity = (id) => client.delete(`/activities/${id}/favorite`);
