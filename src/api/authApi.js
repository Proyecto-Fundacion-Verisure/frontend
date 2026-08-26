import client from './axiosClient';

export const login = (credentials) => client.post('/auth/login', credentials);
export const logout = (accessToken) => client.post('/auth/logout', undefined, {
  headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
});
export const getCurrentUser = () => client.get('/auth/me');
