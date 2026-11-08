import { describe, expect, it } from 'vitest';
import {
  MIN_DASHBOARD_YEAR,
  buildDashboardFilters,
  isValidDashboardYear,
  parseDashboardFilters,
  toDashboardSearchParams,
} from './dashboardFilters';

function params(query) {
  return new URLSearchParams(query);
}

describe('dashboardFilters model', () => {
  it('acepta el año vacío y valida el rango permitido', () => {
    expect(isValidDashboardYear('')).toBe(true);
    expect(isValidDashboardYear(null)).toBe(true);
    expect(isValidDashboardYear('2026', 2026)).toBe(true);
    expect(isValidDashboardYear('1999', 2026)).toBe(false);
    expect(isValidDashboardYear('abc', 2026)).toBe(false);
    expect(MIN_DASHBOARD_YEAR).toBe(2000);
  });

  it('trata los parámetros inválidos como ausentes y los marca', () => {
    const parsed = parseDashboardFilters(params('year=1800&line=inventada'), 2026);

    expect(parsed).toEqual({
      year: '',
      line: '',
      hasInvalidYear: true,
      hasInvalidLine: true,
    });
  });

  it('conserva los parámetros válidos', () => {
    const parsed = parseDashboardFilters(params('year=2026&line=educar'), 2026);

    expect(parsed).toEqual({
      year: '2026',
      line: 'educar',
      hasInvalidYear: false,
      hasInvalidLine: false,
    });
  });

  it('construye los filtros de la consulta con el año como número', () => {
    expect(buildDashboardFilters({ year: '2026', line: 'educar' })).toEqual({
      year: 2026,
      line: 'educar',
    });
    expect(buildDashboardFilters({ year: '', line: '' })).toEqual({});
  });

  it('escribe los filtros activos como parámetros de URL', () => {
    const searchParams = toDashboardSearchParams({ year: 2026, line: 'educar' });

    expect(searchParams.toString()).toBe('year=2026&line=educar');
    expect(toDashboardSearchParams({}).toString()).toBe('');
  });
});
