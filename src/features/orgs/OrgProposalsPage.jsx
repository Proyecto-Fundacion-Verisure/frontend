import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOrgProposals } from '../../api/orgApi';
import { Badge, Button, EmptyState, Spinner, Table } from '../../components/ui';

const STATUS_BADGES = {
  DRAFT: { label: 'Borrador', variant: 'neutral' },
  PENDING_APPROVAL: { label: 'Pendiente', variant: 'warning' },
  ACCEPTED: { label: 'Aceptada', variant: 'success' },
  REJECTED: { label: 'Rechazada', variant: 'danger' },
};

export default function OrgProposalsPage() {
  const [page, setPage] = useState(1);
  const [proposals, setProposals] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [state, setState] = useState({ status: 'loading', error: null });

  const load = useCallback(async () => {
    setState({ status: 'loading', error: null });
    try {
      const { data } = await getOrgProposals({ page: page - 1 });
      const content = data?.content ?? data;
      setProposals(Array.isArray(content) ? content : []);
      setTotalPages(Number(data?.totalPages) || 1);
      setState({ status: 'success', error: null });
    } catch (error) {
      setState({ status: 'error', error });
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.status === 'loading') return <Spinner label="Cargando propuestas de la entidad…" />;
  if (state.status === 'error') {
    return (
      <section>
        <h1>No hemos podido cargar las propuestas</h1>
        <p role="alert">{state.error?.message || 'Inténtalo de nuevo.'}</p>
        <Button onClick={load}>Reintentar</Button>
      </section>
    );
  }

  const columns = [
    { key: 'title', label: 'Propuesta', render: (item) => item.title ?? item.description ?? `Propuesta ${item.id}` },
    {
      key: 'status',
      label: 'Estado',
      render: (item) => {
        const badge = STATUS_BADGES[item.status];
        return badge
          ? <Badge variant={badge.variant}>{badge.label}</Badge>
          : item.status ?? '—';
      },
    },
    {
      key: 'createdAt',
      label: 'Fecha',
      render: (item) => item.createdAt ? new Date(item.createdAt).toLocaleDateString('es-ES') : '—',
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (item) => item.status === 'ACCEPTED'
        ? (
          <Link
            className="button button--primary button--small"
            to="/org/activities/new"
          >
            Crear actividad
          </Link>
        )
        : '—',
    },
  ];

  return (
    <section className="activities-list" aria-labelledby="org-proposals-title">
      <header className="activities-list__header">
        <div>
          <p className="activities-list__eyebrow">Entidad colaboradora</p>
          <h1 id="org-proposals-title">Mis propuestas</h1>
          <p>{proposals.length} propuestas encontradas</p>
        </div>
        <Link className="button button--primary button--medium" to="/org/proposals/new">
          Crear propuesta
        </Link>
      </header>
      {proposals.length ? (
        <>
          <Table caption="Propuestas de mi entidad" columns={columns} data={proposals} />
          <nav aria-label="Paginación de propuestas de la entidad">
            <span>Página {page} de {totalPages}</span>
            <Button disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Anterior</Button>
            <Button disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>Siguiente</Button>
          </nav>
        </>
      ) : (
        <EmptyState title="No hay propuestas" description="Tu entidad todavía no ha enviado propuestas." />
      )}
    </section>
  );
}
