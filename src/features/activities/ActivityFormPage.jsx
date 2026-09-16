import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  createActivity,
  getAdminActivity,
  publishActivity,
  updateActivity,
} from '../../api/activitiesApi';
import {
  createOrgActivity,
  getOrgActivities,
  submitOrgActivity,
  updateOrgActivity,
} from '../../api/orgApi';
import { ApiError } from '../../api/apiError';
import { useAuth } from '../auth/AuthContext';
import useForm from '../../hooks/useForm';
import { Button, Input, Modal, Select, Spinner, Textarea } from '../../components/ui';

// Los nombres son los de `CreateActivityRequest`: `mode` y `spots`, no
// `modality` ni `maxParticipants`. Las fechas son `LocalDate` (`YYYY-MM-DD`): la
// actividad no tiene hora, y el backend la rechazaría con un timestamp.
const initialValues = {
  title: '',
  description: '',
  line: '',
  mode: '',
  location: '',
  spots: '',
  hours: '',
  startDate: '',
  endDate: '',
  registrationDeadline: '',
};

// Los valores de `mode` son los que siembra el backend y por los que filtra el
// catálogo (`CatalogPage.MODE_OPTIONS`): en mayúsculas, sin traducir.
const MODE_OPTIONS = [
  { value: 'PRESENCIAL', label: 'Presencial' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'MIXTO', label: 'Mixto' },
];

function toDateInput(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

// Lee tanto `ActivityFormResponse` (admin) como `OrgActivityRow` (entidad); la
// segunda no trae `description`, que llega vacía.
function toFormValues(activity) {
  return {
    title: activity.title ?? '',
    description: activity.description ?? '',
    line: activity.line?.toLowerCase() ?? '',
    mode: activity.mode?.toUpperCase() ?? '',
    location: activity.location ?? '',
    spots: String(activity.spots ?? ''),
    hours: String(activity.hours ?? ''),
    startDate: toDateInput(activity.startDate),
    endDate: toDateInput(activity.endDate),
    registrationDeadline: toDateInput(activity.registrationDeadline),
  };
}

// No hay `GET /api/org/activities/{id}`: la fila viene del listado por el
// `state` del enlace «Editar» y, si se entra por URL, se busca en las páginas
// del listado hasta dar con ella. Lo que no esté ahí es 404, y una de otra
// entidad nunca aparece: el backend filtra por el `partnerId` del token.
async function findOrgActivity(activityId, stateActivity) {
  if (stateActivity && String(stateActivity.id) === String(activityId)) return stateActivity;
  for (let page = 0; page < 50; page += 1) {
    const { data } = await getOrgActivities({ page, size: 50 });
    const found = (data?.content ?? []).find((item) => String(item.id) === String(activityId));
    if (found) return found;
    if (page + 1 >= (data?.totalPages ?? 0)) break;
  }
  throw new ApiError({ message: 'No se ha encontrado el recurso solicitado.', status: 404 });
}

function validate(values) {
  const errors = {};
  if (!values.title.trim()) errors.title = 'Indica el título de la actividad.';
  else if (values.title.trim().length > 120) errors.title = 'El título no puede superar los 120 caracteres.';
  if (!values.description.trim()) errors.description = 'Describe la actividad.';
  if (!values.line) errors.line = 'Selecciona una línea.';
  if (!values.mode) errors.mode = 'Selecciona una modalidad.';
  if (values.location.trim().length > 160) errors.location = 'El lugar no puede superar los 160 caracteres.';
  if (!values.spots) {
    errors.spots = 'Indica el número de plazas.';
  } else if (Number(values.spots) < 1) {
    errors.spots = 'Debe ser al menos 1.';
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

  // Las mismas dos reglas que `@ValidDateRange` en el backend: una actividad de
  // un día tiene inicio y fin iguales, y el plazo puede coincidir con el inicio.
  // Son `YYYY-MM-DD`, así que se comparan como texto.
  if (values.startDate && values.endDate && values.endDate < values.startDate) {
    errors.endDate = 'La fecha de fin no puede ser anterior a la de inicio.';
  }
  if (
    values.startDate
    && values.registrationDeadline
    && values.registrationDeadline > values.startDate
  ) {
    errors.registrationDeadline = 'La fecha límite no puede ser posterior al inicio.';
  }

  return errors;
}

function buildPayload(values) {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    line: values.line,
    mode: values.mode,
    location: values.location.trim() || null,
    startDate: values.startDate,
    endDate: values.endDate,
    registrationDeadline: values.registrationDeadline,
    hours: Number(values.hours),
    spots: Number(values.spots),
  };
}

export default function ActivityFormPage({ backPath = '/dashboard' }) {
  const { activityId } = useParams();
  const { state: routeState } = useLocation();
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
        const data = isPartner
          ? await findOrgActivity(activityId, routeState?.activity)
          : (await getAdminActivity(activityId)).data;
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
  }, [activityId, isEditMode, isPartner, reloadKey, routeState, setValues]);

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
            ? isPartner ? 'Propuesta enviada' : 'Actividad publicada'
            : isUpdated ? 'Cambios guardados' : 'Borrador guardado'}
        </p>
        <h1>
          {isPublished
            ? isPartner ? 'La propuesta está pendiente de aprobación' : 'La actividad ya está publicada'
            : isUpdated
              ? isPartner ? 'La propuesta se ha actualizado' : 'La actividad se ha actualizado'
              : 'Tu borrador está guardado'}
        </h1>
        <p>
          {isPublished
            ? isPartner
              ? 'La Fundación revisará la propuesta y, si la aprueba, la actividad pasará al catálogo.'
              : 'La actividad ya está disponible en el catálogo interno.'
            : isUpdated
              ? isPartner
                ? 'Los cambios están guardados. Desde «Mis propuestas» puedes enviarla a la Fundación.'
                : 'Los cambios están guardados y ya puedes volver al listado administrativo.'
            : isPartner
              ? 'La propuesta todavía no se ha enviado a la Fundación. Puedes enviarla cuando esté lista.'
              : 'La actividad todavía no es visible en el catálogo. Puedes publicarla cuando esté lista.'}
        </p>
        {errorMessage && <p className="activity-form__error" role="alert">{errorMessage}</p>}
        <div className="activity-form-page__success-actions">
          {!isPublished && !isEditMode && (
            <Button size="large" onClick={handlePublishRequest}>
              {isPartner ? 'Enviar propuesta' : 'Publicar actividad'}
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
        <p className="activity-form-page__eyebrow">
          {isPartner
            ? isEditMode ? 'Editar propuesta' : 'Nueva propuesta'
            : isEditMode ? 'Editar actividad' : 'Nueva actividad'}
        </p>
        <h1 id="activity-form-title">
          {isPartner
            ? isEditMode ? 'Editar propuesta de actividad' : 'Proponer una actividad de voluntariado'
            : isEditMode ? 'Editar actividad de voluntariado' : 'Crear actividad de voluntariado'}
        </h1>
        <p>
          {isEditMode
            ? 'Actualiza los datos necesarios y guarda los cambios.'
            : isPartner
              ? 'Guarda la propuesta como borrador o envíala a la Fundación cuando esté lista. Si la aprueba, la actividad pasará al catálogo de la plantilla.'
              : 'Guarda la actividad como borrador o publícala cuando todos los datos estén listos.'}
        </p>
      </div>

      {/* Viene de aceptar una propuesta: el backend solo pudo precargar
          descripción, línea, plazas y entidad; el resto son marcadores. */}
      {isEditMode && routeState?.fromProposal && (
        <p className="activity-form__notice" role="status">
          Esta actividad nace de una propuesta aceptada. La descripción, la línea y las
          plazas vienen de la propuesta; el título, las fechas y las horas son
          provisionales y hay que completarlos antes de publicarla.
        </p>
      )}

      {isEditMode && activity?.reviewNote && (
        <p className="activity-form__review-note" role="status">
          <strong>Comentario de la Fundación:</strong> {activity.reviewNote}
        </p>
      )}

      {/* La fila de la entidad no trae la descripción y no hay detalle que la
          sirva: hay que volver a escribirla al editar. Cuando BE3 entregue
          `GET /api/org/activities/{id}`, este aviso sobra. */}
      {isEditMode && isPartner && !activity?.description && (
        <p className="activity-form__notice" role="status">
          Al editar hay que volver a escribir la descripción: «Mis propuestas»
          todavía no la recupera.
        </p>
      )}

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
          <Select label="Modalidad" required {...fieldProps('mode')}>
            <option value="">Selecciona una modalidad</option>
            {MODE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
          <Input label="Lugar" placeholder="Ciudad o sede (opcional)" {...fieldProps('location')} />
        </div>

        {/* Aquí estaba el control de portada. `B2-03` decidió que la imagen es
            la de la línea de acción, que ya se elige arriba, así que no hay nada
            que subir ni que escribir. */}
        <div className="activity-form__grid">
          <Input type="number" min="1" label="Plazas" required {...fieldProps('spots')} />
          <Input type="number" min="1" label="Horas estimadas por persona" required {...fieldProps('hours')} />
        </div>

        <div className="activity-form__grid activity-form__grid--dates">
          <Input type="date" label="Fecha de inicio" required {...fieldProps('startDate')} />
          <Input type="date" label="Fecha de fin" required {...fieldProps('endDate')} />
          <Input type="date" label="Fecha límite de inscripción" required {...fieldProps('registrationDeadline')} />
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
                {isPartner ? 'Enviar propuesta' : 'Publicar actividad'}
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
      title={isPartner ? 'Enviar propuesta a la Fundación' : 'Publicar actividad'}
      description={isPartner
        ? 'La Fundación revisará la propuesta y, si la aprueba, la actividad pasará al catálogo. Confirma que los datos son correctos.'
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
          ? 'Esta acción envía la propuesta a la cola de aprobación de la Fundación. Hasta que decida, no podrás editarla.'
          : 'Esta acción publica el borrador persistido y actualiza su estado en el catálogo.'}
      </p>
    </Modal>
  );
}
