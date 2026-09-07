import { useId } from 'react';
import { formatDashboardNumber } from './KpiRow';

const CHART_WIDTH = 760;
const LABEL_WIDTH = 210;
const VALUE_WIDTH = 80;
const PLOT_WIDTH = CHART_WIDTH - LABEL_WIDTH - VALUE_WIDTH;
const ROW_HEIGHT = 52;
const BAR_HEIGHT = 24;

export default function BarChart({
  data = [],
  title = 'Gráfico de barras',
  description = 'Comparación de los valores recibidos para cada categoría.',
  labelKey = 'label',
  valueKey = 'value',
  getLabel = (item) => item[labelKey],
  formatValue = formatDashboardNumber,
  emptyMessage = 'No hay datos para representar en el gráfico.',
}) {
  const titleId = useId();
  const descriptionId = useId();
  const items = Array.isArray(data) ? data : [];

  if (items.length === 0) {
    return <p className="bar-chart__empty" role="status">{emptyMessage}</p>;
  }

  const values = items.map((item) => {
    const value = Number(item[valueKey]);
    return Number.isFinite(value) && value > 0 ? value : 0;
  });
  const maximum = Math.max(...values, 0);
  const chartHeight = items.length * ROW_HEIGHT + 16;

  return (
    <div className="bar-chart__scroll" tabIndex={0} role="region" aria-label={title}>
      <svg
        className="bar-chart"
        viewBox={`0 0 ${CHART_WIDTH} ${chartHeight}`}
        role="img"
        aria-labelledby={`${titleId} ${descriptionId}`}
      >
        <title id={titleId}>{title}</title>
        <desc id={descriptionId}>{description}</desc>
        {items.map((item, index) => {
          const label = String(getLabel(item) ?? 'Sin categoría');
          const numericValue = values[index];
          const barWidth = maximum === 0 ? 0 : (numericValue / maximum) * PLOT_WIDTH;
          const y = index * ROW_HEIGHT + 8;

          return (
            <g key={item.id ?? `${label}-${index}`} className="bar-chart__row">
              <text className="bar-chart__label" x={LABEL_WIDTH - 12} y={y + 17} textAnchor="end">
                {label}
              </text>
              <rect
                className="bar-chart__track"
                x={LABEL_WIDTH}
                y={y}
                width={PLOT_WIDTH}
                height={BAR_HEIGHT}
                rx="5"
              />
              <rect
                className="bar-chart__bar"
                data-testid={`bar-${index}`}
                data-value={item[valueKey] ?? ''}
                x={LABEL_WIDTH}
                y={y}
                width={barWidth}
                height={BAR_HEIGHT}
                rx="5"
              />
              <text className="bar-chart__value" x={LABEL_WIDTH + PLOT_WIDTH + 12} y={y + 17}>
                {formatValue(item[valueKey])}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
