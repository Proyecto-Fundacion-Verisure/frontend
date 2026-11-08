import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, Card } from '../../../shared/ui';
import { formatDate } from '../../../shared/lib/dates';
import {
  canCancelRegistration,
  getActivityTitle,
  getRegistrationAction,
  getStatusBadge,
} from '../model/myVolunteering';
import CancelRegistrationModal from './CancelRegistrationModal';

export default function MyVolunteeringCard({ item, onCancel, isCancelling }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const activity = item.activity ?? {};
  const statusBadge = getStatusBadge(item.status);
  const action = getRegistrationAction(item);
  const canCancel = Boolean(onCancel) && canCancelRegistration(item);

  const startDate = activity.startDate ?? '';
  const endDate = activity.endDate ?? '';
  const hours = activity.hours ?? null;
  const showQueue = item.queuePosition !== null && item.queuePosition !== undefined;
  const showsAccepted = item.status === 'WAITLISTED';
  const acceptedLabel = item.accepted ? 'Aceptada' : 'Pendiente de revisión';

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    if (!isCancelling) setIsModalOpen(false);
  };
  const confirmCancel = async () => {
    await onCancel(item.registrationId);
    setIsModalOpen(false);
  };

  return (
    <Card className="my-volunteering__card" data-testid={`registration-${item.registrationId}`}>
      <div className="my-volunteering__card-header">
        <h3 className="my-volunteering__card-title">{getActivityTitle(activity)}</h3>
        <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
      </div>

      {activity.partner && (
        <p className="my-volunteering__meta">Entidad: {activity.partner}</p>
      )}
      <p className="my-volunteering__meta">
        {formatDate(startDate)} — {formatDate(endDate)} {hours ? `· ${hours} h` : ''}
      </p>

      {showQueue && (
        <p className="my-volunteering__queue">
          Posición en la lista de espera: {item.queuePosition}
        </p>
      )}

      {showsAccepted && (
        <p className="my-volunteering__accepted" data-testid={`accepted-${item.registrationId}`}>
          {acceptedLabel}
        </p>
      )}

      <div className="my-volunteering__card-actions">
        {action && (
          <Link
            to={action.to}
            className={`button button--${action.variant} button--small`}
            data-testid={`${action.testIdPrefix}-${item.registrationId}`}
          >
            {action.label}
          </Link>
        )}

        {canCancel && (
          <Button
            variant="danger"
            size="small"
            onClick={openModal}
            data-testid={`cancel-${item.registrationId}`}
            disabled={isCancelling}
          >
            Cancelar inscripción
          </Button>
        )}
      </div>

      <CancelRegistrationModal
        isOpen={isModalOpen}
        isCancelling={isCancelling}
        registrationId={item.registrationId}
        onClose={closeModal}
        onConfirm={confirmCancel}
      />
    </Card>
  );
}
