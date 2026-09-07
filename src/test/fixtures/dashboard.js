export const DASHBOARD_RESPONSE = Object.freeze({
  reportedHours: 2655,
  activeVolunteers: 598,
  finishedActivities: 60,
  beneficiaries: 12234,
  totalFavorites: 842,
  hoursByDepartment: [
    { department: 'Tecnología', hours: 980 },
    { department: 'Marketing', hours: 760 },
    { department: 'Operaciones', hours: 915 },
  ],
  hoursByLine: [
    { line: 'desoledad', hours: 1239 },
    { line: 'educar', hours: 620 },
    { line: 'acoso', hours: 420 },
    { line: 'medio_ambiente', hours: 376 },
  ],
  favoriteRanking: [
    { activityId: 41, activityTitle: 'Acompañamiento a mayores', favoriteCount: 164 },
    { activityId: 18, activityTitle: 'Mentoría para el empleo', favoriteCount: 121 },
    { activityId: 72, activityTitle: 'Reforestación comunitaria', favoriteCount: 97 },
  ],
});

export function makeDashboardResponse(overrides = {}) {
  return { ...DASHBOARD_RESPONSE, ...overrides };
}
