import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { acceptProposal } from '../../api/proposalsApi';
import { Button } from '../../components/ui';

const CONFLICT_MESSAGE =
  'Esta propuesta ya ha sido aceptada o rechazada. Actualiza el detalle para ver su estado.';
const GENERIC_ERROR_MESSAGE =
  'No hemos podido aceptar la propuesta. Inténtalo de nuevo.';

export function getActivityDraftPath(activityId) {
  return `/activities/${activityId}/edit`;
}

export default function AcceptProposalButton({ proposalId, onAccepted }) {
  const navigate = useNavigate();
  const requestInProgress = useRef(false);
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleAccept = async () => {
    if (requestInProgress.current || status === 'accepted' || status === 'conflict') {
      return;
    }

    requestInProgress.current = true;
    setStatus('loading');
    setErrorMessage('');

    try {
      const { data: activity } = await acceptProposal(proposalId);
      if (!activity?.id) throw new Error('Missing activity id');

      setStatus('accepted');
      onAccepted?.(activity);
      navigate(getActivityDraftPath(activity.id));
    } catch (error) {
      if (error?.status === 409 || error?.code === 'PROPOSAL_ALREADY_DECIDED') {
        setStatus('conflict');
        setErrorMessage(CONFLICT_MESSAGE);
      } else {
        requestInProgress.current = false;
        setStatus('idle');
        setErrorMessage(GENERIC_ERROR_MESSAGE);
      }
    }
  };

  const isLoading = status === 'loading';
  const isDisabled = status === 'accepted' || status === 'conflict';

  return (
    <div className="proposal-accept-action">
      <Button
        type="button"
        onClick={handleAccept}
        isLoading={isLoading}
        loadingLabel="Aceptando…"
        disabled={isDisabled}
      >
        {status === 'accepted' ? 'Propuesta aceptada' : 'Aceptar propuesta'}
      </Button>
      {errorMessage && (
        <p className="proposal-accept-action__error" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
