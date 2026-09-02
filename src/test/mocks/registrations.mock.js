import { createApiError } from '../fixtures/apiErrors';
import { RegistrationStatus } from '../fixtures/registrations';

// In-memory store keyed by registrationId
const store = new Map();
let nextId = 200;

export function resetRegistrationsMock(initial = []) {
  store.clear();
  nextId = 200;
  initial.forEach((r) => store.set(r.registrationId, { ...r }));
}

export function seedRegistrations(items) {
  items.forEach((r) => store.set(r.registrationId, { ...r }));
}

function findByActivityAndUser(activityId, userId = 2) {
  // Simplified: userId ignored in frontend mocks (single employee)
  return [...store.values()].find(
    (r) => String(r.activityId) === String(activityId) && r.status !== RegistrationStatus.CANCELLED,
  );
}

export function mockCreateRegistration({ activityId }) {
  const existing = findByActivityAndUser(activityId);
  if (existing) {
    return Promise.reject(
      createApiError({ status: 409, code: 'ALREADY_REGISTERED', message: 'Ya estás inscrito en esta actividad.' }),
    );
  }
  const reg = {
    registrationId: nextId++,
    activityId,
    status: RegistrationStatus.CONFIRMED,
    accepted: true,
    queuePosition: null,
  };
  store.set(reg.registrationId, reg);
  return Promise.resolve({ data: reg, status: 201 });
}

export function mockGetMyRegistrations() {
  // Return MyRegistrationItems shape (simplified)
  const items = [...store.values()].map((r) => ({
    registrationId: r.registrationId,
    activity: { id: r.activityId, title: `Actividad ${r.activityId}`, partner: 'Org', startDate: '2026-09-10', endDate: '2026-09-17', hours: 8 },
    status: r.status,
    accepted: r.accepted,
    queuePosition: r.queuePosition ?? null,
    reportId: r.reportId ?? null,
    reportStatus: r.reportStatus ?? null,
  }));
  return Promise.resolve({ data: items, status: 200 });
}

export function mockGetActivityRegistrations() {
  // Not central to #73; return empty page
  return Promise.resolve({ data: [...store.values()], status: 200 });
}

export function mockAcceptRegistration(registrationId) {
  const reg = store.get(Number(registrationId));
  if (!reg) return Promise.reject(createApiError({ status: 404, message: 'No se ha encontrado el recurso solicitado.' }));
  reg.status = RegistrationStatus.CONFIRMED;
  reg.accepted = true;
  return Promise.resolve({ data: { ...reg }, status: 200 });
}

export function mockRejectRegistration(registrationId) {
  const reg = store.get(Number(registrationId));
  if (!reg) return Promise.reject(createApiError({ status: 404, message: 'No se ha encontrado el recurso solicitado.' }));
  // Rejection has no reason/body per contract
  reg.status = RegistrationStatus.REJECTED;
  reg.accepted = false;
  return Promise.resolve({ data: { ...reg }, status: 200 });
}

export function mockCancelRegistration(registrationId, payload) {
  const reg = store.get(Number(registrationId));
  if (!reg) return Promise.reject(createApiError({ status: 404, message: 'No se ha encontrado el recurso solicitado.' }));
  // PATCH /registrations/{id}/cancel accepts optional {reason}
  // Validate no required reason for employee owner (contract: without reason)
  void payload;
  reg.status = RegistrationStatus.CANCELLED;
  reg.accepted = false;
  return Promise.resolve({ data: { ...reg }, status: 200 });
}

// Expose store for assertions in tests
export const _store = store;
