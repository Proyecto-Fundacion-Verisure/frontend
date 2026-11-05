import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Badge, Button, EmptyState, PageHeader, Pagination, Spinner, Table, Tabs } from '../../components/ui';
import RegistrationDecisionActions from './RegistrationDecisionActions';
import CancelRegistrationAction from './CancelRegistrationAction';
import useRegistrations from './useRegistrations';

const SECTIONS = [
  { key: 'waitlisted', title: 'En cola' },
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
  cancelled: { label: 'Cancelada', variant: 'danger' },
};

function getSectionKey(registration) {
  if (registration.status === 'WAITLISTED') {
    return registration.accepted ? 'accepted-waitlist' : 'unreviewed';
  }
  return {
    CONFIRMED: 'confirmed',
    PENDING_CLOSURE: 'pending-report',
    CLOSED: 'closed',
    REJECTED: 'rejected',
    CANCELLED: 'cancelled',
  }[registration.status] ?? 'unreviewed';
}

// La respuesta es el Page de Spring, así que las filas van en `content`.
function getRegistrations(payload) {
  return Array.isArray(payload?.content) ? payload.content : [];
}

// El tablero global mezcla filas de varias actividades: la columna «Proyecto»
// dice de cuál es cada una y lleva a su tablero propio.
const ACTIVITY_COLUMN = {
  key: 'activity',
  label: 'Proyecto',
  render: (registration) => (
    <Link
      to={`/activities/${registration.activityId}/registrations`}
      state={{ activityTitle: registration.activityTitle }}
    >
      {registration.activityTitle}
    </Link>
  ),
};

// Columnas base: Persona, Departamento, Organización, Horas del año, Estado.
// Las acciones se deciden por fila, no por sección.
const BASE_COLUMNS = [
  { key: 'person', label: 'Persona', render: (registration) => registration.userName },
  {
    key: 'department',
    label: 'Departamento',
    render: (registration) => registration.department,
  },
  {
    key: 'organization',
    label: 'Organización',
    render: (registration) => registration.organization,
  },
  {
    key: 'yearHours',
    label: 'Horas del año',
    render: (registration) => registration.yearHours ?? 0,
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

// «En cola» agrupa las sin revisar y las aceptadas.
function getSectionRows(grouped, sectionKey) {
  return sectionKey === 'waitlisted'
    ? [...(grouped['unreviewed'] ?? []), ...(grouped['accepted-waitlist'] ?? [])]
    : (grouped[sectionKey] ?? []);
}

function hasRowActions(registration) {
  return ['WAITLISTED', 'CONFIRMED', 'PENDING_CLOSURE'].includes(registration.status);
}

// Columnas con acciones que se deciden por fila según el estado.
function buildColumnsWithActions({
  isGlobal, decision, acceptRegistration, rejectRegistration, cancelRegistration,
}) {
  return [
    ...(isGlobal ? [ACTIVITY_COLUMN] : []),
    ...BASE_COLUMNS,
    {
      key: 'actions',
      label: 'Acciones',
      render: (registration) => {
        const isUnreviewed = registration.status === 'WAITLISTED' && !registration.accepted;
        if (isUnreviewed) {
          return (
            <RegistrationDecisionActions
              registration={registration}
              decision={decision}
              onAccept={acceptRegistration}
              onReject={rejectRegistration}
            />
          );
        }
        if (hasRowActions(registration)) {
          return (
            <CancelRegistrationAction
              registration={registration}
              decision={decision}
              onCancel={cancelRegistration}
            />
          );
        }
        return null;
      },
    },
  ];
}

// Sin `activityId` en la ruta es el tablero global: todas las actividades.
export default function RegistrationsTablePage() {
  const { activityId } = useParams();
  const isGlobal = !activityId;
  const { state } = useLocation();
  const [page, setPage] = useState(1);
  const [activeSectionKey, setActiveSectionKey] = useState(SECTIONS[0].key);
  const {
    board,
    counts,
    loading,
    error,
    decision,
    reload,
    acceptRegistration,
    rejectRegistration,
    cancelRegistration,
  } = useRegistrations(activityId, page - 1);

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
  const totalElements = Number(board?.totalElements) || registrations.length;
  const totalPages = Math.max(Number(board?.totalPages) || 1, 1);
  const grouped = registrations.reduce((result, registration) => {
    const key = getSectionKey(registration);
    result[key] = [...(result[key] ?? []), registration];
    return result;
  }, {});

  const columnsWithActions = buildColumnsWithActions({
    isGlobal,
    decision,
    acceptRegistration,
    rejectRegistration,
    cancelRegistration,
  });

  const activeSection = SECTIONS.find((section) => section.key === activeSectionKey);
  const activeRows = getSectionRows(grouped, activeSectionKey);

  return (
    <section className="registrations-page" aria-labelledby="registrations-title">
      {!isGlobal && (
        <Link className="registrations-page__back" to="/admin/activities">← Volver a actividades</Link>
      )}
      <PageHeader
        title="Inscripciones"
        titleId="registrations-title"
        description={isGlobal ? 'Todos los proyectos' : (state?.activityTitle ?? `Actividad ${activityId}`)}
        actions={(
          <div className="registrations-page__totals">
            <strong>{totalElements} inscripciones</strong>
            {counts && (
              <p className="registrations-page__summary">
                Confirmadas {counts.confirmed} · En cola {counts.waitlisted}
                {counts.unreviewed > 0 && `, de las que ${counts.unreviewed} sin revisar`}
              </p>
            )}
          </div>
        )}
      />

      {registrations.length === 0 ? (
        <EmptyState
          title="Todavía no hay inscripciones"
          description="Cuando alguien solicite participar, aparecerá aquí para su revisión."
        />
      ) : (
        <div className="registrations-page__sections">
          <Tabs
            label="Estado de las inscripciones"
            tabs={SECTIONS.map((section) => ({
              id: section.key,
              label: section.title,
              count: getSectionRows(grouped, section.key).length,
            }))}
            activeId={activeSection.key}
            onChange={setActiveSectionKey}
          >
            <section className="registrations-page__section">
              {activeRows.length > 0 ? (
                <Table
                  caption={isGlobal ? activeSection.title : `${activeSection.title} de la actividad`}
                  columns={activeRows.some(hasRowActions)
                    ? columnsWithActions
                    : columnsWithActions.filter((column) => column.key !== 'actions')}
                  data={activeRows}
                  rowKey="registrationId"
                />
              ) : (
                <EmptyState title={`No hay inscripciones ${activeSection.title.toLowerCase()}`} />
              )}
            </section>
          </Tabs>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            ariaLabel="Paginación de inscripciones"
          />
        </div>
      )}
    </section>
  );
}
