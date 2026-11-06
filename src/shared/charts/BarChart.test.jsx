import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import BarChart from './BarChart';

const DATA = [
  { department: 'Tecnología', hours: 50 },
  { department: 'Marketing', hours: 100 },
  { department: 'Operaciones', hours: 0 },
];

describe('BarChart', () => {
  it('representa etiquetas, valores y una escala proporcional', () => {
    render(
      <BarChart
        title="Horas por departamento"
        description="Horas cerradas por departamento"
        data={DATA}
        labelKey="department"
        valueKey="hours"
      />,
    );

    expect(screen.getByRole('img', { name: 'Horas por departamento Horas cerradas por departamento' }))
      .toBeInTheDocument();
    expect(screen.getByText('Tecnología')).toBeInTheDocument();
    expect(Number(screen.getByTestId('bar-0').getAttribute('width')))
      .toBeCloseTo(Number(screen.getByTestId('bar-1').getAttribute('width')) / 2);
    expect(Number(screen.getByTestId('bar-2').getAttribute('width'))).toBe(0);
  });

  it('explica el estado vacío sin dibujar un gráfico falso', () => {
    render(<BarChart data={[]} emptyMessage="No hay horas cerradas." />);

    expect(screen.getByRole('status')).toHaveTextContent('No hay horas cerradas.');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
