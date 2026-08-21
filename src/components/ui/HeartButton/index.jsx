export default function HeartButton({ active = false, ...props }) {
  return <button aria-label="Favorito" aria-pressed={active} {...props}>{active ? '♥' : '♡'}</button>;
}
