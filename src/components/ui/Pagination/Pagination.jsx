import { Button } from '../';

export default function Pagination({
  page,
  totalPages,
  onPageChange,
  ariaLabel = 'Paginación',
}) {
  const safeTotal = Math.max(totalPages, 1);

  return (
    <nav className="pagination" aria-label={ariaLabel}>
      <span>Página {page} de {safeTotal}</span>
      <div>
        <Button
          size="small"
          variant="secondary"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          ← Anterior
        </Button>
        <Button
          size="small"
          variant="secondary"
          disabled={page >= safeTotal}
          onClick={() => onPageChange(page + 1)}
        >
          Siguiente →
        </Button>
      </div>
    </nav>
  );
}
