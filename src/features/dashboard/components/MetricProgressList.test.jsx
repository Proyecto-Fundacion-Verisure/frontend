import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import MetricProgressList from './MetricProgressList';

describe('MetricProgressList', () => {
  it('muestra porcentajes y limita visualmente los valores al rango accesible', () => {
    render(<MetricProgressList items={[
      { id: 'normal', label: 'Ocupación', value: 82 },
      { id: 'high', label: 'Valor superior', value: 140 },
      { id: 'low', label: 'Valor inferior', value: -5 },
    ]} />);

    expect(screen.getByText('82%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Ocupación' }))
      .toHaveAttribute('aria-valuenow', '82');
    expect(screen.getByRole('progressbar', { name: 'Valor superior' }))
      .toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByRole('progressbar', { name: 'Valor inferior' }))
      .toHaveAttribute('aria-valuenow', '0');
  });
});

