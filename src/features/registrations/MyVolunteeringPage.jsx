import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cancelRegistration, getMyRegistrations } from '../../api/registrationsApi';
import { Badge, Button, Card, EmptyState, Modal, Spinner } from '../../components/ui';

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
  } catch {
    return String(value);
  }
}

function RegistrationCard({ item, onCancel, isCancelling }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const activity = item.activity ?? {};
  const title = activity.title ?? `Actividad ${activity.id ?? ''}`;
  const partner = activity.partner ?? activity.organizationName ?? '';
  const startDate = activity.startDate ?? activity.start ?? '';
  const endDate = activity.endDate ?? activity.end ?? '';
  const hours = activity.hours ?? activity.estimatedHours ?? null;

  const showQueue = item.queuePosition !== null && item.queuePosition !== undefined;
  const hasReport = Boolean(item.reportId);
  const isReturned = item.reportStatus === 'RETURNED';
  const showAccepted = item.status === 'WAITLISTED';
  const acceptedLabel = item.accepted ? 'Aceptada' : 'Pendiente de revisión';

  const statusLabels = {
    WAITLISTED: 'En lista de espera',
    CONFIRMED: 'CONFIRMADO',
    CLOSED: 'cerrado',
  };
  const statusLabel = statusLabels[item.status] ?? item.status;

  const startDateObj = startDate ? new Date(startDate) : null;
  const isStarted = startDateObj ? startDateObj < new Date() : false;
  const canCancel = (item.status === 'WAITLISTED' || item.status === 'CONFIRMED') && !isStarted;

  const handleOpen = () => setIsModalOpen(true);
  const handleClose = () => {
    if (isCancelling) return;
    setIsModalOpen(false);
  };
  const handleConfirm = async () => {
    await onCancel(item.registrationId);
    setIsModalOpen(false);
  };

  return (
    <Card className="my-volunteering__card" data-testid={`registration-${item.registrationId}`}>
      <div className="my-volunteering__card-header">
        <h3 className="my-volunteering__card-title">{title}</h3>
        <Badge variant="neutral">{statusLabel}</Badge>
      </div>
      {partner && <p className="my-volunteering__meta">Entidad: {partner}</p>}
      <p className="my-volunteering__meta">
        {formatDate(startDate)} — {formatDate(endDate)} {hours ? `· ${hours} h` : ''}
      </p>
      {showQueue && <p className="my-volunteering__queue">Posición en cola: {item.queuePosition}</p>}
      {showAccepted && <p className="my-volunteering__accepted" data-testid={`accepted-${item.registrationId}`}>{acceptedLabel}</p>}
      {!hasReport && (
        <Link
          to={`/reports/new?registrationId=${item.registrationId}`}
          className="button button--primary button--small"
          data-testid={`action-enviar-${item.registrationId}`}
        >
          Enviar cierre
        </Link>
      )}
      {hasReport && isReturned && (
        <Link
          to={`/reports/${item.reportId}`}
          className="button button--primary button--small"
          data-testid={`action-corregir-${item.registrationId}`}
        >
          Corregir y reenviar
        </Link>
      )}
      {hasReport && !isReturned && (
        <Link
          to={`/reports/${item.reportId}`}
          className="button button--secondary button--small"
          data-testid={`action-ver-${item.registrationId}`}
        >
          Ver cierre
        </Link>
      )}
      {onCancel && canCancel && (
        <>
          <Button
            variant="secondary"
            size="small"
            onClick={handleOpen}
            data-testid={`cancel-${item.registrationId}`}
            disabled={isCancelling}
          >
            Cancelar inscripción
          </Button>
          <Modal
            isOpen={isModalOpen}
            onClose={handleClose}
            title="Cancelar inscripción"
            description="¿Seguro que quieres cancelar tu inscripción? Esta acción no se puede deshacer."
            footer={
              <>
                <Button variant="secondary" onClick={handleClose} disabled={isCancelling} data-testid={`modal-cancel-${item.registrationId}`}>
                  Volver
                </Button>
                <Button
                  variant="danger"
                  onClick={handleConfirm}
                  isLoading={isCancelling}
                  disabled={isCancelling}
                  data-testid={`confirm-cancel-${item.registrationId}`}
                >
                  Confirmar baja
                </Button>
              </>
            }
          >
            <p>Se liberará tu plaza y se actualizará la lista de espera.</p>
          </Modal>
        </>
      )}
    </Card>
  );
}

export default function MyVolunteeringPage() {
  const [active, setActive] = useState(null);
  const [closed, setClosed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelError, setCancelError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyRegistrations();
      const payload = res.data ?? res;
      // MyRegistrationsResponse: { active: MyRegistrationItem[], closed: MyRegistrationItem[] }
      // Support variants: active/closed, activeRegistrations/closedRegistrations, or flat array
      if (payload && Array.isArray(payload.active) && Array.isArray(payload.closed)) {
        setActive(payload.active);
        setClosed(payload.closed);
      } else if (payload && Array.isArray(payload.activeRegistrations) && Array.isArray(payload.closedRegistrations)) {
        setActive(payload.activeRegistrations);
        setClosed(payload.closedRegistrations);
      } else if (payload && payload.data && (Array.isArray(payload.data.active) || Array.isArray(payload.data.closed))) {
        setActive(payload.data.active ?? []);
        setClosed(payload.data.closed ?? []);
      } else if (Array.isArray(payload)) {
        // Fallback for legacy mock flat array: treat as active, closed empty (do not reclassify by status)
        setActive(payload);
        setClosed([]);
      } else if (Array.isArray(payload?.content)) {
        setActive(payload.content);
        setClosed([]);
      } else if (payload && typeof payload === 'object') {
        // Try to detect active/closed inside data property (axios response already unwrapped)
        const maybeActive = payload.active ?? payload.actives ?? null;
        const maybeClosed = payload.closed ?? payload.closedRegistrations ?? null;
        if (Array.isArray(maybeActive) || Array.isArray(maybeClosed)) {
          setActive(maybeActive ?? []);
          setClosed(maybeClosed ?? []);
        } else {
          setActive([]);
          setClosed([]);
        }
      } else {
        setActive([]);
        setClosed([]);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCancel = useCallback(async (registrationId) => {
    setCancelError(null);
    setCancellingId(registrationId);
    try {
      await cancelRegistration(registrationId);
      await fetchData();
    } catch (err) {
      setCancelError(err.message || 'No se pudo cancelar la inscripción.');
    } finally {
      setCancellingId(null);
    }
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <section className="my-volunteering" aria-label="Cargando inscripciones">
        <Spinner label="Cargando inscripciones…" />
      </section>
    );
  }

  if (error?.status === 401) {
    return (
      <section className="my-volunteering">
        <div className="my-volunteering__error" role="alert">
          Tu sesión ha expirado. Vuelve a iniciar sesión.
        </div>
        <Link to="/login" className="button button--primary">
          Iniciar sesión
        </Link>
      </section>
    );
  }

  if (error) {
    return (
      <section className="my-volunteering">
        <div className="my-volunteering__error" role="alert">
          {error.message || 'No se han podido cargar tus inscripciones.'}
        </div>
        <Button onClick={fetchData}>Reintentar</Button>
      </section>
    );
  }

  const activeList = Array.isArray(active) ? active : [];
  const closedList = Array.isArray(closed) ? closed : [];
  const bothEmpty = activeList.length === 0 && closedList.length === 0;

  if (bothEmpty) {
    return (
      <section className="my-volunteering" aria-labelledby="my-volunteering-title">
        <h1 id="my-volunteering-title" className="my-volunteering__title">
          Mi voluntariado
        </h1>
        <EmptyState
          title="No tienes inscripciones"
          description="Aún no te has inscrito en ninguna actividad."
          action={
            <Link to="/activities" className="button button--primary">
              Explorar actividades
            </Link>
          }
        />
      </section>
    );
  }

  return (
    <section className="my-volunteering" aria-labelledby="my-volunteering-title">
      <h1 id="my-volunteering-title" className="my-volunteering__title">
        Mi voluntariado
      </h1>
      {cancelError && (
        <div className="my-volunteering__error" role="alert">
          {cancelError}
        </div>
      )}

      <section className="my-volunteering__block" aria-labelledby="active-title">
        <h2 id="active-title" className="my-volunteering__block-title">
          Activas
        </h2>
        {activeList.length === 0 ? (
          <EmptyState
            title="Sin inscripciones activas"
            description="No tienes inscripciones activas."
            action={
              <Link to="/activities" className="button button--primary">
                Explorar actividades
              </Link>
            }
          />
        ) : (
          <div className="my-volunteering__grid">
            {activeList.map((item) => (
              <RegistrationCard
                key={item.registrationId}
                item={item}
                onCancel={handleCancel}
                isCancelling={cancellingId === item.registrationId}
              />
            ))}
          </div>
        )}
      </section>

      <section className="my-volunteering__block" aria-labelledby="closed-title">
        <h2 id="closed-title" className="my-volunteering__block-title">
          Cerradas
        </h2>
        {closedList.length === 0 ? (
          <EmptyState title="Sin inscripciones cerradas" description="No tienes inscripciones cerradas." />
        ) : (
          <div className="my-volunteering__grid">
            {closedList.map((item) => (
              <RegistrationCard key={item.registrationId} item={item} />
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
