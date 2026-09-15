import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createOrganization } from '../../api/orgApi';
import OrgRegisterPage from './OrgRegisterPage';

vi.mock('../../api/orgApi', () => ({
  createOrganization: vi.fn(),
  resendOrganizationRegistrationEmail: vi.fn(),
}));

describe('OrgRegisterPage', () => {
  beforeEach(() => {
    createOrganization.mockReset();
    createOrganization.mockResolvedValue({ data: { id: 9 }, status: 201 });
  });

  it('envía el consentimiento exigido por el contrato del backend', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><OrgRegisterPage /></MemoryRouter>);

    await user.type(screen.getByLabelText(/nombre de la entidad/i), 'Fundación Ejemplo');
    await user.type(screen.getByLabelText(/^cif/i), 'G12345678');
    await user.type(screen.getByLabelText(/persona de contacto/i), 'María García');
    await user.type(screen.getByLabelText(/correo electrónico/i), 'maria@ejemplo.org');
    await user.type(screen.getByLabelText(/teléfono/i), '600123456');
    await user.type(screen.getByLabelText(/^contraseña/i), 'Segura123');
    await user.type(screen.getByLabelText(/repite la contraseña/i), 'Segura123');
    await user.click(screen.getByRole('checkbox', { name: /he leído y acepto/i }));
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }));

    await waitFor(() => expect(createOrganization).toHaveBeenCalledWith({
      name: 'Fundación Ejemplo',
      cif: 'G12345678',
      contactName: 'María García',
      email: 'maria@ejemplo.org',
      phone: '600123456',
      password: 'Segura123',
      consent: true,
    }));
    expect(await screen.findByRole('dialog', { name: /solicitud enviada/i })).toBeInTheDocument();
  });
});
