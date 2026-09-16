import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminActivities } from '../../api/activitiesApi';
import { Badge, Button, EmptyState, Pagination, Select, Spinner, Table } from '../../components/ui';
import CancelActivityButton from './CancelActivityButton';
import { formatDate } from '../../utils/dates';
import PartnerActivityReviewActions from './PartnerActivityReviewActions';

// Lo que cambia entre el inventario de administración (`/admin/activities`) y
// la cola de revisión (`/admin/activities/pending`): la cola no filtra por
// estado —todo está en `PENDING_APPROVAL`— y es la única que aprueba o
// devuelve. El listado de la entidad ya no pasa por aquí: es `OrgActivitiesPage`.
const DEFAULT_COLUMNS_CONFIG = {
  showPartnerColumn: true,
  showRegistrationsLink: true,
  showFavoritesColumn: true,
  showReviewActions: false,
  showStatusFilter: true,
};

export const PENDING_REVIEW_PATH = '/admin/activities/pending';

const PAGE_SIZE = 10;

// Cancelar solo tiene sentido en lo que está vivo. El backend rechaza
// `FINISHED` (409 `ACTIVITY_FINISHED`), `CANCELLED` (409
// `ACTIVITY_NOT_EDITABLE`) y `PENDING_APPROVAL` (eso se devuelve, no se
// cancela); un `DRAFT` sí se puede cancelar.
const CANCELLABLE_STATUSES = new Set(['DRAFT', 'PUBLISHED', 'FULL', 'IN_PROGRESS']);

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'DRAFT', label: 'Borrador' },
  { value: 'PENDING_APPROVAL', label: 'Pendiente de aprobación' },
  { value: 'PUBLISHED', label: 'Publicada' },
  { value: 'FULL', label: 'Completa' },
  { value: 'IN_PROGRESS', label: 'En curso' },
  { value: 'FINISHED', label: 'Finalizada' },
  { value: 'CANCELLED', label: 'Cancelada' },
];

// Compartidas con `OrgActivitiesPage`: los estados son los mismos siete.
export const ACTIVITY_STATUS_BADGES = {
  DRAFT: { label: 'Borrador', variant: 'neutral' },
  PENDING_APPROVAL: { label: 'Pendiente', variant: 'warning' },
  PUBLISHED: { label: 'Publicada', variant: 'success' },
  FULL: { label: 'Completa', variant: 'info' },
  IN_PROGRESS: { label: 'En curso', variant: 'primary' },
  FINISHED: { label: 'Finalizada', variant: 'neutral' },
  CANCELLED: { label: 'Cancelada', variant: 'danger' },
};

function getPageData(response) {
  const payload = response.data;
  const content = Array.isArray(payload?.content)
    ? payload.content
    : Array.isArray(payload)
      ? payload
      : [];
  const totalElements = Number(
    payload?.totalElements ?? response.headers?.['x-total-count'] ?? content.length,
  ) || 0;
  const totalPages = Number(payload?.totalPages) || Math.ceil(totalElements / PAGE_SIZE);

  return { content, totalElements, totalPages };
}

export default function ActivitiesListPage({
  fetchData = getAdminActivities,
  showCreateButton = true,
  showPartnerColumn = DEFAULT_COLUMNS_CONFIG.showPartnerColumn,
  showRegistrationsLink = DEFAULT_COLUMNS_CONFIG.showRegistrationsLink,
  showFavoritesColumn = DEFAULT_COLUMNS_CONFIG.showFavoritesColumn,
  showReviewActions = DEFAULT_COLUMNS_CONFIG.showReviewActions,
  showStatusFilter = DEFAULT_COLUMNS_CONFIG.showStatusFilter,
  title = 'Proyectos',
  emptyDescription = null,
  eyebrow = 'Administración',
  createPath = '/activities/new',
}) {
  const [activities, setActivities] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [requestState, setRequestState] = useState({ status: 'loading', error: null });
  const [reloadKey, setReloadKey] = useState(0);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadActivities = async () => {
      setRequestState({ status: 'loading', error: null });
      try {
        // `size` va explícito: la pantalla pagina de 10 en 10 y el backend
        // sirve 20 por defecto; sin él, el recuento y las páginas no cuadran.
        const params = { page: page - 1, size: PAGE_SIZE };
        if (statusFilter) params.status = statusFilter;

        const response = await fetchData(params);
        if (cancelled) return;
        const pageData = getPageData(response);
        setActivities(pageData.content);
        setTotalElements(pageData.totalElements);
        setTotalPages(pageData.totalPages);
        setRequestState({ status: 'success', error: null });
      } catch (error) {
        if (!cancelled) setRequestState({ status: 'error', error });
      }
    };

    loadActivities();
    return () => {
      cancelled = true;
    };
  }, [page, reloadKey, statusFilter, fetchData]);

  const handleStatusChange = (event) => {
    setPage(1);
    setStatusFilter(event.target.value);
  };

  const columns = [
    {
      key: 'title',
      label: 'Proyecto',
      render: (activity) => (
        <strong className="activities-list__activity-title">{activity.title}</strong>
      ),
    },
    ...(showPartnerColumn ? [{
      key: 'partner',
      label: 'Entidad colaboradora',
      render: (activity) => activity.partner?.name
        ?? activity.partnerName
        ?? activity.organizationName
        ?? '—',
    }] : []),
    {
      key: 'status',
      label: 'Estado',
      render: (activity) => {
        const badge = ACTIVITY_STATUS_BADGES[activity.status];
        return badge
          ? <Badge variant={badge.variant}>{badge.label}</Badge>
          : activity.status ?? '—';
      },
    },
    {
      key: 'startDate',
      label: 'Inicio',
      render: (activity) => formatDate(activity.startDate ?? activity.date),
    },
    {
      key: 'capacity',
      label: 'Plazas',
      render: (activity) => activity.spots
        ?? activity.capacity
        ?? activity.maxParticipants
        ?? '—',
    },
    ...(showFavoritesColumn ? [{
      key: 'favoriteCount',
      label: 'Favoritos',
      render: (activity) => activity.favoriteCount ?? activity.favoritesCount ?? 0,
    }] : []),
    {
      key: 'actions',
      label: 'Acciones',
      render: (activity) => (
        <div className="activities-list__actions">
          {activity.status === 'PENDING_APPROVAL' && (showReviewActions ? (
            <PartnerActivityReviewActions
              activity={activity}
              onReviewed={(result) => {
                setNotice({
                  approved: 'La propuesta se ha aprobado y ya está en el catálogo.',
                  returned: 'La propuesta se ha devuelto a la entidad.',
                  stale: 'Otra persona ya había revisado esta propuesta. La lista se ha actualizado.',
                }[result] ?? '');
                setReloadKey((current) => current + 1);
              }}
            />
          ) : (
            <Link className="button button--primary button--small" to={PENDING_REVIEW_PATH}>
              Revisar
            </Link>
          ))}
          {activity.status === 'DRAFT' && (
            <Link
              className="button button--secondary button--small"
              to={`/activities/${activity.id}/edit`}
            >
              Editar
            </Link>
          )}
          {showRegistrationsLink && (
            <Link
              className="button button--secondary button--small"
              to={`/activities/${activity.id}/registrations`}
              // El tablero no puede pedir el título: su respuesta es un Page de
              // inscripciones. Se lo pasamos desde aquí, que ya lo tenemos.
              state={{ activityTitle: activity.title }}
            >
              Inscripciones
            </Link>
          )}
          {CANCELLABLE_STATUSES.has(activity.status) && (
            <CancelActivityButton
              activity={activity}
              onCancelled={() => {
                setNotice('El proyecto se ha cancelado correctamente.');
                setReloadKey((current) => current + 1);
              }}
            />
          )}
        </div>
      ),
    },
  ];

  const titleLower = title.replace(/^Mis /i, '').toLocaleLowerCase();

  return (
    <section className="activities-list" aria-labelledby="activities-list-title">
      <header className="activities-list__header">
        <div>
          <p className="activities-list__eyebrow">{eyebrow}</p>
          <h1 id="activities-list-title">{title}</h1>
          <p>{totalElements} {titleLower} encontrados</p>
        </div>
        {showCreateButton && (
          <Link className="button button--primary button--medium" to={createPath}>
            Nuevo proyecto →
          </Link>
        )}
      </header>

      {showStatusFilter && (
        <div className="activities-list__toolbar">
          <Select label="Filtrar por estado" value={statusFilter} onChange={handleStatusChange}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
        </div>
      )}

      {notice && <p className="activities-list__notice" role="status">{notice}</p>}

      {requestState.status === 'loading' && (
        <div className="activities-list__loading" aria-label={`Cargando ${titleLower}`}>
          <Spinner label={`Cargando ${titleLower}…`} />
        </div>
      )}

      {requestState.status === 'error' && requestState.error?.status === 403 && (
        <div className="activities-list__error" role="alert">
          No tienes permiso para consultar los {titleLower}.
        </div>
      )}

      {requestState.status === 'error' && requestState.error?.status !== 403 && (
        <div className="activities-list__error-panel">
          <p className="activities-list__error" role="alert">
            {requestState.error?.message || `No hemos podido cargar los ${titleLower}.`}
          </p>
          <Button onClick={() => setReloadKey((current) => current + 1)}>Reintentar</Button>
        </div>
      )}

      {requestState.status === 'success' && activities.length === 0 && (
        <EmptyState
          title={`No hay ${titleLower}`}
          description={emptyDescription ?? `No se encontraron ${titleLower} con los filtros seleccionados.`}
          action={showStatusFilter ? (
            <Button
              variant="secondary"
              onClick={() => {
                setStatusFilter('');
                setPage(1);
              }}
            >
              Limpiar filtros
            </Button>
          ) : null}
        />
      )}

      {requestState.status === 'success' && activities.length > 0 && (
        <>
          <Table caption={`Listado de ${titleLower}`} columns={columns} data={activities} />
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            ariaLabel={`Paginación de ${titleLower}`}
          />
        </>
      )}
    </section>
  );
}
