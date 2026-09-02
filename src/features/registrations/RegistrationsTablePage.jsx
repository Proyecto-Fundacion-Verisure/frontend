import { Link, useParams } from 'react-router-dom';
import { Badge, Button, EmptyState, Spinner, Table } from '../../components/ui';
import RegistrationSummary from './RegistrationSummary';
import RegistrationDecisionActions from './RegistrationDecisionActions';
import CancelRegistrationAction from './CancelRegistrationAction';
import useRegistrations from './useRegistrations';

const SECTIONS = [
  { key: 'unreviewed', title: 'Sin revisar' },
  { key: 'accepted-waitlist', title: 'Aceptadas en cola' },
  { key: 'confirmed', title: 'Confirmadas' },
  { key: 'pending-report', title: 'Pendientes de cierre' },
  { key: 'closed', title: 'Cerradas' },
  { key: 'rejected', title: 'Rechazadas' },
  { key: 'cancelled', title: 'Canceladas' },
];

const STATUS_BADGES = {
  unreviewed: { label: 'Sin revisar', variant: 'warning' },
  'accepted-waitlist': { label: 'Aceptada · en cola', variant: 'info' },
  confirmed: { label: 'Confirmada', variant: 'success' },
  'pending-report': { label: 'Pendiente de cierre', variant: 'warning' },
  closed: { label: 'Cerrada', variant: 'neutral' },
  rejected: { label: 'Rechazada', variant: 'danger' },
  cancelled: { label: 'Cancelada', variant: 'neutral' },
};

function getSectionKey(registration) {
  if (registration.status === 'WAITLISTED') {
    return registration.accepted ? 'accepted-waitlist' : 'unreviewed';
  }
  return {
    CONFIRMED: 'confirmed',
    PENDING_REPORT: 'pending-report',
    CLOSED: 'closed',
    REJECTED: 'rejected',
    CANCELLED: 'cancelled',
  }[registration.status] ?? 'unreviewed';
}

function getRegistrations(payload) {
  if (Array.isArray(payload)) return payload;
  for (const key of ['registrations', 'items', 'content']) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
}

function getPersonName(registration) {
  return registration.person?.name
    ?? registration.employee?.name
    ?? registration.user?.name
    ?? registration.userName
    ?? registration.name
    ?? '—';
}

const BASE_COLUMNS = [
  { key: 'person', label: 'Persona', render: getPersonName },
  {
    key: 'department',
    label: 'Departamento',
    render: (registration) => registration.person?.department
      ?? registration.employee?.department
      ?? registration.department
      ?? '—',
  },
  {
    key: 'organization',
    label: 'Organización',
    render: (registration) => registration.person?.organization
      ?? registration.employee?.organization
      ?? registration.organization
      ?? '—',
  },
  {
    key: 'yearHours',
    label: 'Horas del año',
    render: (registration) => registration.yearHours
      ?? registration.annualHours
      ?? registration.hoursThisYear
      ?? 0,
  },
  {
    key: 'status',
    label: 'Estado',
    render: (registration) => {
      const badge = STATUS_BADGES[getSectionKey(registration)];
      return <Badge variant={badge.variant}>{badge.label}</Badge>;
    },
  },
];

export default function RegistrationsTablePage() {
  const { activityId } = useParams();
  const {
    board,
    loading,
    error,
    decision,
    reload,
    acceptRegistration,
    rejectRegistration,
    cancelRegistration,
  } = useRegistrations(activityId);

  if (loading) {
    return (
      <section className="registrations-page registrations-page--state" aria-label="Cargando inscripciones">
        <Spinner label="Cargando inscripciones…" />
      </section>
    );
  }

  if (error) {
    const isForbidden = error.status === 403;
    return (
      <section className="registrations-page registrations-page--state">
        <h1>{isForbidden ? 'No tienes permiso para consultar las inscripciones' : 'No hemos podido cargar las inscripciones'}</h1>
        <p role="alert">{error.message || 'Inténtalo de nuevo.'}</p>
        <div className="registrations-page__state-actions">
          {!isForbidden && <Button onClick={() => reload().catch(() => undefined)}>Reintentar</Button>}
          <Link className="button button--secondary button--medium" to="/admin/activities">Volver a actividades</Link>
        </div>
      </section>
    );
  }

  const registrations = getRegistrations(board);
  const grouped = registrations.reduce((result, registration) => {
    const key = getSectionKey(registration);
    result[key] = [...(result[key] ?? []), registration];
    return result;
  }, {});
  const unreviewedColumns = [
    ...BASE_COLUMNS,
    {
      key: 'actions',
      label: 'Acciones',
      render: (registration) => (
        <RegistrationDecisionActions
          registration={registration}
          decision={decision}
          onAccept={acceptRegistration}
          onReject={rejectRegistration}
        />
      ),
    },
  ];
  const cancellableColumns = [
    ...BASE_COLUMNS,
    {
      key: 'actions',
      label: 'Acciones',
      render: (registration) => (
        <CancelRegistrationAction
          registration={registration}
          decision={decision}
          onCancel={cancelRegistration}
        />
      ),
    },
  ];

  return (
    <section className="registrations-page" aria-labelledby="registrations-title">
      <header className="registrations-page__header">
        <div>
          <Link className="registrations-page__back" to="/admin/activities">← Volver a actividades</Link>
          <p className="registrations-page__eyebrow">Administración</p>
          <h1 id="registrations-title">Inscripciones</h1>
          <p>{board?.activity?.title ?? board?.activityTitle ?? `Actividad ${activityId}`}</p>
        </div>
        <strong>{registrations.length} inscripciones</strong>
      </header>

      <RegistrationSummary board={board} />

      {registrations.length === 0 ? (
        <EmptyState
          title="Todavía no hay inscripciones"
          description="Cuando alguien solicite participar, aparecerá aquí para su revisión."
        />
      ) : (
        <div className="registrations-page__sections">
          {SECTIONS.map((section) => {
            const rows = grouped[section.key] ?? [];
            if (!rows.length) return null;
            return (
              <section className="registrations-page__section" key={section.key}>
                <h2>{section.title} <span>{rows.length}</span></h2>
                <Table
                  caption={`${section.title} de la actividad`}
                  columns={section.key === 'unreviewed'
                    ? unreviewedColumns
                    : ['accepted-waitlist', 'confirmed', 'pending-report'].includes(section.key)
                      ? cancellableColumns
                      : BASE_COLUMNS}
                  data={rows}
                  rowKey="registrationId"
                />
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}
