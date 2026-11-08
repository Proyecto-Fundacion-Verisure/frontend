import { describe, expect, it } from 'vitest';
import { hasDashboardData, normalizeDashboardData } from './dashboardData';

describe('dashboardData model', () => {
  it('detecta respuestas vacías o nulas', () => {
    expect(hasDashboardData(null)).toBe(false);
    expect(hasDashboardData({})).toBe(false);
    expect(hasDashboardData({ kpis: {} })).toBe(false);
  });

  it('detecta tanto KPIs con valor como series con filas', () => {
    expect(hasDashboardData({ kpis: { reportedHours: 2655 } })).toBe(true);
    expect(hasDashboardData({ favoriteRanking: [{ activityId: 1 }] })).toBe(true);
    expect(hasDashboardData({ kpis: { reportedHours: null } })).toBe(false);
  });

  it('aplana la respuesta en listas y mapas seguros', () => {
    const dashboard = normalizeDashboardData({
      kpis: { reportedHours: 2655 },
      impactVariations: { reportedHours: 120 },
      participationByDepartment: 'no-es-una-lista',
      favoriteRanking: [{ activityId: 1, activityTitle: 'Acompañamiento' }],
      dataSource: 'mock',
    });

    expect(dashboard.hasData).toBe(true);
    expect(dashboard.isMockData).toBe(true);
    expect(dashboard.metrics).toEqual({ reportedHours: 2655 });
    expect(dashboard.variations).toEqual({ reportedHours: 120 });
    expect(dashboard.departmentData).toEqual([]);
    expect(dashboard.rankingData).toHaveLength(1);
  });

  it('prefiere impactVariations sobre variations y cae a vacío', () => {
    const withLegacyKey = normalizeDashboardData({ variations: { reportedHours: 5 } });
    const withBothKeys = normalizeDashboardData({
      impactVariations: { reportedHours: 1 },
      variations: { reportedHours: 5 },
    });

    expect(withLegacyKey.variations).toEqual({ reportedHours: 5 });
    expect(withBothKeys.variations).toEqual({ reportedHours: 1 });
  });

  it('devuelve valores por defecto cuando no hay respuesta', () => {
    const dashboard = normalizeDashboardData(null);

    expect(dashboard.hasData).toBe(false);
    expect(dashboard.isMockData).toBe(false);
    expect(dashboard.metrics).toEqual({});
    expect(dashboard.variations).toEqual({});
    expect(dashboard.effectiveness).toEqual([]);
  });
});
