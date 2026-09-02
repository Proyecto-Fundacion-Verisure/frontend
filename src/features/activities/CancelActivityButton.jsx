import { useState } from 'react';
import { cancelActivity } from '../../api/activitiesApi';
import { getActivityRegistrations } from '../../api/registrationsApi';
import { Button, Modal, Spinner } from '../../components/ui';

const UNAFFECTED_STATUSES = new Set(['CANCELLED', 'REJECTED', 'CLOSED']);

function getRegistrations(payload) {
  if (Array.isArray(payload)) return payload;
  for (const key of ['content', 'registrations', 'items']) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return Object.values(payload ?? {})
    .filter(Array.isArray)
    .flat();
}

function getAffectedCount(payload) {
  const explicitCount = payload?.affectedCount
    ?? payload?.activeCount
    ?? payload?.counters?.affected
    ?? payload?.counters?.active;
  if (Number.isFinite(Number(explicitCount))) return Number(explicitCount);
  return getRegistrations(payload)
    .filter((registration) => !UNAFFECTED_STATUSES.has(registration.status))
    .length;
}

export default function CancelActivityButton({ activity, onCancelled }) {
  const [isOpen, setIsOpen] = useState(false);
  const [countStatus, setCountStatus] = useState('idle');
  const [affectedCount, setAffectedCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const loadCount = async () => {
    setCountStatus('loading');
    setErrorMessage('');
    try {
      const { data } = await getActivityRegistrations(activity.id);
      setAffectedCount(getAffectedCount(data));
      setCountStatus('success');
    } catch (error) {
      setErrorMessage(error?.message || 'No hemos podido consultar las personas inscritas.');
      setCountStatus('error');
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    const loadedCount = activity.affectedRegistrationCount
      ?? activity.registrationCount
      ?? activity.registeredCount;
    if (Number.isFinite(Number(loadedCount))) {
      setAffectedCount(Number(loadedCount));
      setCountStatus('success');
      setErrorMessage('');
    } else {
      loadCount();
    }
  };

  const handleClose = () => {
    if (isCancelling) return;
    setIsOpen(false);
    setCountStatus('idle');
    setErrorMessage('');
  };

  const handleConfirm = async () => {
    setIsCancelling(true);
    setErrorMessage('');
    try {
      await cancelActivity(activity.id);
      setIsOpen(false);
      onCancelled?.(activity.id);
      getActivityRegistrations(activity.id).catch(() => undefined);
    } catch (error) {
      setErrorMessage(
        error?.code === 'ACTIVITY_FINISHED'
          ? 'La actividad ya ha finalizado y no se puede cancelar.'
          : error?.message || 'No hemos podido cancelar la actividad.',
      );
    } finally {
      setIsCancelling(false);
    }
  };

  const isAlreadyClosed = activity.status === 'CANCELLED' || activity.status === 'FINISHED';

  return (
    <>
      <Button size="small" variant="danger" disabled={isAlreadyClosed} onClick={handleOpen}>
        Cancelar
      </Button>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        closeOnBackdrop={!isCancelling}
        title="Cancelar actividad"
        description={`Vas a cancelar “${activity.title}”. Esta acción no se puede deshacer.`}
        footer={(
          <>
            <Button variant="secondary" disabled={isCancelling} onClick={handleClose}>
              Volver
            </Button>
            <Button
              variant="danger"
              disabled={countStatus !== 'success'}
              isLoading={isCancelling}
              loadingLabel="Cancelando…"
              onClick={handleConfirm}
            >
              Confirmar cancelación
            </Button>
          </>
        )}
      >
        {countStatus === 'loading' && <Spinner label="Consultando inscripciones…" />}
        {countStatus === 'success' && (
          <p>
            {affectedCount === 1
              ? 'La cancelación afectará a 1 persona inscrita.'
              : `La cancelación afectará a ${affectedCount} personas inscritas.`}
          </p>
        )}
        {errorMessage && <p className="activities-list__error" role="alert">{errorMessage}</p>}
        {countStatus === 'error' && (
          <Button variant="secondary" size="small" onClick={loadCount}>Reintentar consulta</Button>
        )}
      </Modal>
    </>
  );
}
