export default function Spinner({ className = '', label = 'Cargando', size = 'medium' }) {
  return (
    <span
      className={`spinner spinner--${size} ${className}`.trim()}
      role={label ? 'status' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : 'true'}
    />
  );
}
