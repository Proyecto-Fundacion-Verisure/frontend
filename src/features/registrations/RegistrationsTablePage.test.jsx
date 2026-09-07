import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  acceptRegistration,
  cancelRegistration,
  getActivityRegistrations,
  rejectRegistration,
} from '../../api/registrationsApi';
import RegistrationsTablePage from './RegistrationsTablePage';

vi.mock('../../api/registrationsApi', () => ({
  acceptRegistration: vi.fn(),
  cancelRegistration: vi.fn(),
  getActivityRegistrations: vi.fn(),
  rejectRegistration: vi.fn(),
}));

const BOARD = {
  content: [
    { registrationId: 1, name: 'Ana Torres', department: 'Tecnología', organization: 'VERISURE_ES', yearHours: 12, status: 'WAITLISTED', accepted: false },
    { registrationId: 2, person: { name: 'Luis Martín', department: 'Personas', organization: 'VERISURE_GROUP' }, hoursThisYear: 8, status: 'WAITLISTED', accepted: true },
    { registrationId: 3, name: 'Marta Ruiz', department: 'Operaciones', organization: 'VERISURE_ES', annualHours: 16, status: 'CONFIRMED', accepted: true },
    { registrationId: 4, name: 'Sara Gil', status: 'REJECTED', accepted: false, rejectionReason: 'No mostrar' },
  ],
  number: 0,
  size: 10,
  totalElements: 4,
  totalPages: 1,
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
  acceptRegistration.mockReset();
  cancelRegistration.mockReset();
  getActivityRegistrations.mockReset();
  rejectRegistration.mockReset();
});

describe('RegistrationsTablePage', () => {
  it('renders reviewed, unreviewed and rejected registrations in separate sections', async () => {
    getActivityRegistrations.mockResolvedValue({ data: BOARD });
    renderPage();

    expect(screen.getByRole('status', { name: /cargando inscripciones/i })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: /inscripciones/i, level: 1 })).toBeInTheDocument();
    expect(getActivityRegistrations).toHaveBeenCalledWith('8', { page: 0 });

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
      data: { content: [], number: 0, size: 10, totalElements: 0, totalPages: 0 },
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

  it('moves an accepted registration to confirmed when backend grants a spot', async () => {
    const confirmed = { ...BOARD.content[0], status: 'CONFIRMED', accepted: true };
    getActivityRegistrations
      .mockResolvedValueOnce({ data: BOARD })
      .mockResolvedValueOnce({ data: { ...BOARD, content: [confirmed], totalElements: 1 } });
    acceptRegistration.mockResolvedValue({ data: confirmed });
    const user = userEvent.setup();
    renderPage();

    const row = (await screen.findByText('Ana Torres')).closest('tr');
    await user.click(within(row).getByRole('button', { name: /Aceptar inscripción de Ana Torres/i }));

    expect(await screen.findByRole('heading', { name: /confirmadas 1/i })).toBeInTheDocument();
    expect(acceptRegistration).toHaveBeenCalledWith(1);
    expect(screen.queryByRole('heading', { name: /sin revisar 1/i })).not.toBeInTheDocument();
  });

  it('keeps an accepted registration in the queue when backend reports no spot', async () => {
    const acceptedInQueue = { ...BOARD.content[0], status: 'WAITLISTED', accepted: true, queuePosition: 1 };
    getActivityRegistrations
      .mockResolvedValueOnce({ data: BOARD })
      .mockResolvedValueOnce({ data: { ...BOARD, content: [acceptedInQueue], totalElements: 1 } });
    acceptRegistration.mockResolvedValue({ data: acceptedInQueue });
    const user = userEvent.setup();
    renderPage();

    const row = (await screen.findByText('Ana Torres')).closest('tr');
    await user.click(within(row).getByRole('button', { name: /Aceptar inscripción de Ana Torres/i }));

    expect(await screen.findByRole('heading', { name: /aceptadas en cola 1/i })).toBeInTheDocument();
    expect(screen.getByText(/aceptada · en cola/i)).toBeInTheDocument();
  });

  it('rejects without asking for or sending a reason', async () => {
    const rejected = { ...BOARD.content[0], status: 'REJECTED', accepted: false };
    getActivityRegistrations
      .mockResolvedValueOnce({ data: BOARD })
      .mockResolvedValueOnce({ data: { ...BOARD, content: [rejected], totalElements: 1 } });
    rejectRegistration.mockResolvedValue({ data: rejected });
    const user = userEvent.setup();
    renderPage();

    const row = (await screen.findByText('Ana Torres')).closest('tr');
    await user.click(within(row).getByRole('button', { name: /Rechazar inscripción de Ana Torres/i }));

    expect(await screen.findByRole('heading', { name: /rechazadas 1/i })).toBeInTheDocument();
    expect(rejectRegistration).toHaveBeenCalledWith(1);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('keeps the row actionable after a decision error', async () => {
    getActivityRegistrations.mockResolvedValue({ data: BOARD });
    acceptRegistration.mockRejectedValue({ status: 500, message: 'No se pudo aceptar.' });
    const user = userEvent.setup();
    renderPage();

    const row = (await screen.findByText('Ana Torres')).closest('tr');
    await user.click(within(row).getByRole('button', { name: /Aceptar inscripción de Ana Torres/i }));

    expect(await within(row).findByRole('alert')).toHaveTextContent('No se pudo aceptar.');
    expect(within(row).getByRole('button', { name: /Aceptar inscripción de Ana Torres/i })).toBeEnabled();
    await user.click(within(row).getByRole('button', { name: /Aceptar inscripción de Ana Torres/i }));
    expect(acceptRegistration).toHaveBeenCalledTimes(2);
  });

  it('shows the candidate promoted by the refreshed backend board after cancellation', async () => {
    const confirmed = BOARD.content[2];
    const acceptedInQueue = BOARD.content[1];
    const unreviewed = BOARD.content[0];
    const refreshedBoard = {
      ...BOARD,
      content: [
        { ...confirmed, status: 'CANCELLED' },
        { ...acceptedInQueue, status: 'CONFIRMED', queuePosition: null },
        unreviewed,
      ],
    };
    getActivityRegistrations
      .mockResolvedValueOnce({ data: { ...BOARD, content: [confirmed, acceptedInQueue, unreviewed], totalElements: 3 } })
      .mockResolvedValueOnce({ data: refreshedBoard });
    cancelRegistration.mockResolvedValue({ data: { ...confirmed, status: 'CANCELLED' } });
    const user = userEvent.setup();
    renderPage();

    const confirmedRow = (await screen.findByText('Marta Ruiz')).closest('tr');
    await user.click(within(confirmedRow).getByRole('button', { name: /dar de baja/i }));
    await user.click(screen.getByRole('button', { name: /confirmar baja/i }));

    const refreshedPerson = await screen.findByText('Luis Martín');
    expect(within(refreshedPerson.closest('tr')).getByText('Confirmada')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /sin revisar 1/i })).toBeInTheDocument();
    expect(cancelRegistration).toHaveBeenCalledWith(3, undefined);
  });

  it('does not promote an unreviewed registration when backend returns no candidate', async () => {
    const confirmed = BOARD.content[2];
    const unreviewed = BOARD.content[0];
    getActivityRegistrations
      .mockResolvedValueOnce({ data: { ...BOARD, content: [confirmed, unreviewed], totalElements: 2 } })
      .mockResolvedValueOnce({
        data: { ...BOARD, content: [{ ...confirmed, status: 'CANCELLED' }, unreviewed], totalElements: 2 },
      });
    cancelRegistration.mockResolvedValue({ data: { ...confirmed, status: 'CANCELLED' } });
    const user = userEvent.setup();
    renderPage();

    const confirmedRow = (await screen.findByText('Marta Ruiz')).closest('tr');
    await user.click(within(confirmedRow).getByRole('button', { name: /dar de baja/i }));
    await user.click(screen.getByRole('button', { name: /confirmar baja/i }));

    const remainingPerson = await screen.findByText('Ana Torres');
    expect(within(remainingPerson.closest('tr')).getByText('Sin revisar')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /confirmadas 1/i })).not.toBeInTheDocument();
  });
});
