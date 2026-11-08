// Secciones, badges y agrupación del tablero de inscripciones.
// Aquí no hay React: la página y el hook solo coordinan estado y pintado.
export const REGISTRATION_SECTIONS = Object.freeze([
  { key: 'waitlisted', title: 'En lista de espera' },
  { key: 'confirmed', title: 'Confirmadas' },
  { key: 'pending-report', title: 'Pendientes de cierre' },
  { key: 'closed', title: 'Cerradas' },
  { key: 'rejected', title: 'Rechazadas' },
  { key: 'cancelled', title: 'Canceladas' },
]);

export const REGISTRATION_STATUS_BADGES = Object.freeze({
  unreviewed: { label: 'Sin revisar', variant: 'warning' },
  'accepted-waitlist': { label: 'Aceptada · en lista de espera', variant: 'info' },
  confirmed: { label: 'Confirmada', variant: 'success' },
  'pending-report': { label: 'Pendiente de cierre', variant: 'warning' },
  closed: { label: 'Cerrada', variant: 'neutral' },
  rejected: { label: 'Rechazada', variant: 'danger' },
  cancelled: { label: 'Cancelada', variant: 'danger' },
});

const SECTION_BY_STATUS = Object.freeze({
  CONFIRMED: 'confirmed',
  PENDING_CLOSURE: 'pending-report',
  CLOSED: 'closed',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
});

// Estados en los que la fila todavía admite una decisión de la administración.
const ACTIONABLE_STATUSES = Object.freeze(['WAITLISTED', 'CONFIRMED', 'PENDING_CLOSURE']);

const FALLBACK_SECTION_KEY = 'unreviewed';

export function getSectionKey(registration) {
  if (registration.status === 'WAITLISTED') {
    return registration.accepted ? 'accepted-waitlist' : 'unreviewed';
  }
  return SECTION_BY_STATUS[registration.status] ?? FALLBACK_SECTION_KEY;
}

export function getSectionStatusBadge(registration) {
  return (
    REGISTRATION_STATUS_BADGES[getSectionKey(registration)] ?? REGISTRATION_STATUS_BADGES.unreviewed
  );
}

function appendRegistration(grouped, registration) {
  const key = getSectionKey(registration);
  grouped[key] = [...(grouped[key] ?? []), registration];
  return grouped;
}

export function groupRegistrationsBySection(registrations) {
  return registrations.reduce(appendRegistration, {});
}

// «En lista de espera» agrupa las sin revisar y las aceptadas.
export function getSectionRows(grouped, sectionKey) {
  if (sectionKey === 'waitlisted') {
    return [...(grouped.unreviewed ?? []), ...(grouped['accepted-waitlist'] ?? [])];
  }
  return grouped[sectionKey] ?? [];
}

export function hasRowActions(registration) {
  return ACTIONABLE_STATUSES.includes(registration.status);
}

// La respuesta es el Page de Spring, así que las filas van en `content`.
export function getRegistrations(payload) {
  return Array.isArray(payload?.content) ? payload.content : [];
}

// El encabezado cuenta toda la actividad, no la página visible.
export function getBoardTotals(board, registrations) {
  return {
    totalElements: Number(board?.totalElements) || registrations.length,
    totalPages: Math.max(Number(board?.totalPages) || 1, 1),
  };
}

export function getSection(sectionKey) {
  return REGISTRATION_SECTIONS.find(({ key }) => key === sectionKey) ?? REGISTRATION_SECTIONS[0];
}

export function getSectionTabs(grouped) {
  return REGISTRATION_SECTIONS.map(({ key, title }) => ({
    id: key,
    label: title,
    count: getSectionRows(grouped, key).length,
  }));
}

export function getSectionCaption({ isGlobal, sectionTitle }) {
  return isGlobal ? sectionTitle : `${sectionTitle} de la actividad`;
}

export function getEmptySectionTitle(section) {
  return `No hay inscripciones ${section.title.toLowerCase()}`;
}

export function getCountsSummary(counts) {
  if (!counts) return null;

  const unreviewedSuffix =
    counts.unreviewed > 0 ? `, de las que ${counts.unreviewed} sin revisar` : '';

  return `Confirmadas ${counts.confirmed} · En lista de espera ${counts.waitlisted}${unreviewedSuffix}`;
}
