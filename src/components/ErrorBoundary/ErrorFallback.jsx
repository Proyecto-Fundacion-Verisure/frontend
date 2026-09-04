import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../ui';

export default function ErrorFallback({ error, resetErrorBoundary }) {
  const navigate = useNavigate();

  return (
    <section className="error-fallback" role="alert">
      <EmptyState
        icon={<span aria-hidden="true">⚠</span>}
        title="Algo salió mal"
        description={error.message}
        action={
          <div className="error-fallback__actions">
            <button
              type="button"
              className="button button--primary"
              onClick={() => navigate('/')}
            >
              Volver al inicio
            </button>
            <button
              type="button"
              className="button button--secondary"
              onClick={resetErrorBoundary}
            >
              Reintentar
            </button>
          </div>
        }
      />
    </section>
  );
}
