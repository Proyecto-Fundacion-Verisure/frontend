import { KPI_DEFINITIONS } from '../../../shared/charts';

// Series de la respuesta del contrato: si alguna tiene filas, hay dashboard.
const DISTRIBUTION_KEYS = [
  'effectiveness',
  'participationByDepartment',
  'participationByOrganization',
  'participationByLine',
  'distributionByMode',
  'distributionByLocation',
  'favoriteRanking',
];

function toList(value) {
  return Array.isArray(value) ? value : [];
}

export function hasDashboardData(data) {
  if (!data || typeof data !== 'object') return false;

  const metrics = data.kpis ?? data;
  const hasMetric = KPI_DEFINITIONS.some(
    ({ key }) => Object.prototype.hasOwnProperty.call(metrics, key) && metrics[key] !== null,
  );

  return (
    hasMetric || DISTRIBUTION_KEYS.some((key) => Array.isArray(data[key]) && data[key].length > 0)
  );
}

// La respuesta puede llegar sin `kpis` (formato antiguo) o con series ausentes:
// aquí se aplana una sola vez para que la página reciba listas y mapas seguros.
export function normalizeDashboardData(data) {
  const source = data ?? {};

  return {
    hasData: hasDashboardData(data),
    isMockData: source.dataSource === 'mock',
    metrics: source.kpis ?? source,
    variations: source.impactVariations ?? source.variations ?? {},
    effectiveness: toList(source.effectiveness),
    departmentData: toList(source.participationByDepartment),
    organizationData: toList(source.participationByOrganization),
    lineData: toList(source.participationByLine),
    modeData: toList(source.distributionByMode),
    locationData: toList(source.distributionByLocation),
    rankingData: toList(source.favoriteRanking),
  };
}
