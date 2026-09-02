import { useState } from 'react';
import { Button } from '../../components/ui';

export default function RegistrationDecisionActions({
  registration,
  decision,
  onAccept,
  onReject,
}) {
  const registrationId = registration.registrationId ?? registration.id;
  const [errorMessage, setErrorMessage] = useState('');
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

  return (
    <div className="registration-actions">
      <div className="registration-actions__buttons">
        <Button
          size="small"
          isLoading={isSubmitting && decision.type === 'accept'}
          loadingLabel="Aceptando…"
          disabled={isSubmitting}
          onClick={() => run(onAccept)}
        >
          Aceptar
        </Button>
        <Button
          size="small"
          variant="secondary"
          isLoading={isSubmitting && decision.type === 'reject'}
          loadingLabel="Rechazando…"
          disabled={isSubmitting}
          onClick={() => run(onReject)}
        >
          Rechazar
        </Button>
      </div>
      {errorMessage && <p className="registration-actions__error" role="alert">{errorMessage}</p>}
    </div>
  );
}
