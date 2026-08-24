import { forwardRef } from 'react';
import Spinner from '../Spinner';

const Button = forwardRef(function Button(
  {
    children,
    className = '',
    variant = 'primary',
    size = 'medium',
    isLoading = false,
    loadingLabel = 'Cargando',
    disabled = false,
    type = 'button',
    ...props
  },
  ref,
) {
  const classes = ['button', `button--${variant}`, `button--${size}`, className]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      ref={ref}
      className={classes}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      type={type}
      {...props}
    >
      {isLoading && <Spinner className="button__spinner" label="" size="small" />}
      <span>{isLoading ? loadingLabel : children}</span>
    </button>
  );
});

export default Button;
