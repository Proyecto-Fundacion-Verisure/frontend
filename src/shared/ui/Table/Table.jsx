export default function Table({
  columns = [],
  data = [],
  caption,
  emptyMessage = 'No hay datos disponibles',
  rowKey = 'id',
  getRowProps,
  className = '',
}) {
  return (
    <div className="table-wrapper" role="region" aria-label={caption} tabIndex={0}>
      <table className={`table ${className}`.trim()}>
        {caption && <caption>{caption}</caption>}
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className={column.className}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length ? data.map((row, index) => (
            <tr key={row[rowKey] ?? index} {...getRowProps?.(row, index)}>
              {columns.map((column) => (
                <td key={column.key} data-label={column.label} className={column.className}>
                  {column.render ? column.render(row, index) : row[column.key]}
                </td>
              ))}
            </tr>
          )) : (
            <tr>
              <td className="table__empty" colSpan={Math.max(columns.length, 1)}>{emptyMessage}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
