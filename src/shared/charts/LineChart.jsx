import { useId } from 'react';
import { formatDashboardNumber } from '../lib/formatNumber';

const CHART_WIDTH = 760;
const CHART_HEIGHT = 320;
const MARGIN = { top: 24, right: 24, bottom: 44, left: 64 };
const PLOT_WIDTH = CHART_WIDTH - MARGIN.left - MARGIN.right;
const PLOT_HEIGHT = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;
const GRID_STEPS = 4;

// Serie temporal: el eje X es el tiempo, no categorías sueltas. Se usa para la
// evolución (horas por año), donde lo que importa es la tendencia y no comparar
// barras entre sí.
export default function LineChart({
  data = [],
  title = 'Evolución',
  description = 'Evolución del valor a lo largo del tiempo.',
  xKey = 'year',
  yKey = 'value',
  getX = (item) => item[xKey],
  getY = (item) => item[yKey],
  formatValue = formatDashboardNumber,
  emptyMessage = 'No hay datos para representar en el gráfico.',
}) {
  const titleId = useId();
  const descriptionId = useId();
  const items = Array.isArray(data) ? data : [];

  if (items.length === 0) {
    return (
      <p className="line-chart__empty" role="status">
        {emptyMessage}
      </p>
    );
  }

  const values = items.map((item) => {
    const value = Number(getY(item));
    return Number.isFinite(value) && value > 0 ? value : 0;
  });
  const maximum = Math.max(...values, 0);
  const axisMaximum = maximum === 0 ? 1 : maximum;

  const pointAt = (index) => {
    const ratio = items.length === 1 ? 0.5 : index / (items.length - 1);
    const x = MARGIN.left + ratio * PLOT_WIDTH;
    const y = MARGIN.top + PLOT_HEIGHT - (values[index] / axisMaximum) * PLOT_HEIGHT;
    return { x, y };
  };

  const points = items.map((_, index) => pointAt(index));
  const polyline = points.map(({ x, y }) => `${x},${y}`).join(' ');
  const area = [
    `M ${points[0].x} ${MARGIN.top + PLOT_HEIGHT}`,
    ...points.map(({ x, y }) => `L ${x} ${y}`),
    `L ${points[points.length - 1].x} ${MARGIN.top + PLOT_HEIGHT}`,
    'Z',
  ].join(' ');
  const gridLines = Array.from({ length: GRID_STEPS + 1 }, (_, step) => {
    const ratio = step / GRID_STEPS;
    return {
      y: MARGIN.top + PLOT_HEIGHT - ratio * PLOT_HEIGHT,
      value: axisMaximum * ratio,
    };
  });

  return (
    <div className="line-chart__scroll">
      <svg
        className="line-chart"
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        role="img"
        aria-labelledby={`${titleId} ${descriptionId}`}
      >
        <title id={titleId}>{title}</title>
        <desc id={descriptionId}>{description}</desc>

        {gridLines.map((line) => (
          <g key={line.y}>
            <line
              className="line-chart__grid"
              x1={MARGIN.left}
              x2={MARGIN.left + PLOT_WIDTH}
              y1={line.y}
              y2={line.y}
            />
            <text className="line-chart__axis" x={MARGIN.left - 12} y={line.y + 4} textAnchor="end">
              {formatValue(Math.round(line.value))}
            </text>
          </g>
        ))}

        <path className="line-chart__area" d={area} />
        <polyline className="line-chart__line" points={polyline} />

        {items.map((item, index) => {
          const { x, y } = points[index];
          return (
            <g key={getX(item) ?? index}>
              <circle
                className="line-chart__point"
                data-testid={`line-point-${index}`}
                data-value={getY(item) ?? ''}
                cx={x}
                cy={y}
                r="5"
              />
              <text className="line-chart__value" x={x} y={y - 14} textAnchor="middle">
                {formatValue(getY(item))}
              </text>
              <text
                className="line-chart__label"
                x={x}
                y={MARGIN.top + PLOT_HEIGHT + 26}
                textAnchor="middle"
              >
                {String(getX(item) ?? '—')}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
