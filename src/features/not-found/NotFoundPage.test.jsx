import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AuthContext } from '../auth/AuthContext';
import NotFoundPage from './NotFoundPage';

function renderNotFound({ isAuthenticated = false, user = null, initialEntry = '/no-existe' } = {}) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthContext.Provider value={{ isAuthenticated, user }}>
        <Routes>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

describe('NotFoundPage', () => {
  it('muestra mensaje y enlace a la portada para anónimo', async () => {
    renderNotFound();
    expect(screen.getByRole('heading', { level: 1, name: /404 — página no encontrada/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /página no encontrada/i })).toBeInTheDocument();
    expect(screen.getByText(/la ruta que has solicitado no existe/i)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /volver a la portada/i });
    expect(link).toHaveAttribute('href', '/');
    expect(screen.getByRole('heading', { level: 1 })).toHaveFocus();
  });

  it('enlace es role-aware para EMPLOYEE y ADMIN', () => {
    const { unmount } = renderNotFound({ isAuthenticated: true, user: { role: 'EMPLOYEE' } });
    expect(screen.getByRole('link', { name: /volver al inicio/i })).toHaveAttribute('href', '/activities');
    unmount();
    renderNotFound({ isAuthenticated: true, user: { role: 'ADMIN' } });
    expect(screen.getByRole('link', { name: /volver al inicio/i })).toHaveAttribute('href', '/dashboard');
  });

  it('es accesible y funciona con teclado', async () => {
    const user = userEvent.setup();
    renderNotFound();
    const link = screen.getByRole('link', { name: /volver a la portada/i });
    await user.tab();
    expect(link).toHaveFocus();
    expect(screen.getByRole('heading', { level: 1 })).toHaveAttribute('id', 'notfound-title');
  });

  it('se renderiza para cualquier ruta no definida', async () => {
    render(
      <MemoryRouter initialEntries={['/ruta/que/no/existe']}>
        <AuthContext.Provider value={{ isAuthenticated: false, user: null }}>
          <Routes>
            <Route path="/" element={<h1>Home</h1>} />
            <Route path="/login" element={<h1>Login</h1>} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 2, name: /página no encontrada/i })).toBeInTheDocument();
  });
});
