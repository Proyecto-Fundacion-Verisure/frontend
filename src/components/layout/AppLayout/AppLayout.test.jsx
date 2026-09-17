import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext } from '../../../features/auth/AuthContext';
import AppLayout from './AppLayout';

describe('AppLayout', () => {
  it('enlaza el logo de la topbar con el inicio del rol, no con la landing', async () => {
    const user = userEvent.setup();

    render(
      <AuthContext.Provider
        value={{
          user: { name: 'Fabiana', role: 'ADMIN' },
          logout: vi.fn(),
        }}
      >
        <MemoryRouter initialEntries={['/dashboard/detalle']}>
          <Routes>
            <Route path="/" element={<h1>Landing page</h1>} />
            <Route path="/dashboard" element={<AppLayout />}>
              <Route index element={<h1>Dashboard</h1>} />
              <Route path="detalle" element={<h1>Detalle</h1>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    const logoLink = screen.getByRole('link', { name: 'Fundación Verisure' });
    expect(logoLink).toHaveAttribute('href', '/dashboard');

    await user.click(logoLink);

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Landing page' })).not.toBeInTheDocument();
  });
});
