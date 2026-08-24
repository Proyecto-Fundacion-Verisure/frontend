import axios from 'axios';
import { normalizeApiError } from './apiError';

export const AUTH_UNAUTHORIZED_EVENT = 'auth:unauthorized';

const storage = typeof window !== 'undefined' ? window.localStorage : null;

function clearInvalidSession() {
  const hadSession = Boolean(storage?.getItem('accessToken'));
  storage?.removeItem('accessToken');
  storage?.removeItem('refreshToken');
  storage?.removeItem('user');
  delete axiosClient.defaults.headers.common.Authorization;

  if (hadSession && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
  }
}

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

axiosClient.interceptors.request.use((config) => {
  const token = storage?.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) clearInvalidSession();
    return Promise.reject(normalizeApiError(error));
  },
);

export default axiosClient;
