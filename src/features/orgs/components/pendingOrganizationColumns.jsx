import { Badge, Button } from '../../../shared/ui';
import { formatDateTime } from '../../../shared/lib/dates';

function renderOrganization(organization) {
  return (
    <>
      <strong className="account-status__org-name">{organization.organizationName}</strong>
      <span className="account-status__meta">CIF {organization.cif}</span>
    </>
  );
}

function renderContact(organization) {
  return (
    <>
      {organization.contactName}
      <span className="account-status__meta">{organization.email}</span>
      <span className="account-status__meta">{organization.phone}</span>
    </>
  );
}

function renderRequestedAt(organization) {
  return formatDateTime(organization.requestedAt, { day: 'numeric', month: 'long', year: 'numeric' });
}

// No se bloquea aprobar sin correo verificado; se avisa.
function renderEmailStatus(organization) {
  return organization.emailVerified
    ? <Badge variant="success">Verificado</Badge>
    : <Badge variant="warning">Sin verificar</Badge>;
}

function renderActions(organization, { actionPendingId, onRequestAction }) {
  const isPending = actionPendingId === organization.id;

  return (
    <div className="account-status__row-actions">
      <Button
        size="small"
        isLoading={isPending}
        loadingLabel="Procesando"
        onClick={() => onRequestAction(organization, 'accept')}
      >
        Aceptar
      </Button>
      <Button
        size="small"
        variant="secondary"
        isLoading={isPending}
        loadingLabel="Procesando"
        onClick={() => onRequestAction(organization, 'reject')}
      >
        Rechazar
      </Button>
    </div>
  );
}

export default function buildPendingOrganizationColumns(actions) {
  return [
    { key: 'organization', label: 'Entidad', render: renderOrganization },
    { key: 'contact', label: 'Contacto', render: renderContact },
    { key: 'requestedAt', label: 'Solicitado el', render: renderRequestedAt },
    { key: 'emailVerified', label: 'Correo', render: renderEmailStatus },
    {
      key: 'actions',
      label: 'Acciones',
      render: (organization) => renderActions(organization, actions),
    },
  ];
}
