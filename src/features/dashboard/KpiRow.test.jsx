import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import KpiRow, { formatDashboardNumber, formatDashboardVariation } from './KpiRow';

describe('KpiRow', () => {
  it('muestra exactamente los agregados recibidos con formato consistente', () => {
    render(<KpiRow metrics={{
      reportedHours: 12500.5,
      activeVolunteers: 598,
      finishedActivities: 60,
      activePartners: 24,
    }} variations={{
      reportedHours: 12.5,
      activeVolunteers: -2,
    }} />);

    expect(screen.getByRole('list', { name: 'Indicadores principales de impacto' })).toBeInTheDocument();
    expect(screen.getByText('12.500,5 h')).toBeInTheDocument();
    expect(screen.getByText('598')).toBeInTheDocument();
    expect(screen.getByText('24')).toBeInTheDocument();
    expect(screen.getByText('+12,5 % respecto al trimestre anterior')).toBeInTheDocument();
    expect(screen.getByText('-2 % respecto al trimestre anterior')).toBeInTheDocument();
  });

  it('diferencia cero de un dato ausente', () => {
    render(<KpiRow metrics={{ reportedHours: 0, activeVolunteers: null }} />);

    expect(screen.getByText('0 h')).toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(3);
  });

  it('no presenta valores no numéricos como indicadores válidos', () => {
    expect(formatDashboardNumber(undefined)).toBe('—');
    expect(formatDashboardNumber('no-numérico')).toBe('—');
    expect(formatDashboardNumber(0)).toBe('0');
    expect(formatDashboardVariation(4.5)).toBe('+4,5 %');
    expect(formatDashboardVariation(-1)).toBe('-1 %');
    expect(formatDashboardVariation(undefined)).toBeNull();
  });
});
