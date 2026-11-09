import { useId } from 'react';
import { formatDashboardNumber } from '../lib/formatNumber';

const SIZE = 220;
const CENTER = SIZE / 2;
const RADIUS = 74;
const STROKE = 28;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SEGMENT_CLASSES = 6;

// Parte de un todo: cada sector es una porción del total, no una magnitud
// suelta. Se usa para distribuciones (por modalidad, ubicación o línea), donde
// lo que se lee es «cuánto pesa cada categoría».
export default function DonutChart({
  data = [],
  title = 'Distribución',
  description = 'Reparto del total entre sus categorías.',
  labelKey = 'label',
  valueKey = 'value',
  getLabel = (item) => item[labelKey],
  getValue = (item) => item[valueKey],
  formatValue = formatDashboardNumber,
  valueSuffix = '',
  emptyMessage = 'No hay datos para representar en el gráfico.',
}) {
  const titleId = useId();
  const descriptionId = useId();
  const items = Array.isArray(data) ? data : [];

  const values = items.map((item) => {
    const value = Number(getValue(item));
    return Number.isFinite(value) && value > 0 ? value : 0;
  });
  const total = values.reduce((sum, value) => sum + value, 0);
  const hasSegments = total > 0;

  const segments = [];
  let offset = 0;
  values.forEach((value, index) => {
    if (!hasSegments || value === 0) return;

    const length = (value / total) * CIRCUMFERENCE;
    segments.push({
      key: getLabel(items[index]) ?? index,
      length,
      offset,
      index,
      percentage: (value / total) * 100,
    });
    offset += length;
  });

  return (
    <div className="donut-chart">
      {hasSegments && (
        <svg
          className="donut-chart__figure"
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="img"
          aria-labelledby={`${titleId} ${descriptionId}`}
        >
          <title id={titleId}>{title}</title>
          <desc id={descriptionId}>{description}</desc>
          <circle
            className="donut-chart__track"
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            strokeWidth={STROKE}
          />
          {segments.map((segment) => (
            <circle
              key={segment.key}
              className={`donut-chart__segment donut-chart__segment--${
                (segment.index % SEGMENT_CLASSES) + 1
              }`}
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              strokeWidth={STROKE}
              strokeDasharray={`${segment.length} ${CIRCUMFERENCE - segment.length}`}
              strokeDashoffset={-segment.offset}
              data-testid={`donut-segment-${segment.index}`}
              data-percentage={segment.percentage.toFixed(1)}
            />
          ))}
          <text className="donut-chart__total" x={CENTER} y={CENTER - 4} textAnchor="middle">
            {formatValue(total)}
            {valueSuffix}
          </text>
          <text className="donut-chart__total-label" x={CENTER} y={CENTER + 18} textAnchor="middle">
            total
          </text>
        </svg>
      )}

      {!hasSegments && (
        <p className="donut-chart__empty" role="status">
          {emptyMessage}
        </p>
      )}

      <ul className="donut-chart__legend">
        {items.map((item, index) => {
          const percentage = hasSegments ? (values[index] / total) * 100 : 0;
          return (
            <li key={getLabel(item) ?? index} className="donut-chart__legend-item">
              <span
                className={`donut-chart__swatch donut-chart__segment--${
                  (index % SEGMENT_CLASSES) + 1
                }`}
                aria-hidden="true"
              />
              <span className="donut-chart__legend-label">{getLabel(item) ?? 'Sin categoría'}</span>
              <span className="donut-chart__legend-value">
                {formatValue(getValue(item))}
                {valueSuffix} · {formatDashboardNumber(percentage)} %
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
