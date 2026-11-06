import Button from '../Button/Button';
import Modal from '../Modal/Modal';

// Pide confirmación antes de una acción que no se puede deshacer. No se cierra
// mientras la acción está en curso: quien la lanza decide cuándo cerrar.
export default function ConfirmModal({
  confirmLabel,
  description,
  isLoading = false,
  isOpen,
  loadingLabel,
  onClose,
  onConfirm,
  title,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeOnBackdrop={!isLoading}
      closeDisabled={isLoading}
      title={title}
      description={description}
      footer={(
        <>
          <Button variant="secondary" disabled={isLoading} onClick={onClose}>Volver</Button>
          <Button variant="danger" isLoading={isLoading} loadingLabel={loadingLabel} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      )}
    />
  );
}
