export default function EmptyState({ title = 'No hay resultados', children }) {
  return <section><h2>{title}</h2>{children}</section>;
}
