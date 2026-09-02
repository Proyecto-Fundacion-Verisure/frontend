// Report fixtures — backend v2 contract
// ReportSummary (Page<ReportSummary> for GET /reports/pending) is lightweight
// ReportDetailResponse (GET /reports/{id}, PATCH validate/return) is full

export const ReportStatus = {
  SUBMITTED: 'SUBMITTED',
  VALIDATED: 'VALIDATED',
  RETURNED: 'RETURNED',
};

export function makeReportSummary(overrides = {}) {
  return {
    id: 501, // reportId in summary is `id`
    reportId: 501,
    activity: {
      id: 4,
      title: 'Jornada de voluntariado ambiental',
      partner: 'Voluntarios Activos',
    },
    person: {
      id: 2,
      name: 'Elena Empleada',
      email: 'empleado@verisure.com',
    },
    sentDate: '2026-09-01T10:00:00.000Z',
    actualHours: 6,
    status: ReportStatus.SUBMITTED,
    ...overrides,
  };
}

export function makeReportDetailResponse(overrides = {}) {
  return {
    reportId: 501,
    activity: {
      id: 4,
      title: 'Jornada de voluntariado ambiental',
      partner: 'Voluntarios Activos',
      startDate: '2026-07-01',
      endDate: '2026-07-02',
      hours: 8,
    },
    person: {
      id: 2,
      name: 'Elena Empleada',
      email: 'empleado@verisure.com',
    },
    expectedHours: 8,
    actualHours: 6,
    rating: 5,
    comment: 'Experiencia muy positiva.',
    evidenceUrl: null,
    status: ReportStatus.SUBMITTED,
    returnNote: null,
    validatedHours: null,
    ...overrides,
  };
}

export function makePage(content = [], { totalElements = content.length, page = 0, size = 10 } = {}) {
  const totalPages = Math.max(1, Math.ceil(totalElements / size));
  return {
    content,
    totalElements,
    totalPages,
    number: page,
    size,
    first: page === 0,
    last: page >= totalPages - 1,
  };
}

export function makeCreateReportRequest(overrides = {}) {
  return {
    registrationId: 104,
    actualHours: 6,
    rating: 5,
    comment: 'Gran experiencia.',
    evidenceConsent: true,
    ...overrides,
  };
}

// Multipart helpers: backend expects parts `request` (JSON) and `evidence` (file)
export function makeReportMultipart(requestOverrides = {}, evidenceFile = null) {
  const request = makeCreateReportRequest(requestOverrides);
  return { request, evidence: evidenceFile };
}

export function makeValidateRequest(validatedHours) {
  return { validatedHours };
}

export function makeReturnRequest(note) {
  return { note };
}
