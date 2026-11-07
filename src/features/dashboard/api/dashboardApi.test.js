import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  exportDashboardPdf,
  exportPartnersCsv,
  exportParticipationsCsv,
  getDashboard,
  sanitizeDashboardParams,
} from './dashboardApi';

const { client } = vi.hoisted(() => ({
  client: {
    get: vi.fn(),
  },
}));

vi.mock('../../../shared/api/axiosClient', () => ({ default: client }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('dashboard API contract', () => {
  it('uses the contract export paths and filters each export independently', () => {
    const filters = { year: 2026, line: 'SOCIAL' };

    getDashboard(filters);
    exportParticipationsCsv(filters);
    exportPartnersCsv(filters);
    exportDashboardPdf(filters);

    expect(client.get).toHaveBeenNthCalledWith(1, '/dashboard', { params: filters });
    expect(client.get).toHaveBeenNthCalledWith(2, '/dashboard/participations.csv', {
      params: filters,
      responseType: 'blob',
    });
    expect(client.get).toHaveBeenNthCalledWith(3, '/dashboard/partners.csv', {
      params: { year: 2026 },
      responseType: 'blob',
    });
    expect(client.get).toHaveBeenNthCalledWith(4, '/dashboard/report.pdf', {
      params: filters,
      responseType: 'blob',
    });
  });

  it('never sends filters outside the dashboard contract', () => {
    expect(sanitizeDashboardParams({
      year: 2026,
      line: 'desoledad',
      department: 'Tecnología',
      page: 3,
    })).toEqual({ year: 2026, line: 'desoledad' });
  });
});
