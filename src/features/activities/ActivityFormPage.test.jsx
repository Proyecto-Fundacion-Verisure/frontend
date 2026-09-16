import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createActivity,
  getAdminActivity,
  publishActivity,
  updateActivity,
} from '../../api/activitiesApi';
import { createOrgActivity, getOrgActivities, updateOrgActivity } from '../../api/orgApi';
import { AuthContext } from '../auth/AuthContext';
import ActivityFormPage from './ActivityFormPage';

vi.mock('../../api/activitiesApi', () => ({
  createActivity: vi.fn(),
  getAdminActivity: vi.fn(),
  publishActivity: vi.fn(),
  updateActivity: vi.fn(),
}));

vi.mock('../../api/orgApi', () => ({
  createOrgActivity: vi.fn(),
  getOrgActivities: vi.fn(),
  submitOrgActivity: vi.fn(),
  updateOrgActivity: vi.fn(),
}));

function renderForm() {
  return render(
    <MemoryRouter initialEntries={['/activities/new']}>
      <ActivityFormPage />
    </MemoryRouter>,
  );
}

function renderEditForm() {
  return render(
    <MemoryRouter initialEntries={['/activities/12/edit']}>
      <Routes>
        <Route path="/activities/:activityId/edit" element={<ActivityFormPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function renderPartnerForm() {
  return render(
    <MemoryRouter initialEntries={['/org/activities/new']}>
      <AuthContext.Provider value={{ user: { role: 'PARTNER', status: 'ACTIVE' } }}>
        <ActivityFormPage backPath="/org/activities" />
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

const EDIT_ACTIVITY = {
  id: 12,
  title: 'Mentoría digital',
  description: 'Acompañamiento para reducir la brecha digital.',
  line: 'educar',
  mode: 'PRESENCIAL',
  location: 'Madrid',
  spots: 15,
  hours: 3,
  startDate: '2026-10-10',
  endDate: '2026-10-10',
  registrationDeadline: '2026-10-08',
  status: 'DRAFT',
  partnerName: null,
};

async function fillValidForm(user) {
  await user.type(screen.getByLabelText(/título/i), 'Taller de code');
  await user.selectOptions(screen.getByLabelText(/línea/i), 'educar');
  await user.type(screen.getByLabelText(/descripción/i), 'Un taller para aprender a programar');
  await user.selectOptions(screen.getByLabelText(/modalidad/i), 'PRESENCIAL');
  await user.type(screen.getByLabelText(/^plazas/i), '15');
  await user.type(screen.getByLabelText(/horas estimadas/i), '3');
  await user.type(screen.getByLabelText(/fecha de inicio/i), '2026-09-10');
  await user.type(screen.getByLabelText(/fecha de fin/i), '2026-09-10');
  await user.type(screen.getByLabelText(/fecha límite de inscripción/i), '2026-09-08');
}

beforeEach(() => {
  createActivity.mockReset();
  getAdminActivity.mockReset();
  publishActivity.mockReset();
  updateActivity.mockReset();
  createOrgActivity.mockReset();
  getOrgActivities.mockReset();
  updateOrgActivity.mockReset();
});

describe('ActivityFormPage', () => {
  it('renders the complete form and both persistence actions', () => {
    renderForm();

    expect(screen.getByLabelText(/título/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/línea/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/descripción/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/modalidad/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^plazas/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/horas estimadas/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/fecha de inicio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/fecha de fin/i)).toBeInTheDocument();
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
    await user.clear(screen.getByLabelText(/fecha de fin/i));
    await user.type(screen.getByLabelText(/fecha de fin/i), '2026-09-09');
    await user.click(screen.getByRole('button', { name: /guardar borrador/i }));

    expect(await screen.findByText(/la fecha de fin no puede ser anterior/i)).toBeInTheDocument();
    expect(createActivity).not.toHaveBeenCalled();
  });

  it('saves a draft without publishing it', async () => {
    createActivity.mockResolvedValue({ data: { id: 41, status: 'DRAFT' }, status: 201 });
    const user = userEvent.setup();
    renderForm();
    await fillValidForm(user);

    await user.click(screen.getByRole('button', { name: /guardar borrador/i }));

    await waitFor(() => expect(createActivity).toHaveBeenCalledTimes(1));
    // Exactamente `CreateActivityRequest`: fechas `YYYY-MM-DD`, `mode` y `spots`.
    expect(createActivity).toHaveBeenCalledWith({
      title: 'Taller de code',
      description: 'Un taller para aprender a programar',
      line: 'educar',
      mode: 'PRESENCIAL',
      location: null,
      startDate: '2026-09-10',
      endDate: '2026-09-10',
      registrationDeadline: '2026-09-08',
      hours: 3,
      spots: 15,
    });
    expect(publishActivity).not.toHaveBeenCalled();
    expect(await screen.findByRole('heading', { name: /tu borrador está guardado/i })).toBeInTheDocument();
  });

  it('creates partner drafts through /org, and nobody gets a cover control', async () => {
    createOrgActivity.mockResolvedValue({ data: { id: 51, status: 'DRAFT' }, status: 201 });
    const user = userEvent.setup();
    renderPartnerForm();
    await fillValidForm(user);

    // Ni subida ni URL: la portada sale de la línea de acción.
    expect(screen.queryByLabelText(/^imagen de portada$/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/url de imagen/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /guardar borrador/i }));

    await waitFor(() => expect(createOrgActivity).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Taller de code',
      line: 'educar',
    })));
    expect(createActivity).not.toHaveBeenCalled();
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

  it('loads every field from the administrative detail in edit mode', async () => {
    getAdminActivity.mockResolvedValue({ data: EDIT_ACTIVITY });
    renderEditForm();

    expect(screen.getByRole('status', { name: /cargando actividad/i })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: /editar actividad de voluntariado/i })).toBeInTheDocument();
    expect(getAdminActivity).toHaveBeenCalledWith('12');
    expect(screen.getByLabelText(/título/i)).toHaveValue('Mentoría digital');
    expect(screen.getByLabelText(/línea/i)).toHaveValue('educar');
    expect(screen.getByLabelText(/modalidad/i)).toHaveValue('PRESENCIAL');
    expect(screen.getByLabelText(/lugar/i)).toHaveValue('Madrid');
    expect(screen.getByLabelText(/^plazas/i)).toHaveValue(15);
    expect(screen.getByLabelText(/fecha de inicio/i)).toHaveValue('2026-10-10');
    expect(screen.getByLabelText(/horas estimadas/i)).toHaveValue(3);
    expect(screen.queryByRole('button', { name: /publicar actividad/i })).not.toBeInTheDocument();
  });

  it('updates the loaded activity without creating a new one', async () => {
    getAdminActivity.mockResolvedValue({ data: EDIT_ACTIVITY });
    updateActivity.mockResolvedValue({ data: { ...EDIT_ACTIVITY, title: 'Mentoría avanzada' } });
    const user = userEvent.setup();
    renderEditForm();

    const title = await screen.findByLabelText(/título/i);
    await user.clear(title);
    await user.type(title, 'Mentoría avanzada');
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => expect(updateActivity).toHaveBeenCalledWith('12', expect.objectContaining({
      title: 'Mentoría avanzada',
      mode: 'PRESENCIAL',
      location: 'Madrid',
      spots: 15,
      hours: 3,
      startDate: '2026-10-10',
    })));
    expect(createActivity).not.toHaveBeenCalled();
    expect(await screen.findByRole('heading', { name: /la actividad se ha actualizado/i })).toBeInTheDocument();
  });

  it('edits a partner draft from the list row without calling the admin detail', async () => {
    const row = {
      id: 901,
      title: 'Taller de memoria',
      line: 'desoledad',
      mode: 'PRESENCIAL',
      location: 'Barcelona',
      startDate: '2026-11-10',
      endDate: '2026-11-10',
      registrationDeadline: '2026-11-03',
      hours: 3,
      spots: 6,
      occupiedSpots: 0,
      status: 'DRAFT',
      reviewNote: 'Concreta el lugar.',
    };
    updateOrgActivity.mockResolvedValue({ data: row });
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={[{ pathname: '/org/activities/901/edit', state: { activity: row } }]}>
        <AuthContext.Provider value={{ user: { role: 'PARTNER', status: 'ACTIVE' } }}>
          <Routes>
            <Route path="/org/activities/:activityId/edit" element={<ActivityFormPage backPath="/org/activities" />} />
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    expect(await screen.findByLabelText(/título/i)).toHaveValue('Taller de memoria');
    expect(getAdminActivity).not.toHaveBeenCalled();
    expect(getOrgActivities).not.toHaveBeenCalled();
    expect(screen.getByText(/comentario de la fundación/i)).toBeInTheDocument();
    expect(screen.getByText('Concreta el lugar.')).toBeInTheDocument();
    expect(screen.getByText(/volver a escribir la descripción/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/descripción/i), 'Ejercicios de memoria para mayores.');
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => expect(updateOrgActivity).toHaveBeenCalledWith('901', expect.objectContaining({
      description: 'Ejercicios de memoria para mayores.',
      spots: 6,
    })));
    expect(updateActivity).not.toHaveBeenCalled();
  });

  it('looks the partner draft up in the list when entered by URL', async () => {
    getOrgActivities.mockResolvedValue({
      data: { content: [{ id: 7, title: 'Otra' }, { id: 901, title: 'Por URL', status: 'DRAFT' }], totalPages: 1 },
    });
    render(
      <MemoryRouter initialEntries={['/org/activities/901/edit']}>
        <AuthContext.Provider value={{ user: { role: 'PARTNER', status: 'ACTIVE' } }}>
          <Routes>
            <Route path="/org/activities/:activityId/edit" element={<ActivityFormPage backPath="/org/activities" />} />
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    expect(await screen.findByLabelText(/título/i)).toHaveValue('Por URL');
    expect(getOrgActivities).toHaveBeenCalledWith({ page: 0, size: 50 });
    expect(getAdminActivity).not.toHaveBeenCalled();
  });

  it('shows the forbidden state returned by the administrative endpoint', async () => {
    getAdminActivity.mockRejectedValue({ status: 403, message: 'Acceso denegado.' });
    renderEditForm();

    expect(await screen.findByRole('heading', { name: /no tienes permiso/i })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Acceso denegado.');
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
  });
});
