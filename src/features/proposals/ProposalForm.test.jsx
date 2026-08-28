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

  it('muestra los errores del servidor en el campo correspondiente', async () => {
    const user = userEvent.setup();
    createProposal.mockRejectedValue({
      fieldErrors: { email: 'Ya existe una propuesta con este correo.' },
    });
    renderForm();

    await user.type(screen.getByLabelText(/nombre de la organización/i), 'Fundación Prueba');
    await user.type(screen.getByLabelText(/^cif/i), 'G12345678');
    await user.type(screen.getByLabelText(/persona de contacto/i), 'Ana Pérez');
    await user.type(screen.getByLabelText(/correo electrónico/i), 'ana@fundacion.org');
    await user.type(screen.getByLabelText(/teléfono/i), '600000000');
    await user.type(screen.getByLabelText(/descripción de la necesidad/i), 'Necesitamos apoyo voluntario.');
    await user.click(screen.getByRole('checkbox', { name: /he leído y acepto/i }));
    await user.click(screen.getByRole('button', { name: /enviar propuesta/i }));

    const serverError = await screen.findByText('Ya existe una propuesta con este correo.');
    expect(serverError).toBeInTheDocument();
    expect(screen.getByLabelText(/correo electrónico/i)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByText(/no hemos podido enviar/i)).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText(/correo electrónico/i));
    expect(serverError).not.toBeInTheDocument();
  });

  it('muestra un error general cuando el servidor no identifica un campo', async () => {
    const user = userEvent.setup();
    createProposal.mockRejectedValue(new Error('Fallo de red'));
    renderForm();

    await user.type(screen.getByLabelText(/nombre de la organización/i), 'Fundación Prueba');
    await user.type(screen.getByLabelText(/^cif/i), 'G12345678');
    await user.type(screen.getByLabelText(/persona de contacto/i), 'Ana Pérez');
    await user.type(screen.getByLabelText(/correo electrónico/i), 'ana@fundacion.org');
    await user.type(screen.getByLabelText(/teléfono/i), '600000000');
    await user.type(screen.getByLabelText(/descripción de la necesidad/i), 'Necesitamos apoyo voluntario.');
    await user.click(screen.getByRole('checkbox', { name: /he leído y acepto/i }));
    await user.click(screen.getByRole('button', { name: /enviar propuesta/i }));

    expect(await screen.findByText(/no hemos podido enviar/i)).toBeInTheDocument();
  });
});
