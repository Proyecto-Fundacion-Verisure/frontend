import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import PublicHeader from './PublicHeader';

function renderHeader() {
  return render(
    <MemoryRouter>
      <PublicHeader />
    </MemoryRouter>,
  );
}

describe('PublicHeader', () => {
  it('muestra la marca con enlace a la portada', () => {
    renderHeader();
    const brand = screen.getByRole('link', { name: /fundación verisure/i });
    expect(brand).toHaveAttribute('href', '/');
    expect(screen.getByAltText(/fundación verisure/i)).toBeInTheDocument();
  });

  it('muestra el acceso a iniciar sesión', () => {
    renderHeader();
    const login = screen.getByRole('link', { name: /iniciar sesión/i });
    expect(login).toHaveAttribute('href', '/login');
  });
});
