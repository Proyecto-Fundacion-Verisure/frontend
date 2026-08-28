import { useContext } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_UNAUTHORIZED_EVENT } from '../../api/axiosClient';
import { AuthContext, AuthProvider } from './AuthContext';
import { login as loginRequest, logout as logoutRequest } from '../../api/authApi';

vi.mock('../../api/authApi', () => ({
  login: vi.fn(),
  logout: vi.fn(),
}));

function SessionHarness() {
  const { isAuthenticated, login, logout, user } = useContext(AuthContext);

  return (
    <div>
      <span>{isAuthenticated ? user.name : 'anonymous'}</span>
      <button type="button" onClick={() => login({ email: 'ana@example.com', password: 'secret' }).catch(() => {})}>
        Login
      </button>
      <button type="button" onClick={logout}>Logout</button>
    </div>
  );
}

function renderAuth(initialEntry = '/private') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthProvider>
        <Routes>
          <Route path="/private" element={<SessionHarness />} />
          <Route path="/login" element={<h1>Iniciar sesión</h1>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  vi.clearAllMocks();
});

afterEach(() => window.localStorage.clear());

describe('AuthContext', () => {
  it('stores the JWT session returned by login', async () => {
    loginRequest.mockResolvedValue({
      data: {
        accessToken: 'signed-jwt',
        user: { id: 4, name: 'Ana', role: 'EMPLOYEE' },
      },
    });
    const user = userEvent.setup();
    renderAuth();

    await user.click(screen.getByRole('button', { name: 'Login' }));

    expect(await screen.findByText('Ana')).toBeInTheDocument();
    expect(window.localStorage.getItem('accessToken')).toBe('signed-jwt');
    expect(JSON.parse(window.localStorage.getItem('user'))).toMatchObject({ id: 4 });
  });

  it('clears locally and redirects without waiting for server logout', async () => {
    window.localStorage.setItem('accessToken', 'signed-jwt');
    window.localStorage.setItem('user', JSON.stringify({ id: 4, name: 'Ana' }));
    logoutRequest.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    renderAuth();

    await user.click(screen.getByRole('button', { name: 'Logout' }));

    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(window.localStorage.getItem('accessToken')).toBeNull();
    expect(window.localStorage.getItem('user')).toBeNull();
    expect(logoutRequest).toHaveBeenCalledWith('signed-jwt');
  });

  it('applies the same local exit when Axios reports a 401', async () => {
    window.localStorage.setItem('accessToken', 'expired-jwt');
    window.localStorage.setItem('user', JSON.stringify({ id: 4, name: 'Ana' }));
    renderAuth();

    act(() => window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT)));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
    });
  });

  it('propagates the error when login fails so the form can show a message', async () => {
    loginRequest.mockRejectedValue({
      message: 'Credenciales incorrectas.',
      status: 401,
    });
    const user = userEvent.setup();
    renderAuth();

    await user.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(loginRequest).toHaveBeenCalledWith({ email: 'ana@example.com', password: 'secret' });
    });
    expect(screen.getByText('anonymous')).toBeInTheDocument();
    expect(window.localStorage.getItem('accessToken')).toBeNull();
    expect(window.localStorage.getItem('user')).toBeNull();
  });
});
