import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOrgActivities, submitOrgActivity } from '../../api/orgApi';
import { Badge, Button, EmptyState, Select, Spinner, Table } from '../../components/ui';

const STATUS_OPTIONS = [
  '',
  'DRAFT',
  'PENDING_APPROVAL',
  'PUBLISHED',
  'FULL',
  'IN_PROGRESS',
  'FINISHED',
  'CANCELLED',
];

export default function OrgActivitiesPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [activities, setActivities] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [requestState, setRequestState] = useState({ status: 'loading', error: null });

  const load = useCallback(async () => {
    setRequestState({ status: 'loading', error: null });
    try {
      const { data } = await getOrgActivities({ status, page: page - 1 });
      const content = data?.content ?? data;
      setActivities(Array.isArray(content) ? content : []);
      setTotalPages(Number(data?.totalPages) || 1);
      setRequestState({ status: 'success', error: null });
    } catch (error) {
      setRequestState({ status: 'error', error });
    }
  }, [page, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (activityId) => {
    try {
      await submitOrgActivity(activityId);
      await load();
    } catch (error) {
      setRequestState({ status: 'error', error });
    }
  };

  if (requestState.status === 'loading') return <Spinner label="Cargando actividades de la entidad…" />;
  if (requestState.status === 'error') {
    return (
      <section>
        <h1>No hemos podido cargar las actividades</h1>
        <p role="alert">{requestState.error?.message || 'Inténtalo de nuevo.'}</p>
        <Button onClick={load}>Reintentar</Button>
      </section>
    );
  }

  const columns = [
    { key: 'title', label: 'Actividad', render: (item) => item.title },
    { key: 'status', label: 'Estado', render: (item) => <Badge>{item.status}</Badge> },
    {
      key: 'startDate',
      label: 'Inicio',
      render: (item) => item.startDate ? new Date(item.startDate).toLocaleDateString('es-ES') : '—',
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (item) => item.status === 'DRAFT'
        ? <Button size="small" onClick={() => submit(item.id)}>Enviar a revisión</Button>
        : '—',
    },
  ];

  return (
    <section aria-labelledby="org-activities-title">
      <h1 id="org-activities-title">Actividades de mi entidad</h1>
      <Link className="button button--primary button--medium" to="/org/activities/new">Nueva actividad</Link>
      <Select
        label="Filtrar por estado"
        value={status}
        onChange={(event) => {
          setStatus(event.target.value);
          setPage(1);
        }}
      >
        {STATUS_OPTIONS.map((value) => (
          <option key={value || 'all'} value={value}>{value || 'Todos los estados'}</option>
        ))}
      </Select>
      {activities.length ? (
        <>
          <Table caption="Actividades de mi entidad" columns={columns} data={activities} />
          <nav aria-label="Paginación de actividades de la entidad">
            <span>Página {page} de {totalPages}</span>
            <Button disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Anterior</Button>
            <Button disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>Siguiente</Button>
          </nav>
        </>
      ) : (
        <EmptyState title="No hay actividades" description="Crea una actividad o cambia el filtro seleccionado." />
      )}
    </section>
  );
}
