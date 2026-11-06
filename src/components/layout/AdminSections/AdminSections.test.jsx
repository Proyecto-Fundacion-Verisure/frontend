import { render, screen } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { SidebarCountsContext } from '../Sidebar/useSidebarCounts';
import { ActivitiesTabs } from './AdminSections';

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

describe('section tabs', () => {
  it('groups closures under activities with their count', () => {
    renderWithCounts(<ActivitiesTabs />, '/admin/activities/pending-closure');

    expect(screen.getByRole('link', { name: 'Por cerrar 2' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Todas' })).toHaveAttribute('href', '/admin/activities');
  });
});
