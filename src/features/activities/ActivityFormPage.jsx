import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  createActivity,
  getAdminActivity,
  publishActivity,
  updateActivity,
} from '../../api/activitiesApi';
import {
  createOrgActivity,
  submitOrgActivity,
  updateOrgActivity,
} from '../../api/orgApi';
import { useAuth } from '../auth/AuthContext';
import useForm from '../../hooks/useForm';
import { Button, Input, Modal, Select, Spinner, Textarea } from '../../components/ui';

const initialValues = {
  title: '',
  description: '',
  line: '',
  modality: '',
  maxParticipants: '',
  hours: '',
  startDate: '',
  endDate: '',
  registrationDeadline: '',
};

function toISOString(localValue) {
  if (!localValue) return '';
  return new Date(localValue).toISOString();
}

function toLocalDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function toFormValues(activity) {
  return {
    title: activity.title ?? '',
    description: activity.description ?? '',
    line: activity.line?.toLowerCase() ?? '',
    modality: (activity.modality ?? activity.mode)?.toLowerCase() ?? '',
    maxParticipants: String(
      activity.maxParticipants ?? activity.spots ?? activity.capacity ?? '',
    ),
    hours: String(activity.hours ?? ''),
    startDate: toLocalDateTime(activity.startDate),
    endDate: toLocalDateTime(activity.endDate),
    registrationDeadline: toLocalDateTime(activity.registrationDeadline),
  };
}

function validate(values) {
  const errors = {};
  if (!values.title.trim()) errors.title = 'Indica el título de la actividad.';
  else if (values.title.trim().length > 120) errors.title = 'El título no puede superar los 120 caracteres.';
  if (!values.description.trim()) errors.description = 'Describe la actividad.';
  if (!values.line) errors.line = 'Selecciona una línea.';
  if (!values.modality) errors.modality = 'Selecciona una modalidad.';
  if (!values.maxParticipants) {
    errors.maxParticipants = 'Indica el número máximo de participantes.';
  } else if (Number(values.maxParticipants) < 1) {
    errors.maxParticipants = 'Debe ser al menos 1.';
  }
  if (!values.hours) {
    errors.hours = 'Indica las horas estimadas.';
  } else if (Number(values.hours) < 1) {
    errors.hours = 'Debe ser al menos 1.';
  }
  if (!values.startDate) errors.startDate = 'Indica la fecha de inicio.';
  if (!values.endDate) errors.endDate = 'Indica la fecha de fin.';
  if (!values.registrationDeadline) {
    errors.registrationDeadline = 'Indica la fecha límite de inscripción.';
  }

  if (values.startDate && values.endDate) {
    const start = new Date(values.startDate);
    const end = new Date(values.endDate);
    if (end <= start) {
      errors.endDate = 'La fecha de fin debe ser posterior a la de inicio.';
    }
  }

  if (values.startDate && values.registrationDeadline) {
    const start = new Date(values.startDate);
    const deadline = new Date(values.registrationDeadline);
    if (deadline > start) {
      errors.registrationDeadline = 'La fecha límite no puede ser posterior al inicio.';
    }
  }

  return errors;
}

function buildPayload(values) {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    line: values.line,
    modality: values.modality,
    maxParticipants: Number(values.maxParticipants),
    hours: Number(values.hours),
    startDate: toISOString(values.startDate),
    endDate: toISOString(values.endDate),
    registrationDeadline: toISOString(values.registrationDeadline),
  };
}

export default function ActivityFormPage({ backPath = '/dashboard' }) {
  const { activityId } = useParams();
  const auth = useAuth();
  const isPartner = auth?.user?.role === 'PARTNER'
    || backPath.startsWith('/org/');
  const isEditMode = Boolean(activityId);
  const requestInProgress = useRef(false);
  const { values, setValues, handleChange } = useForm(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [requestStatus, setRequestStatus] = useState(isEditMode ? 'loading' : 'idle');
  const [activity, setActivity] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPublishConfirmOpen, setIsPublishConfirmOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!isEditMode) return undefined;
    let cancelled = false;

    const loadActivity = async () => {
      setRequestStatus('loading');
      setErrorMessage('');
      try {
        const { data } = await getAdminActivity(activityId);
        if (cancelled) return;
        setActivity(data);
        setValues(toFormValues(data));
        setRequestStatus('idle');
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(error?.message || 'No hemos podido cargar la actividad.');
        setRequestStatus(
          error?.status === 403
            ? 'forbidden'
            : error?.status === 404
              ? 'not-found'
              : 'load-error',
        );
      }
    };

    loadActivity();
    return () => {
      cancelled = true;
    };
  }, [activityId, isEditMode, reloadKey, setValues]);

  const validateForm = () => {
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setTouched(Object.keys(initialValues).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
    return Object.keys(nextErrors).length === 0;
  };

  const applyApiError = (error) => {
    if (error?.fieldErrors) {
      setErrors(error.fieldErrors);
      setTouched(Object.keys(error.fieldErrors).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
    }
    setErrorMessage(error?.message || 'No hemos podido completar la operación. Inténtalo de nuevo.');
  };

  const createDraft = async () => {
    const createRequest = isPartner ? createOrgActivity : createActivity;
    const { data: createdActivity } = await createRequest(buildPayload(values));
    if (!createdActivity?.id) throw new Error('La respuesta no incluye el identificador de la actividad.');
    setActivity(createdActivity);
    return createdActivity;
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (requestInProgress.current || !validateForm()) return;

    requestInProgress.current = true;
    setRequestStatus('saving');
    setErrorMessage('');
    try {
      if (isEditMode) {
        const payload = buildPayload(values);
        const updateRequest = isPartner ? updateOrgActivity : updateActivity;
        const { data: updatedActivity } = await updateRequest(activityId, payload);
        setActivity(updatedActivity ?? { ...activity, ...payload });
        setRequestStatus('updated');
      } else {
        await createDraft();
        setRequestStatus('draft');
      }
    } catch (error) {
      applyApiError(error);
      setRequestStatus('idle');
    } finally {
      requestInProgress.current = false;
    }
  };

  const handlePublishRequest = () => {
    if (requestInProgress.current || (!activity && !validateForm())) return;
    setErrorMessage('');
    setIsPublishConfirmOpen(true);
  };

  const handlePublish = async () => {
    if (requestInProgress.current) return;

    requestInProgress.current = true;
    setRequestStatus('publishing');
    setErrorMessage('');
    let persistedActivity = activity;
    try {
      persistedActivity ??= await createDraft();
      const publishRequest = isPartner ? submitOrgActivity : publishActivity;
      const { data: publishedActivity } = await publishRequest(persistedActivity.id);
      setActivity(publishedActivity ?? { ...persistedActivity, status: 'PUBLISHED' });
      setRequestStatus('published');
      setIsPublishConfirmOpen(false);
    } catch (error) {
      applyApiError(error);
      setRequestStatus(persistedActivity ? 'draft' : 'idle');
      setIsPublishConfirmOpen(false);
    } finally {
      requestInProgress.current = false;
    }
  };

  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setActivity(null);
    setErrorMessage('');
    setRequestStatus('idle');
  };

  const validateField = (name) => {
    const fieldErrors = validate(values);
    if (fieldErrors[name]) {
      setErrors((current) => ({ ...current, [name]: fieldErrors[name] }));
    } else {
      setErrors((current) => {
        const next = { ...current };
        delete next[name];
        return next;
      });
    }
  };

  const handleBlur = ({ target: { name } }) => {
    setTouched((current) => ({ ...current, [name]: true }));
    validateField(name);
  };

  const fieldProps = (name) => ({
    name,
    value: values[name],
    onChange: handleChange,
    onBlur: handleBlur,
    error: touched[name] ? errors[name] : undefined,
  });

  const isPublishing = requestStatus === 'publishing';
  const showsResultPage = requestStatus === 'draft'
    || requestStatus === 'published'
    || requestStatus === 'updated'
    || (isPublishing && activity);

  if (requestStatus === 'loading') {
    return (
      <section className="activity-form-page activity-form-page--state" aria-label="Cargando actividad">
        <Spinner label="Cargando actividad…" />
      </section>
    );
  }

  if (['forbidden', 'not-found', 'load-error'].includes(requestStatus)) {
    const title = requestStatus === 'forbidden'
      ? 'No tienes permiso para editar esta actividad'
      : requestStatus === 'not-found'
        ? 'No encontramos la actividad'
        : 'No hemos podido cargar la actividad';
    return (
      <section className="activity-form-page activity-form-page--state">
        <h1>{title}</h1>
        <p role="alert">{errorMessage}</p>
        <div className="activity-form-page__success-actions">
          {requestStatus === 'load-error' && (
            <Button onClick={() => setReloadKey((current) => current + 1)}>Reintentar</Button>
          )}
          <Link className="button button--secondary button--large" to={backPath}>Volver</Link>
        </div>
      </section>
    );
  }

  if (showsResultPage) {
    const isPublished = requestStatus === 'published';
    const isUpdated = requestStatus === 'updated';
    return (
      <section className="activity-form-page activity-form-page--success">
        <p className="activity-form-page__eyebrow">
          {isPublished
            ? isPartner ? 'Actividad enviada a revisión' : 'Actividad publicada'
            : isUpdated ? 'Cambios guardados' : 'Borrador guardado'}
        </p>
        <h1>
          {isPublished
            ? isPartner ? 'La actividad está pendiente de aprobación' : 'La actividad ya está publicada'
            : isUpdated
              ? 'La actividad se ha actualizado'
              : 'Tu borrador está guardado'}
        </h1>
        <p>
          {isPublished
            ? isPartner
              ? 'La Fundación revisará la actividad antes de publicarla en el catálogo.'
              : 'La actividad ya está disponible en el catálogo interno.'
            : isUpdated
              ? 'Los cambios están guardados y ya puedes volver al listado administrativo.'
            : 'La actividad todavía no es visible en el catálogo. Puedes publicarla cuando esté lista.'}
        </p>
        {errorMessage && <p className="activity-form__error" role="alert">{errorMessage}</p>}
        <div className="activity-form-page__success-actions">
          {!isPublished && !isEditMode && (
            <Button size="large" onClick={handlePublishRequest}>
              {isPartner ? 'Enviar a revisión' : 'Publicar actividad'}
            </Button>
          )}
          {isEditMode ? (
            <Button size="large" variant="secondary" onClick={() => setRequestStatus('idle')}>
              Seguir editando
            </Button>
          ) : (
            <Button size="large" variant="secondary" onClick={resetForm}>
              Crear otra actividad
            </Button>
          )}
          <Link className="button button--secondary button--large" to={backPath}>
            Volver
          </Link>
        </div>
        <PublishConfirmation
          isOpen={isPublishConfirmOpen}
          isPublishing={isPublishing}
          onClose={() => !isPublishing && setIsPublishConfirmOpen(false)}
          onConfirm={handlePublish}
          isPartner={isPartner}
        />
      </section>
    );
  }

  return (
    <section className="activity-form-page" aria-labelledby="activity-form-title">
      <div className="activity-form-page__intro">
        <Link to={backPath} className="activity-form-page__back">&larr; Volver</Link>
        <p className="activity-form-page__eyebrow">{isEditMode ? 'Editar actividad' : 'Nueva actividad'}</p>
        <h1 id="activity-form-title">
          {isEditMode ? 'Editar actividad de voluntariado' : 'Crear actividad de voluntariado'}
        </h1>
        <p>
          {isEditMode
            ? 'Actualiza los datos necesarios y guarda los cambios.'
            : isPartner
              ? 'Guarda la actividad como borrador o envíala a revisión cuando esté lista.'
              : 'Guarda la actividad como borrador o publícala cuando todos los datos estén listos.'}
        </p>
      </div>

      <form className="activity-form" onSubmit={handleSave} noValidate>
        <div className="activity-form__grid">
          <Input label="Título" placeholder="Nombre de la actividad" required {...fieldProps('title')} />
          <Select label="Línea" required {...fieldProps('line')}>
            <option value="">Selecciona una línea</option>
            <option value="desoledad">Desoledad</option>
            <option value="educar">Educar para proteger</option>
            <option value="acoso">Protegidos ante el acoso</option>
            <option value="medioambiente">Medio ambiente</option>
          </Select>
        </div>

        <Textarea
          label="Descripción"
          placeholder="Describe la actividad, su objetivo y a quién beneficia."
          required
          rows={4}
          {...fieldProps('description')}
        />

        <div className="activity-form__grid">
          <Select label="Modalidad" required {...fieldProps('modality')}>
            <option value="">Selecciona una modalidad</option>
            <option value="presencial">Presencial</option>
            <option value="online">Online</option>
          </Select>
          <Input type="number" min="1" label="Máximo de participantes" required {...fieldProps('maxParticipants')} />
        </div>

        {/* Aquí estaba el control de portada. `B2-03` decidió que la imagen es
            la de la línea de acción, que ya se elige arriba, así que no hay nada
            que subir ni que escribir. */}
        <div className="activity-form__grid">
          <Input type="number" min="1" label="Horas estimadas por persona" required {...fieldProps('hours')} />
        </div>

        <div className="activity-form__grid activity-form__grid--dates">
          <Input type="datetime-local" label="Fecha y hora de inicio" required {...fieldProps('startDate')} />
          <Input type="datetime-local" label="Fecha y hora de fin" required {...fieldProps('endDate')} />
          <Input type="datetime-local" label="Fecha límite de inscripción" required {...fieldProps('registrationDeadline')} />
        </div>

        {errorMessage && <p className="activity-form__error" role="alert">{errorMessage}</p>}

        <div className="activity-form__footer">
          <small>Los campos marcados con * son obligatorios.</small>
          <div className="activity-form__actions">
            <Button
              type="submit"
              size="large"
              variant="secondary"
              isLoading={requestStatus === 'saving'}
              loadingLabel="Guardando…"
              disabled={isPublishing}
            >
              {isEditMode ? 'Guardar cambios' : 'Guardar borrador'}
            </Button>
            {!isEditMode && (
              <Button type="button" size="large" onClick={handlePublishRequest} disabled={requestStatus === 'saving'}>
                {isPartner ? 'Enviar a revisión' : 'Publicar actividad'}
              </Button>
            )}
          </div>
        </div>
      </form>

      <PublishConfirmation
        isOpen={isPublishConfirmOpen}
        isPublishing={isPublishing}
        onClose={() => !isPublishing && setIsPublishConfirmOpen(false)}
        onConfirm={handlePublish}
        isPartner={isPartner}
      />
    </section>
  );
}

function PublishConfirmation({ isOpen, isPublishing, onClose, onConfirm, isPartner = false }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeOnBackdrop={!isPublishing}
      title={isPartner ? 'Enviar actividad a revisión' : 'Publicar actividad'}
      description={isPartner
        ? 'La Fundación revisará la actividad antes de publicarla. Confirma que los datos son correctos.'
        : 'La actividad será visible para toda la plantilla. Confirma que los datos son correctos antes de continuar.'}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose} disabled={isPublishing}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} isLoading={isPublishing} loadingLabel={isPartner ? 'Enviando…' : 'Publicando…'}>
            {isPartner ? 'Confirmar envío' : 'Confirmar publicación'}
          </Button>
        </>
      )}
    >
      <p>
        {isPartner
          ? 'Esta acción envía el borrador a la cola de aprobación de la Fundación.'
          : 'Esta acción publica el borrador persistido y actualiza su estado en el catálogo.'}
      </p>
    </Modal>
  );
}
