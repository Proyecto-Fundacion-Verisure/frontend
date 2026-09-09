import {
  Building2,
  CalendarCheck2,
  Clock3,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Card } from '../../components/ui';

export const KPI_DEFINITIONS = [
  { key: 'reportedHours', label: 'Horas de voluntariado', Icon: Clock3, suffix: ' h' },
  { key: 'activeVolunteers', label: 'Voluntarios únicos', Icon: Users },
  { key: 'finishedActivities', label: 'Actividades finalizadas', Icon: CalendarCheck2 },
  { key: 'activePartners', label: 'Entidades colaboradoras', Icon: Building2 },
];

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

export default function KpiRow({
  metrics = {},
  variations = {},
  definitions = KPI_DEFINITIONS,
  variationLabel = 'respecto al trimestre anterior',
  listLabel = 'Indicadores principales de impacto',
}) {
  return (
    <div className="kpi-row" role="list" aria-label={listLabel}>
      {definitions.map(({ key, label, Icon, suffix = '' }) => {
        const formattedValue = formatDashboardNumber(metrics[key]);
        const variation = Number(variations[key]);
        const formattedVariation = formatDashboardVariation(variations[key]);
        const VariationIcon = variation < 0 ? TrendingDown : TrendingUp;
        return (
          <Card as="article" className="kpi-card" key={key} role="listitem">
            <Icon className="kpi-card__icon" aria-hidden="true" size={24} />
            <dl>
              <div>
                <dt>{label}</dt>
                <dd>{formattedValue}{formattedValue === '—' ? '' : suffix}</dd>
              </div>
            </dl>
            {formattedVariation && (
              <p className={`kpi-card__variation kpi-card__variation--${variation < 0 ? 'negative' : 'positive'}`}>
                <VariationIcon aria-hidden="true" size={16} />
                <span>{formattedVariation} {variationLabel}</span>
              </p>
            )}
          </Card>
        );
      })}
    </div>
  );
}
