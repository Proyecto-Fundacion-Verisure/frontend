/**
 * Fechas: comparar y pintar por día natural, no por instante.
 *
 * `new Date('2026-09-15')` no es el 15 de septiembre: es la medianoche **UTC** de
 * ese día, que en España cae el 14 a las 22:00 o a las 01:00 del 15 según el
 * horario de verano. Compararla con `new Date()` adelanta o atrasa el corte un
 * día entero, y el síntoma es un botón que desaparece antes de tiempo sin que
 * nada avise.
 *
 * El backend razona en `LocalDate`, sin zona: `LocalDate.now().isAfter(deadline)`.
 * Esto es su equivalente.
 */

/**
 * Lee `YYYY-MM-DD` —y también un ISO con hora, del que se queda solo el día—
 * como fecha del calendario local.
 *
 * Devuelve `null` si no hay nada legible, para que quien llame decida qué hacer
 * con una fecha que no entiende en vez de recibir un `Invalid Date`.
 */
export function parseLocalDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value ?? ''));
  if (!match) return null;
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * ¿Hoy es **estrictamente posterior** a esa fecha?
 *
 * El propio día del plazo devuelve `false`: quien tiene hasta el día 20 puede
 * apuntarse el 20, que es lo que hace el backend.
 */
export function isPastLocalDate(value) {
  const date = parseLocalDate(value);
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today > date;
}

const DEFAULT_FORMAT = { day: 'numeric', month: 'short', year: 'numeric' };

/**
 * Pinta una **fecha de calendario** —`startDate`, `endDate`, `registrationDeadline`—,
 * que el backend manda como `LocalDate`, o sea `"2026-09-15"`.
 *
 * Pasa por `parseLocalDate` y no por `new Date(value)` a propósito: ese
 * constructor interpreta la cadena como medianoche UTC, así que al oeste de
 * Greenwich pinta el día anterior. Aquí no hay zona que aplicar, porque el dato
 * no la tiene.
 *
 * Para un instante de verdad —`createdAt`, `requestedAt`— la función es
 * `formatDateTime`, que sí quiere convertir a hora local.
 */
export function formatDate(value, options = DEFAULT_FORMAT) {
  const date = parseLocalDate(value);
  if (!date) return '—';
  return new Intl.DateTimeFormat('es-ES', options).format(date);
}

/**
 * Pinta un **instante** —lo que el backend manda como `Instant` u
 * `OffsetDateTime`— en la hora local de quien mira.
 */
export function formatDateTime(value, options = DEFAULT_FORMAT) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-ES', options).format(date);
}

/**
 * Un rango de fechas tal como se lee en voz alta: si empieza y acaba el mismo
 * día, una sola fecha, no la misma repetida dos veces.
 */
export function formatDateRange(start, end, options = DEFAULT_FORMAT) {
  const from = parseLocalDate(start);
  const to = parseLocalDate(end);
  if (!from && !to) return '—';
  if (!from) return formatDate(end, options);
  if (!to || from.getTime() === to.getTime()) return formatDate(start, options);
  return `${formatDate(start, options)} — ${formatDate(end, options)}`;
}
