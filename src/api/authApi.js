import realClient from './axiosClient';

export const login = (credentials) => realClient.post('/auth/login', credentials);

export const logout = (accessToken) => realClient.post('/auth/logout', undefined, {
  headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
});

export const getCurrentUser = () => realClient.get('/auth/me');

export const registerPartner = (data) => realClient.post('/auth/register', data);

export const verifyEmail = (token) => realClient.get('/auth/verify', { params: { token } });

export const resendVerification = (email) => (
  realClient.post('/auth/resend-verification', { email })
);
