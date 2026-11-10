import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import PublicFooter from './PublicFooter';

function renderFooter() {
  return render(
    <MemoryRouter>
      <PublicFooter />
    </MemoryRouter>,
  );
}

describe('PublicFooter', () => {
  it('explica que es un proyecto académico con datos ficticios', () => {
    renderFooter();

    expect(
      screen.getByText(/proyecto académico desarrollado con la fundación verisure/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/los datos son ficticios/i)).toBeInTheDocument();
    expect(screen.queryByText(/responsable del tratamiento/i)).not.toBeInTheDocument();
  });

  it('muestra los enlaces legales y el contacto', () => {
    renderFooter();
    expect(screen.getByText('FUNDACIÓN VERISURE')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /política de privacidad/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /aviso legal/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /política de cookies/i })).toBeInTheDocument();
  });

  it('muestra el correo de contacto', () => {
    renderFooter();
    const mail = screen.getByRole('link', { name: /voluntariado@fundacionverisure\.org/i });
    expect(mail).toHaveAttribute('href', 'mailto:voluntariado@fundacionverisure.org');
  });
});
