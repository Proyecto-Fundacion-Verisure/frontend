import { ORG_DASHBOARD_MOCK_DATA } from '../../assets/mock/data/orgDashboard';

export const ORG_DASHBOARD_RESPONSE = ORG_DASHBOARD_MOCK_DATA;

export function makeOrgDashboardResponse(overrides = {}) {
  return { ...ORG_DASHBOARD_RESPONSE, ...overrides };
}

export function makeEmptyOrgDashboardResponse() {
  return {
    dataSource: 'real',
    receivedHours: 0,
    activities: 0,
    distinctVolunteers: 0,
    benefitedPeople: 0,
    variations: {},
    evolutionByYear: [],
    distributionByLine: [],
  };
}