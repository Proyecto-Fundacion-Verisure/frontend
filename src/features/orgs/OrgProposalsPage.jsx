import { useCallback, useEffect, useState } from 'react';
import { getOrgProposals } from '../../api/orgApi';
import { Button, EmptyState, Spinner, Table } from '../../components/ui';

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
    { key: 'status', label: 'Estado', render: (item) => item.status },
    {
      key: 'createdAt',
      label: 'Fecha',
      render: (item) => item.createdAt ? new Date(item.createdAt).toLocaleDateString('es-ES') : '—',
    },
  ];

  return (
    <section aria-labelledby="org-proposals-title">
      <h1 id="org-proposals-title">Mis propuestas</h1>
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
