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
  // Los dos 409 del alta hablan del correo, no del CIF: un CIF que ya existe no
  // es un error, la cuenta nueva se cuelga de la entidad que ya había (§6.1).
  CIF_ALREADY_REGISTERED: 'Este correo ya tiene una cuenta en esta entidad.',
  EMAIL_ALREADY_REGISTERED: 'Este correo ya está registrado. Inicia sesión o usa otro.',
  ACTIVITY_NOT_PENDING_APPROVAL: 'La actividad ya no está pendiente de revisión.',
  PROPOSAL_ALREADY_DECIDED: 'La propuesta ya ha sido aceptada o rechazada.',
  VERIFICATION_EXPIRED: 'El enlace de verificación ha caducado. Solicita uno nuevo.',
  RATE_LIMIT_EXCEEDED: 'Se han realizado demasiadas solicitudes. Inténtalo más tarde.',
  // Códigos que emite `GlobalExceptionHandler` fuera del enum `ErrorCode`. Sin
  // entrada aquí se enseñaba el `message` técnico del servidor («Error interno
  // del servidor»). `UNAUTHORIZED` y `UNSUPPORTED_MEDIA_TYPE` quedan fuera a
  // propósito: su mensaje cambia según el caso (credenciales vs. sesión;
  // tipo no admitido vs. archivo vacío) y el del backend es el bueno.
  NOT_FOUND: 'No se ha encontrado el recurso solicitado.',
  FORBIDDEN: 'No tienes permiso para realizar esta acción.',
  MALFORMED_REQUEST: 'La solicitud no es válida.',
  PAYLOAD_TOO_LARGE: 'El archivo adjunto excede el tamaño máximo permitido.',
  METHOD_NOT_ALLOWED: 'No se ha podido completar la solicitud.',
  INTERNAL_ERROR: 'Ha ocurrido un error en el servidor. Inténtalo más tarde.',
});

// Los DTO del backend usan Bean Validation sin `message`, así que `fields` trae
// los textos por defecto de Hibernate Validator en el idioma del `Accept-Language`
// de la petición. Con un navegador en inglés (o un cliente sin cabecera) llegan
// en inglés: estos son los que pueden aparecer, con su traducción.
const VALIDATION_DEFAULTS = [
  [/^must not be (blank|null|empty)$/i, 'Este campo es obligatorio.'],
  [/^must be a well-formed email address$/i, 'Introduce un correo válido.'],
  [/^must be greater than or equal to (\S+)$/i, 'Debe ser mayor o igual que $1.'],
  [/^must be less than or equal to (\S+)$/i, 'Debe ser menor o igual que $1.'],
  [/^must be greater than (\S+)$/i, 'Debe ser mayor que $1.'],
  [/^must be less than (\S+)$/i, 'Debe ser menor que $1.'],
  [/^size must be between (\d+) and (\d+)$/i, 'Debe tener entre $1 y $2 caracteres.'],
  [/^must be a future date$/i, 'Debe ser una fecha futura.'],
  [/^must be a date in the present or in the future$/i, 'Debe ser hoy o una fecha futura.'],
  [/^must match "(.+)"$/i, 'El formato no es válido.'],
];

function translateValidationDefault(message) {
  const match = VALIDATION_DEFAULTS.find(([pattern]) => pattern.test(message));
  return match ? message.replace(match[0], match[1]) : message;
}

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
      .map((message) => getDomainMessage(message, translateValidationDefault(message)));
    return [field, translated.join(' ')];
  }));
}
