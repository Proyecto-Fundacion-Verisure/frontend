import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProposal } from '../../api/proposalsApi';
import ProposalForm from './ProposalForm';

vi.mock('../../api/proposalsApi', () => ({
  createProposal: vi.fn(),
}));

function renderForm() {
  return render(
    <MemoryRouter>
      <ProposalForm />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  createProposal.mockReset();
});

describe('ProposalForm', () => {
  it('exige el consentimiento y lo muestra desmarcado al inicio', async () => {
    const user = userEvent.setup();
    renderForm();
    const consent = screen.getByRole('checkbox', { name: /he leído y acepto/i });

    expect(consent).not.toBeChecked();
    expect(consent).toBeRequired();

    await user.click(screen.getByRole('button', { name: /enviar propuesta/i }));

    expect(screen.getByText('Debes aceptar la política de privacidad.')).toBeInTheDocument();
    expect(consent).toHaveAttribute('aria-invalid', 'true');
    expect(createProposal).not.toHaveBeenCalled();

    await user.click(consent);
    expect(screen.queryByText('Debes aceptar la política de privacidad.')).not.toBeInTheDocument();
  });
});
