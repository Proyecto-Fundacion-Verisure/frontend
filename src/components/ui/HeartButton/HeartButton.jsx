import { Heart } from 'lucide-react';
import Spinner from '../Spinner/Spinner';

export default function HeartButton({
  active = false,
  disabled = false,
  isLoading = false,
  className = '',
  'aria-label': ariaLabel,
  size = 20,
  ...props
}) {
  const isDisabled = disabled || isLoading;
  const label = ariaLabel ?? (active ? 'Quitar de favoritos' : 'Añadir a favoritos');

  return (
    <button
      type="button"
      className={`heart-button ${active ? 'heart-button--active' : ''} ${className}`.trim()}
      aria-label={label}
      aria-pressed={active}
      aria-busy={isLoading || undefined}
      disabled={isDisabled}
      {...props}
    >
      {isLoading ? (
        <Spinner size="small" label="" />
      ) : (
        <Heart
          size={size}
          fill={active ? 'currentColor' : 'none'}
          strokeWidth={active ? 2 : 1.8}
          aria-hidden="true"
          className="heart-button__icon"
        />
      )}
    </button>
  );
}
