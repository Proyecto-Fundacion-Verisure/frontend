import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LineChart from './LineChart';

const SERIES = [
  { year: 2024, receivedHours: 980 },
  { year: 2025, receivedHours: 1580 },
  { year: 2026, receivedHours: 2450 },
];

describe('LineChart', () => {
  it('pinta un punto por valor con su año y su cifra', () => {
    render(
      <LineChart
        data={SERIES}
        title="Evolución de horas"
        description="Horas por año"
        xKey="year"
        yKey="receivedHours"
      />,
    );

    expect(screen.getByRole('img', { name: /evolución de horas/i })).toBeInTheDocument();
    expect(screen.getByText('2024')).toBeInTheDocument();
    expect(screen.getByText('2026')).toBeInTheDocument();
    expect(screen.getByTestId('line-point-0')).toHaveAttribute('data-value', '980');
    expect(screen.getByTestId('line-point-2')).toHaveAttribute('data-value', '2450');
    expect(screen.getAllByTestId(/line-point-/)).toHaveLength(SERIES.length);
  });

  it('admite un único punto sin romper la escala', () => {
    render(
      <LineChart data={[{ year: 2026, receivedHours: 500 }]} xKey="year" yKey="receivedHours" />,
    );

    expect(screen.getByTestId('line-point-0')).toBeInTheDocument();
    expect(screen.queryByTestId('line-point-1')).not.toBeInTheDocument();
  });

  it('muestra un aviso accesible cuando no hay datos', () => {
    render(<LineChart data={[]} />);

    expect(screen.getByRole('status')).toHaveTextContent(/no hay datos/i);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
