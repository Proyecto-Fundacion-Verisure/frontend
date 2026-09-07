import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import KpiRow, { formatDashboardNumber } from './KpiRow';

describe('KpiRow', () => {
  it('muestra exactamente los agregados recibidos con formato consistente', () => {
    render(<KpiRow metrics={{
      reportedHours: 12500.5,
      activeVolunteers: 598,
      finishedActivities: 60,
      beneficiaries: 12234,
      totalFavorites: 842,
    }} />);

    expect(screen.getByRole('region', { name: 'Indicadores principales' })).toBeInTheDocument();
    expect(screen.getByText('12.500,5 h')).toBeInTheDocument();
    expect(screen.getByText('598')).toBeInTheDocument();
    expect(screen.getByText('12.234')).toBeInTheDocument();
    expect(screen.getByText('842')).toBeInTheDocument();
  });

  it('diferencia cero de un dato ausente', () => {
    render(<KpiRow metrics={{ reportedHours: 0, activeVolunteers: null }} />);

    expect(screen.getByText('0 h')).toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(4);
  });

  it('no presenta valores no numéricos como indicadores válidos', () => {
    expect(formatDashboardNumber(undefined)).toBe('—');
    expect(formatDashboardNumber('no-numérico')).toBe('—');
    expect(formatDashboardNumber(0)).toBe('0');
  });
});
