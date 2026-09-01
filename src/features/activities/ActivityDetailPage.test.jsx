import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getActivityDetail } from '../../api/activitiesApi';
import ActivityDetailPage from './ActivityDetailPage';

vi.mock('../../api/activitiesApi', () => ({
  getActivityDetail: vi.fn(),
  getAdminActivity: vi.fn(),
  getPublishedActivities: vi.fn(),
}));

function renderDetail(id = '1') {
  return render(
    <MemoryRouter initialEntries={[`/activities/${id}`]}>
      <Routes>
        <Route path="/activities/:activityId" element={<ActivityDetailPage />} />
        <Route path="/activities" element={<h1>Catálogo</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  getActivityDetail.mockReset();
});

describe('ActivityDetailPage', () => {
  it('muestra 404 con mensaje y vuelta al catálogo', async () => {
    getActivityDetail.mockRejectedValue({ status: 404, message: 'No se ha encontrado el recurso solicitado.' });
    renderDetail('999');

    expect(await screen.findByText(/actividad no encontrada/i)).toBeInTheDocument();
    expect(screen.getByText(/no se ha encontrado/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /volver al catálogo/i })).toHaveAttribute('href', '/activities');
  });

  it('muestra detalle cuando existe', async () => {
    getActivityDetail.mockResolvedValue({
      data: {
        id: 1,
        title: 'Acompañamiento a mayores',
        description: 'Visitas semanales.',
        line: 'desoledad',
        mode: 'PRESENCIAL',
        capacity: 20,
        registeredCount: 8,
        organizationName: 'Fundación Solitaria',
        location: 'Madrid',
      },
    });
    renderDetail('1');

    expect(await screen.findByRole('heading', { name: /acompañamiento a mayores/i })).toBeInTheDocument();
    expect(screen.getByText(/visitas semanales/i)).toBeInTheDocument();
    expect(screen.getByText('📍 Madrid')).toBeInTheDocument();
  });
});
