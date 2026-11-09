import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import AppRouter from './AppRouter';

vi.mock('../../features/proposals/api/proposalsApi', () => ({
  createProposal: vi.fn(),
  getProposals: vi.fn(),
}));

function renderAt(route = '/') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AppRouter />
    </MemoryRouter>,
  );
}

describe('public routes', () => {
  it('no renderiza el formulario de propuesta', () => {
    renderAt('/');

    expect(screen.getByRole('heading', { name: /el cambio empieza/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/nombre de la organización/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/correo electrónico/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /enviar propuesta/i })).not.toBeInTheDocument();
  });

  it('el hero ofrece solo dos acciones: acceso y alta de organización', () => {
    renderAt('/');

    const hero = screen.getByRole('region', { name: /el cambio empieza/i });
    const heroLinks = within(hero).getAllByRole('link');

    expect(heroLinks).toHaveLength(2);
    expect(heroLinks[0]).toHaveAttribute('href', '/login');
    expect(heroLinks[1]).toHaveAttribute('href', '/register-organization');
    expect(heroLinks[1]).toHaveAccessibleName(/registra tu organización/i);
  });

  it('la propuesta de voluntariado vive en la tarjeta de iniciativas', async () => {
    const user = userEvent.setup();
    renderAt('/');

    const cta = screen.getByRole('link', { name: /quieres proponer un voluntariado/i });
    expect(cta).toHaveAttribute('href', '/new-proposal');

    await user.click(cta);

    expect(
      await screen.findByRole('heading', { name: /contadnos qué necesitáis/i }),
    ).toBeInTheDocument();
  });

  it('muestra el encabezado y el pie de página en la landing', () => {
    renderAt('/');

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /fundación verisure/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByText(/voluntariado@fundacionverisure\.org/i)).toBeInTheDocument();
  });

  it('muestra el encabezado y el pie de página en el formulario público', () => {
    renderAt('/new-proposal');

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /contadnos qué necesitáis/i })).toBeInTheDocument();
  });
});
