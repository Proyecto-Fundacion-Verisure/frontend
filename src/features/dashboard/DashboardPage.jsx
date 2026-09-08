import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getDashboard } from '../../api/dashboardApi';
import { Link } from 'react-router-dom';
import { Button, Card, EmptyState, Spinner } from '../../components/ui';
import { ACTIVITY_LINES, getLineByValue } from '../../constants/activityLines';
import BarChart from './BarChart';
import ChartTable from './ChartTable';
import DashboardExports from './DashboardExports';
import ExportMenu from './ExportMenu';
import DashboardFilters, { isValidDashboardYear } from './DashboardFilters';
import KpiRow, { KPI_DEFINITIONS } from './KpiRow';

const ALLOWED_LINES = new Set(ACTIVITY_LINES.map(({ value }) => value));

function hasDashboardData(data) {
  if (!data || typeof data !== 'object') return false;
  const metrics = data.kpis ?? data;
  const hasMetric = KPI_DEFINITIONS.some(({ key }) => (
    Object.prototype.hasOwnProperty.call(metrics, key) && metrics[key] !== null
  ));
  return hasMetric
    || ['hoursByDepartment', 'hoursByLine', 'favoriteRanking']
      .some((key) => Array.isArray(data[key]) && data[key].length > 0);
}

function DashboardDataSection({
  id,
  title,
  description,
  data,
  labelKey,
  valueKey,
  categoryLabel,
  valueLabel,
  getLabel,
  emptyTitle,
}) {
  return (
    <Card as="section" className="dashboard-chart-panel" aria-labelledby={`${id}-title`}>
      <header className="dashboard-chart-panel__header">
        <h2 id={`${id}-title`}>{title}</h2>
        <p>{description}</p>
      </header>
      {data.length > 0 ? (
        <div className="dashboard-chart-panel__content">
          <BarChart
            data={data}
            title={title}
            description={description}
            labelKey={labelKey}
            valueKey={valueKey}
            getLabel={getLabel}
          />
          <ChartTable
            data={data}
            caption={`Tabla de ${title.toLowerCase()}`}
            categoryLabel={categoryLabel}
            valueLabel={valueLabel}
            labelKey={labelKey}
            valueKey={valueKey}
            getLabel={getLabel}
          />
        </div>
      ) : (
        <EmptyState
          title={emptyTitle}
          description="No hay datos suficientes para los filtros seleccionados. Prueba con otro año o línea de acción."
        />
      )}
    </Card>
  );
}

export default function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [requestState, setRequestState] = useState({ status: 'loading', data: null, error: null });
  const [retryKey, setRetryKey] = useState(0);

  const rawYear = searchParams.get('year') ?? '';
  const rawLine = searchParams.get('line') ?? '';
  const year = isValidDashboardYear(rawYear) ? rawYear : '';
  const line = ALLOWED_LINES.has(rawLine) ? rawLine : '';
  const filters = useMemo(() => ({
    ...(year ? { year: Number(year) } : {}),
    ...(line ? { line } : {}),
  }), [line, year]);

  useEffect(() => {
    const invalidYear = Boolean(rawYear) && !isValidDashboardYear(rawYear);
    const invalidLine = Boolean(rawLine) && !ALLOWED_LINES.has(rawLine);
    if (!invalidYear && !invalidLine) return;

    const normalized = new URLSearchParams(searchParams);
    if (invalidYear) normalized.delete('year');
    if (invalidLine) normalized.delete('line');
    setSearchParams(normalized, { replace: true });
  }, [rawLine, rawYear, searchParams, setSearchParams]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setRequestState((current) => ({ ...current, status: 'loading', error: null }));
    getDashboard(filters, { signal: controller.signal })
      .then((response) => {
        if (active) setRequestState({ status: 'success', data: response.data, error: null });
      })
      .catch((error) => {
        if (active && !error?.isCanceled) {
          setRequestState({ status: 'error', data: null, error });
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [filters, retryKey]);

  const applyFilters = (nextFilters) => {
    const next = new URLSearchParams();
    if (nextFilters.year) next.set('year', String(nextFilters.year));
    if (nextFilters.line) next.set('line', nextFilters.line);
    if (next.toString() !== searchParams.toString()) setSearchParams(next);
  };

  const clearFilters = () => {
    if (searchParams.toString()) setSearchParams(new URLSearchParams());
  };

  const metrics = requestState.data?.kpis ?? requestState.data ?? {};
  const departmentData = Array.isArray(requestState.data?.hoursByDepartment)
    ? requestState.data.hoursByDepartment
    : [];
  const lineData = Array.isArray(requestState.data?.hoursByLine)
    ? requestState.data.hoursByLine
    : [];
  const rankingData = Array.isArray(requestState.data?.favoriteRanking)
    ? requestState.data.favoriteRanking
    : [];

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div>
          <p className="dashboard__eyebrow">Análisis de impacto</p>
          <h1>Panel de control</h1>
        </div>
        <div className="dashboard__header-actions">
          <Link to="/proposals" className="button button--secondary button--medium">
            Ver propuestas recibidas
          </Link>
          <ExportMenu filters={filters} />
        </div>
      </header>
      <p className="dashboard__intro">Consulta el impacto de las participaciones cerradas y descarga los resultados.</p>

      <DashboardFilters
        year={year}
        line={line}
        onApply={applyFilters}
        onClear={clearFilters}
      />

      {requestState.status === 'loading' && (
        <Card className="dashboard__loading" role="status" aria-live="polite">
          <Spinner label="Cargando indicadores del dashboard…" />
          <p>Cargando indicadores…</p>
        </Card>
      )}

      {requestState.status === 'error' && requestState.error?.status === 403 && (
        <Card className="dashboard__error" role="alert">
          <h2>Acceso restringido</h2>
          <p>No tienes permiso para consultar el dashboard de la Fundación.</p>
        </Card>
      )}

      {requestState.status === 'error' && requestState.error?.status !== 403 && (
        <Card className="dashboard__error">
          <h2>No hemos podido cargar el dashboard</h2>
          <p role="alert">{requestState.error?.message ?? 'Comprueba tu conexión y vuelve a intentarlo.'}</p>
          <Button onClick={() => setRetryKey((current) => current + 1)}>Reintentar</Button>
        </Card>
      )}

      {requestState.status === 'success' && !hasDashboardData(requestState.data) && (
        <Card>
          <EmptyState
            title="Todavía no hay datos de impacto"
            description="El dashboard se completa cuando existen participaciones cerradas para los filtros seleccionados."
            action={Object.keys(filters).length > 0 ? (
              <Button variant="secondary" onClick={clearFilters}>Ver todos los datos</Button>
            ) : undefined}
          />
        </Card>
      )}

      {requestState.status === 'success' && hasDashboardData(requestState.data) && (
        <>
          <KpiRow metrics={metrics} />
          <div className="dashboard__charts">
            <DashboardDataSection
              id="department-hours"
              title="Horas por departamento"
              description="Horas reportadas por cada departamento de la plantilla."
              data={departmentData}
              labelKey="department"
              valueKey="hours"
              categoryLabel="Departamento"
              valueLabel="Horas"
              emptyTitle="Sin horas por departamento"
            />
            <DashboardDataSection
              id="line-hours"
              title="Horas por línea de acción"
              description="Horas reportadas en cada línea de acción de la Fundación."
              data={lineData}
              labelKey="line"
              valueKey="hours"
              categoryLabel="Línea de acción"
              valueLabel="Horas"
              getLabel={(item) => getLineByValue(item.line)?.label ?? item.line}
              emptyTitle="Sin horas por línea de acción"
            />
          </div>
          <DashboardDataSection
            id="favorite-ranking"
            title="Actividades favoritas"
            description="Ranking agregado por el backend según el número total de favoritos."
            data={rankingData}
            labelKey="activityTitle"
            valueKey="favoriteCount"
            categoryLabel="Actividad"
            valueLabel="Favoritos"
            emptyTitle="Todavía no hay un ranking"
          />
          <DashboardExports filters={filters} />
        </>
      )}
    </div>
  );
}
