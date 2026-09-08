import { formatDashboardNumber } from './KpiRow';

function clampPercentage(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return 0;
  return Math.min(100, Math.max(0, numericValue));
}

export default function MetricProgressList({ items = [], valueSuffix = '%', showHeading = true }) {
  return (
    <ul className="metric-progress-list">
      {items.map((item, index) => {
        const percentage = clampPercentage(item.value);
        const label = item.label ?? `Indicador ${index + 1}`;
        return (
          <li key={item.id ?? label} className="metric-progress-list__item">
            {showHeading && (
              <div className="metric-progress-list__heading">
                <span>{label}</span>
                <strong>{formatDashboardNumber(item.value)}{valueSuffix}</strong>
              </div>
            )}
            <div
              className="metric-progress-list__track"
              role="progressbar"
              aria-label={label}
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={percentage}
            >
              <span
                className="metric-progress-list__bar"
                style={{ '--progress-value': `${percentage}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
