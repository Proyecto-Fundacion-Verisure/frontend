// Registration fixtures — backend v2 contract
// RegistrationStatus + boolean accepted are separate (never ACCEPTED status)
// MyRegistrationItem drives "Mis inscripciones" and report CTA

export const RegistrationStatus = {
  WAITLISTED: 'WAITLISTED',
  CONFIRMED: 'CONFIRMED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
  PENDING_REPORT: 'PENDING_REPORT',
  PENDING_CLOSURE: 'PENDING_CLOSURE',
  CLOSED: 'CLOSED',
  // Legacy aliases kept for backward compat in UI
  CANCELADA: 'CANCELADA',
};

export function makeRegistration(overrides = {}) {
  return {
    registrationId: 1001,
    activityId: 1,
    status: RegistrationStatus.CONFIRMED,
    accepted: true,
    queuePosition: null,
    ...overrides,
  };
}

export function makeMyRegistrationItem(overrides = {}) {
  return {
    registrationId: 1001,
    activity: {
      id: 1,
      title: 'Acompañamiento a mayores',
      partner: 'Fundación Solitaria',
      startDate: '2026-09-10',
      endDate: '2026-09-17',
      hours: 8,
    },
    status: RegistrationStatus.CONFIRMED,
    accepted: true,
    queuePosition: null,
    reportId: null,
    reportStatus: null,
    closureId: null,
    activityClosed: false,
    ...overrides,
  };
}

// Preset items covering common scenarios
export const MY_REGISTRATIONS_PRESETS = {
  confirmedNoReport: makeMyRegistrationItem({
    registrationId: 101,
    activity: { id: 1, title: 'Acompañamiento a mayores', partner: 'Fundación Solitaria', startDate: '2026-09-10', endDate: '2026-09-17', hours: 8 },
    status: RegistrationStatus.CONFIRMED,
    accepted: true,
  }),
  waitlisted: makeMyRegistrationItem({
    registrationId: 102,
    activity: { id: 2, title: 'Taller educativo', partner: 'Educamos Juntos', startDate: '2026-09-12', endDate: '2026-09-13', hours: 6 },
    status: RegistrationStatus.WAITLISTED,
    accepted: false,
    queuePosition: 3,
  }),
  waitlistedAccepted: makeMyRegistrationItem({
    registrationId: 103,
    activity: { id: 2, title: 'Taller educativo', partner: 'Educamos Juntos', startDate: '2026-09-12', endDate: '2026-09-13', hours: 6 },
    status: RegistrationStatus.WAITLISTED,
    accepted: true,
    queuePosition: 1,
  }),
  pendingReport: makeMyRegistrationItem({
    registrationId: 104,
    activity: { id: 4, title: 'Jornada ambiental', partner: 'Voluntarios Activos', startDate: '2026-07-01', endDate: '2026-07-02', hours: 8 },
    status: RegistrationStatus.PENDING_CLOSURE,
    accepted: true,
    reportId: null,
    reportStatus: null,
    closureId: null,
    activityClosed: false,
  }),
  closedValidated: makeMyRegistrationItem({
    registrationId: 105,
    activity: { id: 4, title: 'Jornada ambiental', partner: 'Voluntarios Activos', startDate: '2026-07-01', endDate: '2026-07-02', hours: 8 },
    status: RegistrationStatus.CLOSED,
    accepted: true,
    reportId: 501,
    reportStatus: 'VALIDATED',
    closureId: 501,
    activityClosed: true,
  }),
  returnedNeedsResubmit: makeMyRegistrationItem({
    registrationId: 106,
    activity: { id: 4, title: 'Jornada ambiental', partner: 'Voluntarios Activos', startDate: '2026-07-01', endDate: '2026-07-02', hours: 8 },
    status: RegistrationStatus.PENDING_CLOSURE,
    accepted: true,
    reportId: 502,
    reportStatus: 'RETURNED',
    closureId: 502,
    activityClosed: false,
  }),
  cancelled: makeMyRegistrationItem({
    registrationId: 107,
    activity: { id: 3, title: 'Prevención acoso', partner: 'Prevención Total', startDate: '2026-08-20', endDate: '2026-09-20', hours: 10 },
    status: RegistrationStatus.CANCELLED,
    accepted: false,
  }),
};

export function makeCancelRequest(reason = undefined) {
  return reason ? { reason } : {};
}

// Helper to check if registration allows report submission
export function canSubmitReport(item) {
  return item.status === RegistrationStatus.CONFIRMED || item.status === RegistrationStatus.PENDING_REPORT || item.status === RegistrationStatus.PENDING_CLOSURE;
}
