import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext } from './context/AuthContext';
import LoginForm from './components/LoginForm';

// axe revisa el DOM que se pinta de verdad: roles, etiquetas asociadas, `aria`
// y estructura. `jsx-a11y` ya cubre el código estático; esto cubre el resultado.
function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthContext.Provider value={{ user: null, isAuthenticated: false, login: vi.fn() }}>
        <LoginForm />
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

describe('LoginForm · accesibilidad', () => {
  it('no tiene violaciones de axe en el estado inicial', async () => {
    const { container } = renderLogin();

    expect(await axe(container)).toHaveNoViolations();
  });

  it('sigue siendo accesible con los errores de validación visibles', async () => {
    const user = userEvent.setup();
    const { container, getByRole } = renderLogin();

    await user.click(getByRole('button', { name: /entrar al portal/i }));

    expect(await axe(container)).toHaveNoViolations();
  });
});
