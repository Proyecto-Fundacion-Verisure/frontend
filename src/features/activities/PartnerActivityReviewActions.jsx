import { useState } from 'react';
import { approveActivity, returnActivity } from '../../api/activitiesApi';
import { Button, Modal, Textarea } from '../../components/ui';

export default function PartnerActivityReviewActions({ activity, onReviewed }) {
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [note, setNote] = useState('');
  const [state, setState] = useState({ status: 'idle', error: '' });

  const approve = async () => {
    setState({ status: 'approving', error: '' });
    try {
      await approveActivity(activity.id);
      onReviewed?.('approved');
    } catch (error) {
      setState({ status: 'idle', error: error?.message || 'No se pudo aprobar la actividad.' });
    }
  };

  const sendBack = async () => {
    const trimmedNote = note.trim();
    if (!trimmedNote) {
      setState({ status: 'idle', error: 'Indica qué debe corregir la entidad.' });
      return;
    }
    setState({ status: 'returning', error: '' });
    try {
      await returnActivity(activity.id, trimmedNote);
      setIsReturnOpen(false);
      onReviewed?.('returned');
    } catch (error) {
      setState({ status: 'idle', error: error?.message || 'No se pudo devolver la actividad.' });
    }
  };

  return (
    <>
      <Button
        size="small"
        onClick={approve}
        isLoading={state.status === 'approving'}
        disabled={state.status === 'returning'}
      >
        Aprobar
      </Button>
      <Button
        size="small"
        variant="secondary"
        onClick={() => {
          setState({ status: 'idle', error: '' });
          setIsReturnOpen(true);
        }}
        disabled={state.status === 'approving'}
      >
        Devolver
      </Button>
      {state.error && !isReturnOpen && <span role="alert">{state.error}</span>}
      <Modal
        isOpen={isReturnOpen}
        onClose={() => state.status !== 'returning' && setIsReturnOpen(false)}
        title="Devolver actividad"
        description="Explica a la entidad qué información debe corregir."
        footer={(
          <>
            <Button
              variant="secondary"
              onClick={() => setIsReturnOpen(false)}
              disabled={state.status === 'returning'}
            >
              Cancelar
            </Button>
            <Button
              onClick={sendBack}
              isLoading={state.status === 'returning'}
              loadingLabel="Devolviendo…"
            >
              Confirmar devolución
            </Button>
          </>
        )}
      >
        <Textarea
          name="note"
          label="Correcciones solicitadas"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          error={state.error || undefined}
          required
        />
      </Modal>
    </>
  );
}
