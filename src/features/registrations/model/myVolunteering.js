// Estados, acciones y reglas de «Mis voluntariados».
// Aquí no hay React: la página y el hook solo coordinan estado y pintado.
export const MY_VOLUNTEERING_STATUS = Object.freeze({
  WAITLISTED: { label: 'En lista de espera', variant: 'warning' },
  CONFIRMED: { label: 'Confirmada', variant: 'success' },
  CLOSED: { label: 'Cerrada', variant: 'neutral' },
  PENDING_CLOSURE: { label: 'Pendiente de cierre', variant: 'warning' },
  REJECTED: { label: 'Rechazada', variant: 'danger' },
  CANCELLED: { label: 'Cancelada', variant: 'danger' },
});

const UNKNOWN_STATUS_BADGE = Object.freeze({ label: '', variant: 'neutral' });

// Inscripciones vivas. El resto (`CLOSED`, `REJECTED`, `CANCELLED`) es historial:
// ya no admite acciones, pero la persona debe poder ver que fue rechazada o
// que se dio de baja.
const ACTIVE_STATUSES = new Set(['WAITLISTED', 'CONFIRMED', 'PENDING_CLOSURE']);

const CANCELLABLE_STATUSES = new Set(['WAITLISTED', 'CONFIRMED']);

export function isActiveRegistration(item) {
  return ACTIVE_STATUSES.has(item.status) && !item.activityClosed;
}

export function splitRegistrations(items) {
  return {
    active: items.filter(isActiveRegistration),
    history: items.filter((item) => !isActiveRegistration(item)),
  };
}

export function getStatusBadge(status) {
  const badge = MY_VOLUNTEERING_STATUS[status] ?? UNKNOWN_STATUS_BADGE;
  return { label: badge.label || status, variant: badge.variant };
}

export function getActivityTitle(activity) {
  return activity?.title ?? `Actividad ${activity?.id ?? ''}`;
}

// `YYYY-MM-DD` en hora local. Se compara como texto: `new Date('2026-09-14')`
// se interpreta como medianoche UTC y al oeste de Greenwich adelanta la regla
// un día.
export function getTodayIsoDate() {
  return new Date().toLocaleDateString('sv');
}

export function hasActivityStarted(startDate, todayIso = getTodayIsoDate()) {
  return Boolean(startDate) && todayIso > startDate;
}

// El backend deja cancelar hasta el día de inicio incluido: usa
// `LocalDate.now().isAfter(startDate)`, que ese mismo día todavía es falso.
export function canCancelRegistration(item, todayIso = getTodayIsoDate()) {
  const startDate = item.activity?.startDate ?? '';
  return CANCELLABLE_STATUSES.has(item.status) && !hasActivityStarted(startDate, todayIso);
}

const ACTION_TEST_ID_PREFIX = Object.freeze({
  'start-closure': 'action-enviar',
  certificate: 'action-cert',
  'view-closure': 'action-ver',
});

function buildAction(key, { to, label, variant }) {
  return { key, to, label, variant, testIdPrefix: ACTION_TEST_ID_PREFIX[key] };
}

// La acción de la tarjeta la decide el estado del cierre y de la actividad,
// nunca el componente.
export function getRegistrationAction(item) {
  const closureId = item.closureId ?? null;
  const activityClosed = Boolean(item.activityClosed);

  if (!closureId && !activityClosed && item.status === 'PENDING_CLOSURE') {
    return buildAction('start-closure', {
      to: `/closures/new?registrationId=${item.registrationId}`,
      label: 'Cerrar tu participación',
      variant: 'primary',
    });
  }

  if (closureId && activityClosed) {
    return buildAction('certificate', {
      to: `/closures/${closureId}/certificate`,
      label: 'Descargar certificado',
      variant: 'primary',
    });
  }

  if (closureId && !activityClosed) {
    return buildAction('view-closure', {
      to: `/closures/${closureId}`,
      label: 'Ver cierre',
      variant: 'secondary',
    });
  }

  return null;
}
