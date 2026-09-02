export const MENSAJES = Object.freeze({
  ACTIVITY_NOT_FINISHED: 'La actividad todavía no ha finalizado.',
  REGISTRATION_NOT_CONFIRMED: 'La inscripción debe estar confirmada para realizar esta acción.',
  CLOSURE_ALREADY_CLOSED: 'El cierre de esta participación ya está completado.',
  REPORT_ALREADY_SUBMITTED: 'Ya se ha enviado el informe de esta participación.',
  REGISTRATION_NOT_FOUND: 'No se ha encontrado la inscripción solicitada.',
  ACTIVITY_NOT_FOUND: 'No se ha encontrado la actividad solicitada.',
  USER_NOT_FOUND: 'No se ha encontrado la persona usuaria.',
  UNAUTHORIZED: 'Debes iniciar sesión para continuar.',
  FORBIDDEN: 'No tienes permiso para realizar esta acción.',
  VALIDATION_ERROR: 'Revisa los datos introducidos.',
  FILE_TOO_LARGE: 'El archivo supera el tamaño máximo permitido.',
  UNSUPPORTED_MEDIA_TYPE: 'El tipo de archivo no está permitido.',
  DUPLICATE_CIF: 'Ya existe una entidad registrada con este CIF.',
  ACCOUNT_PENDING: 'La cuenta todavía está pendiente de aprobación.',
  ACCOUNT_REJECTED: 'La solicitud de cuenta ha sido rechazada.',
  ACTIVITY_FULL: 'No quedan plazas disponibles para esta actividad.',

  // Alias vigentes del contrato v2 que expresan los mismos casos de dominio.
  CIF_ALREADY_REGISTERED: 'Ya existe una entidad registrada con este CIF.',
  ACCOUNT_PENDING_APPROVAL: 'La cuenta todavía está pendiente de aprobación.',
  ACCOUNT_NOT_VERIFIED: 'Debes verificar tu correo electrónico antes de continuar.',
  ACTIVITY_NOT_EDITABLE: 'La actividad no se puede editar en su estado actual.',
  ACTIVITY_FINISHED: 'La actividad ya ha finalizado y no admite esta acción.',
  PROPOSAL_ALREADY_DECIDED: 'La propuesta ya ha sido aceptada o rechazada.',
});

export function getDomainMessage(code, fallback = null) {
  return MENSAJES[code] ?? fallback;
}

export function translateFieldErrors(fieldErrors) {
  if (!fieldErrors || Array.isArray(fieldErrors) || typeof fieldErrors !== 'object') {
    return fieldErrors ?? null;
  }
  return Object.fromEntries(
    Object.entries(fieldErrors).map(([field, message]) => [
      field,
      getDomainMessage(message, message),
    ]),
  );
}
