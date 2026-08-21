export default function Spinner({ label = 'Cargando' }) {
  return <span role="status" aria-label={label}>…</span>;
}
