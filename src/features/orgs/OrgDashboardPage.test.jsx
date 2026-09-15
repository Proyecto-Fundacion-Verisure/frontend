import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getOrgDashboard } from '../../api/orgApi';
import { makeOrgDashboardResponse, makeEmptyOrgDashboardResponse } from '../../test/fixtures/orgDashboard';
import OrgDashboardPage from './OrgDashboardPage';

vi.mock('../../api/orgApi', () => ({
  getOrgDashboard: vi.fn(),
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/org/dashboard']}>
      <OrgDashboardPage />
    </MemoryRouter>,
  );
}

describe('OrgDashboardPage', () => {
  beforeEach(() => getOrgDashboard.mockReset());

  it('renders the four entity KPIs, evolution chart+table and distribution chart+table', async () => {
    getOrgDashboard.mockResolvedValue({ data: makeOrgDashboardResponse() });
    renderPage();

    await waitFor(() => expect(getOrgDashboard).toHaveBeenCalled());

    expect(await screen.findByRole('heading', { name: /panel de control de la entidad/i })).toBeInTheDocument();
    expect(screen.getByText('Datos ficticios para validación')).toBeInTheDocument();

    expect(screen.getByRole('list', { name: 'Indicadores de la entidad' })).toBeInTheDocument();
    expect(screen.getByText(/2.?450 h/)).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('148')).toBeInTheDocument();
    expect(screen.getByText('860')).toBeInTheDocument();

    expect(screen.getAllByText('Desoledad').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Educar para proteger').length).toBeGreaterThanOrEqual(1);

    const chartScrolls = screen.getAllByRole('region');
    expect(chartScrolls.filter((el) => el.classList.contains('bar-chart__scroll')).length).toBe(2);

    const tableWrappers = screen.getAllByRole('region');
    expect(tableWrappers.filter((el) => el.querySelector('table')).length).toBeGreaterThanOrEqual(2);
  });

  it('shows an explicit empty state when all KPIs are zero', async () => {
    getOrgDashboard.mockResolvedValue({ data: makeEmptyOrgDashboardResponse() });
    renderPage();

    expect(await screen.findByRole('heading', { name: /todavía no hay cierres validados/i })).toBeInTheDocument();
    expect(screen.getByText(/el panel se completa cuando la administración valida/i)).toBeInTheDocument();
    expect(screen.queryByText('0 h')).not.toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Indicadores de la entidad' })).not.toBeInTheDocument();
  });

  it('renders a forbidden state when the API returns 403', async () => {
    getOrgDashboard.mockResolvedValue({
      data: { message: 'No tienes permiso.' },
      status: 403,
    });
    renderPage();

    expect(await screen.findByRole('heading', { name: /acceso restringido/i })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/acceso restringido/i);
    expect(screen.getByRole('alert')).toHaveTextContent(/no tienes permiso/i);
  });

  it('shows an error with retry and succeeds on second attempt', async () => {
    getOrgDashboard
      .mockRejectedValueOnce(new Error('Error de red.'))
      .mockResolvedValueOnce({ data: makeOrgDashboardResponse() });
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByRole('heading', { name: /no hemos podido cargar el panel/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /reintentar/i }));
    expect(await screen.findByText(/2.?450 h/)).toBeInTheDocument();
    expect(getOrgDashboard).toHaveBeenCalledTimes(2);
  });

  it('never exposes volunteer names in the dashboard', async () => {
    getOrgDashboard.mockResolvedValue({ data: makeOrgDashboardResponse() });
    renderPage();

    await screen.findByRole('heading', { name: /panel de control de la entidad/i });
    const bodyText = document.body.textContent;
    expect(bodyText).not.toMatch(/María García/i);
    expect(bodyText).not.toMatch(/Javier López/i);
    expect(bodyText).not.toMatch(/Laura Fernández/i);
    expect(bodyText).not.toMatch(/Ana Martínez/i);
  });
});
