import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { acceptProposal, getProposal, rejectProposal } from '../../api/proposalsApi';
import ProposalDetailPage from './ProposalDetailPage';

vi.mock('../../api/proposalsApi', () => ({
  getProposal: vi.fn(),
  acceptProposal: vi.fn(),
  rejectProposal: vi.fn(),
}));

function DraftPage() {
  const { activityId } = useParams();
  return <h1>Actividad en borrador {activityId}</h1>;
}

function renderDetail(proposalId = '1') {
  return render(
    <MemoryRouter initialEntries={[`/proposals/${proposalId}`]}>
      <Routes>
        <Route path="/proposals/:proposalId" element={<ProposalDetailPage />} />
        <Route path="/proposals" element={<h1>Bandeja</h1>} />
        <Route path="/activities/:activityId/edit" element={<DraftPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

const baseProposal = {
  id: 1,
  partnerName: 'Fundación Solitaria',
  contactName: 'María García',
  email: 'maria@solitaria.org',
  phone: '600 111 222',
  suggestedLine: 'desoledad',
  description: 'Acompañamiento semanal a personas mayores.',
  estimatedVolunteers: 8,
  status: 'NEW',
  createdAt: '2026-08-20T10:00:00.000Z',
};

beforeEach(() => {
  getProposal.mockReset();
  acceptProposal.mockReset();
  rejectProposal.mockReset();
});

describe('ProposalDetailPage', () => {
  it('carga y muestra los datos de contacto y las acciones para NEW', async () => {
    getProposal.mockResolvedValue({ data: baseProposal });
    renderDetail('1');

    expect(await screen.findByRole('heading', { name: /fundación solitaria/i })).toBeInTheDocument();
    // Sin CIF: `ProposalDetailResponse` no lo lleva. Entran beneficiarios y consentimiento.
    expect(screen.queryByText('G12345678')).not.toBeInTheDocument();
    expect(screen.getByText('Personas beneficiarias')).toBeInTheDocument();
    expect(screen.getByText('María García')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'maria@solitaria.org' })).toHaveAttribute('href', 'mailto:maria@solitaria.org');
    expect(screen.getByRole('link', { name: '600 111 222' })).toHaveAttribute('href', 'tel:600 111 222');
    expect(screen.getByText('Acompañamiento semanal a personas mayores.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /aceptar propuesta/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /rechazar propuesta/i })).toBeInTheDocument();
    expect(getProposal).toHaveBeenCalledWith('1');
  });

  it('recarga conserva el detalle (GET por id sin location.state)', async () => {
    getProposal.mockResolvedValue({ data: baseProposal });
    const { unmount } = renderDetail('2');
    expect(await screen.findByRole('heading', { name: /fundación solitaria/i })).toBeInTheDocument();
    expect(getProposal).toHaveBeenCalledWith('2');
    unmount();
    getProposal.mockResolvedValue({ data: { ...baseProposal, id: 2, partnerName: 'Educamos Juntos' } });
    renderDetail('2');
    expect(await screen.findByRole('heading', { name: /educamos juntos/i })).toBeInTheDocument();
  });

  it('acepta y navega a la actividad en borrador con 201', async () => {
    const user = userEvent.setup();
    getProposal.mockResolvedValue({ data: baseProposal });
    acceptProposal.mockResolvedValue({ data: { id: 42, status: 'DRAFT' } });
    renderDetail('1');

    await screen.findByRole('heading', { name: /fundación solitaria/i });

    await user.click(screen.getByRole('button', { name: /aceptar propuesta/i }));

    expect(acceptProposal).toHaveBeenCalledWith(1);
    expect(await screen.findByRole('heading', { name: /actividad en borrador 42/i })).toBeInTheDocument();
  });

  it('rechaza sin motivo y actualiza el estado a REJECTED', async () => {
    const user = userEvent.setup();
    getProposal.mockResolvedValue({ data: baseProposal });
    rejectProposal.mockResolvedValue({ data: { id: 1, status: 'REJECTED' } });
    renderDetail('1');

    await screen.findByRole('heading', { name: /fundación solitaria/i });

    await user.click(screen.getByRole('button', { name: /rechazar propuesta/i }));

    expect(rejectProposal).toHaveBeenCalledWith('1');
    expect(await screen.findByText(/sin acciones disponibles/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /aceptar propuesta/i })).not.toBeInTheDocument();
  });

  it('gestiona 409 conflicto en aceptar y rechazar', async () => {
    const user = userEvent.setup();
    getProposal.mockResolvedValue({ data: baseProposal });
    acceptProposal.mockRejectedValue({ status: 409, code: 'PROPOSAL_ALREADY_DECIDED' });
    renderDetail('1');

    await screen.findByRole('heading', { name: /fundación solitaria/i });
    await user.click(screen.getByRole('button', { name: /aceptar propuesta/i }));

    expect(await screen.findByText(/ya ha sido aceptada o rechazada/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /aceptar propuesta/i })).toBeDisabled();
  });

  it('gestiona 409 conflicto al rechazar', async () => {
    const user = userEvent.setup();
    getProposal.mockResolvedValue({ data: baseProposal });
    rejectProposal.mockRejectedValue({ status: 409, code: 'PROPOSAL_ALREADY_DECIDED' });
    renderDetail('1');

    await screen.findByRole('heading', { name: /fundación solitaria/i });
    await user.click(screen.getByRole('button', { name: /rechazar propuesta/i }));

    expect(await screen.findByText(/ya ha sido aceptada o rechazada/i)).toBeInTheDocument();
  });

  it('para ACCEPTED ofrece Ver actividad y para REJECTED no muestra acciones', async () => {
    getProposal.mockResolvedValue({ data: { ...baseProposal, status: 'ACCEPTED' } });
    const { unmount } = renderDetail('3');
    expect(await screen.findByRole('link', { name: /ver actividad/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /aceptar propuesta/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /rechazar/i })).not.toBeInTheDocument();
    unmount();

    getProposal.mockResolvedValue({ data: { ...baseProposal, status: 'REJECTED' } });
    renderDetail('5');
    expect(await screen.findByText(/sin acciones disponibles/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /ver actividad/i })).not.toBeInTheDocument();
  });

  it('gestiona 404 no encontrado', async () => {
    getProposal.mockRejectedValue({ status: 404, message: 'No se ha encontrado el recurso solicitado.' });
    renderDetail('999');

    expect(await screen.findByText(/propuesta no encontrada/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /volver a la bandeja/i })).toHaveAttribute('href', '/proposals');
  });
});
