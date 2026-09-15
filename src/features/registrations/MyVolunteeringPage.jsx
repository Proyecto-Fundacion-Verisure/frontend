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
  const registrationId = item.registrationId ?? item.id;

  const showQueue = item.queuePosition !== null && item.queuePosition !== undefined;
  const closureId = item.closureId ?? null;
  const activityClosed = Boolean(item.activityClosed);
  const hasClosure = Boolean(closureId);
  const showAccepted = item.status === 'WAITLISTED';
  const acceptedLabel = item.accepted ? 'Aceptada' : 'Pendiente de revisión';

  const statusLabels = {
    WAITLISTED: 'En lista de espera',
    CONFIRMED: 'CONFIRMADO',
    CLOSED: 'cerrado',
    PENDING_CLOSURE: 'Pendiente de cierre',
  };
  const statusLabel = statusLabels[item.status] ?? item.status;

  const startDateObj = startDate
    ? new Date(/^\d{4}-\d{2}-\d{2}$/.test(startDate) ? `${startDate}T00:00:00` : startDate)
    : null;
  const isStarted = startDateObj ? startDateObj < new Date() : false;
  // Derivar visibilidad de fecha de inicio y acción permitida en la respuesta (MyRegistrationItem.canCancel / allowedActions)
  const allowedByBackend = (() => {
    if (typeof item.canCancel === 'boolean') return item.canCancel;
    if (typeof item.cancellable === 'boolean') return item.cancellable;
    if (Array.isArray(item.allowedActions)) return item.allowedActions.includes('CANCEL') || item.allowedActions.includes('cancel');
    if (Array.isArray(item.actions)) return item.actions.includes('CANCEL');
    return true;
  })();
  // Persona solo cancela antes del inicio; regla administrativa (cancelar en cualquier momento) no se aplica aquí
  const canCancel = (item.status === 'WAITLISTED' || item.status === 'CONFIRMED') && !isStarted && allowedByBackend;

  const handleOpen = () => setIsModalOpen(true);
  const handleClose = () => {
    if (isCancelling) return;
    setIsModalOpen(false);
  };
  const handleConfirm = async () => {
    await onCancel(registrationId);
    setIsModalOpen(false);
  };

  return (
    <Card className="my-volunteering__card" data-testid={`registration-${registrationId}`}>
      <div className="my-volunteering__card-header">
        <h3 className="my-volunteering__card-title">{title}</h3>
        <Badge variant="neutral">{statusLabel}</Badge>
      </div>
      {partner && <p className="my-volunteering__meta">Entidad: {partner}</p>}
      <p className="my-volunteering__meta">
        {formatDate(startDate)} — {formatDate(endDate)} {hours ? `· ${hours} h` : ''}
      </p>
      {showQueue && <p className="my-volunteering__queue">Posición en cola: {item.queuePosition}</p>}
      {showAccepted && typeof item.accepted === 'boolean' && (
        <p className="my-volunteering__accepted" data-testid={`accepted-${registrationId}`}>{acceptedLabel}</p>
      )}
      {(() => {
        if (!hasClosure && !activityClosed && item.status === 'PENDING_CLOSURE') {
          return (
            <Link to={`/closures/new?registrationId=${registrationId}`} className="button button--primary button--small" data-testid={`action-enviar-${registrationId}`}>
              Cerrar tu participación
            </Link>
          );
        }
        if (hasClosure && activityClosed) {
          return (
            <Link to={`/closures/${closureId}/certificate`} className="button button--primary button--small" data-testid={`action-cert-${registrationId}`}>
              Descargar certificado
            </Link>
          );
        }
        if (hasClosure && !activityClosed) {
          return (
            <Link to={`/closures/${closureId}`} className="button button--secondary button--small" data-testid={`action-ver-${registrationId}`}>
              Ver cierre
            </Link>
          );
        }
        return null;
      })()}
      {onCancel && canCancel && (
        <>
          <Button
            variant="secondary"
            size="small"
            onClick={handleOpen}
            data-testid={`cancel-${registrationId}`}
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
                <Button variant="secondary" onClick={handleClose} disabled={isCancelling} data-testid={`modal-cancel-${registrationId}`}>
                  Volver
                </Button>
                <Button
                  variant="danger"
                  onClick={handleConfirm}
                  isLoading={isCancelling}
                  disabled={isCancelling}
                  data-testid={`confirm-cancel-${registrationId}`}
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
      const payload = res.data?.content ?? res.data ?? res;
      const items = Array.isArray(payload) ? payload : [];
      setActive(items.filter((item) => item.status !== 'CLOSED' && !item.activityClosed));
      setClosed(items.filter((item) => item.status === 'CLOSED' || item.activityClosed));
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
      // Si hay desfase horario y backend devuelve DEADLINE_PASSED (409), actualizar interfaz
      if (err?.code === 'DEADLINE_PASSED' || err?.status === 409) {
        try {
          await fetchData();
        } catch {
          // ignore
        }
      }
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
                key={item.registrationId ?? item.id}
                item={item}
                onCancel={handleCancel}
                isCancelling={cancellingId === (item.registrationId ?? item.id)}
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
              <RegistrationCard key={item.registrationId ?? item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
