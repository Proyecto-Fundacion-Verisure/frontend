import { Card, EmptyState } from '../../../shared/ui';
import { formatDashboardNumber } from '../../../shared/lib/formatNumber';
import MetricProgressList from './MetricProgressList';

export default function EffectivenessGrid({ metrics }) {
  const hasMetrics = metrics.length > 0;

  return (
    <>
      {!hasMetrics && (
        <Card>
          <EmptyState
            title="Todavía no hay datos de eficacia"
            description="Las tasas aparecerán cuando existan inscripciones y participaciones cerradas."
          />
        </Card>
      )}
      {hasMetrics && (
        <div className="effectiveness-grid">
          {metrics.map((metric) => (
            <Card as="article" className="effectiveness-card" key={metric.id ?? metric.label}>
              <div className="effectiveness-card__heading">
                <h3>{metric.label}</h3>
                <strong>{formatDashboardNumber(metric.value)} %</strong>
              </div>
              <MetricProgressList items={[metric]} showHeading={false} />
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
