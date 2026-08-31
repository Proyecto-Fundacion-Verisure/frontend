import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getProposal, rejectProposal } from '../../api/proposalsApi';
import { Badge, Button, Card, EmptyState, Spinner } from '../../components/ui';
import AcceptProposalButton, { getActivityDraftPath } from './AcceptProposalButton';

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
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function ProposalDetailPage() {
  const { proposalId } = useParams();
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rejectStatus, setRejectStatus] = useState('idle');
  const [rejectError, setRejectError] = useState('');

  const fetchProposal = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getProposal(proposalId);
      setProposal(response.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [proposalId]);

  useEffect(() => {
    fetchProposal();
  }, [fetchProposal]);

  const handleReject = async () => {
    if (rejectStatus === 'loading' || rejectStatus === 'conflict') return;
    setRejectStatus('loading');
    setRejectError('');
    try {
      await rejectProposal(proposalId);
      setProposal((prev) => (prev ? { ...prev, status: 'REJECTED' } : prev));
      setRejectStatus('idle');
    } catch (err) {
      if (err?.status === 409 || err?.code === 'PROPOSAL_ALREADY_DECIDED') {
        setRejectStatus('conflict');
        setRejectError('Esta propuesta ya ha sido aceptada o rechazada. Actualiza el detalle para ver su estado.');
      } else {
        setRejectStatus('idle');
        setRejectError(err?.message || 'No hemos podido rechazar la propuesta. Inténtalo de nuevo.');
      }
    }
  };

  if (loading) {
    return (
      <section className="proposal-detail" aria-label="Cargando propuesta">
        <Spinner label="Cargando propuesta…" />
      </section>
    );
  }

  if (error?.status === 404) {
    return (
      <section className="proposal-detail">
        <EmptyState
          title="Propuesta no encontrada"
          description={error.message || 'No se ha encontrado el recurso solicitado.'}
          action={
            <Link to="/proposals" className="button button--primary">
              Volver a la bandeja
            </Link>
          }
        />
      </section>
    );
  }

  if (error) {
    return (
      <section className="proposal-detail">
        <div className="proposals-inbox__error" role="alert">
          {error.message || 'Ha ocurrido un error al cargar la propuesta.'}
        </div>
        <Button onClick={fetchProposal}>Reintentar</Button>
      </section>
    );
  }

  if (!proposal) return null;

  const badge = STATUS_BADGE[proposal.status];
  const lineLabel = LINE_LABELS[proposal.line] || proposal.line;

  return (
    <section className="proposal-detail" aria-labelledby="proposal-detail-title">
      <Link to="/proposals" className="proposal-detail__back">
        ← Volver a la bandeja
      </Link>
      <div className="proposal-detail__header">
        <h1 id="proposal-detail-title">{proposal.organizationName}</h1>
        {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
      </div>

      <Card className="proposal-detail__card">
        <dl className="proposal-detail__meta">
          <div>
            <dt>Organización</dt>
            <dd>{proposal.organizationName}</dd>
          </div>
          <div>
            <dt>CIF</dt>
            <dd>{proposal.cif}</dd>
          </div>
          <div>
            <dt>Persona de contacto</dt>
            <dd>{proposal.contactName}</dd>
          </div>
          <div>
            <dt>Correo</dt>
            <dd>
              <a href={`mailto:${proposal.email}`}>{proposal.email}</a>
            </dd>
          </div>
          <div>
            <dt>Teléfono</dt>
            <dd>
              <a href={`tel:${proposal.phone}`}>{proposal.phone}</a>
            </dd>
          </div>
          <div>
            <dt>Línea</dt>
            <dd>{lineLabel ? <Badge variant="info">{lineLabel}</Badge> : '—'}</dd>
          </div>
          <div>
            <dt>Voluntarios estimados</dt>
            <dd>{proposal.estimatedVolunteers ?? '—'}</dd>
          </div>
          <div>
            <dt>Fecha</dt>
            <dd>{formatDate(proposal.createdAt)}</dd>
          </div>
        </dl>
        <div className="proposal-detail__description">
          <h2>Descripción</h2>
          <p>{proposal.description}</p>
        </div>
      </Card>

      <div className="proposal-detail__actions">
        {proposal.status === 'NEW' && (
          <>
            <AcceptProposalButton proposalId={proposal.id} />
            <Button
              variant="secondary"
              onClick={handleReject}
              isLoading={rejectStatus === 'loading'}
              loadingLabel="Rechazando…"
              disabled={rejectStatus === 'conflict'}
            >
              Rechazar propuesta
            </Button>
            {rejectError && (
              <p className="proposal-detail__error" role="alert">
                {rejectError}
              </p>
            )}
          </>
        )}
        {proposal.status === 'ACCEPTED' && (
          <Link
            className="button button--secondary"
            to={getActivityDraftPath(proposal.activityId ?? proposal.id)}
          >
            Ver actividad
          </Link>
        )}
        {proposal.status === 'REJECTED' && (
          <span className="proposals-inbox__no-action">Sin acciones disponibles</span>
        )}
      </div>
    </section>
  );
}
