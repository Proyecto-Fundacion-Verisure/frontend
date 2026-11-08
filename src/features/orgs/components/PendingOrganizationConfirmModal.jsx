import { Button, Modal } from '../../../shared/ui';
import { getOrganizationActionCopy } from '../model/accountStatus';

export default function PendingOrganizationConfirmModal({
  isOpen,
  action,
  organizationName,
  onClose,
  onConfirm,
}) {
  const copy = getOrganizationActionCopy(action);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={copy.title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Volver
          </Button>
          <Button variant={copy.variant} onClick={onConfirm}>
            {copy.confirmLabel}
          </Button>
        </>
      }
    >
      <p>{copy.question(organizationName)}</p>
    </Modal>
  );
}
