import client from './axiosClient';

export const login = (credentials) => client.post('/auth/login', credentials);
export const logout = () => client.post('/auth/logout');
export const getCurrentUser = () => client.get('/auth/me');
