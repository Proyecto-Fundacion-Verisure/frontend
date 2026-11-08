import { Link } from 'react-router-dom';
import { Button } from '../../../shared/ui';

export default function ActivityFormResult({
  resultCopy,
  errorMessage,
  isEditMode,
  backPath,
  onPublish,
  onContinueEditing,
  onReset,
}) {
  return (
    <section className="activity-form-page activity-form-page--success">
      <p className="activity-form-page__eyebrow">{resultCopy.eyebrow}</p>
      <h1>{resultCopy.title}</h1>
      <p>{resultCopy.description}</p>
      {errorMessage && (
        <p className="activity-form__error" role="alert">
          {errorMessage}
        </p>
      )}
      <div className="activity-form-page__success-actions">
        {resultCopy.showPublish && <Button onClick={onPublish}>{resultCopy.publishLabel}</Button>}
        {isEditMode ? (
          <Button variant="secondary" onClick={onContinueEditing}>
            {resultCopy.secondaryLabel}
          </Button>
        ) : (
          <Button variant="secondary" onClick={onReset}>
            {resultCopy.secondaryLabel}
          </Button>
        )}
        <Link className="button button--secondary button--medium" to={backPath}>
          Volver
        </Link>
      </div>
    </section>
  );
}
