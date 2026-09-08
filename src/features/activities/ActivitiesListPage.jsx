import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminActivities } from '../../api/activitiesApi';
import { useAuth } from '../auth/AuthContext';
import { Badge, Button, EmptyState, Input, Select, Spinner, Table } from '../../components/ui';
import CancelActivityButton from './CancelActivityButton';

const PAGE_SIZE = 10;

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

const STATUS_BADGES = {
  DRAFT: { label: 'Borrador', variant: 'neutral' },
  PENDING_APPROVAL: { label: 'Pendiente', variant: 'warning' },
  PUBLISHED: { label: 'Publicada', variant: 'success' },
  FULL: { label: 'Completa', variant: 'info' },
  IN_PROGRESS: { label: 'En curso', variant: 'primary' },
  FINISHED: { label: 'Finalizada', variant: 'neutral' },
  CANCELLED: { label: 'Cancelada', variant: 'danger' },
};

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

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

export default function ActivitiesListPage() {
  const { user } = useAuth();
  const isOrg = user?.role === 'ORG';

  const [activities, setActivities] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
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
        const params = { page, limit: PAGE_SIZE };
        if (isOrg && user?.name) {
          params.organizationName = user.name;
        }
        if (statusFilter) params.status = statusFilter;
        if (query) params.q = query;

        const response = await getAdminActivities(params);
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
  }, [page, query, reloadKey, statusFilter, isOrg, user?.name]);

  const handleSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setQuery(searchInput.trim());
  };

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
    ...(!isOrg
      ? [{
          key: 'partner',
          label: 'Entidad colaboradora',
          render: (activity) => activity.partner?.name
            ?? activity.partnerName
            ?? activity.organizationName
            ?? '—',
        }]
      : []),
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
    {
      key: 'favoriteCount',
      label: 'Favoritos',
      render: (activity) => activity.favoriteCount ?? activity.favoritesCount ?? 0,
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (activity) => (
        <div className="activities-list__actions">
          <Link
            className="button button--secondary button--small"
            to={`/activities/${activity.id}/edit`}
          >
            Editar
          </Link>
          {!isOrg && (
            <Link
              className="button button--secondary button--small"
              to={`/activities/${activity.id}/registrations`}
            >
              Inscripciones
            </Link>
          )}
          <CancelActivityButton
            activity={activity}
            onCancelled={() => {
              setNotice('El proyecto se ha cancelado correctamente.');
              setReloadKey((current) => current + 1);
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
          <p className="activities-list__eyebrow">{isOrg ? 'Mi organización' : 'Administración'}</p>
          <h1 id="activities-list-title">Proyectos</h1>
          <p>{totalElements} proyectos encontrados</p>
        </div>
        <Link className="button button--primary button--medium" to={isOrg ? "/org/activities/new" : "/activities/new" }>
          Crear proyecto
        </Link>
      </header>

      <div className="activities-list__toolbar">
        <form className="activities-list__search" role="search" onSubmit={handleSearch}>
          <Input
            type="search"
            label="Buscar proyectos"
            placeholder="Buscar por proyecto o entidad"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
          <Button type="submit" variant="secondary">Buscar</Button>
        </form>
        <Select label="Filtrar por estado" value={statusFilter} onChange={handleStatusChange}>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </Select>
      </div>

      {notice && <p className="activities-list__notice" role="status">{notice}</p>}

      {requestState.status === 'loading' && (
        <div className="activities-list__loading" aria-label="Cargando proyectos">
          <Spinner label="Cargando proyectos…" />
        </div>
      )}

      {requestState.status === 'error' && requestState.error?.status === 403 && (
        <div className="activities-list__error" role="alert">
          No tienes permiso para consultar los proyectos administrativos.
        </div>
      )}

      {requestState.status === 'error' && requestState.error?.status !== 403 && (
        <div className="activities-list__error-panel">
          <p className="activities-list__error" role="alert">
            {requestState.error?.message || 'No hemos podido cargar los proyectos.'}
          </p>
          <Button onClick={() => setReloadKey((current) => current + 1)}>Reintentar</Button>
        </div>
      )}

      {requestState.status === 'success' && activities.length === 0 && (
        <EmptyState
          title="No hay proyectos"
          description="No se encontraron proyectos con los filtros seleccionados."
          action={(
            <Button
              variant="secondary"
              onClick={() => {
                setSearchInput('');
                setQuery('');
                setStatusFilter('');
                setPage(1);
              }}
            >
              Limpiar filtros
            </Button>
          )}
        />
      )}

      {requestState.status === 'success' && activities.length > 0 && (
        <>
          <Table caption={isOrg ? 'Listado de proyectos de mi organización' : 'Listado administrativo de actividades'} columns={columns} data={activities} />
          <nav className="activities-list__pagination" aria-label="Paginación de actividades">
            <span>Página {page} de {Math.max(totalPages, 1)}</span>
            <div>
              <Button
                size="small"
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
              >
                ← Anterior
              </Button>
              <Button
                size="small"
                variant="secondary"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Siguiente →
              </Button>
            </div>
          </nav>
        </>
      )}
    </section>
  );
}
