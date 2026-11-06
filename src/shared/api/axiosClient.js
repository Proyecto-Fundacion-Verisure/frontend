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

const LOGIN_PATH = '/auth/login';

// Un 401 del propio login son credenciales incorrectas, no una sesión caducada:
// el formulario lo muestra en su mensaje de error y no debe rebotar a /login.
function isSessionExpiry(error) {
  const isUnauthorized = error?.response?.status === 401;
  const isLoginAttempt = error?.config?.url?.endsWith(LOGIN_PATH);
  return isUnauthorized && !isLoginAttempt;
}

// Sin `Content-Type` por defecto: axios ya pone `application/json` cuando el
// cuerpo es un objeto. Fijarlo aquí rompía el multipart de `POST /closures`,
// porque con esa cabecera axios serializa el `FormData` a JSON en vez de dejar
// que el navegador mande `multipart/form-data` con su `boundary`.
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
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
    if (isSessionExpiry(error)) clearSession({ notify: true });
    return Promise.reject(normalizeApiError(error));
  },
);

export default axiosClient;
