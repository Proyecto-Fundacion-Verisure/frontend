export default function Badge({ children, className = '', variant = 'neutral', ...props }) {
  return <span className={`badge badge--${variant} ${className}`.trim()} {...props}>{children}</span>;
}
