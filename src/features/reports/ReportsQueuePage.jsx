import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPendingActivityClosures } from '../../api/closuresApi';
import { Button, EmptyState, Pagination, Spinner, Table } from '../../components/ui';

const PAGE_SIZE = 10;

export default function ReportsQueuePage() {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [state, setState] = useState({ status: 'loading', error: null });

  const load = useCallback(async () => {
    setState({ status: 'loading', error: null });
    try {
      const { data } = await getPendingActivityClosures({ page: page - 1 });
      const content = data?.content ?? data;
      setItems(Array.isArray(content) ? content : []);
      setTotalPages(Number(data?.totalPages) || 1);
      setState({ status: 'success', error: null });
    } catch (error) {
      setState({ status: 'error', error });
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.status === 'loading') return <Spinner label="Cargando cierres pendientes…" />;
  if (state.status === 'error') {
    return (
      <section>
        <h1>No hemos podido cargar los cierres pendientes</h1>
        <p role="alert">{state.error?.message || 'Inténtalo de nuevo.'}</p>
        <Button onClick={load}>Reintentar</Button>
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
      key: 'partner',
      label: 'Entidad',
      render: (item) => item.partnerName ?? item.partner?.name ?? '—',
    },
    {
      key: 'endDate',
      label: 'Finalización',
      render: (item) => item.endDate
        ? new Date(item.endDate).toLocaleDateString('es-ES')
        : '—',
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
      <h1 id="pending-closures-title">Cierres de actividad pendientes</h1>
      {items.length ? (
        <>
          <Table caption="Actividades pendientes de cierre" columns={columns} data={items} rowKey="activityId" />
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            ariaLabel="Paginación de cierres"
          />
        </>
      ) : (
        <EmptyState title="No hay cierres pendientes" description="Todas las actividades finalizadas están cerradas." />
      )}
    </section>
  );
}
