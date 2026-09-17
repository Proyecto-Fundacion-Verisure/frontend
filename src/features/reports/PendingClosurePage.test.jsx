import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getPendingActivityClosures } from '../../api/closuresApi';
import { ApiError } from '../../api/apiError';
import { makeActivitySummary, makePage } from '../../test/fixtures/closures';
import PendingClosurePage from './PendingClosurePage';

vi.mock('../../api/closuresApi', () => ({
  getPendingActivityClosures: vi.fn(),
}));

beforeEach(() => vi.clearAllMocks());

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/admin/activities/pending-closure']}>
      <PendingClosurePage />
    </MemoryRouter>,
  );
}

describe('PendingClosurePage', () => {
  it('shows a loading state while requesting activities', () => {
    getPendingActivityClosures.mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByRole('status', { name: /cargando actividades pendientes de cierre/i })).toBeInTheDocument();
    expect(getPendingActivityClosures).toHaveBeenCalledWith({ page: 0 });
  });

  it('renders the queue from the real ActivityClosureRow DTO without reordering', async () => {
    const summaries = [
      makeActivitySummary({ activityId: 41, title: 'Mentoría laboral', partnerName: 'Fundación Solitaria', startDate: '2026-07-01', endDate: '2026-07-30', hours: 12 }),
      makeActivitySummary({ activityId: 42, title: 'Acompañamiento a mayores', partnerName: null, startDate: '2026-08-14', endDate: '2026-08-14', hours: 8 }),
    ];
    getPendingActivityClosures.mockResolvedValue({ data: makePage(summaries, { totalElements: 2 }) });

    renderPage();

    expect(await screen.findByRole('heading', { name: /actividades pendientes de cierre/i })).toBeInTheDocument();

    ['Mentoría laboral', 'Acompañamiento a mayores'].forEach((title) => {
      expect(screen.getByText(title)).toBeInTheDocument();
    });
    expect(screen.getByText('Fundación Solitaria')).toBeInTheDocument();
    expect(screen.getByText('Sin entidad')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    const reviewLinks = screen.getAllByRole('link', { name: /revisar cierre/i });
    expect(reviewLinks).toHaveLength(2);
    expect(reviewLinks[0]).toHaveAttribute('href', '/admin/activities/41/closure');
    expect(getPendingActivityClosures).toHaveBeenCalledWith({ page: 0 });
  });

  it('shows an explicit empty state when the queue has no activities', async () => {
    getPendingActivityClosures.mockResolvedValue({ data: makePage([], { totalElements: 0 }) });

    renderPage();

    expect(await screen.findByRole('heading', { name: /no hay actividades pendientes de cierre/i })).toBeInTheDocument();
    expect(screen.getByText(/todas las actividades finalizadas están cerradas/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /revisar cierre/i })).not.toBeInTheDocument();
  });

  it('paginates following the backend page order without reordering', async () => {
    const pageA = Array.from({ length: 10 }, (_, index) => makeActivitySummary({
      activityId: 100 + index,
      title: `Actividad ${100 + index}`,
    }));
    const pageB = [makeActivitySummary({ activityId: 200, title: 'Actividad página dos' })];
    getPendingActivityClosures
      .mockResolvedValueOnce({ data: makePage(pageA, { totalElements: 11 }) })
      .mockResolvedValueOnce({ data: makePage(pageB, { totalElements: 11, page: 1 }) });
    const user = userEvent.setup();

    renderPage();

    expect(await screen.findByText('Actividad 100')).toBeInTheDocument();
    expect(screen.queryByText('Actividad página dos')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /siguiente/i }));

    expect(await screen.findByText('Actividad página dos')).toBeInTheDocument();
    expect(screen.getByText(/página 2 de 2/i)).toBeInTheDocument();
    expect(getPendingActivityClosures).toHaveBeenLastCalledWith({ page: 1 });
  });

  it('renders an explicit forbidden state when the API returns 403', async () => {
    getPendingActivityClosures.mockRejectedValue(new ApiError({
      message: 'No tienes permiso para realizar esta acción.',
      status: 403,
      code: 'FORBIDDEN',
    }));

    renderPage();

    expect(await screen.findByRole('heading', { name: /acceso restringido/i })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/no tienes permiso/i);
    expect(screen.queryByRole('button', { name: /reintentar/i })).not.toBeInTheDocument();
  });

  it('renders an error state with retry when the request fails', async () => {
    getPendingActivityClosures
      .mockRejectedValueOnce(new Error('Ha ocurrido un error en el servidor.'))
      .mockResolvedValueOnce({
        data: makePage([makeActivitySummary({ title: 'Mentoría laboral' })], { totalElements: 1 }),
      });
    const user = userEvent.setup();

    renderPage();

    expect(await screen.findByRole('heading', { name: /no hemos podido cargar las actividades/i })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/ha ocurrido un error en el servidor/i);

    await user.click(screen.getByRole('button', { name: /reintentar/i }));

    expect(await screen.findByText('Mentoría laboral')).toBeInTheDocument();
    await waitFor(() => expect(getPendingActivityClosures).toHaveBeenCalledTimes(2));
  });
});