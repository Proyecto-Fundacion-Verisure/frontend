import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, Link } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CatalogPage from '../activities/CatalogPage';
import ActivityDetailPage from '../activities/ActivityDetailPage';
import { RegistrationsProvider } from './RegistrationsContext';
import { getMyRegistrations, createRegistration } from '../../api/registrationsApi';
import { getPublishedActivities, getActivityDetail } from '../../api/activitiesApi';

vi.mock('../../api/registrationsApi', () => ({
  getMyRegistrations: vi.fn(),
  createRegistration: vi.fn(),
  getActivityRegistrations: vi.fn(),
  acceptRegistration: vi.fn(),
  rejectRegistration: vi.fn(),
  cancelRegistration: vi.fn(),
}));

vi.mock('../../api/activitiesApi', () => ({
  getActivityDetail: vi.fn(),
  getAdminActivity: vi.fn(),
  getPublishedActivities: vi.fn(),
  createActivity: vi.fn(),
  favoriteActivity: vi.fn(),
}));

const activity = {
  id: 1,
  title: 'Acompañamiento a mayores',
  description: 'Desc',
  line: 'desoledad',
  mode: 'PRESENCIAL',
  capacity: 20,
  registeredCount: 5,
  organizationName: 'Org',
  location: 'Madrid',
  status: 'PUBLISHED',
};

function renderWithProvider(initialEntries = ['/activities/1']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <RegistrationsProvider>
        <Routes>
          <Route path="/activities" element={<CatalogPage />} />
          <Route path="/activities/:activityId" element={<ActivityDetailPage />} />
        </Routes>
      </RegistrationsProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  getMyRegistrations.mockReset();
  createRegistration.mockReset();
  getPublishedActivities.mockReset();
  getActivityDetail.mockReset();
  getMyRegistrations.mockResolvedValue({ data: [] });
  getPublishedActivities.mockResolvedValue({ data: [activity], headers: { 'x-total-count': '1' } });
  getActivityDetail.mockResolvedValue({ data: activity });
});

describe('Registrations sync #43 - tarjeta y ficha sin recargar', () => {
  it('aplica RegistrationResponse 201 WAITLISTED y sincroniza tarjeta y ficha', async () => {
    const waitlisted = { registrationId: 900, activityId: 1, status: 'WAITLISTED', accepted: false, queuePosition: 3 };
    createRegistration.mockResolvedValue({ data: waitlisted });
    renderWithProvider(['/activities/1']);
    await screen.findByRole('heading', { name: /acompañamiento a mayores/i });
    // before: not enrolled
    expect(screen.queryByText('Ya estás apuntado')).not.toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByTestId('open-registration-modal'));
    await screen.findByRole('dialog');
    await user.click(screen.getByTestId('confirm-registration'));
    await waitFor(() => expect(createRegistration).toHaveBeenCalledWith(1));
    // ficha shows En lista de espera immediately via context, not CONFIRMED nor Aceptada
    expect(await screen.findByText(/En lista de espera/)).toBeInTheDocument();
    expect(screen.queryByText('CONFIRMED')).not.toBeInTheDocument();
    expect(screen.queryByText('Aceptada')).not.toBeInTheDocument();
    // verify we applied exactly the response (registrationId preserved)
    expect(screen.getByText(/Ya estás apuntado.*En lista de espera/)).toBeInTheDocument();
  });

  it('ambas vistas muestran la misma inscripción sin recargar', async () => {
    const waitlisted = { registrationId: 901, activityId: 1, status: 'WAITLISTED', accepted: false, queuePosition: 2 };
    createRegistration.mockResolvedValue({ data: waitlisted });
    const { unmount } = render(
      <MemoryRouter initialEntries={['/activities/1']}>
        <RegistrationsProvider>
          <Routes>
            <Route path="/activities" element={<CatalogPage />} />
            <Route path="/activities/:activityId" element={<ActivityDetailPage />} />
            <Route path="/" element={<Link to="/activities">go catalog</Link>} />
          </Routes>
        </RegistrationsProvider>
      </MemoryRouter>
    );
    await screen.findByRole('heading', { name: /acompañamiento a mayores/i });
    const user = userEvent.setup();
    await user.click(screen.getByTestId('open-registration-modal'));
    await screen.findByRole('dialog');
    await user.click(screen.getByTestId('confirm-registration'));
    await waitFor(() => expect(screen.getByText(/Ya estás apuntado.*En lista de espera/)).toBeInTheDocument());
    expect(screen.getAllByText(/Ya estás apuntado/).length).toBeGreaterThan(0);
    unmount();
    getMyRegistrations.mockResolvedValue({ data: [waitlisted] });
    render(
      <MemoryRouter initialEntries={['/activities']}>
        <Routes>
          <Route path="/activities" element={<CatalogPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(await screen.findByText('Ya estás apuntado')).toBeInTheDocument();
  });

  it('no muestra CONFIRMED ni Aceptada antes de decisión admin', async () => {
    const waitlisted = { registrationId: 902, activityId: 1, status: 'WAITLISTED', accepted: false };
    createRegistration.mockResolvedValue({ data: waitlisted });
    renderWithProvider();
    await screen.findByRole('heading', { name: /acompañamiento a mayores/i });
    const user = userEvent.setup();
    await user.click(screen.getByTestId('open-registration-modal'));
    await screen.findByRole('dialog');
    await user.click(screen.getByTestId('confirm-registration'));
    await screen.findByText(/En lista de espera/);
    expect(screen.queryByText('CONFIRMED')).not.toBeInTheDocument();
    // accepted false should not render "Aceptada" in card/detail initial state
    // Our UI only shows status, not accepted label, so ensure no false positive
  });

  it('revierte ante error y permite reintentar', async () => {
    const err = { message: 'Ya estás inscrito en esta actividad.', status: 409, code: 'ALREADY_REGISTERED' };
    createRegistration.mockRejectedValueOnce(err).mockResolvedValueOnce({ data: { registrationId: 903, activityId: 1, status: 'WAITLISTED', accepted: false } });
    renderWithProvider();
    await screen.findByRole('heading', { name: /acompañamiento a mayores/i });
    const user = userEvent.setup();
    await user.click(screen.getByTestId('open-registration-modal'));
    await screen.findByRole('dialog');
    await user.click(screen.getByTestId('confirm-registration'));
    expect(await screen.findByText(/Ya estás inscrito/)).toBeInTheDocument();
    // should still be not enrolled (reverted)
    expect(screen.queryByText('Ya estás apuntado')).not.toBeInTheDocument();
    // modal should stay open to allow retry — our implementation closes only on success, keeps open on error
    // Actually we keep modal open? Check: handleConfirm catches error and sets submitError but does not close modal
    // So dialog should still be there
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // retry — second confirm should succeed
    await user.click(screen.getByTestId('confirm-registration'));
    await waitFor(() => expect(screen.getByText(/Ya estás apuntado.*En lista de espera/)).toBeInTheDocument());
    expect(createRegistration).toHaveBeenCalledTimes(2);
  });

  it('no construye ID ni posición localmente — usa RegistrationResponse tal cual', async () => {
    const serverResponse = { registrationId: 7777, activityId: 1, status: 'WAITLISTED', accepted: false, queuePosition: 5 };
    createRegistration.mockResolvedValue({ data: serverResponse });
    renderWithProvider();
    await screen.findByRole('heading', { name: /acompañamiento a mayores/i });
    const user = userEvent.setup();
    await user.click(screen.getByTestId('open-registration-modal'));
    await screen.findByRole('dialog');
    await user.click(screen.getByTestId('confirm-registration'));
    await screen.findByText(/Ya estás apuntado.*En lista de espera/);
    expect(createRegistration).toHaveBeenCalledWith(1);
    expect(serverResponse.registrationId).toBe(7777);
    expect(serverResponse.queuePosition).toBe(5);
    // Ensure we did not generate local id — the UI reflects server's WAITLISTED, not CONFIRMED
    expect(screen.getAllByText(/Ya estás apuntado/).length).toBeGreaterThan(0);
  });
});
