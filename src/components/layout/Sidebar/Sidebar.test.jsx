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
  it('renders only the partner links', () => {
    renderSidebar('PARTNER');

    // La entidad propone actividades, no las publica: su pantalla es «Mis
    // propuestas», repartida en pendientes y aprobadas. Los cierres son de la
    // Fundación y de la plantilla, no de la entidad.
    expect(screen.getByText('Nueva propuesta')).toBeInTheDocument();
    expect(screen.getByText('Mis propuestas')).toBeInTheDocument();
    expect(screen.queryByText('Mis proyectos')).not.toBeInTheDocument();
    expect(screen.queryByText('Cierres')).not.toBeInTheDocument();
  });

  it('does not render admin-only links for PARTNER', () => {
    renderSidebar('PARTNER');

    expect(screen.queryByText('Actividades')).not.toBeInTheDocument();
    expect(screen.queryByText('Solicitudes pendientes')).not.toBeInTheDocument();
  });
});

describe('Sidebar ADMIN navigation', () => {
  it('links the review queue as Solicitudes', () => {
    renderSidebar('ADMIN');

    expect(screen.getByRole('link', { name: /^solicitudes/i })).toHaveAttribute(
      'href',
      '/admin/activities/pending',
    );
  });

  it('groups the entries under their section titles', () => {
    renderSidebar('ADMIN');

    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual([
      'Panel', 'Nueva actividad', 'Actividades', 'Solicitudes', 'Inscripciones', 'Entidades',
    ]);
    ['Análisis', 'Catálogo', 'Participación'].forEach((title) => {
      expect(screen.getByText(title)).toBeInTheDocument();
    });
  });

  it('links Nueva actividad to the registered admin route', () => {
    renderSidebar('ADMIN');

    expect(screen.getByRole('link', { name: /nueva actividad/i })).toHaveAttribute(
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

describe('Sidebar active link', () => {
  const activeLinks = (role, route) => {
    const { unmount } = render(
      <MemoryRouter initialEntries={[route]}>
        <Sidebar sections={NAV_SECTIONS_BY_ROLE[role]} counts={{}} />
      </MemoryRouter>,
    );
    const links = screen.getAllByRole('link')
      .filter((link) => link.getAttribute('aria-current') === 'page')
      .map((link) => link.textContent);
    unmount();
    return links;
  };

  it.each([
    ['ADMIN', '/dashboard', 'Panel'],
    ['ADMIN', '/activities/new', 'Nueva actividad'],
    ['ADMIN', '/admin/activities', 'Actividades'],
    ['ADMIN', '/activities/9', 'Actividades'],
    ['ADMIN', '/activities/9/edit', 'Actividades'],
    ['ADMIN', '/proposals', 'Solicitudes'],
    ['ADMIN', '/proposals/3', 'Solicitudes'],
    ['ADMIN', '/admin/activities/pending', 'Solicitudes'],
    ['ADMIN', '/admin/account-status', 'Entidades'],
    ['ADMIN', '/admin/registrations', 'Inscripciones'],
    ['ADMIN', '/activities/9/registrations', 'Inscripciones'],
    ['ADMIN', '/admin/activities/pending-closure', 'Actividades'],
    ['ADMIN', '/admin/activities/9/closure', 'Actividades'],
    ['ADMIN', '/closures/4', 'Actividades'],
    ['EMPLOYEE', '/activities', 'Explorar'],
    ['EMPLOYEE', '/activities/9', 'Explorar'],
    ['EMPLOYEE', '/my-activities', 'Mis voluntariados'],
    ['EMPLOYEE', '/my-volunteering', 'Mis voluntariados'],
    ['EMPLOYEE', '/closures/new', 'Mis voluntariados'],
    ['EMPLOYEE', '/closures/4', 'Mis voluntariados'],
    ['EMPLOYEE', '/closures/4/certificate', 'Mis voluntariados'],
    ['PARTNER', '/org/dashboard', 'Dashboard'],
    ['PARTNER', '/org/activities', 'Mis propuestas'],
    ['PARTNER', '/org/activities/new', 'Nueva propuesta'],
    ['PARTNER', '/org/activities/9/edit', 'Mis propuestas'],
  ])('%s en %s resalta solo «%s»', (role, route, label) => {
    expect(activeLinks(role, route)).toEqual([label]);
  });

  it('no resalta nada en una ruta sin entrada en el menú', () => {
    expect(activeLinks('PARTNER', '/org/reports')).toEqual([]);
  });
});
