import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Sidebar from './Sidebar';
import { NAV_SECTIONS_BY_ROLE } from './sidebarNavigation';

function renderSidebar(role) {
  return render(
    <MemoryRouter>
      <Sidebar sections={NAV_SECTIONS_BY_ROLE[role] ?? []} counts={{}} />
    </MemoryRouter>,
  );
}

describe('Sidebar ORG navigation', () => {
  it('renders exactly three links for ORG role', () => {
    renderSidebar('ORG');

    expect(screen.getByText('Mis actividades')).toBeInTheDocument();
    expect(screen.getByText('Informes')).toBeInTheDocument();
    expect(screen.getByText('Mis propuestas')).toBeInTheDocument();
  });

  it('does not render admin-only links for ORG', () => {
    renderSidebar('ORG');

    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Crear actividad')).not.toBeInTheDocument();
    expect(screen.queryByText('Cierres')).not.toBeInTheDocument();
  });
});

describe('Sidebar ADMIN navigation', () => {
  it('links Crear actividad to the registered admin route', () => {
    renderSidebar('ADMIN');

    expect(screen.getByRole('link', { name: /crear actividad/i })).toHaveAttribute(
      'href',
      '/activities/new',
    );
  });
});
