import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import PublicLayout from './PublicLayout';

function renderLayout(content = <p>Contenido</p>) {
  return render(
    <MemoryRouter>
      <PublicLayout>{content}</PublicLayout>
    </MemoryRouter>,
  );
}

describe('PublicLayout', () => {
  it('renderiza encabezado, contenido y pie', () => {
    renderLayout();

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByText('Contenido')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});
