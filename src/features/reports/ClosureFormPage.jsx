import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { getClosure, submitClosure } from '../../api/closuresApi';
import { Button, Input, Select, Spinner, Textarea } from '../../components/ui';
import { formatDateTime } from '../../utils/dates';
import { useRegistrationsOptional } from '../registrations/RegistrationsContext';

const MAX_EVIDENCE_SIZE = 10 * 1024 * 1024;
const ALLOWED_EVIDENCE_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);

function formatBytes(bytes) {
  if (bytes == null || !Number.isFinite(bytes) || bytes <= 0) return '';
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const emptyValues = {
  actualHours: '',
  rating: '',
  comment: '',
  evidenceConsent: false,
};

function validate(values, evidence, registrationId) {
  const errors = {};
  if (!registrationId) errors.registrationId = 'No se ha indicado la inscripción.';
  if (!values.actualHours || Number(values.actualHours) <= 0) {
    errors.actualHours = 'Indica las horas realizadas.';
  }
  if (!values.rating || Number(values.rating) < 1 || Number(values.rating) > 5) {
    errors.rating = 'Selecciona una valoración entre 1 y 5.';
  }
  if (evidence && !ALLOWED_EVIDENCE_TYPES.has(evidence.type)) {
    errors.evidence = 'La evidencia debe ser PDF, JPG o PNG.';
  } else if (evidence && evidence.size > MAX_EVIDENCE_SIZE) {
    errors.evidence = 'La evidencia no puede superar los 10 MB.';
  }
  if (evidence && !values.evidenceConsent) {
    errors.evidenceConsent = 'Debes autorizar el tratamiento de la evidencia.';
  }
  return errors;
}

// Un cierre no se corrige: `POST /closures` siempre crea y el backend rechaza
// un segundo envío de la misma inscripción con `CLOSURE_ALREADY_CLOSED`. El
// detalle es solo lectura, tanto recién enviado como al volver desde
// «Mis voluntariados».
function ClosureDetail({ closure, justCreated = false }) {
  return (
    <section className="report-form-page" aria-labelledby="closure-detail-title">
      <Link to="/my-volunteering">← Volver a mis voluntariados</Link>
      <p className="activity-form-page__eyebrow">Cierre de participación</p>
      <h1 id="closure-detail-title">Detalle del cierre</h1>
      {justCreated && (
        <p className="closure-form__notice" role="status" data-testid="closure-created-notice">
          Cierre enviado. Se ha registrado tu participación.
        </p>
      )}
      <dl>
        {closure.activityTitle && <div><dt>Actividad</dt><dd>{closure.activityTitle}</dd></div>}
        <div><dt>Horas realizadas</dt><dd>{closure.actualHours ?? '—'}</dd></div>
        <div><dt>Valoración</dt><dd>{closure.rating ? `${closure.rating} de 5` : '—'}</dd></div>
        <div><dt>Comentario</dt><dd>{closure.comment || 'Sin comentario'}</dd></div>
        <div>
          <dt>Evidencia</dt>
          <dd>
            {closure.evidenceUrl
              ? <a href={closure.evidenceUrl} target="_blank" rel="noreferrer">Ver evidencia adjunta</a>
              : 'Sin evidencia'}
          </dd>
        </div>
        {closure.submittedAt && <div><dt>Enviado el</dt><dd>{formatDateTime(closure.submittedAt)}</dd></div>}
      </dl>
      <p>
        Cuando la Fundación cierre la actividad podrás descargar tu certificado desde «Mis voluntariados».
      </p>
    </section>
  );
}

export default function ClosureFormPage() {
  const { closureId } = useParams();
  const [searchParams] = useSearchParams();
  const isDetail = Boolean(closureId);

  const [values, setValues] = useState(emptyValues);
  const [evidence, setEvidence] = useState(null);
  const [evidenceUrl, setEvidenceUrl] = useState(null);
  const evidenceInputRef = useRef(null);
  const [errors, setErrors] = useState({});
  const [requestState, setRequestState] = useState(isDetail ? 'loading' : 'idle');
  const [closure, setClosure] = useState(null);
  const [requestError, setRequestError] = useState('');
  const [loadStatus, setLoadStatus] = useState(null);

  const registrationId = searchParams.get('registrationId');
  // `/closures/new` cuelga de `RegistrationsProvider`, que ya trae
  // `/registrations/me` con la actividad de cada inscripción: de ahí sale el
  // título sin otra petición. El hook es opcional porque el detalle
  // (`/closures/:closureId`) vive fuera del provider.
  const registrationsContext = useRegistrationsOptional();
  const registration = registrationsContext?.registrations?.find(
    (item) => String(item.registrationId) === String(registrationId),
  );
  const activityTitle = registration?.activity?.title ?? null;

  // La vista previa usa una URL temporal (`URL.createObjectURL`). Esta limpieza
  // la libera al retirar el archivo y al desmontar el componente: sin ella cada
  // selección dejaría una URL colgada en memoria.
  useEffect(() => () => {
    if (evidenceUrl) URL.revokeObjectURL(evidenceUrl);
  }, [evidenceUrl]);

  const loadClosure = useCallback(async () => {
    if (!closureId) return;
    setRequestState('loading');
    setRequestError('');
    setLoadStatus(null);
    try {
      const { data } = await getClosure(closureId);
      setClosure(data);
      setRequestState('success');
    } catch (error) {
      setLoadStatus(error?.status ?? null);
      setRequestError(error?.message || 'No hemos podido cargar el cierre.');
      setRequestState('error');
    }
  }, [closureId]);

  useEffect(() => {
    void loadClosure();
  }, [loadClosure]);

  const updateValue = (event) => {
    const { name, value, checked, type } = event.target;
    setValues((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleEvidenceChange = (event) => {
    const file = event.target.files?.[0] ?? null;
    setEvidence(file);
    setEvidenceUrl(file?.type.startsWith('image/') ? URL.createObjectURL(file) : null);
    setErrors((current) => ({ ...current, evidence: undefined, evidenceConsent: undefined }));
  };

  const handleRemoveEvidence = () => {
    if (evidenceInputRef.current) evidenceInputRef.current.value = '';
    setEvidence(null);
    setEvidenceUrl(null);
    setErrors((current) => ({ ...current, evidence: undefined, evidenceConsent: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate(values, evidence, registrationId);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setRequestState('submitting');
    setRequestError('');
    try {
      const request = {
        registrationId: Number(registrationId),
        actualHours: Number(values.actualHours),
        rating: Number(values.rating),
        comment: values.comment.trim() || undefined,
        evidenceConsent: values.evidenceConsent,
      };
      const response = await submitClosure(request, evidence);
      setClosure(response?.data ?? {});
      setRequestState('success');
    } catch (error) {
      const nextErrors = error?.fieldErrors && typeof error.fieldErrors === 'object'
        ? { ...error.fieldErrors }
        : {};
      // Los 413 (tamaño) y 415 (tipo) del multipart no llegan asociados a un
      // campo: se pintan junto al control de evidencia, no como error global.
      if ((error?.status === 413 || error?.status === 415) && !nextErrors.evidence) {
        nextErrors.evidence = error?.message || 'No se pudo adjuntar la evidencia.';
      }
      setErrors(nextErrors);
      setRequestError(Object.keys(nextErrors).length ? '' : (error?.message || 'No hemos podido enviar el cierre.'));
      setRequestState('idle');
    }
  };

  if (requestState === 'loading') {
    return <Spinner label="Cargando cierre…" />;
  }

  if (isDetail && requestState === 'error') {
    const isForbidden = loadStatus === 403;
    const isNotFound = loadStatus === 404;
    return (
      <section className="report-form-page" aria-labelledby="closure-load-error">
        <h1 id="closure-load-error">
          {isNotFound
            ? 'No hemos encontrado este cierre'
            : isForbidden
              ? 'No tienes permiso para consultar este cierre'
              : 'No hemos podido cargar el cierre'}
        </h1>
        <p role="alert">{requestError}</p>
        {!isForbidden && !isNotFound && <Button onClick={loadClosure}>Reintentar</Button>}
        <Link className="button button--secondary button--medium" to="/my-volunteering">
          Volver a mis voluntariados
        </Link>
      </section>
    );
  }

  if (requestState === 'success') return <ClosureDetail closure={closure} justCreated={!isDetail} />;

  return (
    <section className="report-form-page" aria-labelledby="closure-form-title">
      <Link to="/my-volunteering">← Volver a mis voluntariados</Link>
      <p className="activity-form-page__eyebrow">Cierre de participación</p>
      <h1 id="closure-form-title">Cerrar tu participación</h1>
      {activityTitle && (
        <p className="closure-form__activity" data-testid="closure-activity-title">{activityTitle}</p>
      )}
      <p>Indica las horas realizadas y tu valoración de la experiencia. El cierre se envía una sola vez.</p>

      {errors.registrationId && <p role="alert">{errors.registrationId}</p>}
      <form onSubmit={handleSubmit} noValidate>
        <Input
          type="number"
          min="0.1"
          step="0.1"
          name="actualHours"
          label="Horas realizadas"
          value={values.actualHours}
          onChange={updateValue}
          error={errors.actualHours}
          required
        />
        <Select
          name="rating"
          label="Valoración"
          value={values.rating}
          onChange={updateValue}
          error={errors.rating}
          required
        >
          <option value="">Selecciona una valoración</option>
          {[1, 2, 3, 4, 5].map((rating) => (
            <option key={rating} value={rating}>{rating}</option>
          ))}
        </Select>
        <Textarea
          name="comment"
          label="Comentario"
          value={values.comment}
          onChange={updateValue}
          rows={4}
        />
        <div className={errors.evidence ? 'field field--error' : 'field'}>
          <label className="field__label" htmlFor="closure-evidence">Evidencia (opcional)</label>
          <input
            ref={evidenceInputRef}
            id="closure-evidence"
            className="field__control"
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            onChange={handleEvidenceChange}
            aria-describedby={errors.evidence ? 'closure-evidence-error' : undefined}
            aria-invalid={Boolean(errors.evidence)}
          />
          {evidence && (
            <div className="closure-form__file" data-testid="closure-file-preview">
              {evidence.type.startsWith('image/') && evidenceUrl ? (
                <img className="closure-form__file-preview" src={evidenceUrl} alt="" />
              ) : (
                <span className="closure-form__file-badge" aria-hidden="true">
                  {evidence.type === 'application/pdf' ? 'PDF' : 'IMG'}
                </span>
              )}
              <div className="closure-form__file-info">
                <span className="closure-form__file-name" data-testid="closure-file-name">{evidence.name}</span>
                <span className="closure-form__file-size" data-testid="closure-file-size">{formatBytes(evidence.size)}</span>
              </div>
              <div className="closure-form__file-actions">
                <Button
                  type="button"
                  variant="secondary"
                  size="small"
                  onClick={handleRemoveEvidence}
                  data-testid="closure-remove-evidence"
                >
                  Retirar archivo
                </Button>
              </div>
            </div>
          )}
          {errors.evidence && <span id="closure-evidence-error" className="field__error" role="alert">{errors.evidence}</span>}
        </div>
        <label
          className={`closure-form__consent${errors.evidenceConsent ? ' closure-form__consent--error' : ''}`}
          htmlFor="evidence-consent"
        >
          <input
            id="evidence-consent"
            type="checkbox"
            name="evidenceConsent"
            checked={values.evidenceConsent}
            onChange={updateValue}
            aria-invalid={Boolean(errors.evidenceConsent)}
          />
          <span>Autorizo el tratamiento de la evidencia adjunta.</span>
        </label>
        {errors.evidenceConsent && <p role="alert">{errors.evidenceConsent}</p>}
        {requestError && <p role="alert">{requestError}</p>}
        <div className="closure-form__actions">
          <Button
            type="submit"
            isLoading={requestState === 'submitting'}
            loadingLabel="Enviando cierre…"
          >
            Enviar cierre
          </Button>
        </div>
      </form>
    </section>
  );
}