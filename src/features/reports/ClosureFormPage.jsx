import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { getClosure, submitClosure } from '../../api/closuresApi';
import { Button, Input, Select, Spinner, Textarea } from '../../components/ui';

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

function valuesFromClosure(closure) {
  return {
    actualHours: closure?.actualHours != null ? String(closure.actualHours) : '',
    rating: closure?.rating != null ? String(closure.rating) : '',
    comment: closure?.comment ?? '',
    evidenceConsent: Boolean(closure?.evidenceConsent),
  };
}

function ClosureDetail({ closure, submitStatus, closureId }) {
  return (
    <section className="report-form-page" aria-labelledby="closure-detail-title">
      <p className="activity-form-page__eyebrow">Cierre de participación</p>
      <h1 id="closure-detail-title">Detalle del cierre</h1>
      {submitStatus === 'corrected' && (
        <p className="closure-form__notice" role="status" data-testid="closure-updated-notice">
          Cierre actualizado. Se ha conservado la identificación
          {closureId ? ` (${closureId})` : ''} y no se ha creado otro cierre.
        </p>
      )}
      {submitStatus === 'created' && (
        <p className="closure-form__notice" role="status" data-testid="closure-created-notice">
          Cierre enviado. Se ha registrado tu participación.
        </p>
      )}
      <dl>
        <div><dt>Horas realizadas</dt><dd>{closure.actualHours ?? '—'}</dd></div>
        <div><dt>Valoración</dt><dd>{closure.rating ? `${closure.rating} de 5` : '—'}</dd></div>
        <div><dt>Comentario</dt><dd>{closure.comment || 'Sin comentario'}</dd></div>
      </dl>
      <Link className="button button--secondary button--medium" to="/my-volunteering">
        Volver a mis voluntariados
      </Link>
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
  const [submitStatus, setSubmitStatus] = useState(null);

  // En la corrección el id no viaja en la ruta: viene del cierre ya cargado.
  // En el envío nuevo llega como query param `registrationId`.
  const registrationId = searchParams.get('registrationId') ?? closure?.registrationId ?? null;

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
      setValues(valuesFromClosure(data));
      setRequestState('idle');
      setSubmitStatus(null);
    } catch (error) {
      setLoadStatus(error?.status ?? null);
      setRequestError(error?.message || 'No hemos podido cargar el cierre.');
      setRequestState('error');
    }
  }, [closureId]);

  useEffect(() => {
    void loadClosure();
  }, [loadClosure]);

  // Horas de referencia para el aviso de desviación: si el backend v2 acaba
  // incorporando las previstas, se usan; si no, la referencia es lo enviado en
  // el cierre anterior, que es justo lo que la corrección puede reducir.
  const referenceHours = useMemo(() => {
    const hours = closure?.expectedHours ?? closure?.plannedHours ?? closure?.actualHours;
    if (hours == null || hours === '') return null;
    const parsed = Number(hours);
    return Number.isFinite(parsed) ? parsed : null;
  }, [closure]);

  const enteredHours = values.actualHours === '' ? NaN : Number(values.actualHours);
  const showsDeviation = referenceHours !== null
    && Number.isFinite(enteredHours)
    && enteredHours < referenceHours;

  // Nota de devolución del administrador (contrato: `adminNote`, con `returnNote`
  // como reserva). Solo se muestra cuando el estado es RETURNED.
  const returnedNote = closure?.adminNote ?? closure?.returnNote ?? '';

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
      // 201 creación · 200 corrección. El multipart de POST /closures no lleva
      // id en la ruta: cuando corregimos, conservamos el closureId ya conocido.
      const returned = response?.data ?? {};
      const keptClosure = {
        ...(closure ?? {}),
        ...returned,
        closureId: closure?.closureId ?? returned.closureId,
      };
      setClosure(keptClosure);
      setSubmitStatus(Number(response?.status) === 201 ? 'created' : 'corrected');
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

  if (requestState === 'success') return (
    <ClosureDetail closure={closure} submitStatus={submitStatus} closureId={closure?.closureId} />
  );

  return (
    <section className="report-form-page" aria-labelledby="closure-form-title">
      <Link to="/my-volunteering">← Volver a mis voluntariados</Link>
      <p className="activity-form-page__eyebrow">Cierre de participación</p>
      <h1 id="closure-form-title">
        {isDetail ? 'Corregir tu cierre' : 'Cerrar tu participación'}
      </h1>
      <p>
        {isDetail
          ? 'Revisa las horas realizadas y tu valoración. Al enviar, actualizas el cierre enviado.'
          : 'Indica las horas realizadas y tu valoración de la experiencia.'}
      </p>

      {/* Nota administrativa: solo en estado RETURNED, solo lectura. Se mantiene
          visible mientras la persona corrige y reenvía desde la misma ruta. */}
      {isDetail && closure?.status === 'RETURNED' && returnedNote && (
        <aside className="closure-form__returned" aria-labelledby="closure-returned-title">
          <h2 id="closure-returned-title" className="closure-form__returned-title">
            Cierre devuelto por la administración
          </h2>
          <p className="closure-form__returned-note" data-testid="closure-returned-note">{returnedNote}</p>
        </aside>
      )}

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
          hint={showsDeviation ? `Has indicado ${enteredHours} h, por debajo de las ${referenceHours} h de tu envío anterior. Puedes continuar: el cierre se actualizará.` : undefined}
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
        <label htmlFor="evidence-consent">
          <input
            id="evidence-consent"
            type="checkbox"
            name="evidenceConsent"
            checked={values.evidenceConsent}
            onChange={updateValue}
            aria-invalid={Boolean(errors.evidenceConsent)}
          />{' '}
          Autorizo el tratamiento de la evidencia adjunta.
        </label>
        {errors.evidenceConsent && <p role="alert">{errors.evidenceConsent}</p>}
        {requestError && <p role="alert">{requestError}</p>}
        <Button
          type="submit"
          isLoading={requestState === 'submitting'}
          loadingLabel="Enviando cierre…"
        >
          {isDetail ? 'Guardar corrección' : 'Enviar cierre'}
        </Button>
      </form>
    </section>
  );
}