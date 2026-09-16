import { useState } from 'react';
import { submitOrgActivity } from '../../api/orgApi';
import { Button, Modal } from '../../components/ui';

// «Enviar propuesta» desde el listado de la entidad. `PATCH
// /org/activities/{id}/submit` solo acepta `DRAFT`; en cualquier otro estado el
// backend contesta 409 `ACTIVITY_NOT_EDITABLE`, que llega ya traducido en
// `error.message` y se pinta dentro del modal.
export default function SubmitForReviewButton({ activity, onSubmitted }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      await submitOrgActivity(activity.id);
      setIsOpen(false);
      onSubmitted?.();
    } catch (err) {
      setError(err?.message || 'No se pudo enviar la propuesta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button size="small" onClick={() => { setError(''); setIsOpen(true); }}>
        Enviar propuesta
      </Button>
      <Modal
        isOpen={isOpen}
        onClose={() => !isSubmitting && setIsOpen(false)}
        title="Enviar propuesta a la Fundación"
        description={`La Fundación revisará «${activity.title}» y, si la aprueba, pasará al catálogo. Hasta entonces no podrás editarla.`}
        footer={(
          <>
            <Button variant="secondary" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button onClick={submit} isLoading={isSubmitting} loadingLabel="Enviando…">
              Confirmar envío
            </Button>
          </>
        )}
      >
        {error && <p className="activity-form__error" role="alert">{error}</p>}
      </Modal>
    </>
  );
}
