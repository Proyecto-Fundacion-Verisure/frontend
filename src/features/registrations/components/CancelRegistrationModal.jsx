import { Button, Modal } from '../../../shared/ui';

export default function CancelRegistrationModal({
  isOpen,
  isCancelling,
  registrationId,
  onClose,
  onConfirm,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cancelar inscripción"
      description="¿Seguro que quieres cancelar tu inscripción? Esta acción no se puede deshacer."
      footer={
        <>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isCancelling}
            data-testid={`modal-cancel-${registrationId}`}
          >
            Volver
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            isLoading={isCancelling}
            disabled={isCancelling}
            data-testid={`confirm-cancel-${registrationId}`}
          >
            Confirmar cancelación
          </Button>
        </>
      }
    >
      <p>Se liberará tu plaza y se actualizará la lista de espera.</p>
    </Modal>
  );
}
