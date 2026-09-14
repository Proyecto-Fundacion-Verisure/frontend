import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getActivityDetail } from '../../api/activitiesApi';
import { createRegistration, getMyRegistrations } from '../../api/registrationsApi';
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
  createRegistration.mockReset();
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
    expect(document.body).not.toHaveTextContent(/\bCONFIRMED\b/);
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

  // H12 — Modal explicativo antes de confirmar
  it('muestra modal con una explicación amigable antes de confirmar', async () => {
    getActivityDetail.mockResolvedValue({
      data: { id: 1, title: 'Actividad', description: 'Desc', capacity: 10, registeredCount: 2 },
    });
    renderDetail('1');
    await screen.findByRole('heading', { name: /actividad/i });
    const user = userEvent.setup();
    await user.click(screen.getByTestId('open-registration-modal'));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Antes de solicitar tu inscripción/i)).toBeInTheDocument();
    expect(screen.getByText(/lista de espera/i)).toBeInTheDocument();
    expect(screen.getByText(/revisada por la administración/i)).toBeInTheDocument();
    expect(screen.getByText(/no se confirma automáticamente/i)).toBeInTheDocument();
    expect(screen.getByRole('dialog')).not.toHaveTextContent(/WAITLISTED|accepted=true|CONFIRMED/i);
  });

  it('confirmar envía una sola solicitud', async () => {
    getActivityDetail.mockResolvedValue({
      data: { id: 1, title: 'Actividad', description: 'Desc', capacity: 10, registeredCount: 2 },
    });
    createRegistration.mockResolvedValue({ data: { registrationId: 200, activityId: 1, status: 'WAITLISTED', accepted: false, queuePosition: 3 } });
    renderDetail('1');
    await screen.findByRole('heading', { name: /actividad/i });
    const user = userEvent.setup();
    await user.click(screen.getByTestId('open-registration-modal'));
    await screen.findByRole('dialog');
    const confirmBtn = screen.getByTestId('confirm-registration');
    // click twice quickly - guard should prevent second call while isSubmitting
    await user.click(confirmBtn);
    await user.click(confirmBtn);
    await waitFor(() => expect(createRegistration).toHaveBeenCalledTimes(1));
    expect(createRegistration).toHaveBeenCalledWith(1);
  });

  it('cancelar no llama a la API', async () => {
    getActivityDetail.mockResolvedValue({
      data: { id: 1, title: 'Actividad', description: 'Desc', capacity: 10, registeredCount: 2 },
    });
    renderDetail('1');
    await screen.findByRole('heading', { name: /actividad/i });
    const user = userEvent.setup();
    await user.click(screen.getByTestId('open-registration-modal'));
    await screen.findByRole('dialog');
    await user.click(screen.getByTestId('cancel-registration'));
    expect(createRegistration).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('gestiona foco del modal y confirma', async () => {
    getActivityDetail.mockResolvedValue({
      data: { id: 1, title: 'Actividad', description: 'Desc', capacity: 10, registeredCount: 2 },
    });
    createRegistration.mockResolvedValue({ data: { registrationId: 201, activityId: 1, status: 'WAITLISTED', accepted: false } });
    renderDetail('1');
    await screen.findByRole('heading', { name: /actividad/i });
    const user = userEvent.setup();
    const openBtn = screen.getByTestId('open-registration-modal');
    await user.click(openBtn);
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
    // foco debe estar dentro del diálogo (Modal enfoca primer elemento focusable)
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    // Escape cierra y no envía
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(createRegistration).not.toHaveBeenCalled();
    // reabrir y confirmar
    await user.click(openBtn);
    await screen.findByRole('dialog');
    await user.click(screen.getByTestId('confirm-registration'));
    await waitFor(() => expect(createRegistration).toHaveBeenCalledTimes(1));
  });
});
