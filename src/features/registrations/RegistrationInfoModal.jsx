import { Button, Modal } from '../../components/ui';

export default function RegistrationInfoModal({ isOpen, onClose, onConfirm, isSubmitting = false }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Antes de solicitar tu inscripción"
      description="Información sobre el proceso de inscripción"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting} data-testid="cancel-registration">
            Cancelar
          </Button>
          <Button onClick={onConfirm} isLoading={isSubmitting} disabled={isSubmitting} data-testid="confirm-registration">
            Confirmar solicitud
          </Button>
        </>
      }
    >
      <div id="registration-info-description">
        <p>Tu solicitud comenzará en <strong>lista de espera </strong> y será revisada por la administración.</p>
      </div>
    </Modal>
  );
}
