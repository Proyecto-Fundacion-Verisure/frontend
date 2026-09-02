import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import AppRouter from '../../routes/AppRouter';

vi.mock('../../api/proposalsApi', () => ({
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

describe('LandingPage', () => {
  it('no renderiza el formulario de propuesta', () => {
    renderAt('/');

    expect(screen.getByRole('heading', { name: /el cambio empieza/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/nombre de la organización/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/correo electrónico/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /enviar propuesta/i })).not.toBeInTheDocument();
  });

  it('el CTA del hero lleva a la sección de propuesta', () => {
    renderAt('/');

    expect(screen.getByRole('link', { name: /quieres proponer un voluntariado/i }))
      .toHaveAttribute('href', '/#propuesta');
  });

  it('el CTA "Enviar propuesta" navega a /new-proposal', async () => {
    const user = userEvent.setup();
    renderAt('/');

    const cta = screen.getByRole('link', { name: /enviar propuesta/i });
    expect(cta).toHaveAttribute('href', '/new-proposal');

    await user.click(cta);

    expect(await screen.findByRole('heading', { name: /contadnos qué necesitáis/i })).toBeInTheDocument();
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
