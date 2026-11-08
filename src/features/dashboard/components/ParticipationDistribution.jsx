import { BarChart, ChartTable } from '../../../shared/charts';
import { Card, EmptyState } from '../../../shared/ui';

// Barras + tabla de «personas participantes por X». `DepartmentEntry` trae
// `department` y no `label` ni `id`; `ParticipationEntry` (organización y
// línea) trae `id` y `label`. Por eso `labelKey` es configurable y `BarChart`
// cae a la etiqueta como `key` cuando no hay `id`.
export default function ParticipationDistribution({
  data,
  title,
  description,
  categoryLabel,
  labelKey,
}) {
  const lowerTitle = title.charAt(0).toLowerCase() + title.slice(1);
  const hasData = data.length > 0;

  return (
    <Card as="article" className="dashboard-distribution-card dashboard-distribution-card--wide">
      <header>
        <h3>{title}</h3>
        <p>{description}</p>
      </header>
      {hasData ? (
        <div className="dashboard-distribution-card__content">
          <BarChart
            data={data}
            title={title}
            description={description}
            labelKey={labelKey}
            valueKey="participants"
          />
          <ChartTable
            data={data}
            caption={`Tabla de ${lowerTitle}`}
            categoryLabel={categoryLabel}
            valueLabel="Participantes"
            labelKey={labelKey}
            valueKey="participants"
          />
        </div>
      ) : (
        <EmptyState
          title={`Sin ${lowerTitle}`}
          description="No hay datos suficientes para los filtros seleccionados."
        />
      )}
    </Card>
  );
}
