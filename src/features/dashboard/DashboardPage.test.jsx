import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DASHBOARD_RESPONSE, makeDashboardResponse } from '../../test/fixtures/dashboard';
import DashboardPage from './DashboardPage';

const api = vi.hoisted(() => ({
  exportDashboardPdf: vi.fn(),
  exportPartnersCsv: vi.fn(),
  exportParticipationsCsv: vi.fn(),
  getDashboard: vi.fn(),
}));

vi.mock('../../api/dashboardApi', () => api);
vi.mock('./downloadFile', () => ({ downloadBlob: vi.fn() }));

function DashboardHarness() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <DashboardPage />
      <output data-testid="location">{location.pathname}{location.search}</output>
      <button type="button" onClick={() => navigate(-1)}>Atrás en historial</button>
      <button type="button" onClick={() => navigate(1)}>Adelante en historial</button>
    </>
  );
}

function renderDashboard(initialEntries = ['/dashboard'], initialIndex) {
  return render(
    <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
      <Routes>
        <Route path="/dashboard" element={<DashboardHarness />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('DashboardPage', () => {
  beforeEach(() => {
    Object.values(api).forEach((mock) => mock.mockReset());
    api.getDashboard.mockResolvedValue({ data: DASHBOARD_RESPONSE });
  });

  it('muestra impacto, eficacia, distribución y demanda con la respuesta del contrato', async () => {
    renderDashboard(['/dashboard?year=2026&line=desoledad']);

    expect(await screen.findByRole('list', { name: 'Indicadores principales de impacto' })).toBeInTheDocument();
    expect(api.getDashboard).toHaveBeenCalledWith(
      { year: 2026, line: 'desoledad' },
      { signal: expect.any(AbortSignal) },
    );
    expect(screen.getByText('2655 h')).toBeInTheDocument();
    expect(screen.queryByText('Datos ficticios para validación')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Impacto' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Eficacia' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Distribución' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Demanda' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Participación de la plantilla' }))
      .toHaveAttribute('aria-valuenow', '68');
    expect(screen.getByRole('img', { name: /Participación por departamento/ })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Tabla de participación por departamento' }))
      .toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Participación por organización/ })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Participación por línea/ })).toBeInTheDocument();

    const ranking = screen.getByRole('list', { name: 'Top 10 de actividades favoritas' });
    const rows = within(ranking).getAllByRole('listitem');
    expect(rows).toHaveLength(10);
    expect(within(rows[0]).getByText('Acompañamiento a mayores')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Mentoría para el empleo')).toBeInTheDocument();
  });

  it('aplica y limpia filtros en URL, consulta y descargas con los mismos valores', async () => {
    const user = userEvent.setup();
    api.exportParticipationsCsv.mockResolvedValue({ data: new Blob(['csv']) });
    renderDashboard();
    await screen.findByRole('list', { name: 'Indicadores principales de impacto' });

    await user.type(screen.getByRole('spinbutton', { name: 'Año' }), '2026');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Línea de acción' }), 'educar');
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/dashboard?year=2026&line=educar'));
    await waitFor(() => expect(api.getDashboard).toHaveBeenLastCalledWith(
      { year: 2026, line: 'educar' },
      { signal: expect.any(AbortSignal) },
    ));
    expect(screen.getByText('Año: 2026')).toBeInTheDocument();
    expect(screen.getByText('Línea: Educar para proteger')).toBeInTheDocument();

    const participationsCard = screen.getByRole('heading', { name: 'Participaciones' }).closest('article');
    await user.click(within(participationsCard).getByRole('button', { name: 'Descargar CSV' }));
    expect(api.exportParticipationsCsv).toHaveBeenCalledWith({ year: 2026, line: 'educar' });

    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/dashboard'));
    await waitFor(() => expect(api.getDashboard).toHaveBeenLastCalledWith(
      {},
      { signal: expect.any(AbortSignal) },
    ));
    expect(screen.getByText(/Filtros activos:/).parentElement).toHaveTextContent('ninguno');
  });

  it('restaura filtros y resultados al navegar atrás y adelante', async () => {
    const user = userEvent.setup();
    renderDashboard(['/dashboard?year=2025']);
    await screen.findByText('Año: 2025');

    await user.clear(screen.getByRole('spinbutton', { name: 'Año' }));
    await user.type(screen.getByRole('spinbutton', { name: 'Año' }), '2026');
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
    await screen.findByText('Año: 2026');

    await user.click(screen.getByRole('button', { name: 'Atrás en historial' }));
    await screen.findByText('Año: 2025');
    expect(api.getDashboard).toHaveBeenLastCalledWith(
      { year: 2025 },
      { signal: expect.any(AbortSignal) },
    );

    await user.click(screen.getByRole('button', { name: 'Adelante en historial' }));
    await screen.findByText('Año: 2026');
    expect(api.getDashboard).toHaveBeenLastCalledWith(
      { year: 2026 },
      { signal: expect.any(AbortSignal) },
    );
  });

  it('normaliza parámetros inválidos sin enviarlos al backend', async () => {
    renderDashboard(['/dashboard?year=1800&line=inventada']);

    await screen.findByRole('list', { name: 'Indicadores principales de impacto' });
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/dashboard'));
    expect(api.getDashboard).toHaveBeenCalledTimes(1);
    expect(api.getDashboard).toHaveBeenCalledWith({}, { signal: expect.any(AbortSignal) });
  });

  it('ignora una respuesta tardía después de cambiar los filtros', async () => {
    const user = userEvent.setup();
    let resolveInitialRequest;
    api.getDashboard
      .mockReturnValueOnce(new Promise((resolve) => {
        resolveInitialRequest = resolve;
      }))
      .mockResolvedValueOnce({
        data: makeDashboardResponse({ activeVolunteers: 999 }),
      });
    renderDashboard();

    await user.type(screen.getByRole('spinbutton', { name: 'Año' }), '2026');
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
    expect(await screen.findByText('999')).toBeInTheDocument();

    resolveInitialRequest({ data: makeDashboardResponse({ activeVolunteers: 111 }) });
    await waitFor(() => expect(screen.queryByText('111')).not.toBeInTheDocument());
    expect(screen.getByText('999')).toBeInTheDocument();
  });

  it('explica el vacío general y el vacío de cada serie', async () => {
    api.getDashboard.mockResolvedValueOnce({ data: {} });
    const { unmount } = renderDashboard();
    expect(await screen.findByRole('heading', { name: 'Todavía no hay datos de impacto' })).toBeInTheDocument();
    unmount();

    api.getDashboard.mockResolvedValueOnce({
      data: makeDashboardResponse({ participationByDepartment: [], favoriteRanking: [] }),
    });
    renderDashboard();
    expect(await screen.findByRole('heading', { name: 'Sin participación por departamento' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Todavía no hay un ranking' })).toBeInTheDocument();
  });

  it('trata 403 y permite recuperar un error temporal', async () => {
    api.getDashboard.mockRejectedValueOnce({ status: 403 });
    const { unmount } = renderDashboard();
    expect(await screen.findByRole('alert')).toHaveTextContent('No tienes permiso');
    unmount();

    api.getDashboard
      .mockRejectedValueOnce({ status: 500, message: 'Error temporal.' })
      .mockResolvedValueOnce({ data: DASHBOARD_RESPONSE });
    const user = userEvent.setup();
    renderDashboard();
    expect(await screen.findByRole('alert')).toHaveTextContent('Error temporal.');
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('list', { name: 'Indicadores principales de impacto' })).toBeInTheDocument();
  });
});
