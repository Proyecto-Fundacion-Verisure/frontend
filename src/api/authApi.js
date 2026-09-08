import realClient from './axiosClient';
import { ApiError } from './apiError';

const useDevelopmentMocks = () => (
  import.meta.env.DEV
  && import.meta.env.MODE !== 'test'
  && import.meta.env.VITE_USE_MOCKS !== 'false'
);

const MOCK_USERS = {
  admin: {
    id: 1, name: 'Admin Verisure', email: 'admin@verisure.com',
    role: 'ADMIN', department: 'Tecnología', organization: 'VERISURE_ES',
  },
  empleado: {
    id: 2, name: 'Elena Empleada', email: 'empleado@verisure.com',
    role: 'EMPLOYEE', department: 'Marketing', organization: 'VERISURE_ES',
  },
  ong: {
    id: 3, name: 'Fundación Social', email: 'ong@fundacion.org',
    role: 'PARTNER', department: null, organization: null, status: 'ACTIVE',
  },
  pendiente: {
    id: 4, name: 'Entidad Pendiente', email: 'pendiente@entidad.org',
    role: 'PARTNER', department: null, organization: null, status: 'PENDING_APPROVAL',
  },
};

function mockLogin({ email }) {
  const key = Object.keys(MOCK_USERS).find((k) =>
    email?.toLowerCase().startsWith(k),
  );
  if (!key) {
    return Promise.reject(new ApiError({ message: 'Credenciales inválidas.', status: 401 }));
  }
  const mockUser = MOCK_USERS[key];
  const statusErrors = {
    PENDING_VERIFICATION: 'ACCOUNT_NOT_VERIFIED',
    PENDING_APPROVAL: 'ACCOUNT_PENDING_APPROVAL',
    REJECTED: 'ACCOUNT_REJECTED',
  };
  const errorCode = statusErrors[mockUser.status];
  if (errorCode) {
    return Promise.reject(new ApiError({ message: errorCode, status: 403, code: errorCode }));
  }
  return Promise.resolve({
    data: {
      accessToken: `mock-token-${key}`,
      tokenType: 'Bearer',
      expiresIn: 7200,
      user: mockUser,
    },
  });
}

export const login = (credentials) =>
  useDevelopmentMocks() ? mockLogin(credentials) : realClient.post('/auth/login', credentials);

export const logout = (accessToken) => realClient.post('/auth/logout', undefined, {
  headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
});

export const getCurrentUser = () => realClient.get('/auth/me');

export const registerPartner = (data) => realClient.post('/auth/register', data);

export const verifyEmail = (token) => realClient.get('/auth/verify', { params: { token } });

export const resendVerification = (email) => (
  realClient.post('/auth/resend-verification', { email })
);
