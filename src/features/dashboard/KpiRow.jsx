import {
  CalendarCheck2,
  Clock3,
  HandHeart,
  Heart,
  Users,
} from 'lucide-react';
import { Card } from '../../components/ui';

export const KPI_DEFINITIONS = [
  { key: 'reportedHours', label: 'Horas reportadas', Icon: Clock3, suffix: ' h' },
  { key: 'activeVolunteers', label: 'Personas voluntarias', Icon: Users },
  { key: 'finishedActivities', label: 'Actividades finalizadas', Icon: CalendarCheck2 },
  { key: 'beneficiaries', label: 'Personas beneficiadas', Icon: HandHeart },
  { key: 'totalFavorites', label: 'Favoritos acumulados', Icon: Heart },
];

export function formatDashboardNumber(value) {
  if (value === null || value === undefined || value === '') return '—';
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return '—';
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(numericValue);
}

export default function KpiRow({ metrics = {} }) {
  return (
    <section className="kpi-row" aria-label="Indicadores principales">
      {KPI_DEFINITIONS.map(({ key, label, Icon, suffix = '' }) => {
        const formattedValue = formatDashboardNumber(metrics[key]);
        return (
          <Card as="div" className="kpi-card" key={key}>
            <Icon className="kpi-card__icon" aria-hidden="true" size={24} />
            <dl>
              <div>
                <dt>{label}</dt>
                <dd>{formattedValue}{formattedValue === '—' ? '' : suffix}</dd>
              </div>
            </dl>
          </Card>
        );
      })}
    </section>
  );
}
