import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Badge, Button, EmptyState, Pagination, Spinner, Table } from '../../components/ui';
import RegistrationDecisionActions from './RegistrationDecisionActions';
import CancelRegistrationAction from './CancelRegistrationAction';
import useRegistrations from './useRegistrations';

const WORK_SECTIONS = [
  { key: 'waitlisted', title: 'En cola' },
  { key: 'confirmed', title: 'Confirmadas' },
];

const HISTORY_SECTIONS = [
  { key: 'pending-report', title: 'Pendientes de cierre' },
  { key: 'closed', title: 'Cerradas' },
  { key: 'rejected', title: 'Rechazadas' },
  { key: 'cancelled', title: 'Canceladas' },
];

const ALL_SECTIONS = [...WORK_SECTIONS, ...HISTORY_SECTIONS];

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

// Columnas con acciones que se deciden por fila según el estado.
function buildColumnsWithActions({ decision, acceptRegistration, rejectRegistration, cancelRegistration }) {
  return [
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
        const isCancellable = ['WAITLISTED', 'CONFIRMED', 'PENDING_CLOSURE'].includes(registration.status);
        if (isCancellable) {
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

// Total de una sección agrupa: "En cola" incluye sin revisar y aceptadas.
function getWaitlistedCount(grouped) {
  return (grouped['unreviewed'] ?? []).length + (grouped['accepted-waitlist'] ?? []).length;
}

function getUnreviewedCount(grouped) {
  return (grouped['unreviewed'] ?? []).length;
}

export default function RegistrationsTablePage() {
  const { activityId } = useParams();
  const { state } = useLocation();
  const [page, setPage] = useState(1);
  const [historyOpen, setHistoryOpen] = useState(false);
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
    decision,
    acceptRegistration,
    rejectRegistration,
    cancelRegistration,
  });

  const waitlistedTotal = getWaitlistedCount(grouped);
  const unreviewedTotal = getUnreviewedCount(grouped);
  const confirmedTotal = (grouped['confirmed'] ?? []).length;
  const historyTotal = HISTORY_SECTIONS.reduce(
    (sum, section) => sum + (grouped[section.key] ?? []).length,
    0,
  );

  return (
    <section className="registrations-page" aria-labelledby="registrations-title">
      <header className="registrations-page__header">
        <div>
          <Link className="registrations-page__back" to="/admin/activities">← Volver a actividades</Link>
          <p className="registrations-page__eyebrow">Administración</p>
          <h1 id="registrations-title">Inscripciones</h1>
          <p>{state?.activityTitle ?? `Actividad ${activityId}`}</p>
        </div>
        <div className="registrations-page__totals">
          <strong>{totalElements} inscripciones</strong>
          {counts && (
            <p className="registrations-page__summary">
              Confirmadas {counts.confirmed} · En cola {counts.waitlisted}
              {counts.unreviewed > 0 && `, de las que ${counts.unreviewed} sin revisar`}
            </p>
          )}
        </div>
      </header>

      {registrations.length === 0 ? (
        <EmptyState
          title="Todavía no hay inscripciones"
          description="Cuando alguien solicite participar, aparecerá aquí para su revisión."
        />
      ) : (
        <div className="registrations-page__sections">
          {WORK_SECTIONS.map((section) => {
            const sectionKey = section.key === 'waitlisted' ? null : section.key;
            const rows = section.key === 'waitlisted'
              ? [...(grouped['unreviewed'] ?? []), ...(grouped['accepted-waitlist'] ?? [])]
              : (grouped[sectionKey] ?? []);
            return (
              <section className="registrations-page__section" key={section.key}>
                <h2>{section.title} <span>{rows.length}</span></h2>
                <Table
                  caption={`${section.title} de la actividad`}
                  columns={columnsWithActions}
                  data={rows}
                  rowKey="registrationId"
                />
              </section>
            );
          })}

          <section className="registrations-page__section registrations-page__section--history">
            <Button
              variant="secondary"
              size="small"
              onClick={() => setHistoryOpen((prev) => !prev)}
              aria-expanded={historyOpen}
              aria-controls="registrations-history"
            >
              {historyOpen
                ? <ChevronDown aria-hidden="true" size={16} />
                : <ChevronRight aria-hidden="true" size={16} />}
              Historial ({historyTotal})
            </Button>
            {historyOpen && (
              <div id="registrations-history" className="registrations-page__history-content">
                {HISTORY_SECTIONS.map((section) => {
                  const rows = grouped[section.key] ?? [];
                  return (
                    <section className="registrations-page__section registrations-page__section--terminal" key={section.key}>
                      <h3>{section.title} <span>{rows.length}</span></h3>
                      <Table
                        caption={`${section.title} de la actividad`}
                        columns={columnsWithActions}
                        data={rows}
                        rowKey="registrationId"
                        emptyMessage={`No hay inscripciones ${section.title.toLowerCase()}.`}
                      />
                    </section>
                  );
                })}
              </div>
            )}
          </section>

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
