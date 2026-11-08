import { Card, EmptyState } from '../../../shared/ui';
import MetricProgressList from './MetricProgressList';

export default function DistributionProgressCard({ title, items, emptyTitle }) {
  const hasItems = items.length > 0;

  return (
    <Card as="article" className="dashboard-distribution-card">
      <h3>{title}</h3>
      {hasItems ? (
        <MetricProgressList items={items} />
      ) : (
        <EmptyState
          title={emptyTitle}
          description="No hay datos suficientes para los filtros seleccionados."
        />
      )}
    </Card>
  );
}
