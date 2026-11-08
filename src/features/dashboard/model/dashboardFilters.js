import { ACTIVITY_LINES } from '../../../shared/domain/activityLines';

// Año más antiguo con datos del programa; también es el mínimo del campo del filtro.
export const MIN_DASHBOARD_YEAR = 2000;

const ALLOWED_LINES = new Set(ACTIVITY_LINES.map(({ value }) => value));

// El año vacío es válido: significa «todos los años». Se pasa el año en curso
// como parámetro para que los tests no dependan del reloj real.
export function isValidDashboardYear(value, currentYear = new Date().getFullYear()) {
  if (value === '' || value === null || value === undefined) return true;
  const year = Number(value);
  return Number.isInteger(year) && year >= MIN_DASHBOARD_YEAR && year <= currentYear;
}

function isValidLine(value) {
  return ALLOWED_LINES.has(value);
}

// Lee la URL y devuelve solo valores sanos: lo inválido se trata como ausente
// y se marca para que el hook lo quite de la URL sin preguntar al backend.
export function parseDashboardFilters(searchParams, currentYear = new Date().getFullYear()) {
  const rawYear = searchParams.get('year') ?? '';
  const rawLine = searchParams.get('line') ?? '';

  const year = isValidDashboardYear(rawYear, currentYear) ? rawYear : '';
  const line = isValidLine(rawLine) ? rawLine : '';

  return {
    year,
    line,
    hasInvalidYear: Boolean(rawYear) && year === '',
    hasInvalidLine: Boolean(rawLine) && line === '',
  };
}

// La query real al backend: solo claves presentes y el año como número.
export function buildDashboardFilters({ year, line }) {
  return {
    ...(year ? { year: Number(year) } : {}),
    ...(line ? { line } : {}),
  };
}

// Los filtros viven en la URL para que el dashboard se pueda compartir y
// restaurar con «atrás»; este helper los vuelve a escribir al aplicar.
export function toDashboardSearchParams({ year, line }) {
  const params = new URLSearchParams();
  if (year) params.set('year', String(year));
  if (line) params.set('line', line);
  return params;
}
