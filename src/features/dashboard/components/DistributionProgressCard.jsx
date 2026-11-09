import { Card, EmptyState } from '../../../shared/ui';
import { DonutChart } from '../../../shared/charts';

export default function DistributionProgressCard({ title, items, emptyTitle }) {
  const hasItems = items.length > 0;

  return (
    <Card as="article" className="dashboard-distribution-card">
      <h3>{title}</h3>
      {hasItems ? (
        <DonutChart
          data={items}
          title={title}
          description={`Reparto del total entre las categorías de ${title.toLowerCase()}`}
          labelKey="label"
          valueKey="value"
          valueSuffix=" %"
        />
      ) : (
        <EmptyState
          title={emptyTitle}
          description="No hay datos suficientes para los filtros seleccionados."
        />
      )}
    </Card>
  );
}
