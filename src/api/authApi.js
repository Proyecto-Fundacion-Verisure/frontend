import client from './axiosClient';

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
    role: 'ORG', department: null, organization: null, status: 'ACTIVE',
  },
  pendiente: {
    id: 4, name: 'Entidad Pendiente', email: 'pendiente@entidad.org',
    role: 'ORG', department: null, organization: null, status: 'PENDING_APPROVAL',
  },
};

function mockLogin({ email }) {
  const key = Object.keys(MOCK_USERS).find((k) =>
    email?.toLowerCase().startsWith(k),
  );
  if (!key) throw new Error('Credenciales inválidas');
  return Promise.resolve({
    data: { accessToken: `mock-token-${key}`, user: MOCK_USERS[key] },
  });
}

export const login = (credentials) =>
  import.meta.env.DEV ? mockLogin(credentials) : client.post('/auth/login', credentials);

export const logout = (accessToken) => client.post('/auth/logout', undefined, {
  headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
});

export const getCurrentUser = () => client.get('/auth/me');
