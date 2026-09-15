import axios from 'axios';
import { normalizeApiError } from './apiError';

export const AUTH_UNAUTHORIZED_EVENT = 'auth:unauthorized';

const storage = typeof window !== 'undefined' ? window.localStorage : null;

export function clearSession({ notify = false } = {}) {
  storage?.removeItem('accessToken');
  storage?.removeItem('refreshToken');
  storage?.removeItem('user');
  delete axiosClient.defaults.headers.common.Authorization;

  if (notify && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
  }
}

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

const LOGIN_PATH = '/auth/login';

function isSessionExpiry(error) {
  const isUnauthorized = error?.response?.status === 401;
  const requestUrl = error?.config?.url ?? '';
  const isLoginAttempt = requestUrl.endsWith(LOGIN_PATH);
  return isUnauthorized && !isLoginAttempt;
}

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
    if (isSessionExpiry(error)) clearSession({ notify: true });
    return Promise.reject(normalizeApiError(error));
  },
);

export default axiosClient;
