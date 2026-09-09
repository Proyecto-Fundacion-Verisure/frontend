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

export function makeClosureDetail(overrides = {}) {
  return {
    closureId: 501,
    registrationId: 104,
    actualHours: 6,
    rating: 5,
    comment: 'Gran experiencia.',
    evidenceUrl: null,
    ...overrides,
  };
}

export function makeActivityClosure(overrides = {}) {
  return {
    activityId: 4,
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

export function makeActivitySummary(overrides = {}) {
  return {
    activityId: 41,
    activityTitle: 'Mentoría laboral',
    endDate: '2026-07-30T17:00:00Z',
    expectedHours: 30,
    reportedHours: 24,
    closuresReceived: 6,
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
