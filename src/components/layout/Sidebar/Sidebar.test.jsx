import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Sidebar from './Sidebar';
import { NAV_SECTIONS_BY_ROLE } from './sidebarNavigation';
import { DEMO_REGISTRATIONS_PATH } from '../../../constants/demoActivity';

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
    expect(screen.queryByText('Cuentas pendientes')).not.toBeInTheDocument();
  });
});

describe('Sidebar ADMIN navigation', () => {
  it('links the review queue next to the closures queue', () => {
    renderSidebar('ADMIN');

    expect(screen.getByRole('link', { name: /revisión de propuestas/i })).toHaveAttribute(
      'href',
      '/admin/activities/pending',
    );
  });

  it('links Nuevo proyecto to the registered admin route', () => {
    renderSidebar('ADMIN');

    expect(screen.getByRole('link', { name: /nuevo proyecto/i })).toHaveAttribute(
      'href',
      '/activities/new',
    );
  });

  it('links Inscripciones to the registrations page', () => {
    renderSidebar('ADMIN');

    // Contra la constante y no contra un número escrito aquí: el id estaba a mano
    // en el menú y en el router, y al cambiar uno este enlace se quedó apuntando
    // a una actividad sin inscripciones.
    expect(screen.getByRole('link', { name: /inscripciones/i })).toHaveAttribute(
      'href',
      DEMO_REGISTRATIONS_PATH,
    );
  });
});
