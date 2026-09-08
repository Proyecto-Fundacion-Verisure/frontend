git add import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Clock3, FileText, Users } from 'lucide-react';
import { Badge, Button, Card, ProgressBar } from '../../components/ui';

const MOCK_METRICS = [
  { key: 'activeProposals', label: 'Propuestas Activas', value: 12, hint: '+3 este mes', Icon: FileText },
  { key: 'assignedVolunteers', label: 'Voluntarios Asignados', value: 48, hint: 'En 5 iniciativas', Icon: Users },
  { key: 'totalHours', label: 'Impacto Total', value: '1.2K', hint: 'Horas registradas', Icon: Clock3 },
];

const MOCK_INITIATIVES = [
  {
    id: 'REF-2024-08',
    category: 'Medio Ambiente',
    date: 'Hace 2 días',
    title: 'Reforestación Sierra Norte',
    description: 'Proyecto de recuperación de flora autóctona en zonas afectadas por incendios.',
    status: 'En revisión',
    statusVariant: 'warning',
  },
  {
    id: 'REF-2024-07',
    category: 'Inclusión Social',
    date: 'Hace 1 semana',
    title: 'Taller Tecnológico Mayores',
    description: 'Alfabetización digital para la tercera edad en centros cívicos.',
    status: 'Información requerida',
    statusVariant: 'danger',
    action: 'Ver detalles →',
    highlighted: true,
  },
  {
    id: 'REF-2024-06',
    category: 'Educación',
    date: 'Hace 1 mes',
    title: 'Apoyo Escolar Distrito Sur',
    description: 'Clases de refuerzo para niños en riesgo de exclusión social.',
    status: 'En curso',
    statusVariant: 'success',
    volunteers: 12,
    hours: 24,
    progress: 48,
  },
];

function InitiativeCard({ initiative }) {
  const { category, date, title, description, status, statusVariant, id, action, volunteers, hours, progress, highlighted } = initiative;
  return (
    <Card className={`initiative-card ${highlighted ? 'initiative-card--highlighted' : ''}`}>
      <div className="initiative-card__header">
        <Badge variant="info">{category}</Badge>
        <span className="initiative-card__date">{date}</span>
      </div>
      <h3 className="initiative-card__title">{title}</h3>
      <p className="initiative-card__description">{description}</p>
      <div className="initiative-card__footer">
        <Badge variant={statusVariant}>{status}</Badge>
        <span className="initiative-card__id">{id}</span>
      </div>
      {action && (
        <Link to={`/org/proposals/${id}`} className="initiative-card__action">
          {action}
        </Link>
      )}
      {volunteers !== undefined && (
        <div className="initiative-card__meta">
          <span>{volunteers} Voluntarios</span>
          <span>{hours}h registradas</span>
        </div>
      )}
      {progress !== undefined && (
        <ProgressBar value={progress} max={100} label="Progreso" valueLabel={`${progress}%`} />
      )}
    </Card>
  );
}

export default function OrgDashboardPage() {
  const [filter, setFilter] = useState('activos');

  const initiatives = useMemo(() => {
    if (filter === 'todos') return MOCK_INITIATIVES;
    // Activos: En revisión + En curso (excluye Información requerida si se considera no activo? Mock dice Activos por defecto debe mostrar las 3? Según spec, Activos incluye En revisión y En curso, pero para demo mostramos las 3 y destacamos Información requerida)
    // Para cumplir "Activos por defecto debe aparecer seleccionado Activos" y que filtre, definimos Activos = En revisión + En curso
    return MOCK_INITIATIVES.filter((i) => i.status === 'En revisión' || i.status === 'En curso');
  }, [filter]);

  return (
    <div className="org-dashboard">
      <header className="org-dashboard__header">
        <div>
          <h1>Panel de Propuestas</h1>
          <p>Gestiona y haz seguimiento de tus iniciativas presentadas.</p>
        </div>
        <Link to="/org/activities/new" className="button button--primary button--medium">
          Nueva Propuesta →
        </Link>
      </header>

      <section className="org-dashboard__metrics" aria-label="Métricas">
        {MOCK_METRICS.map(({ key, label, value, hint, Icon }) => (
          <Card key={key} className="org-metric-card">
            <div className="org-metric-card__icon" aria-hidden="true">
              <Icon size={20} />
            </div>
            <div className="org-metric-card__content">
              <p className="org-metric-card__value">{value}</p>
              <p className="org-metric-card__label">{label}</p>
              <p className="org-metric-card__hint">{hint}</p>
            </div>
          </Card>
        ))}
      </section>

      <section className="org-dashboard__initiatives" aria-labelledby="initiatives-title">
        <div className="org-dashboard__initiatives-header">
          <h2 id="initiatives-title">Tus Iniciativas</h2>
          <div className="org-dashboard__filters" role="group" aria-label="Filtros de iniciativas">
            <Button
              variant={filter === 'todos' ? 'primary' : 'secondary'}
              size="small"
              onClick={() => setFilter('todos')}
              aria-pressed={filter === 'todos'}
            >
              Todos
            </Button>
            <Button
              variant={filter === 'activos' ? 'primary' : 'secondary'}
              size="small"
              onClick={() => setFilter('activos')}
              aria-pressed={filter === 'activos'}
            >
              Activos
            </Button>
          </div>
        </div>

        <div className="org-dashboard__grid">
          {initiatives.map((item) => (
            <InitiativeCard key={item.id} initiative={item} />
          ))}
        </div>
        {initiatives.length === 0 && <p className="org-dashboard__empty">No hay iniciativas para este filtro.</p>}
      </section>
    </div>
  );
}
