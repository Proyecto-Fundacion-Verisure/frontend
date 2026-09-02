import { createApiError } from '../fixtures/apiErrors';
import { MOCK_USERS_V2, makeAuthResponse } from '../fixtures/auth';

export function mockLogin({ email, password } = {}) {
  void password;
  const key = Object.keys(MOCK_USERS_V2).find((k) => email?.toLowerCase().startsWith(k));
  if (!key) {
    return Promise.reject(createApiError({ status: 401, message: 'Credenciales inválidas.' }));
  }
  const user = MOCK_USERS_V2[key];
  // Map org statuses to 403 variants per contract
  if (user.status === 'PENDING_VERIFICATION') {
    return Promise.reject(createApiError({ status: 403, code: 'ACCOUNT_NOT_VERIFIED', message: 'Cuenta pendiente de verificación.' }));
  }
  if (user.status === 'PENDING_APPROVAL') {
    return Promise.reject(createApiError({ status: 403, code: 'ACCOUNT_PENDING_APPROVAL', message: 'Cuenta pendiente de aprobación.' }));
  }
  if (user.status === 'REJECTED') {
    return Promise.reject(createApiError({ status: 403, code: 'ACCOUNT_REJECTED', message: 'Cuenta rechazada.' }));
  }
  return Promise.resolve({ data: makeAuthResponse(user), status: 200 });
}

export function mockLogout() {
  return Promise.resolve({ data: null, status: 204 });
}

export function mockGetCurrentUser(user = MOCK_USERS_V2.empleado) {
  return Promise.resolve({ data: user, status: 200 });
}

// Upload mocks — contract #117
import { MAX_IMAGE_BYTES, MAX_EVIDENCE_BYTES, ALLOWED_IMAGE_TYPES, ALLOWED_EVIDENCE_TYPES } from '../fixtures/uploads';

export function mockUploadCover(file) {
  if (!file) return Promise.reject(createApiError({ status: 400, code: 'VALIDATION_ERROR', message: 'La solicitud no es válida.', fieldErrors: { image: 'Requerido' } }));
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return Promise.reject(createApiError({ status: 415, message: 'Tipo de archivo no permitido.' }));
  if (file.size > MAX_IMAGE_BYTES) return Promise.reject(createApiError({ status: 413, message: 'El archivo excede el tamaño máximo permitido.' }));
  return Promise.resolve({ data: { url: `/uploads/${file.name}` }, status: 201 });
}

export function mockUploadEvidence({ request, evidence }) {
  if (!request) return Promise.reject(createApiError({ status: 400, code: 'VALIDATION_ERROR', message: 'La solicitud no es válida.' }));
  if (evidence) {
    if (!ALLOWED_EVIDENCE_TYPES.includes(evidence.type)) return Promise.reject(createApiError({ status: 415, message: 'Tipo de archivo no permitido.' }));
    if (evidence.size > MAX_EVIDENCE_BYTES) return Promise.reject(createApiError({ status: 413, message: 'El archivo excede el tamaño máximo permitido.' }));
    if (!request.evidenceConsent) return Promise.reject(createApiError({ status: 400, code: 'VALIDATION_ERROR', message: 'La solicitud no es válida.', fieldErrors: { evidenceConsent: 'Requerido' } }));
  }
  return Promise.resolve({ data: { reportId: 501 }, status: 201 });
}
