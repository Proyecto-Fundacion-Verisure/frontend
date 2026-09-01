import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createActivity, publishActivity } from '../../api/activitiesApi';
import ActivityFormPage from './ActivityFormPage';

vi.mock('../../api/activitiesApi', () => ({
  createActivity: vi.fn(),
  publishActivity: vi.fn(),
}));

function renderForm() {
  return render(
    <MemoryRouter initialEntries={['/activities/new']}>
      <ActivityFormPage />
    </MemoryRouter>,
  );
}

async function fillValidForm(user) {
  await user.type(screen.getByLabelText(/título/i), 'Taller de code');
  await user.selectOptions(screen.getByLabelText(/línea/i), 'educar');
  await user.type(screen.getByLabelText(/descripción/i), 'Un taller para aprender a programar');
  await user.selectOptions(screen.getByLabelText(/modalidad/i), 'presencial');
  await user.type(screen.getByLabelText(/máximo de participantes/i), '15');
  await user.type(screen.getByLabelText(/horas estimadas/i), '3');
  await user.type(screen.getByLabelText(/fecha y hora de inicio/i), '2026-09-10T10:00');
  await user.type(screen.getByLabelText(/fecha y hora de fin/i), '2026-09-10T13:00');
  await user.type(screen.getByLabelText(/fecha límite de inscripción/i), '2026-09-08T23:59');
}

beforeEach(() => {
  createActivity.mockReset();
  publishActivity.mockReset();
});

describe('ActivityFormPage', () => {
  it('renders the complete form and both persistence actions', () => {
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
    expect(screen.getByRole('button', { name: /guardar borrador/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^publicar actividad$/i })).toBeInTheDocument();
  });

  it('does not call the API when client validation fails', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: /guardar borrador/i }));

    expect(await screen.findByText(/indica el título/i)).toBeInTheDocument();
    expect(screen.getByText(/describe la actividad/i)).toBeInTheDocument();
    expect(createActivity).not.toHaveBeenCalled();
    expect(publishActivity).not.toHaveBeenCalled();
  });

  it('validates the date range before persisting', async () => {
    const user = userEvent.setup();
    renderForm();

    await fillValidForm(user);
    await user.clear(screen.getByLabelText(/fecha y hora de fin/i));
    await user.type(screen.getByLabelText(/fecha y hora de fin/i), '2026-09-09T10:00');
    await user.click(screen.getByRole('button', { name: /guardar borrador/i }));

    expect(await screen.findByText(/la fecha de fin debe ser posterior/i)).toBeInTheDocument();
    expect(createActivity).not.toHaveBeenCalled();
  });

  it('saves a draft without publishing it', async () => {
    createActivity.mockResolvedValue({ data: { id: 41, status: 'DRAFT' }, status: 201 });
    const user = userEvent.setup();
    renderForm();
    await fillValidForm(user);

    await user.click(screen.getByRole('button', { name: /guardar borrador/i }));

    await waitFor(() => expect(createActivity).toHaveBeenCalledTimes(1));
    expect(createActivity).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Taller de code',
      line: 'educar',
      maxParticipants: 15,
      hours: 3,
    }));
    expect(publishActivity).not.toHaveBeenCalled();
    expect(await screen.findByRole('heading', { name: /tu borrador está guardado/i })).toBeInTheDocument();
  });

  it('asks for confirmation, persists once and publishes with the returned id', async () => {
    let resolveCreate;
    createActivity.mockReturnValue(new Promise((resolve) => {
      resolveCreate = resolve;
    }));
    publishActivity.mockResolvedValue({ data: { id: 42, status: 'PUBLISHED' } });
    const user = userEvent.setup();
    renderForm();
    await fillValidForm(user);

    await user.click(screen.getByRole('button', { name: /^publicar actividad$/i }));
    expect(screen.getByRole('dialog', { name: /publicar actividad/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /confirmar publicación/i }));

    expect(createActivity).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /publicando/i })).toBeDisabled();

    await act(async () => {
      resolveCreate({ data: { id: 42, status: 'DRAFT' }, status: 201 });
    });

    await waitFor(() => expect(publishActivity).toHaveBeenCalledWith(42));
    expect(createActivity).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole('heading', { name: /la actividad ya está publicada/i })).toBeInTheDocument();
  });

  it('keeps the persisted draft and does not create another one when publish is retried', async () => {
    createActivity.mockResolvedValue({ data: { id: 43, status: 'DRAFT' }, status: 201 });
    publishActivity
      .mockRejectedValueOnce({ status: 409, message: 'La actividad no se puede publicar en su estado actual.' })
      .mockResolvedValueOnce({ data: { id: 43, status: 'PUBLISHED' } });
    const user = userEvent.setup();
    renderForm();
    await fillValidForm(user);

    await user.click(screen.getByRole('button', { name: /^publicar actividad$/i }));
    await user.click(screen.getByRole('button', { name: /confirmar publicación/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/no se puede publicar/i);
    expect(screen.getByRole('heading', { name: /tu borrador está guardado/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^publicar actividad$/i }));
    await user.click(screen.getByRole('button', { name: /confirmar publicación/i }));

    await waitFor(() => expect(publishActivity).toHaveBeenCalledTimes(2));
    expect(createActivity).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole('heading', { name: /la actividad ya está publicada/i })).toBeInTheDocument();
  });

  it('shows field errors returned by ApiError and allows retrying', async () => {
    createActivity.mockRejectedValue({
      status: 400,
      message: 'Revisa los datos introducidos.',
      fieldErrors: { title: 'El título ya existe.' },
    });
    const user = userEvent.setup();
    renderForm();
    await fillValidForm(user);

    await user.click(screen.getByRole('button', { name: /guardar borrador/i }));

    expect(await screen.findByText('El título ya existe.')).toBeInTheDocument();
    expect(screen.getByText(/revisa los datos introducidos/i)).toHaveAttribute('role', 'alert');
    expect(screen.getByRole('button', { name: /guardar borrador/i })).toBeEnabled();
  });
});
