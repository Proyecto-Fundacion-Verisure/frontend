import { Link } from 'react-router-dom';
import { Button } from '../../../shared/ui';

export default function RegistrationsLoadError({ error, onRetry }) {
  const isForbidden = error?.status === 403;

  return (
    <section className="registrations-page registrations-page--state">
      <h1>
        {isForbidden
          ? 'No tienes permiso para consultar las inscripciones'
          : 'No hemos podido cargar las inscripciones'}
      </h1>
      <p role="alert">{error?.message || 'Inténtalo de nuevo.'}</p>
      <div className="registrations-page__state-actions">
        {!isForbidden && <Button onClick={onRetry}>Reintentar</Button>}
        <Link className="button button--secondary button--medium" to="/admin/activities">
          Volver a actividades
        </Link>
      </div>
    </section>
  );
}
