export default function Card({ as: Component = 'article', children, className = '', interactive = false, ...props }) {
  const classes = ['card', interactive && 'card--interactive', className].filter(Boolean).join(' ');
  return <Component className={classes} {...props}>{children}</Component>;
}
