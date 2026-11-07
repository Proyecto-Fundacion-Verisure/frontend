import { ApiError } from '../../api/apiError';

export function createApiError({ status, code = null, message, fieldErrors = null, details = null }) {
  return new ApiError({ message, status, code, fieldErrors, details });
}

export function ok(data, { status = 200, headers = {} } = {}) {
  return { data, status, headers };
}

export function created(data) {
  return { data, status: 201, headers: {} };
}

export function noContent() {
  return { data: null, status: 204, headers: {} };
}

// Generic http errors matching STATUS_MESSAGES in apiError.js
export const httpErrors = {
  validation: (fieldErrors = null) =>
    createApiError({ status: 400, code: 'VALIDATION_ERROR', message: 'La solicitud no es válida.', fieldErrors }),
  unauthorized: () =>
    createApiError({ status: 401, message: 'Tu sesión ha caducado. Vuelve a iniciar sesión.' }),
  forbidden: (code = null, message = 'No tienes permiso para realizar esta acción.') =>
    createApiError({ status: 403, code, message }),
  notFound: (message = 'No se ha encontrado el recurso solicitado.') =>
    createApiError({ status: 404, message }),
  conflict: (code, message = 'La operación entra en conflicto con el estado actual.') =>
    createApiError({ status: 409, code, message }),
  rateLimited: () =>
    createApiError({ status: 429, message: 'Se han realizado demasiadas solicitudes. Inténtalo más tarde.' }),
  payloadTooLarge: (message = 'El archivo excede el tamaño máximo permitido.') =>
    createApiError({ status: 413, message }),
  unsupportedMedia: (message = 'Tipo de archivo no permitido.') =>
    createApiError({ status: 415, message }),
  serverError: () =>
    createApiError({ status: 500, message: 'Ha ocurrido un error en el servidor. Inténtalo más tarde.' }),
};

// Domain-specific error factories (backend v2 contract)
export const domainErrors = {
  alreadyRegistered: () =>
    createApiError({ status: 409, code: 'ALREADY_REGISTERED', message: 'Ya estás inscrito en esta actividad.' }),
  activityNotFinished: () =>
    createApiError({ status: 409, code: 'ACTIVITY_NOT_FINISHED', message: 'La actividad todavía no ha finalizado.' }),
  registrationNotConfirmed: () =>
    createApiError({ status: 409, code: 'REGISTRATION_NOT_CONFIRMED', message: 'La inscripción no está confirmada.' }),
  activityNotClosed: () =>
    createApiError({ status: 409, code: 'ACTIVITY_NOT_CLOSED', message: 'La actividad todavía no está cerrada.' }),
  closureAlreadyClosed: () =>
    createApiError({ status: 409, code: 'CLOSURE_ALREADY_CLOSED', message: 'El cierre ya está completado.' }),
  proposalAlreadyDecided: () =>
    createApiError({ status: 409, code: 'PROPOSAL_ALREADY_DECIDED', message: 'La propuesta ya ha sido decidida.' }),
  accountNotVerified: () =>
    createApiError({ status: 403, code: 'ACCOUNT_NOT_VERIFIED', message: 'Cuenta pendiente de verificación.' }),
  accountPendingApproval: () =>
    createApiError({ status: 403, code: 'ACCOUNT_PENDING_APPROVAL', message: 'Cuenta pendiente de aprobación.' }),
  accountRejected: () =>
    createApiError({ status: 403, code: 'ACCOUNT_REJECTED', message: 'Cuenta rechazada.' }),
  notOwner: () =>
    createApiError({ status: 403, code: 'NOT_OWNER', message: 'No tienes permiso para realizar esta acción.' }),
  cifAlreadyRegistered: () =>
    createApiError({ status: 409, code: 'CIF_ALREADY_REGISTERED', message: 'El CIF ya está registrado.' }),
  verificationExpired: () =>
    createApiError({ status: 410, code: 'VERIFICATION_EXPIRED', message: 'El enlace de verificación ha expirado.' }),
};

// Re-export for convenience in tests
export const presets = {
  ...httpErrors,
  ...domainErrors,
  createApiError,
  ok,
  created,
  noContent,
};

export const statusMocks = {
  200: (data) => ok(data, { status: 200 }),
  201: (data) => created(data),
  204: () => noContent(),
  400: (fieldErrors) => httpErrors.validation(fieldErrors),
  401: () => httpErrors.unauthorized(),
  403: (code) => httpErrors.forbidden(code),
  404: () => httpErrors.notFound(),
  409: (code) => httpErrors.conflict(code),
  429: () => httpErrors.rateLimited(),
  413: () => httpErrors.payloadTooLarge(),
  415: () => httpErrors.unsupportedMedia(),
  500: () => httpErrors.serverError(),
};
