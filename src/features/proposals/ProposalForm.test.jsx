import { render, screen, waitFor } from '@testing-library/react';
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

async function fillValidForm(user) {
  await user.type(screen.getByLabelText(/nombre de la organización/i), 'Fundación Prueba');
  await user.type(screen.getByLabelText(/^cif/i), 'G12345678');
  await user.type(screen.getByLabelText(/persona de contacto/i), 'Ana Pérez');
  await user.type(screen.getByLabelText(/correo electrónico/i), 'ana@fundacion.org');
  await user.type(screen.getByLabelText(/teléfono/i), '600000000');
  await user.type(screen.getByLabelText(/descripción de la necesidad/i), 'Necesitamos apoyo voluntario.');
  await user.click(screen.getByRole('checkbox', { name: /he leído y acepto/i }));
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
    expect(screen.queryByText('Ya existe una propuesta con este correo.')).not.toBeInTheDocument();
    expect(screen.getByText('Introduce un correo válido.')).toBeInTheDocument();
  });

  it('muestra un error general cuando el servidor no identifica un campo', async () => {
    const user = userEvent.setup();
    createProposal.mockRejectedValue(new Error('Fallo de red'));
    renderForm();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /enviar propuesta/i }));

    expect(await screen.findByText(/no hemos podido enviar/i)).toBeInTheDocument();
  });

  it('valida campos obligatorios y formato de correo antes de enviar', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: /enviar propuesta/i }));

    expect(screen.getByText('Indica el nombre de la organización.')).toBeInTheDocument();
    expect(screen.getByText('Introduce un CIF válido.')).toBeInTheDocument();
    expect(screen.getByText('Indica una persona de contacto.')).toBeInTheDocument();
    expect(screen.getByText('Introduce un correo válido.')).toBeInTheDocument();
    expect(screen.getByText('Indica un teléfono de contacto.')).toBeInTheDocument();
    expect(screen.getByText('Describe la necesidad de la organización.')).toBeInTheDocument();
    expect(createProposal).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText(/correo electrónico/i), 'correo-invalido');
    await user.click(screen.getByRole('button', { name: /enviar propuesta/i }));

    expect(screen.getByText('Introduce un correo válido.')).toBeInTheDocument();
    expect(screen.getByLabelText(/correo electrónico/i)).toHaveAttribute('aria-invalid', 'true');
  });

  it('confirma el envío con 201 y permite enviar otra propuesta', async () => {
    const user = userEvent.setup();
    createProposal.mockResolvedValue({ data: { id: 1, status: 'NEW' } });
    renderForm();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /enviar propuesta/i }));

    expect(await screen.findByText(/propuesta recibida/i)).toBeInTheDocument();
    const heading = screen.getByRole('heading', { name: /gracias por contarnos qué necesitáis/i });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveAttribute('id', 'proposal-success-title');
    expect(screen.getByText(/hemos recibido vuestra propuesta/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/nombre de la organización/i)).not.toBeInTheDocument();
    await waitFor(() => expect(heading).toHaveFocus());
    const successRegion = screen.getByText(/propuesta recibida/i).closest('section');
    expect(successRegion).toHaveAttribute('aria-labelledby', 'proposal-success-title');

    await user.click(screen.getByRole('button', { name: /enviar otra propuesta/i }));

    expect(screen.getByLabelText(/nombre de la organización/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nombre de la organización/i)).toHaveValue('');
    expect(screen.getByLabelText(/^cif/i)).toHaveValue('');
    expect(screen.getByRole('checkbox', { name: /he leído y acepto/i })).not.toBeChecked();
    expect(screen.getByRole('button', { name: /enviar propuesta/i })).toBeInTheDocument();
  });

  it('muestra error general con 429 límite de solicitudes', async () => {
    const user = userEvent.setup();
    createProposal.mockRejectedValue({ message: 'Demasiadas solicitudes', status: 429 });
    renderForm();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /enviar propuesta/i }));

    expect(await screen.findByText(/no hemos podido enviar/i)).toBeInTheDocument();
  });

  it('muestra error general con 500 error de servidor', async () => {
    const user = userEvent.setup();
    createProposal.mockRejectedValue({ message: 'Error del servidor', status: 500 });
    renderForm();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /enviar propuesta/i }));

    expect(await screen.findByText(/no hemos podido enviar/i)).toBeInTheDocument();
  });

  it('bloquea el doble envío y muestra estado de carga', async () => {
    const user = userEvent.setup();
    let resolve;
    createProposal.mockReturnValue(new Promise((r) => { resolve = r; }));
    renderForm();

    await fillValidForm(user);

    const submit = screen.getByRole('button', { name: /enviar propuesta/i });
    await user.click(submit);

    expect(createProposal).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /enviando/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /enviando/i })).toHaveAttribute('aria-busy', 'true');

    // segundo clic no debe disparar otra petición porque el botón está deshabilitado
    await user.click(screen.getByRole('button', { name: /enviando/i }));
    expect(createProposal).toHaveBeenCalledTimes(1);

    resolve({ data: { id: 2, status: 'NEW' } });
    await waitFor(() => expect(screen.getByText(/propuesta recibida/i)).toBeInTheDocument());
  });

  it('tiene nombres accesibles y se puede operar con teclado', async () => {
    const user = userEvent.setup();
    renderForm();

    // todos los campos tienen label accesible
    expect(screen.getByLabelText(/nombre de la organización/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^cif/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/persona de contacto/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/descripción de la necesidad/i)).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /he leído y acepto/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar propuesta/i })).toBeInTheDocument();

    // navegación por teclado: Tab mueve el foco de forma secuencial
    await user.tab();
    expect(document.activeElement).not.toBe(document.body);

    // foco visible en el botón de envío
    const submit = screen.getByRole('button', { name: /enviar propuesta/i });
    submit.focus();
    expect(submit).toHaveFocus();

    // cada campo puede recibir foco por teclado
    const orgInput = screen.getByLabelText(/nombre de la organización/i);
    orgInput.focus();
    expect(orgInput).toHaveFocus();

    // marcar consentimiento con teclado (Space)
    const consent = screen.getByRole('checkbox', { name: /he leído y acepto/i });
    consent.focus();
    await user.keyboard(' ');
    expect(consent).toBeChecked();
  });

  it('valida por campo al perder el foco y limpia al corregir', async () => {
    const user = userEvent.setup();
    renderForm();

    const orgInput = screen.getByLabelText(/nombre de la organización/i);
    expect(screen.queryByText('Indica el nombre de la organización.')).not.toBeInTheDocument();

    orgInput.focus();
    await user.tab();
    expect(screen.getByText('Indica el nombre de la organización.')).toBeInTheDocument();
    expect(orgInput).toHaveAttribute('aria-invalid', 'true');

    await user.type(orgInput, 'Fundación Prueba');
    expect(screen.queryByText('Indica el nombre de la organización.')).not.toBeInTheDocument();
    expect(orgInput).toHaveAttribute('aria-invalid', 'false');

    const emailInput = screen.getByLabelText(/correo electrónico/i);
    await user.type(emailInput, 'mal');
    await user.tab();
    expect(screen.getByText('Introduce un correo válido.')).toBeInTheDocument();
    await user.clear(emailInput);
    await user.type(emailInput, 'ok@fundacion.org');
    expect(screen.queryByText('Introduce un correo válido.')).not.toBeInTheDocument();
  });

  it('valida el consentimiento por campo al perder el foco', async () => {
    const user = userEvent.setup();
    renderForm();

    const consent = screen.getByRole('checkbox', { name: /he leído y acepto/i });
    expect(screen.queryByText('Debes aceptar la política de privacidad.')).not.toBeInTheDocument();

    consent.focus();
    await user.tab();
    expect(screen.getByText('Debes aceptar la política de privacidad.')).toBeInTheDocument();

    await user.click(consent);
    expect(screen.queryByText('Debes aceptar la política de privacidad.')).not.toBeInTheDocument();
  });
});
