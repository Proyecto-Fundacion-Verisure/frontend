export const MENSAJES = Object.freeze({
  VALIDATION_ERROR: 'Revisa los datos introducidos.',
  DEADLINE_PASSED: 'El plazo de inscripción ha expirado.',
  ACTIVITY_NOT_FINISHED: 'La actividad todavía no ha finalizado.',
  INVALID_DATE_RANGE: 'La fecha de fin es anterior a la fecha de inicio.',
  NOT_OWNER: 'No tienes permiso para consultar este recurso.',
  ACCOUNT_NOT_VERIFIED: 'Debes verificar tu correo electrónico antes de continuar.',
  ACCOUNT_PENDING_APPROVAL: 'La cuenta todavía está pendiente de aprobación.',
  ACCOUNT_REJECTED: 'La solicitud de cuenta ha sido rechazada.',
  ALREADY_REGISTERED: 'Ya tienes una inscripción activa para esta actividad.',
  REGISTRATION_NOT_CONFIRMED: 'La inscripción debe estar confirmada para realizar esta acción.',
  ACTIVITY_NOT_CLOSED: 'La actividad aún no está cerrada por completo.',
  CLOSURE_ALREADY_CLOSED: 'El cierre de esta participación ya está completado.',
  ACTIVITY_FINISHED: 'La actividad ya ha finalizado y no admite esta acción.',
  ACTIVITY_NOT_EDITABLE: 'La actividad no se puede editar en su estado actual.',
  CIF_ALREADY_REGISTERED: 'Ya existe una entidad registrada con este CIF.',
  PROPOSAL_ALREADY_DECIDED: 'La propuesta ya ha sido aceptada o rechazada.',
  VERIFICATION_EXPIRED: 'El enlace de verificación ha caducado. Solicita uno nuevo.',
  RATE_LIMIT_EXCEEDED: 'Se han realizado demasiadas solicitudes. Inténtalo más tarde.',
});

export function getDomainMessage(code, fallback = null) {
  return MENSAJES[code] ?? fallback;
}

export function translateFieldErrors(fieldErrors) {
  if (!fieldErrors || Array.isArray(fieldErrors) || typeof fieldErrors !== 'object') {
    return fieldErrors ?? null;
  }
  return Object.fromEntries(Object.entries(fieldErrors).map(([field, messages]) => {
    const list = Array.isArray(messages) ? messages : [messages];
    const translated = list
      .filter((message) => typeof message === 'string' && message.trim())
      .map((message) => getDomainMessage(message, message));
    return [field, translated.join(' ')];
  }));
}
