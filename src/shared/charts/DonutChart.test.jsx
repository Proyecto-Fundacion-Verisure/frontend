import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DonutChart from './DonutChart';

const DISTRIBUTION = [
  { id: 'desoledad', label: 'Desoledad', value: 820 },
  { id: 'educar', label: 'Educar para proteger', value: 640 },
  { id: 'medioambiente', label: 'Medio ambiente', value: 540 },
  { id: 'acoso', label: 'Protegidos ante el acoso', value: 450 },
];

describe('DonutChart', () => {
  it('reparte los sectores sobre el total y lo muestra en el centro', () => {
    render(<DonutChart data={DISTRIBUTION} title="Reparto por línea" />);

    expect(screen.getByRole('img', { name: /reparto por línea/i })).toBeInTheDocument();
    expect(screen.getAllByTestId(/donut-segment-/)).toHaveLength(DISTRIBUTION.length);
    // 2450 de total; el primero pesa un 33,5 %.
    // El separador de miles depende del ICU del entorno: se tolera con o sin él.
    expect(screen.getByText(/2[.\s]?450/)).toBeInTheDocument();
    expect(screen.getByTestId('donut-segment-0')).toHaveAttribute('data-percentage', '33.5');
  });

  it('acompaña cada sector de una leyenda legible con valor y porcentaje', () => {
    render(<DonutChart data={DISTRIBUTION} title="Reparto por línea" valueSuffix=" h" />);

    expect(screen.getByText('Desoledad')).toBeInTheDocument();
    expect(screen.getByText(/820 h · 33,47 %/)).toBeInTheDocument();
    expect(screen.getByText('Protegidos ante el acoso')).toBeInTheDocument();
  });

  it('ignora los valores no numéricos o negativos', () => {
    render(
      <DonutChart
        data={[
          { label: 'Válido', value: 10 },
          { label: 'Roto', value: 'no-es-un-numero' },
          { label: 'Negativo', value: -5 },
        ]}
      />,
    );

    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.queryByTestId('donut-segment-1')).not.toBeInTheDocument();
  });

  it('muestra un aviso accesible cuando no hay datos o el total es cero', () => {
    render(<DonutChart data={[{ label: 'Cero', value: 0 }]} />);

    expect(screen.getByRole('status')).toHaveTextContent(/no hay datos/i);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
