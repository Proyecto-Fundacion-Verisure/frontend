export const DASHBOARD_MOCK_DATA = Object.freeze({
  dataSource: 'mock',
  reportedHours: 2655,
  activeVolunteers: 598,
  finishedActivities: 60,
  activePartners: 24,
  impactVariations: {
    reportedHours: 12.4,
    activeVolunteers: 8.1,
    finishedActivities: 15.4,
    activePartners: 4.3,
  },
  effectiveness: [
    { id: 'workforce-participation', label: 'Participación de la plantilla', value: 68 },
    { id: 'place-occupancy', label: 'Ocupación de plazas', value: 82 },
    { id: 'registration-conversion', label: 'Inscripción → participación', value: 74 },
  ],
  participationByDepartment: [
    { department: 'Tecnología', participants: 168 },
    { department: 'Comercial', participants: 144 },
    { department: 'Operaciones', participants: 110 },
    { department: 'Atención al cliente', participants: 84 },
    { department: 'Recursos humanos', participants: 52 },
    { department: 'Finanzas', participants: 40 },
  ],
  distributionByMode: [
    { id: 'in-person', label: 'Presencial', value: 58 },
    { id: 'virtual', label: 'Virtual', value: 25 },
    { id: 'hybrid', label: 'Híbrida', value: 17 },
  ],
  distributionByLocation: [
    { id: 'madrid', label: 'Madrid', value: 44 },
    { id: 'barcelona', label: 'Barcelona', value: 24 },
    { id: 'valencia', label: 'Valencia', value: 18 },
    { id: 'other-cities', label: 'Otras ciudades', value: 14 },
  ],
  favoriteRanking: [
    { activityId: 41, activityTitle: 'Acompañamiento a mayores', favoriteCount: 164 },
    { activityId: 18, activityTitle: 'Mentoría para el empleo', favoriteCount: 141 },
    { activityId: 72, activityTitle: 'Reforestación comunitaria', favoriteCount: 128 },
    { activityId: 36, activityTitle: 'Apoyo escolar en primaria', favoriteCount: 112 },
    { activityId: 55, activityTitle: 'Recogida solidaria de alimentos', favoriteCount: 98 },
    { activityId: 63, activityTitle: 'Taller de competencias digitales', favoriteCount: 87 },
    { activityId: 24, activityTitle: 'Limpieza de espacios naturales', favoriteCount: 76 },
    { activityId: 81, activityTitle: 'Acompañamiento hospitalario', favoriteCount: 65 },
    { activityId: 12, activityTitle: 'Orientación laboral para jóvenes', favoriteCount: 54 },
    { activityId: 90, activityTitle: 'Clasificación de donaciones', favoriteCount: 43 },
  ],
});

export function getDashboardMockData(filters = {}) {
  return {
    ...DASHBOARD_MOCK_DATA,
    appliedFilters: { ...filters },
  };
}

