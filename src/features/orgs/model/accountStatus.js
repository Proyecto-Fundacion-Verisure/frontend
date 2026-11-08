// Textos y vistas de `/account-status`. Las dos rutas comparten estilos pero no
// responsabilidad: la pública explica el estado de una cuenta y la de admin
// revisa las solicitudes pendientes.
export const ACCOUNT_STATUS_COPY = Object.freeze({
  verified: {
    title: 'Correo verificado',
    description: 'La Fundación revisará tu solicitud y te avisará por correo cuando esté aprobada.',
    loginLabel: 'Ir al inicio de sesión',
  },
  pendingVerification: {
    title: 'Verifica tu correo electrónico',
    description:
      'Te hemos enviado un enlace para confirmar la dirección de correo de la entidad. Si no lo encuentras, pide otro:',
  },
  pendingApproval: {
    title: 'Cuenta pendiente de aprobación',
    description:
      'Tu correo ya está verificado. La Fundación está revisando la solicitud de tu entidad y te avisará por correo.',
  },
  verificationError: {
    title: 'No hemos podido verificar el correo',
  },
  verificationExpired: {
    title: 'Este enlace ya se ha usado o ha caducado',
  },
  guest: {
    title: 'Estado de la cuenta',
    description: 'Inicia sesión para consultar el estado de tu entidad.',
  },
});

const VERIFICATION_ERROR_FALLBACK = 'Inténtalo de nuevo más tarde.';

export function isExpiredVerification(error) {
  return error?.code === 'VERIFICATION_EXPIRED';
}

export function getVerificationErrorMessage(error) {
  return error?.message || VERIFICATION_ERROR_FALLBACK;
}

// La URL manda: con `?token=` se verifica el correo (es el enlace que manda el
// backend); con `?pending=` se explica por qué el login ha dicho que no.
export function getAccountStatusView({ token, pending, verifyState, verifyError }) {
  if (token) {
    if (verifyState === 'loading') return 'verifying';
    if (verifyState === 'success') return 'verified';
    return isExpiredVerification(verifyError) ? 'expired' : 'verification-error';
  }

  if (pending === 'verification') return 'pending-verification';
  if (pending === 'approval') return 'pending-approval';
  return 'guest';
}

// --- Bandeja de la administradora ----------------------------------------

export const ORGANIZATION_ACTION_COPY = Object.freeze({
  accept: {
    title: 'Aceptar entidad',
    confirmLabel: 'Confirmar aceptación',
    variant: 'primary',
    question: (name) => `¿Deseas aceptar la cuenta de "${name}"?`,
  },
  reject: {
    title: 'Rechazar entidad',
    confirmLabel: 'Confirmar rechazo',
    variant: 'danger',
    question: (name) => `¿Deseas rechazar la cuenta de "${name}"?`,
  },
});

export const EMPTY_PENDING_ORGANIZATIONS = Object.freeze({
  organizations: [],
  totalPages: 1,
  totalElements: 0,
});

// La respuesta es el `Page` de Spring; un backend antiguo devolvía la lista
// directamente, así que se aceptan las dos formas.
export function normalizePendingOrganizationsPage(payload) {
  const source = payload ?? {};
  const content = source.content ?? source;
  const organizations = Array.isArray(content) ? content : [];

  return {
    organizations,
    totalPages: Math.max(Number(source.totalPages) || 1, 1),
    totalElements: Number(source.totalElements) || 0,
  };
}

export function getPendingCountLabel(totalElements) {
  const noun = totalElements === 1 ? 'cuenta por aprobar' : 'cuentas por aprobar';
  return `${totalElements} ${noun}`;
}

export function getOrganizationActionCopy(action) {
  return ORGANIZATION_ACTION_COPY[action] ?? ORGANIZATION_ACTION_COPY.accept;
}
