import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProposals, rejectProposal } from '../../api/proposalsApi';
import { Badge, Button, EmptyState, Select, Spinner, Table } from '../../components/ui';
import { getActivityDraftPath } from './AcceptProposalButton';

const STATUS_OPTIONS = [
  { value: '', label: 'Todas' },
  { value: 'NEW', label: 'Nueva' },
  { value: 'ACCEPTED', label: 'Aceptada' },
  { value: 'REJECTED', label: 'Rechazada' },
];

const STATUS_BADGE = {
  NEW: { variant: 'primary', label: 'Nueva' },
  ACCEPTED: { variant: 'success', label: 'Aceptada' },
  REJECTED: { variant: 'danger', label: 'Rechazada' },
};

const LINE_LABELS = {
  desoledad: 'Desoledad',
  educar: 'Educar para proteger',
  acoso: 'Protegidos ante el acoso',
  voluntariado: 'Voluntariado',
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default function ProposalsInboxPage() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchProposals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page };
      if (statusFilter) params.status = statusFilter;
      const response = await getProposals(params);
      setProposals(response.data);
      setTotalCount(Number(response.headers?.['x-total-count'] ?? response.data.length));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { fetchProposals(); }, [fetchProposals]);

  useEffect(() => { setPage(1); }, [statusFilter]);

  const handleReject = async (id) => {
    try {
      await rejectProposal(id);
      fetchProposals();
    } catch {
      // error silently — the user can retry
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / 10));

  if (loading) {
    return (
      <section className="proposals-inbox" aria-label="Cargando propuestas">
        <Spinner label="Cargando propuestas…" />
      </section>
    );
  }

  if (error?.status === 403) {
    return (
      <section className="proposals-inbox">
        <div className="proposals-inbox__error" role="alert">
          No tienes permiso para ver las propuestas.
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="proposals-inbox">
        <div className="proposals-inbox__error" role="alert">
          {error.message || 'Ha ocurrido un error al cargar las propuestas.'}
        </div>
        <Button onClick={fetchProposals}>Reintentar</Button>
      </section>
    );
  }

  const columns = [
    {
      key: 'organizationName',
      label: 'Organización',
      render: (row) => (
        <Link to={`/proposals/${row.id}`} className="proposals-inbox__link">
          {row.organizationName}
        </Link>
      ),
    },
    {
      key: 'line',
      label: 'Línea',
      render: (row) => row.line ? <Badge variant="info">{LINE_LABELS[row.line] || row.line}</Badge> : '—',
    },
    {
      key: 'description',
      label: 'Descripción',
      render: (row) => (
        <span title={row.description}>
          {row.description?.length > 60 ? `${row.description.slice(0, 60)}…` : row.description}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      render: (row) => {
        const { variant, label } = STATUS_BADGE[row.status] ?? {};
        return variant ? <Badge variant={variant}>{label}</Badge> : row.status;
      },
    },
    {
      key: 'createdAt',
      label: 'Fecha',
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (row) => (
        <div className="proposals-inbox__actions">
          {row.status === 'NEW' && (
            <>
              <Button
                size="small"
                onClick={() => handleReject(row.id)}
              >
                Rechazar
              </Button>
              <Link
                className="button button--primary button--small"
                to={getActivityDraftPath(row.id)}
              >
                Aceptar
              </Link>
            </>
          )}
          {row.status === 'ACCEPTED' && (
            <Link
              className="button button--secondary button--small"
              to={getActivityDraftPath(row.id)}
            >
              Ver actividad
            </Link>
          )}
          {row.status === 'REJECTED' && (
            <span className="proposals-inbox__no-action">—</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <section className="proposals-inbox" aria-labelledby="proposals-inbox-title">
      <div className="proposals-inbox__header">
        <h1 id="proposals-inbox-title">Bandeja de propuestas</h1>
        <div className="proposals-inbox__filters">
          <Select
            label="Filtrar por estado"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        </div>
      </div>

      {proposals.length === 0 ? (
        <EmptyState
          title="No hay propuestas"
          description="No se encontraron propuestas con los filtros seleccionados."
        />
      ) : (
        <>
          <Table
            caption="Propuestas"
            columns={columns}
            data={proposals}
            rowKey="id"
          />
          <div className="proposals-inbox__pagination">
            <span className="proposals-inbox__pagination-info">
              Página {page} de {totalPages}
            </span>
            <div>
              <Button
                size="small"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Anterior
              </Button>
              <Button
                size="small"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente →
              </Button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
