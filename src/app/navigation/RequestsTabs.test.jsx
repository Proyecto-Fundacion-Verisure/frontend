import { render, screen } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { SidebarCountsContext } from './useSidebarCounts';
import RequestsTabs from './RequestsTabs';

const COUNTS = { pendingReview: 1, proposals: 3 };

function renderWithCounts(element, route = '/proposals') {
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

describe('RequestsTabs', () => {
  it('groups both origins under requests', () => {
    renderWithCounts(<RequestsTabs />, '/proposals');

    expect(screen.getByRole('link', { name: 'Formulario público 3' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Actividades de entidades 1' })).toHaveAttribute(
      'href',
      '/admin/activities/pending',
    );
  });
});
