import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../api/apiError';
import { AuthContext } from './AuthContext';
import LoginForm from './LoginForm';

const login = vi.fn();

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthContext.Provider value={{ user: null, isAuthenticated: false, login }}>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/activities" element={<h1>Inicio empleado</h1>} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

async function submitCredentials(user) {
  await user.type(screen.getByLabelText('Correo electrónico'), 'ana.gil@verisure.es');
  await user.type(screen.getByLabelText('Contraseña'), 'Verisure2026!');
  await user.click(screen.getByRole('button', { name: /Entrar al portal/ }));
}

beforeEach(() => vi.clearAllMocks());

describe('LoginForm', () => {
  it('lleva al inicio del rol tras un acceso correcto', async () => {
    login.mockResolvedValue({ id: 2, name: 'Ana Gil', role: 'EMPLOYEE' });
    const user = userEvent.setup();
    renderLogin();

    await submitCredentials(user);

    expect(login).toHaveBeenCalledWith({
      email: 'ana.gil@verisure.es',
      password: 'Verisure2026!',
    });
    expect(await screen.findByRole('heading', { name: 'Inicio empleado' })).toBeInTheDocument();
  });

  it('muestra el error de unas credenciales incorrectas sin salir del formulario', async () => {
    login.mockRejectedValue(new ApiError({ message: 'Credenciales no válidas.', status: 401 }));
    const user = userEvent.setup();
    renderLogin();

    await submitCredentials(user);

    expect(await screen.findByRole('alert')).toHaveTextContent('Credenciales no válidas.');
    expect(screen.queryByRole('heading', { name: 'Inicio empleado' })).not.toBeInTheDocument();
  });

  it('traduce el código de una cuenta pendiente de aprobación', async () => {
    login.mockRejectedValue(new ApiError({
      message: 'ACCOUNT_PENDING_APPROVAL',
      status: 403,
      code: 'ACCOUNT_PENDING_APPROVAL',
    }));
    const user = userEvent.setup();
    renderLogin();

    await submitCredentials(user);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'La cuenta todavía está pendiente de aprobación.',
    );
    expect(screen.queryByRole('heading', { name: 'Inicio empleado' })).not.toBeInTheDocument();
  });
});
