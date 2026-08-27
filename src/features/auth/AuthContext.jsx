import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient, { AUTH_UNAUTHORIZED_EVENT, clearSession } from '../../api/axiosClient';
import { login as loginRequest, logout as logoutRequest } from '../../api/authApi';

export const AuthContext = createContext(null);

const storage = typeof window !== 'undefined' ? window.localStorage : null;

function getStoredUser() {
  const accessToken = storage?.getItem('accessToken');
  const serializedUser = storage?.getItem('user');
  if (!accessToken || !serializedUser) return null;

  try {
    return JSON.parse(serializedUser);
  } catch {
    clearSession();
    return null;
  }
}

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(getStoredUser);

  const login = useCallback(async (credentials) => {
    const { data } = await loginRequest(credentials);
    const { accessToken, user: authenticatedUser } = data;

    if (!accessToken || !authenticatedUser) {
      throw new Error('La respuesta de autenticación no contiene accessToken y user.');
    }

    storage?.setItem('accessToken', accessToken);
    storage?.setItem('user', JSON.stringify(authenticatedUser));
    axiosClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
    setUser(authenticatedUser);
    return authenticatedUser;
  }, []);

  const logout = useCallback(() => {
    const accessToken = storage?.getItem('accessToken');
    if (accessToken) void logoutRequest(accessToken).catch(() => undefined);

    clearSession();
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      navigate('/login', { replace: true, state: { sessionExpired: true } });
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
  }, [navigate]);

  const value = useMemo(() => ({
    user,
    login,
    logout,
    isAuthenticated: Boolean(user),
  }), [login, logout, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
