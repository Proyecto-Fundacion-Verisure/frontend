import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ChartTable from './ChartTable';

describe('ChartTable', () => {
  it('ofrece los mismos datos del gráfico con caption y encabezados', () => {
    const data = [
      { department: 'Tecnología', hours: 50 },
      { department: 'Marketing', hours: 100 },
    ];
    render(
      <ChartTable
        data={data}
        caption="Tabla de horas por departamento"
        categoryLabel="Departamento"
        valueLabel="Horas"
        labelKey="department"
        valueKey="hours"
      />,
    );

    const region = screen.getByRole('region', { name: 'Tabla de horas por departamento' });
    expect(region).toHaveAttribute('tabindex', '0');
    expect(within(region).getByRole('columnheader', { name: 'Departamento' })).toBeInTheDocument();
    expect(within(region).getByRole('columnheader', { name: 'Horas' })).toBeInTheDocument();
    expect(within(region).getByText('Tecnología')).toBeInTheDocument();
    expect(within(region).getByText('100')).toBeInTheDocument();
  });
});
