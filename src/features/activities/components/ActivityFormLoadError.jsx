import { Link } from 'react-router-dom';
import { Button } from '../../../shared/ui';

export default function ActivityFormLoadError({ errorCopy, errorMessage, backPath, onRetry }) {
  return (
    <section className="activity-form-page activity-form-page--state">
      <h1>{errorCopy.title}</h1>
      <p role="alert">{errorMessage}</p>
      <div className="activity-form-page__success-actions">
        {errorCopy.canRetry && <Button onClick={onRetry}>Reintentar</Button>}
        <Link className="button button--secondary button--medium" to={backPath}>
          Volver
        </Link>
      </div>
    </section>
  );
}
