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

describe('Sidebar PARTNER navigation', () => {
  it('renders exactly three links for PARTNER role', () => {
    renderSidebar('PARTNER');

    expect(screen.getByText('Mis proyectos')).toBeInTheDocument();
    expect(screen.getByText('Cierres')).toBeInTheDocument();
    expect(screen.getByText('Mis propuestas')).toBeInTheDocument();
  });

  it('does not render admin-only links for PARTNER', () => {
    renderSidebar('PARTNER');

    expect(screen.queryByText('Actividades')).not.toBeInTheDocument();
    expect(screen.queryByText('Cuentas pendientes')).not.toBeInTheDocument();
  });
});

describe('Sidebar ADMIN navigation', () => {
  it('links Nuevo proyecto to the registered admin route', () => {
    renderSidebar('ADMIN');

    expect(screen.getByRole('link', { name: /nuevo proyecto/i })).toHaveAttribute(
      'href',
      '/activities/new',
    );
  });

  it('links Inscripciones to the registrations page', () => {
    renderSidebar('ADMIN');

    expect(screen.getByRole('link', { name: /inscripciones/i })).toHaveAttribute(
      'href',
      '/admin/registrations',
    );
  });
});
