import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import ActivityFormPage from './ActivityFormPage';
import { createActivity } from '../../api/activitiesApi';

vi.mock('../../api/activitiesApi', () => ({
  createActivity: vi.fn(),
}));

function renderForm() {
  return render(
    <MemoryRouter initialEntries={['/org/activities/new']}>
      <ActivityFormPage />
    </MemoryRouter>,
  );
}

describe('ActivityFormPage', () => {
  it('renders all form fields', () => {
    renderForm();

    expect(screen.getByLabelText(/título/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/línea/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/descripción/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/modalidad/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/máximo de participantes/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/horas estimadas/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/fecha y hora de inicio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/fecha y hora de fin/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/fecha límite de inscripción/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /crear actividad/i })).toBeInTheDocument();
  });

  it('shows validation errors when submitting empty', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: /crear actividad/i }));

    expect(await screen.findByText(/indica el título/i)).toBeInTheDocument();
    expect(screen.getByText(/describe la actividad/i)).toBeInTheDocument();
    expect(screen.getAllByText(/selecciona una línea/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/selecciona una modalidad/i).length).toBeGreaterThanOrEqual(1);
    expect(createActivity).not.toHaveBeenCalled();
  });

  it('shows date range error when end is before start', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/título/i), 'Taller');
    await user.selectOptions(screen.getByLabelText(/línea/i), 'desoledad');
    await user.selectOptions(screen.getByLabelText(/modalidad/i), 'presencial');
    await user.type(screen.getByLabelText(/máximo de participantes/i), '10');
    await user.type(screen.getByLabelText(/horas estimadas/i), '2');
    await user.type(screen.getByLabelText(/fecha y hora de inicio/i), '2026-09-10T10:00');
    await user.type(screen.getByLabelText(/fecha y hora de fin/i), '2026-09-09T10:00');
    await user.type(screen.getByLabelText(/fecha límite de inscripción/i), '2026-09-01T10:00');

    await user.click(screen.getByRole('button', { name: /crear actividad/i }));

    expect(await screen.findByText(/la fecha de fin debe ser posterior/i)).toBeInTheDocument();
    expect(createActivity).not.toHaveBeenCalled();
  });

  it('shows error when registration deadline is after start', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/título/i), 'Taller');
    await user.selectOptions(screen.getByLabelText(/línea/i), 'desoledad');
    await user.selectOptions(screen.getByLabelText(/modalidad/i), 'presencial');
    await user.type(screen.getByLabelText(/máximo de participantes/i), '10');
    await user.type(screen.getByLabelText(/horas estimadas/i), '2');
    await user.type(screen.getByLabelText(/fecha y hora de inicio/i), '2026-09-10T10:00');
    await user.type(screen.getByLabelText(/fecha y hora de fin/i), '2026-09-10T12:00');
    await user.type(screen.getByLabelText(/fecha límite de inscripción/i), '2026-09-11T10:00');

    await user.click(screen.getByRole('button', { name: /crear actividad/i }));

    expect(await screen.findByText(/la fecha límite no puede ser posterior al inicio/i)).toBeInTheDocument();
    expect(createActivity).not.toHaveBeenCalled();
  });

  it('calls createActivity with correct data and shows success', async () => {
    createActivity.mockResolvedValue({ data: { id: 1 } });
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/título/i), 'Taller de code');
    await user.selectOptions(screen.getByLabelText(/línea/i), 'educar');
    await user.type(screen.getByLabelText(/descripción/i), 'Un taller para aprender a programar');
    await user.selectOptions(screen.getByLabelText(/modalidad/i), 'presencial');
    await user.type(screen.getByLabelText(/máximo de participantes/i), '15');
    await user.type(screen.getByLabelText(/horas estimadas/i), '3');
    await user.type(screen.getByLabelText(/fecha y hora de inicio/i), '2026-09-10T10:00');
    await user.type(screen.getByLabelText(/fecha y hora de fin/i), '2026-09-10T13:00');
    await user.type(screen.getByLabelText(/fecha límite de inscripción/i), '2026-09-08T23:59');

    await user.click(screen.getByRole('button', { name: /crear actividad/i }));

    await waitFor(() => {
      expect(createActivity).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Taller de code',
        line: 'educar',
        modality: 'presencial',
        maxParticipants: 15,
        hours: 3,
      }));
    });

    expect(await screen.findByText(/tu actividad está lista/i)).toBeInTheDocument();
  });

  it('shows server error without crashing', async () => {
    createActivity.mockRejectedValue({ message: 'Error del servidor', status: 500 });
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/título/i), 'Taller');
    await user.selectOptions(screen.getByLabelText(/línea/i), 'desoledad');
    await user.type(screen.getByLabelText(/descripción/i), 'Descripción');
    await user.selectOptions(screen.getByLabelText(/modalidad/i), 'presencial');
    await user.type(screen.getByLabelText(/máximo de participantes/i), '10');
    await user.type(screen.getByLabelText(/horas estimadas/i), '2');
    await user.type(screen.getByLabelText(/fecha y hora de inicio/i), '2026-09-10T10:00');
    await user.type(screen.getByLabelText(/fecha y hora de fin/i), '2026-09-10T12:00');
    await user.type(screen.getByLabelText(/fecha límite de inscripción/i), '2026-09-01T10:00');

    await user.click(screen.getByRole('button', { name: /crear actividad/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/título/i)).toBeInTheDocument();
  });

  it('disables submit button while loading', async () => {
    createActivity.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/título/i), 'Taller');
    await user.selectOptions(screen.getByLabelText(/línea/i), 'desoledad');
    await user.type(screen.getByLabelText(/descripción/i), 'Descripción');
    await user.selectOptions(screen.getByLabelText(/modalidad/i), 'presencial');
    await user.type(screen.getByLabelText(/máximo de participantes/i), '10');
    await user.type(screen.getByLabelText(/horas estimadas/i), '2');
    await user.type(screen.getByLabelText(/fecha y hora de inicio/i), '2026-09-10T10:00');
    await user.type(screen.getByLabelText(/fecha y hora de fin/i), '2026-09-10T12:00');
    await user.type(screen.getByLabelText(/fecha límite de inscripción/i), '2026-09-01T10:00');

    await user.click(screen.getByRole('button', { name: /crear actividad/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /creando/i })).toBeDisabled();
    });
  });
});
