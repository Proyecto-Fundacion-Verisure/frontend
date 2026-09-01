import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ActivityCard from './ActivityCard';

const baseActivity = {
  id: 1,
  title: 'Acompañamiento a mayores',
  description: 'Visitas semanales a personas mayores en soledad.',
  line: 'desoledad',
  mode: 'PRESENCIAL',
  capacity: 20,
  registeredCount: 8,
  organizationName: 'Fundación Solitaria',
  image: '/images/01.png',
  favoritedByMe: true,
};

describe('ActivityCard', () => {
  it('muestra título, badges, organización y plazas ocupadas', () => {
    render(<ActivityCard activity={baseActivity} />);

    expect(screen.getByRole('heading', { name: /acompañamiento a mayores/i })).toBeInTheDocument();
    expect(screen.getByText('Desoledad')).toBeInTheDocument();
    expect(screen.getByText('PRESENCIAL')).toBeInTheDocument();
    expect(screen.getByText('Fundación Solitaria')).toBeInTheDocument();
    expect(screen.getByText('8 de 20 plazas')).toBeInTheDocument();
    const progress = screen.getByRole('progressbar', { name: /plazas ocupadas/i });
    expect(progress).toHaveAttribute('aria-valuenow', '8');
    expect(progress).toHaveAttribute('aria-valuemax', '20');
  });

  it('muestra favoritedByMe sin favoriteCount', () => {
    render(<ActivityCard activity={baseActivity} />);
    const fav = screen.getByRole('button', { name: /quitar de favoritos/i });
    expect(fav).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByText(/favoriteCount/i)).not.toBeInTheDocument();
    // asegurar que no se muestra número de favoritos
    expect(screen.queryByText(/♥.*\d+/)).not.toBeInTheDocument();
  });

  it('muestra estado no favorito', () => {
    render(<ActivityCard activity={{ ...baseActivity, favoritedByMe: false }} />);
    expect(screen.getByRole('button', { name: /añadir a favoritos/i })).toHaveAttribute('aria-pressed', 'false');
  });
});
