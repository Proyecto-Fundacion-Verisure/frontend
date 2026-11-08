import { render, screen } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { SidebarCountsContext } from './useSidebarCounts';
import AttentionPanel from './AttentionPanel';

const COUNTS = { pendingReview: 1, proposals: 3, inscriptions: 0, closes: 2, pendingAccounts: 4 };

// Con un `Outlet` por medio, como `RoleRoute` en la app: las cifras deben atravesarlo.
function renderWithCounts(element, route = '/dashboard') {
  render(
    <MemoryRouter initialEntries={[route]}>
      <SidebarCountsContext.Provider value={COUNTS}>
        <Routes>
          <Route element={<Outlet />}>
            <Route path="*" element={element} />
          </Route>
        </Routes>
      </SidebarCountsContext.Provider>
    </MemoryRouter>,
  );
}

describe('AttentionPanel', () => {
  it('links each pending count to the table that resolves it', () => {
    renderWithCounts(<AttentionPanel />);

    expect(screen.getByRole('link', { name: /1 actividad por aprobar/i })).toHaveAttribute(
      'href',
      '/admin/activities/pending',
    );
    expect(screen.getByRole('link', { name: /3 propuestas por revisar/i })).toHaveAttribute(
      'href',
      '/proposals',
    );
    expect(screen.getByRole('link', { name: /2 actividades por cerrar/i })).toHaveAttribute(
      'href',
      '/admin/activities/pending-closure',
    );
    expect(screen.getByRole('link', { name: /4 cuentas por aprobar/i })).toHaveAttribute(
      'href',
      '/admin/account-status',
    );
  });

  it('keeps items at zero visible but muted', () => {
    renderWithCounts(<AttentionPanel />);

    expect(screen.getByRole('link', { name: /0 inscripciones por revisar/i })).toHaveClass(
      'attention-card--empty',
    );
  });

  it('shows zeros when mounted without the layout', () => {
    render(
      <MemoryRouter>
        <AttentionPanel />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /0 cuentas por aprobar/i })).toBeInTheDocument();
  });
});
