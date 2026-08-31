import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getProposals, rejectProposal } from '../../api/proposalsApi';
import ProposalsInboxPage from './ProposalsInboxPage';

vi.mock('../../api/proposalsApi', () => ({
  getProposals: vi.fn(),
  rejectProposal: vi.fn(),
}));

const NEW_PROPOSAL = {
  id: 1, organizationName: 'Fundación Solitaria', line: 'desoledad',
  description: 'Acompañamiento a personas mayores.', status: 'NEW',
  createdAt: '2026-08-20T10:00:00.000Z',
};

const ACCEPTED_PROPOSAL = {
  id: 2, organizationName: 'Educamos Juntos', line: 'educar',
  description: 'Talleres de refuerzo escolar.', status: 'ACCEPTED',
  createdAt: '2026-08-10T09:15:00.000Z',
};

const REJECTED_PROPOSAL = {
  id: 3, organizationName: 'Ayuda Directa', line: 'desoledad',
  description: 'Donación de alimentos.', status: 'REJECTED',
  createdAt: '2026-08-01T16:45:00.000Z',
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/proposals']}>
      <ProposalsInboxPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ProposalsInboxPage', () => {
  it('shows a loading spinner initially', () => {
    getProposals.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByRole('status', { name: /cargando/i })).toBeInTheDocument();
  });

  it('renders NEW proposals with reject action', async () => {
    getProposals.mockResolvedValue({
      data: [NEW_PROPOSAL],
      headers: { 'x-total-count': '1' },
    });
    renderPage();

    const row = await screen.findByText('Fundación Solitaria');
    const tr = row.closest('tr');
    expect(within(tr).getByText('Nueva')).toBeInTheDocument();
    expect(within(tr).getByText('Rechazar')).toBeInTheDocument();
  });

  it('renders ACCEPTED proposals with view activity link', async () => {
    getProposals.mockResolvedValue({
      data: [ACCEPTED_PROPOSAL],
      headers: { 'x-total-count': '1' },
    });
    renderPage();

    const row = await screen.findByText('Educamos Juntos');
    const tr = row.closest('tr');
    expect(within(tr).getByText('Aceptada')).toBeInTheDocument();
    expect(within(tr).getByText('Ver actividad')).toBeInTheDocument();
    expect(within(tr).queryByText('Rechazar')).not.toBeInTheDocument();
  });

  it('renders REJECTED proposals with no action', async () => {
    getProposals.mockResolvedValue({
      data: [REJECTED_PROPOSAL],
      headers: { 'x-total-count': '1' },
    });
    renderPage();

    const row = await screen.findByText('Ayuda Directa');
    const tr = row.closest('tr');
    expect(within(tr).getByText('Rechazada')).toBeInTheDocument();
    expect(within(tr).getByText('—')).toBeInTheDocument();
    expect(within(tr).queryByText('Rechazar')).not.toBeInTheDocument();
    expect(within(tr).queryByText('Ver actividad')).not.toBeInTheDocument();
  });

  it('shows empty state when there are no proposals', async () => {
    getProposals.mockResolvedValue({ data: [], headers: { 'x-total-count': '0' } });
    renderPage();

    expect(await screen.findByText('No hay propuestas')).toBeInTheDocument();
  });

  it('filters by status when selecting a filter', async () => {
    getProposals.mockResolvedValue({
      data: [NEW_PROPOSAL],
      headers: { 'x-total-count': '1' },
    });
    renderPage();
    await screen.findByText('Fundación Solitaria');

    getProposals.mockResolvedValue({
      data: [ACCEPTED_PROPOSAL],
      headers: { 'x-total-count': '1' },
    });

    const filter = screen.getByLabelText(/filtrar por estado/i);
    await userEvent.selectOptions(filter, 'ACCEPTED');

    expect(await screen.findByText('Educamos Juntos')).toBeInTheDocument();
    expect(getProposals).toHaveBeenCalledWith(expect.objectContaining({ status: 'ACCEPTED' }));
  });
});
