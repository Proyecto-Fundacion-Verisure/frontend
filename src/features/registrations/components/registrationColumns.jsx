import { Link } from 'react-router-dom';
import { Badge } from '../../../shared/ui';
import { getSectionStatusBadge, hasRowActions } from '../model/registrationsTable';
import CancelRegistrationAction from './CancelRegistrationAction';
import RegistrationDecisionActions from './RegistrationDecisionActions';

// El tablero global mezcla filas de varias actividades: la columna «Actividad»
// dice de cuál es cada una y lleva a su tablero propio.
function renderActivity(registration) {
  return (
    <Link
      to={`/activities/${registration.activityId}/registrations`}
      state={{ activityTitle: registration.activityTitle }}
    >
      {registration.activityTitle}
    </Link>
  );
}

function renderPerson(registration) {
  return registration.userName;
}

function renderDepartment(registration) {
  return registration.department;
}

function renderOrganization(registration) {
  return registration.organization;
}

function renderYearHours(registration) {
  return registration.yearHours ?? 0;
}

function renderStatus(registration) {
  const badge = getSectionStatusBadge(registration);
  return <Badge variant={badge.variant}>{badge.label}</Badge>;
}

// Las acciones se deciden por fila, no por sección.
function renderActions(registration, actions) {
  const isUnreviewed = registration.status === 'WAITLISTED' && !registration.accepted;

  if (isUnreviewed) {
    return (
      <RegistrationDecisionActions
        registration={registration}
        decision={actions.decision}
        onAccept={actions.acceptRegistration}
        onReject={actions.rejectRegistration}
      />
    );
  }

  if (hasRowActions(registration)) {
    return (
      <CancelRegistrationAction
        registration={registration}
        decision={actions.decision}
        onCancel={actions.cancelRegistration}
      />
    );
  }

  return null;
}

const ACTIVITY_COLUMN = { key: 'activity', label: 'Actividad', render: renderActivity };

const BASE_COLUMNS = [
  { key: 'person', label: 'Persona', render: renderPerson },
  { key: 'department', label: 'Departamento', render: renderDepartment },
  { key: 'organization', label: 'Organización', render: renderOrganization },
  { key: 'yearHours', label: 'Horas del año', render: renderYearHours },
  { key: 'status', label: 'Estado', render: renderStatus },
];

export default function buildRegistrationColumns({
  isGlobal,
  decision,
  acceptRegistration,
  rejectRegistration,
  cancelRegistration,
}) {
  const actions = { decision, acceptRegistration, rejectRegistration, cancelRegistration };
  const actionColumn = {
    key: 'actions',
    label: 'Acciones',
    render: (registration) => renderActions(registration, actions),
  };

  return [
    ...(isGlobal ? [ACTIVITY_COLUMN] : []),
    ...BASE_COLUMNS,
    actionColumn,
  ];
}
