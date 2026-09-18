import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { approveActivity, getAdminActivities, getPendingActivities, returnActivity } from '../../api/activitiesApi';
import ActivitiesListPage from './ActivitiesListPage';

vi.mock('../../api/activitiesApi', () => ({
  getAdminActivities: vi.fn(),
  approveActivity: vi.fn(),
  getPendingActivities: vi.fn(),
  returnActivity: vi.fn(),
}));

const PENDING = {
  id: 30, title: 'Voluntariado ambiental', partnerName: 'Cruz Roja Valencia',
  status: 'PENDING_APPROVAL', startDate: '2026-11-05', spots: 8, favoriteCount: 0,
};

const ACTIVITIES = [
  {
    id: 12,
    title: 'Mentoría digital',
    partner: { name: 'Fundación Futuro' },
    status: 'DRAFT',
    startDate: '2026-10-10T09:00:00Z',
    spots: 20,
    favoriteCount: 9,
  },
  {
    id: 13,
    title: 'Acompañamiento telefónico',
    partnerName: 'Fundación Cerca',
    status: 'PUBLISHED',
    startDate: '2026-11-01',
    spots: 15,
    favoriteCount: 4,
  },
];

// Filas de `ActivitySummary` en los estados que el backend no deja cancelar.
const NOT_CANCELLABLE = [
  { id: 20, title: 'Ya terminada', partnerName: 'X', status: 'FINISHED', startDate: '2026-03-02', spots: 5, favoriteCount: 0 },
  { id: 21, title: 'Ya cancelada', partnerName: 'X', status: 'CANCELLED', startDate: '2026-02-09', spots: 5, favoriteCount: 0 },
  { id: 22, title: 'En revisión', partnerName: 'X', status: 'PENDING_APPROVAL', startDate: '2026-12-01', spots: 5, favoriteCount: 0 },
];

function pageResponse(content = ACTIVITIES, overrides = {}) {
  return {
    data: {
      content,
      totalElements: content.length,
      totalPages: content.length ? 1 : 0,
      ...overrides,
    },
  };
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/admin/activities']}>
      <ActivitiesListPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  getAdminActivities.mockReset();
  approveActivity.mockReset();
  returnActivity.mockReset();
});

describe('ActivitiesListPage', () => {
  it('shows a loading state while requesting activities', () => {
    getAdminActivities.mockReturnValue(new Promise(() => {}));
    renderPage();

    expect(screen.getByRole('status', { name: /cargando proyectos/i })).toBeInTheDocument();
  });

  it('renders the administrative data including favorite counts', async () => {
    getAdminActivities.mockResolvedValue(pageResponse());
    renderPage();

    const title = await screen.findByText('Mentoría digital');
    const row = title.closest('tr');
    expect(within(row).getByText('Fundación Futuro')).toBeInTheDocument();
    expect(within(row).getByText('Borrador')).toBeInTheDocument();
    expect(within(row).getByText('20')).toBeInTheDocument();
    expect(within(row).getByText('9')).toBeInTheDocument();
    expect(within(row).getByRole('link', { name: /editar/i })).toHaveAttribute(
      'href',
      '/activities/12/edit',
    );
    expect(within(row).getByRole('link', { name: /inscripciones/i })).toHaveAttribute(
      'href',
      '/activities/12/registrations',
    );
    expect(getAdminActivities).toHaveBeenCalledWith({ page: 0, size: 10 });
  });

  it('offers Cancelar only where the backend accepts it', async () => {
    getAdminActivities.mockResolvedValue(pageResponse([...ACTIVITIES, ...NOT_CANCELLABLE]));
    renderPage();

    const published = (await screen.findByText('Acompañamiento telefónico')).closest('tr');
    expect(within(published).getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
    const draft = screen.getByText('Mentoría digital').closest('tr');
    expect(within(draft).getByRole('button', { name: /cancelar/i })).toBeInTheDocument();

    for (const title of ['Ya terminada', 'Ya cancelada', 'En revisión']) {
      const row = screen.getByText(title).closest('tr');
      expect(within(row).queryByRole('button', { name: /cancelar/i })).not.toBeInTheDocument();
    }
  });

  it('in the inventory, a pending activity only links to the review queue', async () => {
    getAdminActivities.mockResolvedValue(pageResponse([PENDING]));
    renderPage();

    const row = (await screen.findByText('Voluntariado ambiental')).closest('tr');
    expect(within(row).getByRole('link', { name: /revisar/i })).toHaveAttribute('href', '/admin/activities/pending');
    expect(within(row).queryByRole('button', { name: /aprobar/i })).not.toBeInTheDocument();
    expect(within(row).queryByRole('button', { name: /devolver/i })).not.toBeInTheDocument();
    expect(within(row).queryByRole('button', { name: /cancelar/i })).not.toBeInTheDocument();
  });

  it('the review queue has no status filter, approves and reloads', async () => {
    const user = userEvent.setup();
    getPendingActivities
      .mockResolvedValueOnce(pageResponse([PENDING]))
      .mockResolvedValueOnce(pageResponse([]));
    approveActivity.mockResolvedValue({ data: { ...PENDING, status: 'PUBLISHED' } });
    render(
      <MemoryRouter>
        <ActivitiesListPage
          fetchData={getPendingActivities}
          title="Propuestas recibidas por el formulario público"
          showCreateButton={false}
          showStatusFilter={false}
          showRegistrationsLink={false}
          showReviewActions={true}
        />
      </MemoryRouter>,
    );

    const row = (await screen.findByText('Voluntariado ambiental')).closest('tr');
    expect(screen.queryByLabelText(/filtrar por estado/i)).not.toBeInTheDocument();
    expect(getPendingActivities).toHaveBeenCalledWith({ page: 0, size: 10 });
    expect(within(row).getByText('Cruz Roja Valencia')).toBeInTheDocument();

    await user.click(within(row).getByRole('button', { name: /aprobar/i }));

    await waitFor(() => expect(approveActivity).toHaveBeenCalledWith(30));
    expect(await screen.findByRole('status')).toHaveTextContent(/se ha aprobado/i);
    await waitFor(() => expect(getPendingActivities).toHaveBeenCalledTimes(2));
    expect(screen.queryByText('Voluntariado ambiental')).not.toBeInTheDocument();
  });

  it('sends the status filter supported by the administrative endpoint', async () => {
    getAdminActivities.mockResolvedValue(pageResponse());
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Mentoría digital');

    await user.selectOptions(screen.getByLabelText(/filtrar por estado/i), 'DRAFT');
    await waitFor(() => expect(getAdminActivities).toHaveBeenLastCalledWith({
      page: 0,
      size: 10,
      status: 'DRAFT',
    }));
  });

  it('uses Page metadata to paginate', async () => {
    getAdminActivities.mockResolvedValue(pageResponse(ACTIVITIES, {
      totalElements: 12,
      totalPages: 2,
    }));
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText(/página 1 de 2/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /anterior/i })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: /siguiente/i }));

    await waitFor(() => expect(getAdminActivities).toHaveBeenLastCalledWith({ page: 1, size: 10 }));
    expect(screen.getByText(/página 2 de 2/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /siguiente/i })).toBeDisabled();
  });

  it('shows an explained empty state and clears filters', async () => {
    getAdminActivities.mockResolvedValue(pageResponse([]));
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByRole('heading', { name: /no hay proyectos/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /limpiar filtros/i }));
    expect(screen.getByLabelText(/filtrar por estado/i)).toHaveValue('');
  });

  it('shows an explicit forbidden state', async () => {
    getAdminActivities.mockRejectedValue({ status: 403 });
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent(/no tienes permiso/i);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('allows retrying after an unexpected error', async () => {
    getAdminActivities
      .mockRejectedValueOnce({ status: 500, message: 'Error del servidor.' })
      .mockResolvedValueOnce(pageResponse());
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent(/error del servidor/i);
    await user.click(screen.getByRole('button', { name: /reintentar/i }));

    expect(await screen.findByText('Mentoría digital')).toBeInTheDocument();
    expect(getAdminActivities).toHaveBeenCalledTimes(2);
  });
});
