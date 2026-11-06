import { useNavigate } from 'react-router-dom';
import { TriangleAlert } from 'lucide-react';
import { EmptyState } from '../../shared/ui';

export default function ErrorFallback({ error, resetErrorBoundary }) {
  const navigate = useNavigate();

  return (
    <section className="error-fallback" role="alert">
      <EmptyState
        icon={<TriangleAlert aria-hidden="true" size={40} />}
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
