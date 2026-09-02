import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getActivityRegistrations } from '../../api/registrationsApi';
import RegistrationsTablePage from './RegistrationsTablePage';

vi.mock('../../api/registrationsApi', () => ({
  acceptRegistration: vi.fn(),
  getActivityRegistrations: vi.fn(),
  rejectRegistration: vi.fn(),
}));

const BOARD = {
  activity: { id: 8, title: 'Mentoría digital' },
  registrations: [
    { registrationId: 1, name: 'Ana Torres', department: 'Tecnología', organization: 'VERISURE_ES', yearHours: 12, status: 'WAITLISTED', accepted: false },
    { registrationId: 2, person: { name: 'Luis Martín', department: 'Personas', organization: 'VERISURE_GROUP' }, hoursThisYear: 8, status: 'WAITLISTED', accepted: true },
    { registrationId: 3, name: 'Marta Ruiz', department: 'Operaciones', organization: 'VERISURE_ES', annualHours: 16, status: 'CONFIRMED', accepted: true },
    { registrationId: 4, name: 'Sara Gil', status: 'REJECTED', accepted: false, rejectionReason: 'No mostrar' },
  ],
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/activities/8/registrations']}>
      <Routes>
        <Route path="/activities/:activityId/registrations" element={<RegistrationsTablePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  getActivityRegistrations.mockReset();
});

describe('RegistrationsTablePage', () => {
  it('renders reviewed, unreviewed and rejected registrations in separate sections', async () => {
    getActivityRegistrations.mockResolvedValue({ data: BOARD });
    renderPage();

    expect(screen.getByRole('status', { name: /cargando inscripciones/i })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: /inscripciones/i, level: 1 })).toBeInTheDocument();
    expect(getActivityRegistrations).toHaveBeenCalledWith('8');

    const unreviewed = screen.getByRole('region', { name: /sin revisar de la actividad/i });
    expect(within(unreviewed).getByText('Ana Torres')).toBeInTheDocument();
    expect(within(unreviewed).getByText('Tecnología')).toBeInTheDocument();
    expect(within(unreviewed).getByText('VERISURE_ES')).toBeInTheDocument();
    expect(within(unreviewed).getByText('12')).toBeInTheDocument();

    const acceptedQueue = screen.getByRole('region', { name: /aceptadas en cola de la actividad/i });
    expect(within(acceptedQueue).getByText('Luis Martín')).toBeInTheDocument();
    expect(within(acceptedQueue).getByText(/aceptada · en cola/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /confirmadas 1/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /rechazadas 1/i })).toBeInTheDocument();
    expect(screen.queryByText('No mostrar')).not.toBeInTheDocument();
  });

  it('shows a clear empty state', async () => {
    getActivityRegistrations.mockResolvedValue({
      data: { activity: { id: 8, title: 'Mentoría digital' }, registrations: [] },
    });
    renderPage();

    expect(await screen.findByRole('heading', { name: /todavía no hay inscripciones/i })).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('shows an explicit forbidden state', async () => {
    getActivityRegistrations.mockRejectedValue({ status: 403, message: 'Acceso denegado.' });
    renderPage();

    expect(await screen.findByRole('heading', { name: /no tienes permiso/i })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Acceso denegado.');
    expect(screen.queryByRole('button', { name: /reintentar/i })).not.toBeInTheDocument();
  });

  it('allows retrying an unexpected loading error', async () => {
    getActivityRegistrations
      .mockRejectedValueOnce({ status: 500, message: 'Error del servidor.' })
      .mockResolvedValueOnce({ data: BOARD });
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Error del servidor.');
    await user.click(screen.getByRole('button', { name: /reintentar/i }));

    await waitFor(() => expect(getActivityRegistrations).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('Ana Torres')).toBeInTheDocument();
  });
});
