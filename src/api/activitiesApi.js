import client from './axiosClient';

export const getActivities = (params) => client.get('/activities', { params });
export const getActivity = (id) => client.get(`/activities/${id}`);
export const createActivity = (data) => client.post('/activities', data);
export const updateActivity = (id, data) => client.put(`/activities/${id}`, data);
export const deleteActivity = (id) => client.delete(`/activities/${id}`);
