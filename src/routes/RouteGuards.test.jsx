import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AuthContext } from '../features/auth/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

function renderGuard({ user = null, roles = ['ADMIN'], initialEntry = '/private' } = {}) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthContext.Provider value={{ user, isAuthenticated: Boolean(user) }}>
        <Routes>
          <Route path="/login" element={<h1>Acceso</h1>} />
          <Route path="/account-status" element={<h1>Estado de cuenta</h1>} />
          <Route path="/dashboard" element={<h1>Inicio administrador</h1>} />
          <Route path="/activities" element={<h1>Inicio empleado</h1>} />
          <Route path="/org/activities" element={<h1>Inicio entidad</h1>} />
          <Route element={<ProtectedRoute />}>
            <Route element={<RoleRoute roles={roles} />}>
              <Route path="/private" element={<h1>Contenido privado</h1>} />
            </Route>
          </Route>
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

describe('guardas de rutas', () => {
  it('envía al acceso a una persona anónima', () => {
    renderGuard();
    expect(screen.getByRole('heading', { name: 'Acceso' })).toBeInTheDocument();
  });

  it('permite el rol autorizado', () => {
    renderGuard({ user: { role: 'ADMIN' } });
    expect(screen.getByRole('heading', { name: 'Contenido privado' })).toBeInTheDocument();
  });

  it('devuelve un rol no autorizado a su inicio', () => {
    renderGuard({ user: { role: 'EMPLOYEE' } });
    expect(screen.getByRole('heading', { name: 'Inicio empleado' })).toBeInTheDocument();
  });

  it('admite una entidad activa cuando la ruta acepta ORG', () => {
    renderGuard({ user: { role: 'ORG', status: 'ACTIVE' }, roles: ['ORG'] });
    expect(screen.getByRole('heading', { name: 'Contenido privado' })).toBeInTheDocument();
  });

  it('devuelve una entidad no activa a su inicio', () => {
    renderGuard({ user: { role: 'ORG', status: 'PENDING_APPROVAL' }, roles: ['ORG'] });
    expect(screen.getByRole('heading', { name: 'Inicio entidad' })).toBeInTheDocument();
  });
});
