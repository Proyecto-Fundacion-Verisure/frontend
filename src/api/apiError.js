import { getDomainMessage, translateFieldErrors } from './domainMessages';

const STATUS_MESSAGES = {
  400: 'La solicitud no es válida.',
  401: 'Tu sesión ha caducado. Vuelve a iniciar sesión.',
  403: 'No tienes permiso para realizar esta acción.',
  404: 'No se ha encontrado el recurso solicitado.',
  409: 'La operación entra en conflicto con el estado actual.',
  422: 'Revisa los datos introducidos.',
  429: 'Se han realizado demasiadas solicitudes. Inténtalo más tarde.',
  500: 'Ha ocurrido un error en el servidor. Inténtalo más tarde.',
};

export class ApiError extends Error {
  constructor({ message, status = null, code = null, details = null, fieldErrors = null, cause }) {
    super(getDomainMessage(code, message), { cause });
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.fieldErrors = translateFieldErrors(fieldErrors);
    this.isNetworkError = status === null && code !== 'ERR_CANCELED';
    this.isCanceled = code === 'ERR_CANCELED';
  }
}

function getResponseMessage(data, status) {
  const domainMessage = getDomainMessage(data?.code);
  if (domainMessage) return domainMessage;
  if (typeof data?.message === 'string' && data.message.trim()) return data.message;
  if (typeof data?.error === 'string' && data.error.trim()) return data.error;
  return STATUS_MESSAGES[status] ?? 'No se ha podido completar la solicitud.';
}

export function normalizeApiError(error) {
  if (error instanceof ApiError) return error;

  if (error?.code === 'ERR_CANCELED') {
    return new ApiError({
      message: 'La solicitud ha sido cancelada.',
      code: error.code,
      cause: error,
    });
  }

  const status = error?.response?.status ?? null;
  const data = error?.response?.data;
  const message = status
    ? getResponseMessage(data, status)
    : 'No se ha podido conectar con el servidor. Comprueba tu conexión.';

  return new ApiError({
    message,
    status,
    code: data?.code ?? error?.code ?? null,
    details: data?.details ?? null,
    fieldErrors: data?.fields ?? data?.fieldErrors ?? data?.errors ?? null,
    cause: error,
  });
}
