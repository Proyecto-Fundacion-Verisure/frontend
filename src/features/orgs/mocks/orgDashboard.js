export const ORG_DASHBOARD_MOCK_DATA = Object.freeze({
  dataSource: 'mock',
  receivedHours: 2450,
  activities: 12,
  distinctVolunteers: 148,
  benefitedPeople: 860,
  variations: {
    receivedHours: 9.2,
    activities: 4,
    distinctVolunteers: 6.7,
    benefitedPeople: -2.3,
  },
  evolutionByYear: [
    { year: 2024, receivedHours: 980 },
    { year: 2025, receivedHours: 1580 },
    { year: 2026, receivedHours: 2450 },
  ],
  distributionByLine: [
    { id: 'desoledad', label: 'Desoledad', value: 820 },
    { id: 'educar', label: 'Educar para proteger', value: 640 },
    { id: 'medioambiente', label: 'Medio ambiente', value: 540 },
    { id: 'acoso', label: 'Protegidos ante el acoso', value: 450 },
  ],
});

export function getOrgDashboardMockData() {
  return {
    ...ORG_DASHBOARD_MOCK_DATA,
    evolutionByYear: ORG_DASHBOARD_MOCK_DATA.evolutionByYear.map((item) => ({ ...item })),
    distributionByLine: ORG_DASHBOARD_MOCK_DATA.distributionByLine.map((item) => ({ ...item })),
  };
}