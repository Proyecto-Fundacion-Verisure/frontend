import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getCertificate } from '../../api/closuresApi';
import CertificatePage from './CertificatePage';

vi.mock('../../api/closuresApi', () => ({
  getCertificate: vi.fn(),
}));

const CERTIFICATE = {
  closureId: 41,
  fullName: 'María García López',
  activityTitle: 'Acompañamiento a mayores',
  partnerName: 'Fundación Solitaria',
  line: 'desoledad',
  startDate: '2026-05-10T09:00:00Z',
  endDate: '2026-06-21T12:00:00Z',
  actualHours: 22,
  issuedAt: '2026-07-01T10:00:00Z',
  reference: 'CERT-2026-0418',
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/closures/41/certificate']}>
      <Routes>
        <Route path="/closures/:closureId/certificate" element={<CertificatePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  getCertificate.mockReset();
  vi.restoreAllMocks();
});

describe('CertificatePage', () => {
  it('renders the stable backend identity and actual hours', async () => {
    getCertificate.mockResolvedValue({ data: CERTIFICATE });
    renderPage();

    expect(screen.getByRole('status', { name: /cargando certificado/i })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: /certificado de voluntariado/i })).toBeInTheDocument();
    expect(getCertificate).toHaveBeenCalledWith('41');
    expect(screen.getByText('María García López')).toBeInTheDocument();
    expect(screen.getByText('Acompañamiento a mayores')).toBeInTheDocument();
    expect(screen.getByText('Fundación Solitaria')).toBeInTheDocument();
    expect(screen.getByText('Desoledad')).toBeInTheDocument();
    expect(screen.getByText('22')).toBeInTheDocument();
    expect(screen.getByText('CERT-2026-0418')).toBeInTheDocument();
  });

  it('opens the native print dialog only when a certificate is available', async () => {
    getCertificate.mockResolvedValue({ data: CERTIFICATE });
    const print = vi.spyOn(window, 'print').mockImplementation(() => {});
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: /imprimir o guardar como pdf/i }));

    expect(print).toHaveBeenCalledOnce();
  });

  it.each([
    [403, 'NOT_OWNER', 'No tienes permiso.', /no puedes consultar este certificado/i],
    [409, 'ACTIVITY_NOT_CLOSED', 'La actividad aún no está cerrada.', /todavía no está disponible/i],
  ])('explains certificate access error %s', async (status, code, message, heading) => {
    getCertificate.mockRejectedValue({ status, code, message });
    renderPage();

    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(message);
    expect(screen.queryByRole('button', { name: /imprimir/i })).not.toBeInTheDocument();
  });
});
