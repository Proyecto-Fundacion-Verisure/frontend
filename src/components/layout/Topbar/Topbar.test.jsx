import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext } from '../../../features/auth/AuthContext';
import Topbar from './Topbar';

function renderTopbar(value) {
  return render(
    <AuthContext.Provider value={value}>
      <Topbar><span>Fundación Verisure</span></Topbar>
    </AuthContext.Provider>,
  );
}

describe('Topbar', () => {
  it('muestra el usuario y ejecuta la salida desde el menú', async () => {
    const logout = vi.fn();
    const user = userEvent.setup();
    renderTopbar({ user: { name: 'Fabiana' }, logout });

    expect(screen.getByText('Fabiana')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('no muestra acciones de sesión cuando no hay usuario', () => {
    renderTopbar({ user: null, logout: vi.fn() });
    expect(screen.queryByRole('button', { name: 'Cerrar sesión' })).not.toBeInTheDocument();
  });

  it('muestra el nombre de la organización para el rol PARTNER', () => {
    renderTopbar({
      user: { name: 'María García', role: 'PARTNER', organization: 'Fundación Social' },
      logout: vi.fn(),
    });

    expect(screen.getByText('Fundación Social')).toBeInTheDocument();
    expect(screen.queryByText('María García')).not.toBeInTheDocument();
  });

  it('muestra el nombre de persona para roles que no son PARTNER', () => {
    renderTopbar({
      user: { name: 'Elena', role: 'EMPLOYEE' },
      logout: vi.fn(),
    });

    expect(screen.getByText('Elena')).toBeInTheDocument();
  });
});
