import { Link } from 'react-router-dom';
import { Button } from '../../../shared/ui';

export default function MyVolunteeringError({ error, onRetry }) {
  const isUnauthorized = error?.status === 401;

  return (
    <section className="my-volunteering">
      {isUnauthorized && (
        <>
          <div className="my-volunteering__error" role="alert">
            Tu sesión ha expirado. Vuelve a iniciar sesión.
          </div>
          <Link to="/login" className="button button--primary">
            Iniciar sesión
          </Link>
        </>
      )}

      {!isUnauthorized && (
        <>
          <div className="my-volunteering__error" role="alert">
            {error?.message || 'No se han podido cargar tus inscripciones.'}
          </div>
          <Button onClick={onRetry}>Reintentar</Button>
        </>
      )}
    </section>
  );
}
