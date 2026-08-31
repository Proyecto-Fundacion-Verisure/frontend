import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { acceptProposal } from '../../api/proposalsApi';
import AcceptProposalButton from './AcceptProposalButton';

vi.mock('../../api/proposalsApi', () => ({
  acceptProposal: vi.fn(),
}));

function DraftPage() {
  const { activityId } = useParams();
  return <h1>Actividad en borrador {activityId}</h1>;
}

function renderAction(props = {}) {
  return render(
    <MemoryRouter initialEntries={['/proposals/9']}>
      <Routes>
        <Route
          path="/proposals/:proposalId"
          element={<AcceptProposalButton proposalId={9} {...props} />}
        />
        <Route path="/activities/:activityId/edit" element={<DraftPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  acceptProposal.mockReset();
});

describe('AcceptProposalButton', () => {
  it('acepta una sola vez y abre el borrador persistido devuelto en 201', async () => {
    const user = userEvent.setup();
    const onAccepted = vi.fn();
    let resolveRequest;
    acceptProposal.mockReturnValue(new Promise((resolve) => {
      resolveRequest = resolve;
    }));
    renderAction({ onAccepted });

    const button = screen.getByRole('button', { name: 'Aceptar propuesta' });
    await user.click(button);

    expect(button).toBeDisabled();
    expect(acceptProposal).toHaveBeenCalledTimes(1);
    expect(acceptProposal).toHaveBeenCalledWith(9);

    await user.click(button);
    expect(acceptProposal).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveRequest({ data: { id: 42, status: 'DRAFT' }, status: 201 });
    });

    expect(onAccepted).toHaveBeenCalledWith({ id: 42, status: 'DRAFT' });
    expect(
      screen.getByRole('heading', { name: 'Actividad en borrador 42' }),
    ).toBeInTheDocument();
  });

  it('explica el conflicto 409 y no intenta abrir un borrador', async () => {
    const user = userEvent.setup();
    acceptProposal.mockRejectedValue({
      status: 409,
      code: 'PROPOSAL_ALREADY_DECIDED',
    });
    renderAction();

    await user.click(screen.getByRole('button', { name: 'Aceptar propuesta' }));

    expect(
      await screen.findByText(/ya ha sido aceptada o rechazada/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aceptar propuesta' })).toBeDisabled();
    expect(acceptProposal).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/actividad en borrador/i)).not.toBeInTheDocument();
  });

  it('permite reintentar después de un error inesperado', async () => {
    const user = userEvent.setup();
    acceptProposal.mockRejectedValue(new Error('Network error'));
    renderAction();

    const button = screen.getByRole('button', { name: 'Aceptar propuesta' });
    await user.click(button);

    expect(await screen.findByText(/no hemos podido aceptar/i)).toBeInTheDocument();
    expect(button).toBeEnabled();

    await user.click(button);
    expect(acceptProposal).toHaveBeenCalledTimes(2);
  });
});
