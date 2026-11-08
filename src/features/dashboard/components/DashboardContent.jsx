import { KpiRow } from '../../../shared/charts';
import { Card, EmptyState } from '../../../shared/ui';
import DashboardExports from './DashboardExports';
import DashboardRanking from './DashboardRanking';
import DashboardSection from './DashboardSection';
import DistributionProgressCard from './DistributionProgressCard';
import EffectivenessGrid from './EffectivenessGrid';
import ParticipationDistribution from './ParticipationDistribution';

export default function DashboardContent({ dashboard, filters }) {
  const hasRanking = dashboard.rankingData.length > 0;

  return (
    <>
      <DashboardSection
        id="impact"
        number="01"
        title="Impacto"
        description="Resultados acumulados y evolución respecto al trimestre anterior."
      >
        <KpiRow metrics={dashboard.metrics} variations={dashboard.variations} />
      </DashboardSection>

      <DashboardSection
        id="effectiveness"
        number="02"
        title="Eficacia"
        description="Capacidad del programa para movilizar personas y aprovechar las plazas disponibles."
      >
        <EffectivenessGrid metrics={dashboard.effectiveness} />
      </DashboardSection>

      <DashboardSection
        id="distribution"
        number="03"
        title="Distribución"
        description="Cómo se reparte la participación por equipos, organización, línea, modalidad y ubicación."
      >
        <div className="dashboard-distribution">
          <ParticipationDistribution
            data={dashboard.departmentData}
            title="Participación por departamento"
            description="Número de personas voluntarias participantes en cada área."
            categoryLabel="Departamento"
            labelKey="department"
          />
          <ParticipationDistribution
            data={dashboard.organizationData}
            title="Participación por organización"
            description="Personas voluntarias participantes de cada sociedad del grupo."
            categoryLabel="Organización"
            labelKey="label"
          />
          <ParticipationDistribution
            data={dashboard.lineData}
            title="Participación por línea"
            description="Personas voluntarias participantes de cada línea de acción."
            categoryLabel="Línea de acción"
            labelKey="label"
          />
          <DistributionProgressCard
            title="Por modalidad"
            items={dashboard.modeData}
            emptyTitle="Sin distribución por modalidad"
          />
          <DistributionProgressCard
            title="Por ubicación"
            items={dashboard.locationData}
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
        {hasRanking ? (
          <DashboardRanking items={dashboard.rankingData} />
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
  );
}
