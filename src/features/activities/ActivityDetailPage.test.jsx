import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getActivityDetail } from '../../api/activitiesApi';
import { getMyRegistrations } from '../../api/registrationsApi';
import ActivityDetailPage from './ActivityDetailPage';

vi.mock('../../api/activitiesApi', () => ({
  getActivityDetail: vi.fn(),
  getAdminActivity: vi.fn(),
  getPublishedActivities: vi.fn(),
}));

vi.mock('../../api/registrationsApi', () => ({
  getMyRegistrations: vi.fn(),
  createRegistration: vi.fn(),
  getActivityRegistrations: vi.fn(),
  acceptRegistration: vi.fn(),
  rejectRegistration: vi.fn(),
  cancelRegistration: vi.fn(),
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
  getMyRegistrations.mockReset();
  getMyRegistrations.mockResolvedValue({ data: [] });
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

  it('es recargable via param activityId sin depender de state', async () => {
    getActivityDetail.mockResolvedValue({
      data: {
        id: 42,
        title: 'Actividad recargable',
        description: 'Detalle recargable.',
        line: 'educar',
        mode: 'ONLINE',
        capacity: 10,
        registeredCount: 2,
      },
    });
    renderDetail('42');
    expect(await screen.findByRole('heading', { name: /actividad recargable/i })).toBeInTheDocument();
    expect(getActivityDetail).toHaveBeenCalledWith('42');
  });

  it('usa ActivityDetailResponse con favoritedByMe sin favoriteCount', async () => {
    getActivityDetail.mockResolvedValue({
      data: {
        id: 1,
        title: 'Acompañamiento a mayores',
        description: 'Visitas semanales.',
        line: 'desoledad',
        mode: 'PRESENCIAL',
        capacity: 20,
        registeredCount: 8,
        favoritedByMe: true,
      },
    });
    renderDetail('1');
    await screen.findByRole('heading', { name: /acompañamiento a mayores/i });
    const favButtons = screen.getAllByRole('button', { name: /quitar de favoritos/i });
    expect(favButtons.length).toBeGreaterThan(0);
    expect(favButtons[0]).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByText(/favoriteCount/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/♥.*\d+/)).not.toBeInTheDocument();
  });

  it('muestra estado no favorito cuando favoritedByMe es false', async () => {
    getActivityDetail.mockResolvedValue({
      data: {
        id: 1,
        title: 'Acompañamiento a mayores',
        description: 'Visitas semanales.',
        favoritedByMe: false,
        capacity: 10,
        registeredCount: 2,
      },
    });
    renderDetail('1');
    await screen.findByRole('heading', { name: /acompañamiento a mayores/i });
    const favButtons = screen.getAllByRole('button', { name: /añadir a favoritos/i });
    expect(favButtons.length).toBeGreaterThan(0);
    expect(favButtons[0]).toHaveAttribute('aria-pressed', 'false');
  });

  it('no inventa inscripción dentro de ActivityDetailResponse', async () => {
    // ActivityDetailResponse contains a fake registration field but page must ignore it
    getActivityDetail.mockResolvedValue({
      data: {
        id: 1,
        title: 'Acompañamiento a mayores',
        description: 'Visitas semanales.',
        favoritedByMe: false,
        capacity: 10,
        registeredCount: 2,
        registration: { id: 999, status: 'CONFIRMED' },
        myRegistration: { id: 999, status: 'CONFIRMED' },
      },
    });
    getMyRegistrations.mockResolvedValue({ data: [] });
    renderDetail('1');
    await screen.findByRole('heading', { name: /acompañamiento a mayores/i });
    expect(screen.queryByText('Ya estás apuntado')).not.toBeInTheDocument();
    expect(getMyRegistrations).toHaveBeenCalled();
  });

  it('obtiene inscripción actual desde GET /api/registrations/me', async () => {
    getActivityDetail.mockResolvedValue({
      data: {
        id: 1,
        title: 'Acompañamiento a mayores',
        description: 'Visitas semanales.',
        capacity: 10,
        registeredCount: 5,
      },
    });
    getMyRegistrations.mockResolvedValue({
      data: [{ id: 101, activityId: 1, status: 'CONFIRMED' }],
    });
    renderDetail('1');
    await screen.findByRole('heading', { name: /acompañamiento a mayores/i });
    expect(await screen.findByText('Ya estás apuntado')).toBeInTheDocument();
    expect(getMyRegistrations).toHaveBeenCalled();
  });

  it('no muestra inscripción si está cancelada', async () => {
    getActivityDetail.mockResolvedValue({
      data: { id: 1, title: 'Actividad', description: 'Desc', capacity: 10, registeredCount: 2 },
    });
    getMyRegistrations.mockResolvedValue({
      data: [{ id: 102, activityId: 1, status: 'CANCELLED' }],
    });
    renderDetail('1');
    await screen.findByRole('heading', { name: /actividad/i });
    expect(screen.queryByText('Ya estás apuntado')).not.toBeInTheDocument();
  });

  it('renderiza panel lateral sticky con accesibilidad', async () => {
    getActivityDetail.mockResolvedValue({
      data: { id: 1, title: 'Actividad', description: 'Desc', capacity: 10, registeredCount: 2 },
    });
    renderDetail('1');
    await screen.findByRole('heading', { name: /actividad/i });
    expect(screen.getByLabelText('Panel de inscripción')).toBeInTheDocument();
    expect(screen.getByText('Inscripción')).toBeInTheDocument();
  });

  it('muestra aforo completo pero permite ver detalle', async () => {
    getActivityDetail.mockResolvedValue({
      data: { id: 2, title: 'Taller lleno', description: 'Completo', capacity: 10, registeredCount: 10, status: 'FULL' },
    });
    getMyRegistrations.mockResolvedValue({ data: [] });
    renderDetail('2');
    await screen.findByRole('heading', { name: /taller lleno/i });
    expect(screen.getAllByText('Completa').length).toBeGreaterThan(0);
    // panel lateral indica lista de espera
    expect(screen.getByText(/lista de espera/i)).toBeInTheDocument();
  });

  it('no muestra contador de favoritos en ningún caso', async () => {
    getActivityDetail.mockResolvedValue({
      data: { id: 1, title: 'Actividad', description: 'Desc', favoritedByMe: true, capacity: 5, registeredCount: 1 },
    });
    renderDetail('1');
    await screen.findByRole('heading', { name: /actividad/i });
    expect(screen.queryByText(/favoriteCount/i)).not.toBeInTheDocument();
    // ensure no numeric favorite count rendered
    const text = document.body.textContent || '';
    expect(text).not.toMatch(/favoritos.*\d+/i);
  });
});
