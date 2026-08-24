export default function EmptyState({
  title = 'No hay resultados',
  description,
  icon,
  action,
  children,
  className = '',
  ...props
}) {
  return (
    <section className={`empty-state ${className}`.trim()} {...props}>
      {icon && <div className="empty-state__icon" aria-hidden="true">{icon}</div>}
      <h2 className="empty-state__title">{title}</h2>
      {description && <p className="empty-state__description">{description}</p>}
      {children}
      {action && <div className="empty-state__action">{action}</div>}
    </section>
  );
}
