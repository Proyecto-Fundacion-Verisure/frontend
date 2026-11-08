import { Button, Card, EmptyState, PageHeader, Spinner } from '../../../shared/ui';
import DashboardContent from '../components/DashboardContent';
import DashboardFilters from '../components/DashboardFilters';
import ExportMenu from '../components/ExportMenu';
import useDashboard from '../hooks/useDashboard';
import { normalizeDashboardData } from '../model/dashboardData';

export default function DashboardPage({ attentionPanel = null }) {
  const {
    year,
    line,
    filters,
    requestState,
    applyFilters,
    clearFilters,
    retry,
  } = useDashboard();
  const dashboard = normalizeDashboardData(requestState.data);

  const isLoading = requestState.status === 'loading';
  const isForbidden = requestState.status === 'error' && requestState.error?.status === 403;
  const hasRequestError = requestState.status === 'error' && requestState.error?.status !== 403;
  const hasEmptyData = requestState.status === 'success' && !dashboard.hasData;
  const hasContent = requestState.status === 'success' && dashboard.hasData;
  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className="dashboard">
      <PageHeader
        title="Panel"
        description="Consulta el impacto de las participaciones cerradas y descarga los resultados."
        actions={<ExportMenu filters={filters} />}
      />
      {dashboard.isMockData && (
        <span className="dashboard__demo-badge">Datos ficticios para validación</span>
      )}

      {attentionPanel}

      <DashboardFilters
        year={year}
        line={line}
        onApply={applyFilters}
        onClear={clearFilters}
      />

      {isLoading && (
        <Card className="dashboard__loading" role="status" aria-live="polite">
          <Spinner label="Cargando indicadores del dashboard…" />
          <p>Cargando indicadores…</p>
        </Card>
      )}

      {isForbidden && (
        <Card className="dashboard__error" role="alert">
          <h2>Acceso restringido</h2>
          <p>No tienes permiso para consultar el dashboard de la Fundación.</p>
        </Card>
      )}

      {hasRequestError && (
        <Card className="dashboard__error">
          <h2>No hemos podido cargar el dashboard</h2>
          <p role="alert">{requestState.error?.message ?? 'Comprueba tu conexión y vuelve a intentarlo.'}</p>
          <Button onClick={retry}>Reintentar</Button>
        </Card>
      )}

      {hasEmptyData && (
        <Card>
          <EmptyState
            title="Todavía no hay datos de impacto"
            description="El dashboard se completa cuando existen participaciones cerradas para los filtros seleccionados."
            action={hasActiveFilters ? (
              <Button variant="secondary" onClick={clearFilters}>Ver todos los datos</Button>
            ) : undefined}
          />
        </Card>
      )}

      {hasContent && <DashboardContent dashboard={dashboard} filters={filters} />}
    </div>
  );
}
