import { Table } from '../../components/ui';
import { formatDashboardNumber } from './KpiRow';

export default function ChartTable({
  data = [],
  caption = 'Datos equivalentes al gráfico',
  categoryLabel = 'Categoría',
  valueLabel = 'Valor',
  labelKey = 'label',
  valueKey = 'value',
  getLabel = (item) => item[labelKey],
  formatValue = formatDashboardNumber,
}) {
  const rows = (Array.isArray(data) ? data : []).map((item, index) => ({
    ...item,
    __chartRowId: item.id ?? `${getLabel(item) ?? 'category'}-${index}`,
  }));
  const columns = [
    {
      key: 'category',
      label: categoryLabel,
      render: (item) => getLabel(item) ?? 'Sin categoría',
    },
    {
      key: 'value',
      label: valueLabel,
      render: (item) => formatValue(item[valueKey]),
    },
  ];

  return (
    <Table
      className="chart-table"
      caption={caption}
      columns={columns}
      data={rows}
      rowKey="__chartRowId"
      emptyMessage="No hay datos para mostrar."
    />
  );
}
