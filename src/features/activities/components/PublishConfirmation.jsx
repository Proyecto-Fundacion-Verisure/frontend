import { Button, Modal } from '../../../shared/ui';

const CONFIRMATION_COPY = {
  admin: {
    title: 'Publicar actividad',
    description:
      'La actividad será visible para toda la plantilla. Confirma que los datos son correctos antes de continuar.',
    body: 'Esta acción publica el borrador persistido y actualiza su estado en el catálogo.',
    confirmLabel: 'Confirmar publicación',
    loadingLabel: 'Publicando…',
  },
  partner: {
    title: 'Enviar propuesta a la Fundación',
    description:
      'La Fundación revisará la propuesta y, si la aprueba, la actividad pasará al catálogo. Confirma que los datos son correctos.',
    body: 'Esta acción envía la propuesta a la cola de aprobación de la Fundación. Hasta que decida, no podrás editarla.',
    confirmLabel: 'Confirmar envío',
    loadingLabel: 'Enviando…',
  },
};

export default function PublishConfirmation({
  isOpen,
  isPublishing,
  onClose,
  onConfirm,
  isPartner = false,
}) {
  const copy = isPartner ? CONFIRMATION_COPY.partner : CONFIRMATION_COPY.admin;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeOnBackdrop={!isPublishing}
      title={copy.title}
      description={copy.description}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isPublishing}>
            Volver
          </Button>
          <Button onClick={onConfirm} isLoading={isPublishing} loadingLabel={copy.loadingLabel}>
            {copy.confirmLabel}
          </Button>
        </>
      }
    >
      <p>{copy.body}</p>
    </Modal>
  );
}
