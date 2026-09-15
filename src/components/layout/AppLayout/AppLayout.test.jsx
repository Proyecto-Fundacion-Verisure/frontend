import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext } from '../../../features/auth/AuthContext';
import AppLayout from './AppLayout';

vi.mock('../../../api/orgApi', () => ({
  getPendingOrganizations: vi.fn(() => Promise.resolve({
    data: { content: [], totalElements: 0 },
  })),
}));

describe('AppLayout', () => {
  it('enlaza el logo de la topbar con la landing page', async () => {
    const user = userEvent.setup();

    render(
      <AuthContext.Provider
        value={{
          user: { name: 'Fabiana', role: 'ADMIN' },
          logout: vi.fn(),
        }}
      >
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/" element={<h1>Landing page</h1>} />
            <Route path="/dashboard" element={<AppLayout />}>
              <Route index element={<h1>Dashboard</h1>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    const logoLink = screen.getByRole('link', { name: 'Fundación Verisure' });
    expect(logoLink).toHaveAttribute('href', '/');

    await user.click(logoLink);

    expect(screen.getByRole('heading', { name: 'Landing page' })).toBeInTheDocument();
  });
});
