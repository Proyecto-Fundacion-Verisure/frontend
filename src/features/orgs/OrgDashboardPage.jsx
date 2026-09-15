import { useEffect, useState } from 'react';
import { getOrgDashboard } from '../../api/orgApi';
import { Card, EmptyState, Spinner, Button } from '../../components/ui';
import BarChart from '../dashboard/BarChart';
import ChartTable from '../dashboard/ChartTable';
import KpiRow from '../dashboard/KpiRow';
import { ORG_KPI_DEFINITIONS, ORG_KPI_KEYS } from './orgDashboardDefinitions';

function hasOrgDashboardData(data) {
  if (!data || typeof data !== 'object') return false;
  const metrics = data.kpis ?? data;
  return ORG_KPI_KEYS.some((key) => {
    const value = metrics[key];
    return value !== null && value !== undefined && Number(value) > 0;
  });
}

function OrgDashboardSection({ id, number, title, description, children }) {
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

export default function OrgDashboardPage() {
  const [requestState, setRequestState] = useState({ status: 'loading', data: null, error: null });
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    setRequestState((current) => ({ ...current, status: 'loading', error: null }));
    getOrgDashboard().then(
      ({ data, status }) => {
        if (!active) return;
        if (status === 403) {
          setRequestState({
            status: 'error',
            data: null,
            error: { message: data?.message, status: 403 },
          });
          return;
        }
        setRequestState({ status: 'success', data, error: null });
      },
      (error) => {
        if (active && !error?.isCanceled) {
          setRequestState({
            status: 'error',
            data: null,
            error: {
              message: error?.message,
              status: error?.status,
              code: error?.code,
            },
          });
        }
      },
    );
    return () => {
      active = false;
    };
  }, [retryKey]);

  const dashboardData = requestState.data ?? {};
  const metrics = dashboardData.kpis ?? dashboardData;
  const evolutionData = Array.isArray(dashboardData.evolutionByYear) ? dashboardData.evolutionByYear : [];
  const lineData = Array.isArray(dashboardData.distributionByLine) ? dashboardData.distributionByLine : [];

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div>
          <p className="dashboard__eyebrow">Entidad colaboradora</p>
          <h1>Panel de control de la entidad</h1>
          {dashboardData.dataSource === 'mock' && (
            <span className="dashboard__demo-badge">Datos ficticios para validación</span>
          )}
        </div>
      </header>
      <p className="dashboard__intro">
        Consulta las horas recibidas, actividades, voluntarios y personas beneficiadas
        a partir de los cierres validados por la administración.
      </p>

      {requestState.status === 'loading' && (
        <Card className="dashboard__loading" role="status" aria-live="polite">
          <Spinner label="Cargando el panel de tu entidad…" />
          <p>Cargando indicadores…</p>
        </Card>
      )}

      {requestState.status === 'error' && requestState.error?.status === 403 && (
        <Card className="dashboard__error" role="alert">
          <h2>Acceso restringido</h2>
          <p>No tienes permiso para consultar el panel de tu entidad.</p>
        </Card>
      )}

      {requestState.status === 'error' && requestState.error?.status !== 403 && (
        <Card className="dashboard__error">
          <h2>No hemos podido cargar el panel</h2>
          <p role="alert">{requestState.error?.message ?? 'Comprueba tu conexión y vuelve a intentarlo.'}</p>
          <Button onClick={() => setRetryKey((c) => c + 1)}>Reintentar</Button>
        </Card>
      )}

      {requestState.status === 'success' && !hasOrgDashboardData(dashboardData) && (
        <Card>
          <EmptyState
            title="Todavía no hay cierres validados"
            description="El panel se completa cuando la administración valida los cierres de tus actividades. Si acabas de llegar, no es un error: tus indicadores aparecerán aquí."
          />
        </Card>
      )}

      {requestState.status === 'success' && hasOrgDashboardData(dashboardData) && (
        <>
          <OrgDashboardSection
            id="impact"
            number="01"
            title="Indicadores"
            description="Resultados acumulados de las actividades con cierres validados."
          >
            <KpiRow
              metrics={metrics}
              variations={dashboardData.variations ?? {}}
              definitions={ORG_KPI_DEFINITIONS}
              variationLabel="respecto al año anterior"
              listLabel="Indicadores de la entidad"
            />
          </OrgDashboardSection>

          <OrgDashboardSection
            id="evolution"
            number="02"
            title="Evolución por año"
            description="Horas recibidas en cada año con cierres validados."
          >
            <Card as="article" className="dashboard-distribution-card dashboard-distribution-card--wide">
              <div className="dashboard-distribution-card__content">
                <BarChart
                  data={evolutionData}
                  title="Evolución de horas recibidas por año"
                  description="Horas recibidas en cada año"
                  labelKey="year"
                  valueKey="receivedHours"
                />
                <ChartTable
                  data={evolutionData}
                  caption="Tabla de evolución de horas recibidas por año"
                  categoryLabel="Año"
                  valueLabel="Horas recibidas"
                  labelKey="year"
                  valueKey="receivedHours"
                />
              </div>
            </Card>
          </OrgDashboardSection>

          <OrgDashboardSection
            id="distribution"
            number="03"
            title="Reparto por línea de acción"
            description="Horas recibidas en cada línea de acción."
          >
            <Card as="article" className="dashboard-distribution-card dashboard-distribution-card--wide">
              <div className="dashboard-distribution-card__content">
                <BarChart
                  data={lineData}
                  title="Reparto por línea de acción"
                  description="Horas recibidas por línea de acción"
                  labelKey="label"
                  valueKey="value"
                />
                <ChartTable
                  data={lineData}
                  caption="Tabla de reparto por línea de acción"
                  categoryLabel="Línea de acción"
                  valueLabel="Horas recibidas"
                  labelKey="label"
                  valueKey="value"
                />
              </div>
            </Card>
          </OrgDashboardSection>
        </>
      )}
    </div>
  );
}
