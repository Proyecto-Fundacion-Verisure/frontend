import { DASHBOARD_MOCK_DATA } from '../../assets/mock/data/dashboard';

export const DASHBOARD_RESPONSE = DASHBOARD_MOCK_DATA;

export function makeDashboardResponse(overrides = {}) {
  return { ...DASHBOARD_RESPONSE, ...overrides };
}
