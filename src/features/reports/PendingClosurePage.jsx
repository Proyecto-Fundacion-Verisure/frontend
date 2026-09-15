import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPendingActivityClosures } from '../../api/closuresApi';
import { Button, EmptyState, Pagination, Spinner, Table } from '../../components/ui';
import { formatDate } from '../../utils/dates';

const PAGE_SIZE = 10;

function normalizeItems(content = []) {
  return content.map((item) => ({
    ...item,
    activityId: item.activityId ?? item.id,
  }));
}

export default function PendingClosurePage() {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [state, setState] = useState({ status: 'loading', error: null });

  const load = useCallback(async () => {
    setState({ status: 'loading', error: null });
    try {
      const { data } = await getPendingActivityClosures({ page: page - 1 });
      setItems(normalizeItems(data?.content));
      setTotalElements(Number(data?.totalElements) || 0);
      setTotalPages(Number(data?.totalPages) || (Array.isArray(data?.content) ? 1 : 0));
      setState({ status: 'success', error: null });
    } catch (error) {
      setState({ status: 'error', error });
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.status === 'loading') return <Spinner label="Cargando actividades pendientes de cierre…" />;
  if (state.status === 'error') {
    const forbidden = state.error?.status === 403;
    return (
      <section aria-labelledby="pending-closures-title">
        <h1 id="pending-closures-title">
          {forbidden ? 'Acceso restringido' : 'No hemos podido cargar las actividades pendientes de cierre'}
        </h1>
        <p role="alert">{state.error?.message || 'Inténtalo de nuevo.'}</p>
        {!forbidden && <Button onClick={load}>Reintentar</Button>}
      </section>
    );
  }

  const columns = [
    {
      key: 'activity',
      label: 'Actividad',
      render: (item) => item.activityTitle ?? item.title ?? `Actividad ${item.activityId}`,
    },
    {
      key: 'endDate',
      label: 'Finalización',
      render: (item) => formatDate(item.endDate),
    },
    {
      key: 'expectedHours',
      label: 'Horas previstas',
      render: (item) => item.expectedHours ?? item.plannedHours ?? 0,
    },
    {
      key: 'reportedHours',
      label: 'Horas reportadas',
      render: (item) => item.reportedHours ?? 0,
    },
    {
      key: 'closuresReceived',
      label: 'Cierres recibidos',
      render: (item) => item.closuresReceived ?? item.closureCount ?? item.closingsCount ?? 0,
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (item) => (
        <Link
          className="button button--primary button--small"
          to={`/admin/activities/${item.activityId}/closure`}
        >
          Revisar cierre
        </Link>
      ),
    },
  ];

  return (
    <section aria-labelledby="pending-closures-title">
      <h1 id="pending-closures-title">Actividades pendientes de cierre</h1>
      <p>{totalElements} {totalElements === 1 ? 'actividad pendiente' : 'actividades pendientes'}</p>
      {items.length ? (
        <>
          <Table
            caption="Actividades pendientes de cierre"
            columns={columns}
            data={items}
            rowKey="activityId"
          />
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            ariaLabel="Paginación de cierres"
          />
        </>
      ) : (
        <EmptyState
          title="No hay actividades pendientes de cierre"
          description="Todas las actividades finalizadas están cerradas."
        />
      )}
    </section>
  );
}