import { EmptyState, PageHeader, Pagination, Spinner, Table } from '../../../shared/ui';
import PendingOrganizationConfirmModal from '../components/PendingOrganizationConfirmModal';
import buildPendingOrganizationColumns from '../components/pendingOrganizationColumns';
import usePendingOrganizations from '../hooks/usePendingOrganizations';

export default function AdminAccountStatusPage() {
  const pending = usePendingOrganizations();
  const columns = buildPendingOrganizationColumns({
    actionPendingId: pending.actionPendingId,
    onRequestAction: pending.openConfirmation,
  });

  const isEmpty = !pending.isLoading && !pending.hasError && pending.organizations.length === 0;
  const hasRows = !pending.isLoading && !pending.hasError && pending.organizations.length > 0;
  const headerDescription = pending.isLoading || pending.hasError ? undefined : pending.countLabel;

  return (
    <section className="account-status">
      <PageHeader title="Organizaciones" description={headerDescription} />

      {pending.isLoading && (
        <div className="account-status__center">
          <Spinner label="Cargando organizaciones pendientes" />
        </div>
      )}

      {pending.hasError && <EmptyState title="Error" description={pending.error} />}

      {isEmpty && (
        <EmptyState
          title="No hay cuentas pendientes"
          description="Todas las solicitudes de registro han sido revisadas."
        />
      )}

      {hasRows && (
        <>
          <Table caption="Cuentas por aprobar" columns={columns} data={pending.organizations} />
          <Pagination
            page={pending.page}
            totalPages={pending.totalPages}
            onPageChange={pending.setPage}
            ariaLabel="Paginación de cuentas pendientes"
          />
        </>
      )}

      <PendingOrganizationConfirmModal
        isOpen={pending.confirmation.isOpen}
        action={pending.confirmation.action}
        organizationName={pending.confirmation.organizationName}
        onClose={pending.closeConfirmation}
        onConfirm={pending.confirmAction}
      />
    </section>
  );
}
