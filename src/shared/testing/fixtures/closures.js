export const ActivityClosureStatus = Object.freeze({
  DRAFT: 'DRAFT',
  CLOSED: 'CLOSED',
});

export function makeCreateClosureRequest(overrides = {}) {
  return {
    registrationId: 104,
    actualHours: 6,
    rating: 5,
    comment: 'Gran experiencia.',
    evidenceConsent: true,
    ...overrides,
  };
}

// `ClosureDetailResponse` de GET /api/closures/{id}: un cierre no tiene estados
// ni se devuelve; la administración cierra la actividad, no el cierre.
export function makeClosureDetail(overrides = {}) {
  return {
    id: 501,
    registrationId: 104,
    activityId: 4,
    activityTitle: 'Jornada de voluntariado ambiental',
    actualHours: 6,
    rating: 5,
    comment: 'Gran experiencia.',
    evidenceUrl: null,
    submittedAt: '2026-08-15T10:00:00Z',
    ...overrides,
  };
}

export function makeActivityClosure(overrides = {}) {
  return {
    activityId: 4,
    activityTitle: 'Jornada de voluntariado ambiental',
    collaborationRating: null,
    closingNotes: null,
    lessonsLearned: null,
    status: ActivityClosureStatus.DRAFT,
    closedAt: null,
    expectedHours: 32,
    reportedHours: 24,
    confirmedVolunteers: 4,
    closedParticipations: 3,
    evidenceCount: 2,
    ...overrides,
  };
}

// `ActivityClosureRow` de GET /api/admin/activities/pending-closure. Los
// totales (previstas, reportadas, cierres) van en el detalle, no en la cola.
export function makeActivitySummary(overrides = {}) {
  return {
    activityId: 41,
    title: 'Mentoría laboral',
    partnerName: 'Fundación Solitaria',
    line: 'desoledad',
    startDate: '2026-07-01',
    endDate: '2026-07-30',
    hours: 12,
    ...overrides,
  };
}

export function makePage(content = [], { totalElements = content.length, page = 0, size = 10 } = {}) {
  const totalPages = totalElements === 0 ? 0 : Math.ceil(totalElements / size);
  return {
    content,
    totalElements,
    totalPages,
    number: page,
    size,
    first: page === 0,
    last: totalPages === 0 || page >= totalPages - 1,
  };
}
