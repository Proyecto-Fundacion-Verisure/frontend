export function formatDashboardNumber(value) {
  if (value === null || value === undefined || value === '') return '—';
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return '—';
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(numericValue);
}

export function formatDashboardVariation(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return null;
  const sign = numericValue > 0 ? '+' : '';
  return `${sign}${formatDashboardNumber(numericValue)} %`;
}
