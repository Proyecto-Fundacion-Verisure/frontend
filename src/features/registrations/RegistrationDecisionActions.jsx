import { useState } from 'react';
import { Button, ConfirmModal } from '../../components/ui';

export default function RegistrationDecisionActions({
  registration,
  decision,
  onAccept,
  onReject,
}) {
  const registrationId = registration.registrationId ?? registration.id;
  const [errorMessage, setErrorMessage] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const isCurrentDecision = String(decision?.registrationId) === String(registrationId);
  const isSubmitting = isCurrentDecision && decision.status === 'loading';

  const run = async (action) => {
    setErrorMessage('');
    try {
      await action(registrationId);
    } catch (error) {
      setErrorMessage(error?.message || 'No hemos podido registrar la decisión.');
    }
  };

  const confirmReject = async () => {
    await run(onReject);
    setIsConfirmOpen(false);
  };

  const personName = registration.userName ?? '';

  return (
    <div className="registration-actions">
      <div className="registration-actions__buttons">
        <Button
          size="small"
          isLoading={isSubmitting && decision.type === 'accept'}
          loadingLabel="Aceptando…"
          disabled={isSubmitting}
          onClick={() => run(onAccept)}
          aria-label={personName ? `Aceptar inscripción de ${personName}` : 'Aceptar inscripción'}
        >
          Aceptar
        </Button>
        <Button
          size="small"
          variant="secondary"
          disabled={isSubmitting}
          onClick={() => setIsConfirmOpen(true)}
          aria-label={personName ? `Rechazar inscripción de ${personName}` : 'Rechazar inscripción'}
        >
          Rechazar
        </Button>
      </div>
      {errorMessage && <p className="registration-actions__error" role="alert">{errorMessage}</p>}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmReject}
        isLoading={isSubmitting && decision.type === 'reject'}
        loadingLabel="Rechazando…"
        title="Rechazar inscripción"
        description={`Se rechazará la inscripción${personName ? ` de ${personName}` : ''}. Esta acción no se puede deshacer.`}
        confirmLabel="Confirmar rechazo"
      />
    </div>
  );
}
