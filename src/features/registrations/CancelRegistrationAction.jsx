import { useCallback, useState } from 'react';
import { Button, Modal, Textarea } from '../../components/ui';

export default function CancelRegistrationAction({ registration, decision, onCancel }) {
  const registrationId = registration.registrationId ?? registration.id;
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const isCancelling = String(decision?.registrationId) === String(registrationId)
    && decision?.type === 'cancel'
    && decision?.status === 'loading';

  const close = useCallback(() => {
    if (isCancelling) return;
    setIsOpen(false);
    setReason('');
    setErrorMessage('');
  }, [isCancelling]);

  const confirm = async () => {
    setErrorMessage('');
    try {
      await onCancel(registrationId, reason.trim() || undefined);
      setIsOpen(false);
      setReason('');
    } catch (error) {
      setErrorMessage(error?.message || 'No hemos podido cancelar la inscripción.');
    }
  };

  return (
    <>
      <Button size="small" variant="danger" onClick={() => setIsOpen(true)}>Dar de baja</Button>
      <Modal
        isOpen={isOpen}
        onClose={close}
        closeOnBackdrop={!isCancelling}
        title="Dar de baja la inscripción"
        description="La plaza se liberará y el backend actualizará la cola automáticamente."
        footer={(
          <>
            <Button variant="secondary" disabled={isCancelling} onClick={close}>Volver</Button>
            <Button
              variant="danger"
              isLoading={isCancelling}
              loadingLabel="Dando de baja…"
              onClick={confirm}
            >
              Confirmar baja
            </Button>
          </>
        )}
      >
        <Textarea
          label="Motivo (opcional)"
          value={reason}
          rows={3}
          onChange={(event) => setReason(event.target.value)}
        />
        {errorMessage && <p className="registration-actions__error" role="alert">{errorMessage}</p>}
      </Modal>
    </>
  );
}
