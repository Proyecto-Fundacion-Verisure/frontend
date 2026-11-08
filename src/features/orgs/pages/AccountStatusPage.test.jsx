import { StrictMode } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AccountStatusPage, { AdminAccountStatusPage } from './AccountStatusPage';

const orgApi = vi.hoisted(() => ({
  approveOrganization: vi.fn(),
  getPendingOrganizations: vi.fn(),
  rejectOrganization: vi.fn(),
  resendOrganizationRegistrationEmail: vi.fn(),
}));

const authApi = vi.hoisted(() => ({ verifyEmail: vi.fn() }));

vi.mock('../api/orgApi', async (importOriginal) => ({
  ...await importOriginal(),
  ...orgApi,
}));

vi.mock('../../auth', async (importOriginal) => ({
  ...await importOriginal(),
  verifyEmail: authApi.verifyEmail,
}));

const ORGANIZATIONS = [
  {
    id: 7,
    organizationName: 'Cáritas Barcelona',
    cif: 'G12345678',
    contactName: 'Marta Ribas',
    email: 'marta@caritasbcn.ex',
    phone: '600000000',
    requestedAt: '2026-10-01T10:00:00',
    emailVerified: true,
  },
  {
    id: 8,
    organizationName: 'Aldeas Infantiles',
    cif: 'G87654321',
    contactName: 'Elena Vargas',
    email: 'elena@aldeasinfantiles.ex',
    phone: '600000001',
    requestedAt: '2026-10-02T10:00:00',
    emailVerified: false,
  },
];

function renderPage(route = '/account-status') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AccountStatusPage />
    </MemoryRouter>,
  );
}

function renderAdmin() {
  return render(
    <MemoryRouter>
      <AdminAccountStatusPage />
    </MemoryRouter>,
  );
}

function mockPendingPage({ content = ORGANIZATIONS, totalPages = 1, totalElements = content.length } = {}) {
  orgApi.getPendingOrganizations.mockResolvedValue({
    data: { content, totalPages, totalElements },
  });
}

beforeEach(() => {
  Object.values(orgApi).forEach((mock) => mock.mockReset());
  authApi.verifyEmail.mockReset();
});

describe('AccountStatusPage', () => {
  it('pide iniciar sesión cuando no hay parámetros', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Estado de la cuenta' })).toBeInTheDocument();
    expect(screen.getByText(/inicia sesión para consultar el estado de tu entidad/i)).toBeInTheDocument();
  });

  it('verifica el token y confirma el correo', async () => {
    authApi.verifyEmail.mockResolvedValue({});
    renderPage('/account-status?token=abc123');

    expect(screen.getByRole('status', { name: /verificando el correo/i })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Correo verificado' })).toBeInTheDocument();
    expect(authApi.verifyEmail).toHaveBeenCalledWith('abc123');
    expect(screen.getByRole('link', { name: /ir al inicio de sesión/i })).toHaveAttribute('href', '/login');
  });

  it('verifica una sola vez aunque el efecto se monte dos veces', async () => {
    authApi.verifyEmail.mockResolvedValue({});
    render(
      <StrictMode>
        <MemoryRouter initialEntries={['/account-status?token=abc123']}>
          <AccountStatusPage />
        </MemoryRouter>
      </StrictMode>,
    );

    expect(await screen.findByRole('heading', { name: 'Correo verificado' })).toBeInTheDocument();
    expect(authApi.verifyEmail).toHaveBeenCalledTimes(1);
  });

  it('explica un fallo de verificación sin ofrecer reenvío', async () => {
    authApi.verifyEmail.mockRejectedValue({ code: 'INVALID_TOKEN', message: 'El token no es válido.' });
    renderPage('/account-status?token=abc123');

    expect(await screen.findByRole('heading', { name: 'No hemos podido verificar el correo' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('El token no es válido.');
    expect(screen.queryByLabelText(/correo de la entidad/i)).not.toBeInTheDocument();
  });

  it('ofrece reenviar el enlace cuando el token ha caducado', async () => {
    authApi.verifyEmail.mockRejectedValue({ code: 'VERIFICATION_EXPIRED' });
    renderPage('/account-status?token=abc123');

    expect(await screen.findByRole('heading', { name: /este enlace ya se ha usado o ha caducado/i }))
      .toBeInTheDocument();
    expect(screen.getByLabelText(/correo de la entidad/i)).toBeInTheDocument();
  });

  it('explica que hay que verificar el correo y permite reenviar', () => {
    renderPage('/account-status?pending=verification');

    expect(screen.getByRole('heading', { name: 'Verifica tu correo electrónico' })).toBeInTheDocument();
    expect(screen.getByLabelText(/correo de la entidad/i)).toBeInTheDocument();
  });

  it('explica que la cuenta espera aprobación', () => {
    renderPage('/account-status?pending=approval');

    expect(screen.getByRole('heading', { name: 'Cuenta pendiente de aprobación' })).toBeInTheDocument();
    expect(screen.queryByLabelText(/correo de la entidad/i)).not.toBeInTheDocument();
  });
});

describe('ResendVerificationForm', () => {
  function renderWithResend() {
    return renderPage('/account-status?pending=verification');
  }

  it('exige un correo antes de reenviar', async () => {
    const user = userEvent.setup();
    renderWithResend();

    await user.click(screen.getByRole('button', { name: /reenviar enlace/i }));

    expect(screen.getByText('Indica el correo con el que se registró la entidad.')).toBeInTheDocument();
    expect(orgApi.resendOrganizationRegistrationEmail).not.toHaveBeenCalled();
  });

  it('reenvía el enlace y lo confirma sin revelar si la cuenta existe', async () => {
    orgApi.resendOrganizationRegistrationEmail.mockResolvedValue({});
    const user = userEvent.setup();
    renderWithResend();

    await user.type(screen.getByLabelText(/correo de la entidad/i), '  marta@caritasbcn.ex  ');
    await user.click(screen.getByRole('button', { name: /reenviar enlace/i }));

    await waitFor(() => expect(orgApi.resendOrganizationRegistrationEmail)
      .toHaveBeenCalledWith('marta@caritasbcn.ex'));
    expect(await screen.findByRole('status')).toHaveTextContent(/te hemos enviado un enlace nuevo/i);
  });

  it('avisa cuando el reenvío falla', async () => {
    orgApi.resendOrganizationRegistrationEmail.mockRejectedValue(new Error('Fallo'));
    const user = userEvent.setup();
    renderWithResend();

    await user.type(screen.getByLabelText(/correo de la entidad/i), 'marta@caritasbcn.ex');
    await user.click(screen.getByRole('button', { name: /reenviar enlace/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/no hemos podido reenviar el enlace/i);
  });

  it('muestra el estado de carga mientras reenvía', async () => {
    let resolveRequest;
    orgApi.resendOrganizationRegistrationEmail.mockReturnValue(
      new Promise((resolve) => { resolveRequest = resolve; }),
    );
    const user = userEvent.setup();
    renderWithResend();

    await user.type(screen.getByLabelText(/correo de la entidad/i), 'marta@caritasbcn.ex');
    await user.click(screen.getByRole('button', { name: /reenviar enlace/i }));

    expect(screen.getByRole('button', { name: /reenviando/i })).toBeDisabled();
    resolveRequest({});
    expect(await screen.findByRole('status')).toHaveTextContent(/enlace nuevo/i);
  });
});

describe('AdminAccountStatusPage', () => {
  it('muestra el estado de carga', () => {
    orgApi.getPendingOrganizations.mockReturnValue(new Promise(() => {}));
    renderAdmin();

    expect(screen.getByRole('status', { name: /cargando entidades pendientes/i })).toBeInTheDocument();
    expect(orgApi.getPendingOrganizations).toHaveBeenCalledWith({ status: 'PENDING', page: 0 });
  });

  it('lista las cuentas pendientes con su verificación de correo', async () => {
    mockPendingPage();
    renderAdmin();

    expect(await screen.findByText('Cáritas Barcelona')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Cuentas por aprobar' })).toBeInTheDocument();
    expect(screen.getByText('CIF G12345678')).toBeInTheDocument();
    expect(screen.getByText('Verificado')).toBeInTheDocument();
    expect(screen.getByText('Sin verificar')).toBeInTheDocument();
    expect(screen.getByText('2 cuentas por aprobar')).toBeInTheDocument();
  });

  it('avisa cuando no hay cuentas pendientes', async () => {
    mockPendingPage({ content: [] });
    renderAdmin();

    expect(await screen.findByRole('heading', { name: 'No hay cuentas pendientes' })).toBeInTheDocument();
  });

  it('muestra el error de carga', async () => {
    orgApi.getPendingOrganizations.mockRejectedValue(new Error('Fallo'));
    renderAdmin();

    expect(await screen.findByRole('heading', { name: 'Error' })).toBeInTheDocument();
    expect(screen.getByText('No se pudieron cargar las entidades pendientes.')).toBeInTheDocument();
  });

  it('acepta una entidad tras confirmar en el modal', async () => {
    orgApi.approveOrganization.mockResolvedValue({});
    mockPendingPage();
    const user = userEvent.setup();
    renderAdmin();

    const row = (await screen.findByText('Cáritas Barcelona')).closest('tr');
    await user.click(within(row).getByRole('button', { name: 'Aceptar' }));

    expect(screen.getByRole('dialog', { name: 'Aceptar entidad' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Confirmar aceptación' }));

    await waitFor(() => expect(orgApi.approveOrganization).toHaveBeenCalledWith(7));
    expect(orgApi.rejectOrganization).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByText('Cáritas Barcelona')).not.toBeInTheDocument());
  });

  it('rechaza una entidad tras confirmar en el modal', async () => {
    orgApi.rejectOrganization.mockResolvedValue({});
    mockPendingPage();
    const user = userEvent.setup();
    renderAdmin();

    const row = (await screen.findByText('Aldeas Infantiles')).closest('tr');
    await user.click(within(row).getByRole('button', { name: 'Rechazar' }));

    expect(screen.getByRole('dialog', { name: 'Rechazar entidad' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Confirmar rechazo' }));

    await waitFor(() => expect(orgApi.rejectOrganization).toHaveBeenCalledWith(8));
    expect(orgApi.approveOrganization).not.toHaveBeenCalled();
  });

  it('no procesa nada si se cierra el modal', async () => {
    mockPendingPage();
    const user = userEvent.setup();
    renderAdmin();

    const row = (await screen.findByText('Cáritas Barcelona')).closest('tr');
    await user.click(within(row).getByRole('button', { name: 'Aceptar' }));
    await user.click(screen.getByRole('button', { name: 'Volver' }));

    expect(orgApi.approveOrganization).not.toHaveBeenCalled();
  });

  it('avisa cuando la acción falla', async () => {
    orgApi.approveOrganization.mockRejectedValue(new Error('Fallo'));
    mockPendingPage();
    const user = userEvent.setup();
    renderAdmin();

    const row = (await screen.findByText('Cáritas Barcelona')).closest('tr');
    await user.click(within(row).getByRole('button', { name: 'Aceptar' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar aceptación' }));

    expect(await screen.findByText('Ha ocurrido un error al procesar la solicitud.')).toBeInTheDocument();
  });

  it('pagina las cuentas pendientes', async () => {
    mockPendingPage({ totalPages: 3 });
    const user = userEvent.setup();
    renderAdmin();

    await screen.findByText('Cáritas Barcelona');
    expect(screen.getByText('Página 1 de 3')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /siguiente/i }));

    await waitFor(() => expect(orgApi.getPendingOrganizations)
      .toHaveBeenLastCalledWith({ status: 'PENDING', page: 1 }));
  });
});
