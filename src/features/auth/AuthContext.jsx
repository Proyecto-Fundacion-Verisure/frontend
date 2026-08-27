import { createContext, useContext, useMemo, useState } from 'react';
import { login as loginRequest, logout as logoutRequest } from '../../api/authApi';

const storage = typeof window !== 'undefined' ? window.localStorage : null;

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = async (credentials) => {
    const { data } = await loginRequest(credentials);
    const { accessToken, refreshToken, user: authenticatedUser } = data;

    storage?.setItem('accessToken', accessToken);
    if (refreshToken) storage?.setItem('refreshToken', refreshToken);
    storage?.setItem('user', JSON.stringify(authenticatedUser));

    setUser(authenticatedUser);
    return authenticatedUser;
  };

  const logout = async () => {
    try {
      await logoutRequest();
    } finally {
      storage?.removeItem('accessToken');
      storage?.removeItem('refreshToken');
      storage?.removeItem('user');
      setUser(null);
    }
  };

  const value = useMemo(
    () => ({ user, login, logout, isAuthenticated: Boolean(user) }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);