import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOrgActivities } from '../../api/orgApi';
import { Badge, Button, EmptyState, Spinner, Table } from '../../components/ui';
import { formatDate } from '../../utils/dates';
import SubmitForReviewButton from '../activities/SubmitForReviewButton';

// «Mis propuestas» de la entidad. La entidad no publica actividades: propone
// una (`POST /org/activities`), la envía y la Fundación la aprueba o la
// devuelve. Dos bloques: lo que todavía no ha aprobado (`DRAFT` y
// `PENDING_APPROVAL`) y lo aprobado, que ya son actividades del catálogo (el
// resto, de publicada a histórico). `GET /api/org/activities` filtra por un
// solo `status` y pagina, así que para repartir en dos bloques se traen todas
// las páginas y se reparte aquí: una entidad tiene pocas actividades.
const PENDING_STATUSES = new Set(['DRAFT', 'PENDING_APPROVAL']);

// Los mismos siete estados que ve la Fundación, con el lenguaje de la entidad:
// una `PENDING_APPROVAL` es una propuesta enviada, y una `PUBLISHED` una
// propuesta aprobada.
const STATUS_BADGES = {
  DRAFT: { label: 'Borrador', variant: 'neutral' },
  PENDING_APPROVAL: { label: 'Enviada', variant: 'warning' },
  PUBLISHED: { label: 'Aprobada', variant: 'success' },
  FULL: { label: 'Completa', variant: 'info' },
  IN_PROGRESS: { label: 'En curso', variant: 'primary' },
  FINISHED: { label: 'Finalizada', variant: 'neutral' },
  CANCELLED: { label: 'Cancelada', variant: 'danger' },
};
const PAGE_SIZE = 50;
const MAX_PAGES = 20;

async function loadAllOrgActivities() {
  const all = [];
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const { data } = await getOrgActivities({ page, size: PAGE_SIZE });
    all.push(...(data?.content ?? []));
    if (page + 1 >= (Number(data?.totalPages) || 0)) break;
  }
  return all;
}

export default function OrgActivitiesPage() {
  const [activities, setActivities] = useState([]);
  const [requestState, setRequestState] = useState({ status: 'loading', error: null });
  const [reloadKey, setReloadKey] = useState(0);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let cancelled = false;
    setRequestState({ status: 'loading', error: null });
    loadAllOrgActivities()
      .then((all) => {
        if (cancelled) return;
        setActivities(all);
        setRequestState({ status: 'success', error: null });
      })
      .catch((error) => {
        if (!cancelled) setRequestState({ status: 'error', error });
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const reload = () => setReloadKey((current) => current + 1);
  const pending = activities.filter((activity) => PENDING_STATUSES.has(activity.status));
  const approved = activities.filter((activity) => !PENDING_STATUSES.has(activity.status));

  const columns = [
    {
      key: 'title',
      label: 'Propuesta',
      render: (activity) => (
        <>
          <strong className="activities-list__activity-title">{activity.title}</strong>
          {/* No hay estado «devuelta»: una devuelta es un `DRAFT` con
              `reviewNote`, y el comentario es lo que la distingue. `approve` lo
              limpia, así que en las aprobadas nunca se ve. */}
          {activity.reviewNote && activity.status === 'DRAFT' && (
            <p className="activities-list__review-note">
              <strong>Devuelta por la Fundación:</strong> {activity.reviewNote}
            </p>
          )}
        </>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      render: (activity) => {
        const badge = STATUS_BADGES[activity.status];
        return badge
          ? <Badge variant={badge.variant}>{badge.label}</Badge>
          : activity.status ?? '—';
      },
    },
    { key: 'startDate', label: 'Inicio', render: (activity) => formatDate(activity.startDate) },
    {
      key: 'spots',
      label: 'Plazas',
      render: (activity) => `${activity.occupiedSpots ?? 0} / ${activity.spots ?? '—'}`,
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (activity) => activity.status === 'DRAFT' && (
        <div className="activities-list__actions">
          <Link
            className="button button--secondary button--small"
            to={`/org/activities/${activity.id}/edit`}
            // No hay detalle en `/org`: el formulario se rellena con esta fila.
            state={{ activity }}
          >
            Editar
          </Link>
          <SubmitForReviewButton
            activity={activity}
            onSubmitted={() => {
              setNotice('La propuesta se ha enviado a la Fundación.');
              reload();
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <section className="activities-list" aria-labelledby="activities-list-title">
      <header className="activities-list__header">
        <div>
          <p className="activities-list__eyebrow">Entidad colaboradora</p>
          <h1 id="activities-list-title">Mis propuestas</h1>
          <p>{activities.length} propuestas encontradas</p>
        </div>
        <Link className="button button--primary button--medium" to="/org/activities/new">
          Nueva propuesta →
        </Link>
      </header>

      {notice && <p className="activities-list__notice" role="status">{notice}</p>}

      {requestState.status === 'loading' && (
        <div className="activities-list__loading" aria-label="Cargando propuestas">
          <Spinner label="Cargando propuestas…" />
        </div>
      )}

      {requestState.status === 'error' && (
        <div className="activities-list__error-panel">
          <p className="activities-list__error" role="alert">
            {requestState.error?.message || 'No hemos podido cargar las propuestas.'}
          </p>
          <Button onClick={reload}>Reintentar</Button>
        </div>
      )}

      {requestState.status === 'success' && activities.length === 0 && (
        <EmptyState
          title="Todavía no tienes propuestas"
          description="Redacta tu primera propuesta de actividad y envíala a la Fundación cuando esté lista."
        />
      )}

      {requestState.status === 'success' && activities.length > 0 && (
        <>
          <section className="activities-list__group" aria-labelledby="org-pending-title">
            <h2 id="org-pending-title" className="activities-list__group-title">
              Pendientes de aprobación <span>({pending.length})</span>
            </h2>
            {pending.length > 0 ? (
              <Table caption="Propuestas pendientes de aprobación" columns={columns} data={pending} />
            ) : (
              <p className="activities-list__group-empty">No tienes propuestas pendientes de aprobación.</p>
            )}
          </section>

          <section className="activities-list__group" aria-labelledby="org-approved-title">
            <h2 id="org-approved-title" className="activities-list__group-title">
              Aprobadas <span>({approved.length})</span>
            </h2>
            {approved.length > 0 ? (
              <Table caption="Propuestas aprobadas" columns={columns} data={approved} />
            ) : (
              <p className="activities-list__group-empty">Todavía no tienes propuestas aprobadas.</p>
            )}
          </section>
        </>
      )}
    </section>
  );
}
