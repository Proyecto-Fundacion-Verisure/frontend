import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAdminActivities } from '../../api/activitiesApi';
import ActivitiesListPage from './ActivitiesListPage';

vi.mock('../../api/activitiesApi', () => ({
  getAdminActivities: vi.fn(),
}));

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
    organizationName: 'Fundación Cerca',
    status: 'PUBLISHED',
    startDate: '2026-11-01T10:00:00Z',
    capacity: 15,
    favoriteCount: 4,
  },
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
});

describe('ActivitiesListPage', () => {
  it('shows a loading state while requesting activities', () => {
    getAdminActivities.mockReturnValue(new Promise(() => {}));
    renderPage();

    expect(screen.getByRole('status', { name: /cargando actividades/i })).toBeInTheDocument();
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
    expect(getAdminActivities).toHaveBeenCalledWith({ page: 1, limit: 10 });
  });

  it('sends status and search filters to the administrative endpoint', async () => {
    getAdminActivities.mockResolvedValue(pageResponse());
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Mentoría digital');

    await user.selectOptions(screen.getByLabelText(/filtrar por estado/i), 'DRAFT');
    await waitFor(() => expect(getAdminActivities).toHaveBeenLastCalledWith({
      page: 1,
      limit: 10,
      status: 'DRAFT',
    }));

    await user.type(screen.getByLabelText(/buscar actividades/i), 'mentor');
    await user.click(screen.getByRole('button', { name: /^buscar$/i }));
    await waitFor(() => expect(getAdminActivities).toHaveBeenLastCalledWith({
      page: 1,
      limit: 10,
      status: 'DRAFT',
      q: 'mentor',
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

    await waitFor(() => expect(getAdminActivities).toHaveBeenLastCalledWith({ page: 2, limit: 10 }));
    expect(screen.getByText(/página 2 de 2/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /siguiente/i })).toBeDisabled();
  });

  it('shows an explained empty state and clears filters', async () => {
    getAdminActivities.mockResolvedValue(pageResponse([]));
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByRole('heading', { name: /no hay actividades/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /limpiar filtros/i }));
    expect(screen.getByLabelText(/buscar actividades/i)).toHaveValue('');
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
