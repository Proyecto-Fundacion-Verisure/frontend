import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getDashboard } from '../../api/dashboardApi';
import { Button, Card, EmptyState, Spinner } from '../../components/ui';
import { ACTIVITY_LINES } from '../../constants/activityLines';
import BarChart from './BarChart';
import ChartTable from './ChartTable';
import DashboardExports from './DashboardExports';
import DashboardFilters, { isValidDashboardYear } from './DashboardFilters';
import DashboardRanking from './DashboardRanking';
import KpiRow, { KPI_DEFINITIONS, formatDashboardNumber } from './KpiRow';
import MetricProgressList from './MetricProgressList';

const ALLOWED_LINES = new Set(ACTIVITY_LINES.map(({ value }) => value));

function hasDashboardData(data) {
  if (!data || typeof data !== 'object') return false;
  const metrics = data.kpis ?? data;
  const hasMetric = KPI_DEFINITIONS.some(({ key }) => (
    Object.prototype.hasOwnProperty.call(metrics, key) && metrics[key] !== null
  ));
  return hasMetric || [
    'effectiveness',
    'participationByDepartment',
    'distributionByMode',
    'distributionByLocation',
    'favoriteRanking',
  ].some((key) => Array.isArray(data[key]) && data[key].length > 0);
}

function DashboardSection({ id, number, title, description, children }) {
  return (
    <section className="dashboard-block" aria-labelledby={`${id}-title`}>
      <header className="dashboard-block__header">
        <span className="dashboard-block__number" aria-hidden="true">{number}</span>
        <div>
          <h2 id={`${id}-title`}>{title}</h2>
          <p>{description}</p>
        </div>
      </header>
      {children}
    </section>
  );
}

function EffectivenessGrid({ metrics }) {
  if (metrics.length === 0) {
    return (
      <Card>
        <EmptyState
          title="Todavía no hay datos de eficacia"
          description="Las tasas aparecerán cuando existan inscripciones y participaciones cerradas."
        />
      </Card>
    );
  }

  return (
    <div className="effectiveness-grid">
      {metrics.map((metric) => (
        <Card as="article" className="effectiveness-card" key={metric.id ?? metric.label}>
          <div className="effectiveness-card__heading">
            <h3>{metric.label}</h3>
            <strong>{formatDashboardNumber(metric.value)} %</strong>
          </div>
          <MetricProgressList items={[metric]} showHeading={false} />
        </Card>
      ))}
    </div>
  );
}

function DistributionProgressCard({ title, items, emptyTitle }) {
  return (
    <Card as="article" className="dashboard-distribution-card">
      <h3>{title}</h3>
      {items.length > 0 ? (
        <MetricProgressList items={items} />
      ) : (
        <EmptyState
          title={emptyTitle}
          description="No hay datos suficientes para los filtros seleccionados."
        />
      )}
    </Card>
  );
}

function DepartmentDistribution({ data }) {
  return (
    <Card as="article" className="dashboard-distribution-card dashboard-distribution-card--wide">
      <header>
        <h3>Participación por departamento</h3>
        <p>Número de personas voluntarias participantes en cada área.</p>
      </header>
      {data.length > 0 ? (
        <div className="dashboard-distribution-card__content">
          <BarChart
            data={data}
            title="Participación por departamento"
            description="Personas voluntarias participantes en cada departamento"
            labelKey="department"
            valueKey="participants"
          />
          <ChartTable
            data={data}
            caption="Tabla de participación por departamento"
            categoryLabel="Departamento"
            valueLabel="Participantes"
            labelKey="department"
            valueKey="participants"
          />
        </div>
      ) : (
        <EmptyState
          title="Sin participación por departamento"
          description="No hay datos suficientes para los filtros seleccionados."
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

  const dashboardData = requestState.data ?? {};
  const metrics = dashboardData.kpis ?? dashboardData;
  const variations = dashboardData.impactVariations ?? dashboardData.variations ?? {};
  const effectiveness = Array.isArray(dashboardData.effectiveness)
    ? dashboardData.effectiveness
    : [];
  const departmentData = Array.isArray(dashboardData.participationByDepartment)
    ? dashboardData.participationByDepartment
    : [];
  const modeData = Array.isArray(dashboardData.distributionByMode)
    ? dashboardData.distributionByMode
    : [];
  const locationData = Array.isArray(dashboardData.distributionByLocation)
    ? dashboardData.distributionByLocation
    : [];
  const rankingData = Array.isArray(dashboardData.favoriteRanking)
    ? dashboardData.favoriteRanking
    : [];

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div>
          <p className="dashboard__eyebrow">Voluntariado corporativo</p>
          <h1>Dashboard de impacto</h1>
          {dashboardData.dataSource === 'mock' && (
            <span className="dashboard__demo-badge">Datos ficticios para validación</span>
          )}
        </div>
        <p>Una visión clara del impacto, la eficacia, la distribución y la demanda del programa.</p>
      </header>

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

      {requestState.status === 'success' && !hasDashboardData(dashboardData) && (
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

      {requestState.status === 'success' && hasDashboardData(dashboardData) && (
        <>
          <DashboardSection
            id="impact"
            number="01"
            title="Impacto"
            description="Resultados acumulados y evolución respecto al trimestre anterior."
          >
            <KpiRow metrics={metrics} variations={variations} />
          </DashboardSection>

          <DashboardSection
            id="effectiveness"
            number="02"
            title="Eficacia"
            description="Capacidad del programa para movilizar personas y aprovechar las plazas disponibles."
          >
            <EffectivenessGrid metrics={effectiveness} />
          </DashboardSection>

          <DashboardSection
            id="distribution"
            number="03"
            title="Distribución"
            description="Cómo se reparte la participación por equipos, modalidad y ubicación."
          >
            <div className="dashboard-distribution">
              <DepartmentDistribution data={departmentData} />
              <DistributionProgressCard
                title="Por modalidad"
                items={modeData}
                emptyTitle="Sin distribución por modalidad"
              />
              <DistributionProgressCard
                title="Por ubicación"
                items={locationData}
                emptyTitle="Sin distribución por ubicación"
              />
            </div>
          </DashboardSection>

          <DashboardSection
            id="demand"
            number="04"
            title="Demanda"
            description="Las diez actividades que más interés despiertan entre la plantilla."
          >
            {rankingData.length > 0 ? (
              <DashboardRanking items={rankingData} />
            ) : (
              <Card>
                <EmptyState
                  title="Todavía no hay un ranking"
                  description="El ranking aparecerá cuando las actividades reciban favoritos."
                />
              </Card>
            )}
          </DashboardSection>

          <DashboardExports filters={filters} />
        </>
      )}
    </div>
  );
}
