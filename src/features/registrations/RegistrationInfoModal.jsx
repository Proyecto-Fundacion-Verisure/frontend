import { Button, Modal } from '../../components/ui';

/**
 * El `error` se pinta aquí dentro y no en quien abre el modal. Mientras el modal
 * está abierto, `Modal` marca el resto de la página como `inert` y `aria-hidden`,
 * así que un aviso de fuera queda tapado por la capa y además no lo anuncia un
 * lector de pantalla. Como la solicitud solo cierra el modal cuando sale bien,
 * un fallo dejaba la pantalla sin reaccionar: era el caso del plazo vencido.
 */
export default function RegistrationInfoModal({ isOpen, onClose, onConfirm, isSubmitting = false, error = null }) {
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
        <p><em>La inscripción no se confirma automáticamente al solicitarla.</em></p>
        {error && (
          <p role="alert" className="registration-info-modal__error" data-testid="registration-error">
            {error.message || 'No se pudo completar la solicitud.'}
          </p>
        )}
      </div>
    </Modal>
  );
}
