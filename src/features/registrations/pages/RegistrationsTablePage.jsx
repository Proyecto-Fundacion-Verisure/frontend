import { Link, useLocation, useParams } from 'react-router-dom';
import { EmptyState, PageHeader } from '../../../shared/ui';
import RegistrationsLoadError from '../components/RegistrationsLoadError';
import RegistrationsLoading from '../components/RegistrationsLoading';
import RegistrationsSections from '../components/RegistrationsSections';
import buildRegistrationColumns from '../components/registrationColumns';
import useRegistrationsTable from '../hooks/useRegistrationsTable';

// Sin `activityId` en la ruta es el tablero global: todas las actividades.
export default function RegistrationsTablePage() {
  const { activityId } = useParams();
  const { state } = useLocation();
  const isGlobal = !activityId;
  const table = useRegistrationsTable(activityId);

  const columns = buildRegistrationColumns({
    isGlobal,
    decision: table.decision,
    acceptRegistration: table.acceptRegistration,
    rejectRegistration: table.rejectRegistration,
    cancelRegistration: table.cancelRegistration,
  });

  const isLoading = table.loading;
  const hasError = Boolean(table.error) && !isLoading;
  const isEmpty = !isLoading && !hasError && table.registrations.length === 0;
  const hasContent = !isLoading && !hasError && table.registrations.length > 0;

  const description = isGlobal
    ? 'Todas las actividades'
    : (state?.activityTitle ?? `Actividad ${activityId}`);

  return (
    <>
      {isLoading && <RegistrationsLoading />}

      {hasError && <RegistrationsLoadError error={table.error} onRetry={table.retry} />}

      {!isLoading && !hasError && (
        <section className="registrations-page" aria-labelledby="registrations-title">
          {!isGlobal && (
            <Link className="registrations-page__back" to="/admin/activities">
              ← Volver a actividades
            </Link>
          )}

          <PageHeader
            title="Inscripciones"
            titleId="registrations-title"
            description={description}
            actions={
              <div className="registrations-page__totals">
                <strong>{table.totalElements} inscripciones</strong>
                {table.countsSummary && (
                  <p className="registrations-page__summary">{table.countsSummary}</p>
                )}
              </div>
            }
          />

          {isEmpty && (
            <EmptyState
              title="Todavía no hay inscripciones"
              description="Cuando alguien solicite participar, aparecerá aquí para su revisión."
            />
          )}

          {hasContent && (
            <RegistrationsSections
              isGlobal={isGlobal}
              tabs={table.tabs}
              activeSection={table.activeSection}
              activeSectionKey={table.activeSectionKey}
              onSectionChange={table.setActiveSectionKey}
              rows={table.activeRows}
              columns={columns}
              page={table.page}
              totalPages={table.totalPages}
              onPageChange={table.setPage}
            />
          )}
        </section>
      )}
    </>
  );
}
