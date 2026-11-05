import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import NavTabs from './NavTabs';

const ITEMS = [
  { to: '/admin/activities', label: 'Todas' },
  { to: '/admin/activities/pending-closure', label: 'Por cerrar', count: 2 },
];

function renderTabs(route) {
  render(
    <MemoryRouter initialEntries={[route]}>
      <NavTabs label="Secciones" items={ITEMS} />
    </MemoryRouter>,
  );
}

describe('NavTabs', () => {
  it('renders each tab as a link with its count', () => {
    renderTabs('/admin/activities');

    expect(screen.getByRole('navigation', { name: 'Secciones' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Por cerrar 2' })).toHaveAttribute(
      'href',
      '/admin/activities/pending-closure',
    );
  });

  it('marks only the exact route as the current page', () => {
    renderTabs('/admin/activities/pending-closure');

    expect(screen.getByRole('link', { name: /por cerrar/i })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Todas' })).not.toHaveAttribute('aria-current');
  });
});
