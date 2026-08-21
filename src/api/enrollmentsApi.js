import client from './axiosClient';

export const getEnrollments = (params) => client.get('/enrollments', { params });
export const enroll = (activityId) => client.post('/enrollments', { activityId });
export const cancelEnrollment = (id) => client.delete(`/enrollments/${id}`);
