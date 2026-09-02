import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext } from '../../features/auth/AuthContext';

/**
 * Render helper with Router + AuthContext.
 * Keeps mocks out of production and avoids real network.
 * @param {React.ReactElement} ui
 * @param {object} options
 * @param {string} options.route - initial route
 * @param {string[]} options.initialEntries - router entries
 * @param {object|null} options.user - mocked user (null = unauthenticated)
 * @param {object} options.authValue - override auth context value
 * @param {string} options.path - route path for Routes wrapper
 */
export function renderWithProviders(ui, {
  route = '/',
  initialEntries = [route],
  user = null,
  authValue = null,
  path = route,
} = {}) {
  const authContextValue = authValue ?? {
    user,
    isAuthenticated: Boolean(user),
    login: async () => user,
    logout: () => {},
  };

  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthContext.Provider value={authContextValue}>
        <Routes>
          <Route path={path} element={ui} />
          {/* fallback for navigation assertions */}
          <Route path="*" element={<div data-testid="fallback" />} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

export function renderWithRouter(ui, { initialEntries = ['/'], path = '/*' } = {}) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path={path} element={ui} />
      </Routes>
    </MemoryRouter>,
  );
}
