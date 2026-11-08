import { EmptyState, Pagination, Table, Tabs } from '../../../shared/ui';
import {
  getEmptySectionTitle,
  getSectionCaption,
  hasRowActions,
} from '../model/registrationsTable';

export default function RegistrationsSections({
  isGlobal,
  tabs,
  activeSection,
  activeSectionKey,
  onSectionChange,
  rows,
  columns,
  page,
  totalPages,
  onPageChange,
}) {
  const hasRows = rows.length > 0;
  const showsActions = rows.some(hasRowActions);
  const visibleColumns = showsActions
    ? columns
    : columns.filter((column) => column.key !== 'actions');

  return (
    <div className="registrations-page__sections">
      <Tabs
        label="Estado de las inscripciones"
        tabs={tabs}
        activeId={activeSectionKey}
        onChange={onSectionChange}
      >
        <section className="registrations-page__section">
          {hasRows ? (
            <Table
              caption={getSectionCaption({ isGlobal, sectionTitle: activeSection.title })}
              columns={visibleColumns}
              data={rows}
              rowKey="registrationId"
            />
          ) : (
            <EmptyState title={getEmptySectionTitle(activeSection)} />
          )}
        </section>
      </Tabs>

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
        ariaLabel="Paginación de inscripciones"
      />
    </div>
  );
}
