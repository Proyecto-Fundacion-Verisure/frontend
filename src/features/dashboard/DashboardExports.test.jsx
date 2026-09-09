import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardExports from './DashboardExports';
import { downloadBlob } from './downloadFile';

const api = vi.hoisted(() => ({
  exportDashboardPdf: vi.fn(),
  exportPartnersCsv: vi.fn(),
  exportParticipationsCsv: vi.fn(),
}));

vi.mock('../../api/dashboardApi', () => api);
vi.mock('./downloadFile', () => ({ downloadBlob: vi.fn() }));

const findCard = (title) => screen.getByRole('heading', { name: title }).closest('article');

describe('DashboardExports', () => {
  beforeEach(() => {
    Object.values(api).forEach((mock) => mock.mockReset());
    downloadBlob.mockReset();
  });

  it('coloca la explicación de los filtros debajo del título', () => {
    render(<DashboardExports filters={{}} />);

    const title = screen.getByRole('heading', { name: 'Descargar resultados' });
    expect(title.nextElementSibling).toHaveTextContent(
      'Cada archivo utiliza exactamente los filtros activos del dashboard.',
    );
  });

  it('descarga ambos CSV y el PDF con los mismos filtros', async () => {
    const user = userEvent.setup();
    const filters = { year: 2026, line: 'desoledad' };
    api.exportParticipationsCsv.mockResolvedValue({ data: new Blob(['participaciones']) });
    api.exportPartnersCsv.mockResolvedValue({ data: new Blob(['entidades']) });
    api.exportDashboardPdf.mockResolvedValue({ data: new Blob(['pdf']) });
    render(<DashboardExports filters={filters} />);

    await user.click(within(findCard('Participaciones')).getByRole('button'));
    await user.click(within(findCard('Entidades colaboradoras')).getByRole('button'));
    await user.click(within(findCard('Informe visual')).getByRole('button'));

    expect(api.exportParticipationsCsv).toHaveBeenCalledWith(filters);
    expect(api.exportPartnersCsv).toHaveBeenCalledWith(filters);
    expect(api.exportDashboardPdf).toHaveBeenCalledWith(filters);
    expect(downloadBlob).toHaveBeenNthCalledWith(1, expect.any(Blob), 'participations.csv');
    expect(downloadBlob).toHaveBeenNthCalledWith(2, expect.any(Blob), 'partners.csv');
    expect(downloadBlob).toHaveBeenNthCalledWith(3, expect.any(Blob), 'report.pdf');
  });

  it('bloquea solo el archivo en curso y anuncia su progreso', async () => {
    const user = userEvent.setup();
    let resolveRequest;
    api.exportParticipationsCsv.mockReturnValue(new Promise((resolve) => {
      resolveRequest = resolve;
    }));
    render(<DashboardExports filters={{ year: 2026 }} />);

    await user.click(within(findCard('Participaciones')).getByRole('button'));

    expect(within(findCard('Participaciones')).getByRole('button')).toBeDisabled();
    expect(within(findCard('Participaciones')).getByRole('button')).toHaveTextContent('Descargando CSV');
    expect(within(findCard('Participaciones')).getByRole('status')).toHaveTextContent(
      'Descargando participations.csv',
    );
    expect(within(findCard('Entidades colaboradoras')).getByRole('button')).toBeEnabled();

    resolveRequest({ data: new Blob(['ok']) });
    await waitFor(() => expect(screen.getByText(/participations.csv se ha descargado/)).toBeInTheDocument());
  });

  it('mantiene los CSV disponibles si el PDF falla y permite reintentar', async () => {
    const user = userEvent.setup();
    api.exportDashboardPdf
      .mockRejectedValueOnce({ status: 500 })
      .mockResolvedValueOnce({ data: new Blob(['pdf']) });
    render(<DashboardExports filters={{}} />);

    const pdfCard = findCard('Informe visual');
    await user.click(within(pdfCard).getByRole('button'));

    expect(within(pdfCard).getByRole('alert')).toHaveTextContent('Puedes volver a intentarlo');
    expect(within(pdfCard).getByRole('button', { name: 'Reintentar descarga' })).toBeEnabled();
    expect(within(findCard('Participaciones')).getByRole('button')).toBeEnabled();

    await user.click(within(pdfCard).getByRole('button', { name: 'Reintentar descarga' }));
    await waitFor(() => expect(within(pdfCard).getByRole('status')).toHaveTextContent('report.pdf se ha descargado'));
  });

  it('explica un 403 sin bloquear las demás exportaciones', async () => {
    const user = userEvent.setup();
    api.exportPartnersCsv.mockRejectedValue({ status: 403 });
    render(<DashboardExports filters={{ year: 2026 }} />);

    const partnersCard = findCard('Entidades colaboradoras');
    await user.click(within(partnersCard).getByRole('button'));

    expect(within(partnersCard).getByRole('alert')).toHaveTextContent(
      'No tienes permiso para descargar este archivo.',
    );
    expect(within(findCard('Participaciones')).getByRole('button')).toBeEnabled();
  });
});
