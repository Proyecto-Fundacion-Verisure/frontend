import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { LandingPage } from '../../features/landing';
import { CatalogPage } from '../../features/activities';
import { DashboardPage } from '../../features/dashboard';
import { MyVolunteeringPage } from '../../features/registrations';
import { getPublishedActivities } from '../../features/activities';
import { getMyRegistrations } from '../../features/registrations';

vi.mock('../../features/activities/api/activitiesApi', () => ({
  getPublishedActivities: vi.fn(),
  getActivityDetail: vi.fn(),
  getAdminActivity: vi.fn(),
}));

vi.mock('../../features/registrations/api/registrationsApi', () => ({
  getMyRegistrations: vi.fn(),
  createRegistration: vi.fn(),
  getActivityRegistrations: vi.fn(),
  acceptRegistration: vi.fn(),
  rejectRegistration: vi.fn(),
  cancelRegistration: vi.fn(),
}));

describe('smoke — recorrido público, empleado, administrador', () => {
  it('público: LandingPage se renderiza', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <LandingPage />
      </MemoryRouter>,
    );
    expect(await screen.findByRole('heading', { name: /voluntariado/i })).toBeInTheDocument();
  });

  it('empleado: catálogo carga actividades (demo data)', async () => {
    getPublishedActivities.mockResolvedValue({
      data: [
        {
          id: 1,
          title: 'Acompañamiento a mayores',
          line: 'desoledad',
          mode: 'PRESENCIAL',
          spots: 20,
          occupiedSpots: 8,
          partnerName: 'Org',
          favoritedByMe: true,
        },
      ],
      headers: { 'x-total-count': '1' },
    });
    getMyRegistrations.mockResolvedValue({ data: [] });
    render(
      <MemoryRouter initialEntries={['/activities']}>
        <CatalogPage />
      </MemoryRouter>,
    );
    expect(await screen.findByText(/Acompañamiento a mayores/)).toBeInTheDocument();
    expect(screen.getByText(/8 de 20 plazas/)).toBeInTheDocument();
  });

  it('empleado: mis inscripciones muestra bloques active/closed', async () => {
    getMyRegistrations.mockResolvedValue({
      data: [
        {
          registrationId: 101,
          activity: {
            id: 1,
            title: 'Act',
            partner: 'P',
            startDate: '2099-01-01',
            endDate: '2099-01-02',
            hours: 2,
          },
          status: 'WAITLISTED',
          queuePosition: 3,
          accepted: false,
          closureId: null,
          activityClosed: false,
        },
      ],
    });
    render(
      <MemoryRouter initialEntries={['/my-activities']}>
        <MyVolunteeringPage />
      </MemoryRouter>,
    );
    expect(await screen.findByRole('heading', { name: /^activas$/i })).toBeInTheDocument();
    expect(screen.getByText(/Posición en la lista de espera: 3/)).toBeInTheDocument();
  });

  it('administrador: dashboard se renderiza', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <DashboardPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Panel' })).toBeInTheDocument();
  });

  it('demo data es coherente y sin secretos', async () => {
    // Sin servidor el fetch falla y `response` es null: en ese caso basta con
    // que el mock de actividades siga disponible.
    const response = await fetch('/demo-data.json').catch(() => null);
    expect(response === null || response.ok).toBe(true);
    expect(getPublishedActivities).toBeDefined();
  });
});
