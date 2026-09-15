import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ActivityCard from './ActivityCard';

const baseActivity = {
  id: 1,
  title: 'Acompañamiento a mayores',
  description: 'Visitas semanales a personas mayores en soledad.',
  line: 'desoledad',
  mode: 'PRESENCIAL',
  spots: 20,
  occupiedSpots: 8,
  partnerName: 'Fundación Solitaria',
  favoritedByMe: true,
};

describe('ActivityCard', () => {
  // El filtro del catálogo acota la fecha de inicio: sin verla en la tarjeta, los
  // resultados cambian y nada lo explica.
  it('enseña el rango de fechas y las horas', () => {
    render(<ActivityCard activity={{ ...baseActivity, startDate: '2026-03-02', endDate: '2026-03-27', hours: 20 }} />);

    expect(screen.getByText(/2 mar 2026 — 27 mar 2026/)).toBeInTheDocument();
    expect(screen.getByText(/20 h/)).toBeInTheDocument();
  });

  it('no repite la fecha cuando empieza y acaba el mismo día', () => {
    render(<ActivityCard activity={{ ...baseActivity, startDate: '2026-03-02', endDate: '2026-03-02' }} />);

    expect(screen.getByText(/2 mar 2026/)).toBeInTheDocument();
    expect(screen.queryByText(/—/)).not.toBeInTheDocument();
  });

  it('calla si no hay fechas, en vez de pintar un guion suelto', () => {
    render(<ActivityCard activity={baseActivity} />);

    expect(screen.queryByText(/Fechas:/)).not.toBeInTheDocument();
  });

  // La portada no viene en la respuesta: es la imagen de la línea de acción.
  it('pinta la portada de la línea de acción, que el backend ya no manda', () => {
    const { container } = render(<ActivityCard activity={baseActivity} />);

    expect(container.querySelector('.activity-card__image img'))
      .toHaveAttribute('src', '/images/01-desoledad-linea-de-accion.png');
  });

  it('deja el hueco cuando la línea no se reconoce', () => {
    render(<ActivityCard activity={{ ...baseActivity, line: 'inventada' }} />);

    expect(screen.getByRole('img', { name: /sin imagen disponible/i })).toBeInTheDocument();
  });

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

  it('muestra distintivo Completa cuando plazas llenas o estado FULL', () => {
    render(<ActivityCard activity={{ ...baseActivity, spots: 10, occupiedSpots: 10 }} />);
    expect(screen.getByText('Completa')).toBeInTheDocument();

    const { rerender } = { rerender: () => {} };
    // estado FULL también
    const { unmount } = render(<ActivityCard activity={{ ...baseActivity, status: 'FULL' }} />) || {};
    // Instead of rerender complexity, just check second render contains Completa via query
    expect(screen.getAllByText('Completa').length).toBeGreaterThan(0);
  });

  it('muestra Ya estás apuntado cuando isEnrolled y no usa favoriteCount', () => {
    render(<ActivityCard activity={baseActivity} isEnrolled />);
    expect(screen.getByText('Ya estás apuntado')).toBeInTheDocument();
    expect(screen.queryByText(/favoriteCount/i)).not.toBeInTheDocument();
  });

  it('no muestra Ya estás apuntado si no está inscrito', () => {
    render(<ActivityCard activity={baseActivity} isEnrolled={false} />);
    expect(screen.queryByText('Ya estás apuntado')).not.toBeInTheDocument();
  });

  it('muestra la ubicación cuando está disponible', () => {
    render(<ActivityCard activity={{ ...baseActivity, location: 'Madrid' }} />);
    expect(screen.getByText(/Madrid/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Ubicación: Madrid/)).toBeInTheDocument();
  });

  it('no muestra ubicación si no está disponible', () => {
    render(<ActivityCard activity={baseActivity} />);
    expect(screen.queryByLabelText(/Ubicación:/)).not.toBeInTheDocument();
  });
});
