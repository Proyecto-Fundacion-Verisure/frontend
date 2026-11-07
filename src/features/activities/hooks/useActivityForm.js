import { useEffect, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import {
  createActivity,
  getAdminActivity,
  publishActivity,
  updateActivity,
} from '../api/activitiesApi';
import {
  createOrgActivity,
  submitOrgActivity,
  updateOrgActivity,
} from '../../orgs';
import findOrgActivity from '../api/findOrgActivity';
import { useAuth } from '../../auth';
import useForm from '../../../shared/hooks/useForm';
import {
  ACTIVITY_FORM_INITIAL_VALUES,
  buildActivityPayload,
  createTouchedState,
  getActivityFormHeaderCopy,
  getActivityFormLoadErrorCopy,
  getActivityFormResultCopy,
  getActivityFormView,
  getActivityLoadErrorStatus,
  toActivityFormValues,
  validateActivityForm,
} from '../model/activityForm';

async function loadActivityForEdit({ activityId, isPartner, routeActivity }) {
  if (isPartner) return findOrgActivity(activityId, routeActivity);
  const { data } = await getAdminActivity(activityId);
  return data;
}

function applyLoadedActivity({ data, setActivity, setValues, setRequestStatus }) {
  setActivity(data);
  setValues(toActivityFormValues(data));
  setRequestStatus('idle');
}

function applyLoadError({ error, setErrorMessage, setRequestStatus }) {
  setErrorMessage(error?.message || 'No hemos podido cargar la actividad.');
  setRequestStatus(getActivityLoadErrorStatus(error?.status));
}

export default function useActivityForm({ backPath }) {
  const { activityId } = useParams();
  const { state: routeState } = useLocation();
  const auth = useAuth();
  const isPartner = auth?.user?.role === 'PARTNER' || backPath.startsWith('/org/');
  const isEditMode = Boolean(activityId);
  const requestInProgress = useRef(false);
  const { values, setValues, handleChange } = useForm(ACTIVITY_FORM_INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [requestStatus, setRequestStatus] = useState(isEditMode ? 'loading' : 'idle');
  const [activity, setActivity] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPublishConfirmOpen, setIsPublishConfirmOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!isEditMode) return undefined;

    let isActive = true;
    setRequestStatus('loading');
    setErrorMessage('');

    loadActivityForEdit({
      activityId,
      isPartner,
      routeActivity: routeState?.activity,
    })
      .then((data) => {
        if (isActive) applyLoadedActivity({ data, setActivity, setValues, setRequestStatus });
      })
      .catch((error) => {
        if (isActive) applyLoadError({ error, setErrorMessage, setRequestStatus });
      });

    return () => {
      isActive = false;
    };
  }, [activityId, isEditMode, isPartner, reloadKey, routeState, setValues]);

  const validateForm = () => {
    const nextErrors = validateActivityForm(values);
    setErrors(nextErrors);
    setTouched(createTouchedState());
    return Object.keys(nextErrors).length === 0;
  };

  const applyApiError = (error) => {
    if (error?.fieldErrors) {
      setErrors(error.fieldErrors);
      setTouched(createTouchedState(Object.keys(error.fieldErrors)));
    }
    setErrorMessage(error?.message || 'No hemos podido completar la operación. Inténtalo de nuevo.');
  };

  const createDraft = async () => {
    const createRequest = isPartner ? createOrgActivity : createActivity;
    const { data: createdActivity } = await createRequest(buildActivityPayload(values));
    if (!createdActivity?.id) {
      throw new Error('La respuesta no incluye el identificador de la actividad.');
    }
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
        const payload = buildActivityPayload(values);
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
    setValues(ACTIVITY_FORM_INITIAL_VALUES);
    setErrors({});
    setTouched({});
    setActivity(null);
    setErrorMessage('');
    setRequestStatus('idle');
  };

  const validateField = (name) => {
    const fieldErrors = validateActivityForm(values);
    if (fieldErrors[name]) {
      setErrors((current) => ({ ...current, [name]: fieldErrors[name] }));
      return;
    }
    setErrors((current) => {
      const next = { ...current };
      delete next[name];
      return next;
    });
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
  const closePublishConfirmation = () => {
    if (!isPublishing) setIsPublishConfirmOpen(false);
  };
  const continueEditing = () => setRequestStatus('idle');
  const retryLoad = () => setReloadKey((current) => current + 1);
  const view = getActivityFormView(requestStatus, activity);

  return {
    view,
    values,
    activity,
    errorMessage,
    requestStatus,
    isEditMode,
    isPartner,
    isPublishing,
    isPublishConfirmOpen,
    isFromProposal: Boolean(isEditMode && routeState?.fromProposal),
    showReviewNote: Boolean(isEditMode && activity?.reviewNote),
    showMissingDescriptionNotice: Boolean(isEditMode && isPartner && !activity?.description),
    headerCopy: getActivityFormHeaderCopy({ isPartner, isEditMode }),
    resultCopy: getActivityFormResultCopy({ requestStatus, isPartner, isEditMode }),
    errorCopy: getActivityFormLoadErrorCopy(requestStatus),
    fieldProps,
    handleSave,
    handlePublishRequest,
    handlePublish,
    handleContinueEditing: continueEditing,
    handleRetryLoad: retryLoad,
    handleReset: resetForm,
    handleClosePublish: closePublishConfirmation,
  };
}
