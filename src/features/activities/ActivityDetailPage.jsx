import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { favoriteActivity, getActivityDetail, unfavoriteActivity } from '../../api/activitiesApi';
import { createRegistration, getMyRegistrations } from '../../api/registrationsApi';
import { useRegistrationsOptional } from '../registrations/RegistrationsContext';
import { useFavoritesOptional } from '../favorites/FavoritesContext';
import { Badge, Button, Card, EmptyState, HeartButton, ProgressBar, Spinner } from '../../components/ui';
import RegistrationInfoModal from '../registrations/RegistrationInfoModal';

const LINE_LABELS = {
  desoledad: 'Desoledad',
  educar: 'Educar para proteger',
  acoso: 'Protegidos ante el acoso',
  voluntariado: 'Voluntariado',
};

export default function ActivityDetailPage() {
  const { activityId } = useParams();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [localRegistration, setLocalRegistration] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [localFavOverride, setLocalFavOverride] = useState(null);
  const [localFavPending, setLocalFavPending] = useState(false);
  const registrationsCtx = useRegistrationsOptional();
  const favoritesCtx = useFavoritesOptional();
  const ctxRegistration = registrationsCtx ? registrationsCtx.getForActivity(activityId) : null;
  const currentRegistration = registrationsCtx ? ctxRegistration : localRegistration;

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getActivityDetail(activityId);
      setActivity(response.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  const submittingRef = useRef(false);
  const handleOpenModal = useCallback(() => {
    setSubmitError(null);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    if (submittingRef.current) return;
    setIsModalOpen(false);
  }, []);

  const handleConfirmRegistration = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const response = await createRegistration(Number(activityId) || activityId);
      const data = response?.data ?? response;
      if (registrationsCtx) {
        registrationsCtx.addRegistration(data);
      } else {
        setLocalRegistration(data);
      }
      setIsModalOpen(false);
    } catch (err) {
      setSubmitError(err);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [activityId, registrationsCtx]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  useEffect(() => {
    if (registrationsCtx) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await getMyRegistrations();
        if (cancelled) return;
        const data = res.data?.content ?? res.data;
        const list = Array.isArray(data) ? data : [];
        const found = list.find((r) => {
          const rid = r.activityId ?? r.activity?.id;
          return String(rid) === String(activityId);
        });
        if (found && found.status !== 'CANCELLED' && found.status !== 'CANCELADA') {
          setLocalRegistration(found);
        } else {
          setLocalRegistration(null);
        }
      } catch {
        if (!cancelled) setLocalRegistration(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activityId, registrationsCtx]);

  if (loading) {
    return (
      <section className="activity-detail" aria-label="Cargando actividad">
        <Spinner label="Cargando actividad…" />
      </section>
    );
  }

  if (error?.status === 404) {
    return (
      <section className="activity-detail">
        <EmptyState
          title="Actividad no encontrada"
          description={error.message || 'No se ha encontrado el recurso solicitado.'}
          action={
            <Link to="/activities" className="button button--primary">
              Volver al catálogo
            </Link>
          }
        />
      </section>
    );
  }

  if (error) {
    return (
      <section className="activity-detail">
        <div className="catalog__error" role="alert">
          {error.message || 'Ha ocurrido un error al cargar la actividad.'}
        </div>
        <Button onClick={fetchActivity}>Reintentar</Button>
      </section>
    );
  }

  if (!activity) return null;

  const occupied = Number(activity.registeredCount) || 0;
  const total = Number(activity.capacity) || 0;
  const lineLabel = LINE_LABELS[activity.line] || activity.line;
  const displayLocation = activity.location || activity.address || activity.city || null;
  const isFull = activity.status === 'FULL' || activity.status === 'COMPLETA' || (total > 0 && occupied >= total);
  const rawFavorited = Boolean(activity.favoritedByMe);
  const favoritedByMe = favoritesCtx
    ? favoritesCtx.getFavorite(activityId, rawFavorited)
    : (localFavOverride !== null ? localFavOverride : rawFavorited);
  const isFavPending = favoritesCtx ? favoritesCtx.isPending(activityId) : localFavPending;
  const isEnrolled = Boolean(currentRegistration);

  const handleToggleFavorite = async () => {
    if (favoritesCtx) {
      if (favoritesCtx.isPending(activityId)) return;
      try {
        await favoritesCtx.toggleFavorite(activityId, favoritedByMe);
      } catch {
        // revert handled inside context
      }
      return;
    }
    if (localFavPending) return;
    const next = !favoritedByMe;
    setLocalFavOverride(next);
    setLocalFavPending(true);
    try {
      if (next) await favoriteActivity(activityId);
      else await unfavoriteActivity(activityId);
      setActivity((prev) => (prev ? { ...prev, favoritedByMe: next } : prev));
    } catch {
      setLocalFavOverride(favoritedByMe);
    } finally {
      setLocalFavPending(false);
    }
  };

  return (
    <section className="activity-detail" aria-labelledby="activity-detail-title">
      <Link to="/activities" className="activity-detail__back">
        ← Volver al catálogo
      </Link>

      <div className="activity-detail__layout">
        <div className="activity-detail__main">
          <div className="activity-detail__header">
            <h1 id="activity-detail-title" className="activity-detail__title">
              {activity.title}
            </h1>
            <HeartButton
              active={favoritedByMe}
              aria-label={favoritedByMe ? 'Quitar de favoritos' : 'Añadir a favoritos'}
              onClick={handleToggleFavorite}
              disabled={isFavPending}
              aria-busy={isFavPending || undefined}
            />
          </div>

          <Card className="activity-detail__card">
            {activity.image && (
              <img src={activity.image} alt={activity.title} className="activity-detail__image" />
            )}
            <div className="activity-detail__badges">
              {lineLabel && <Badge variant="info">{lineLabel}</Badge>}
              {activity.mode && <Badge variant="neutral">{activity.mode}</Badge>}
              {isFull && <Badge variant="danger">Completa</Badge>}
              {isEnrolled && <Badge variant="success">Ya estás apuntado</Badge>}
              {displayLocation && (
                <Badge variant="neutral">
                  <span aria-label={`Ubicación: ${displayLocation}`}>📍 {displayLocation}</span>
                </Badge>
              )}
            </div>
            <p className="activity-detail__description">{activity.description}</p>
            {activity.organizationName && (
              <p className="activity-detail__meta">
                <strong>Organización:</strong> {activity.organizationName}
              </p>
            )}
            {total > 0 && (
              <ProgressBar value={occupied} max={total} label="Plazas ocupadas" showValue={false} valueLabel={`${occupied} de ${total}`} />
            )}
            {total > 0 && <p className="activity-detail__meta">{occupied} de {total} plazas</p>}
          </Card>
        </div>

        <aside className="activity-detail__side" aria-label="Panel de inscripción">
          <Card className="activity-detail__panel">
            <h2 className="activity-detail__panel-title">Inscripción</h2>
            {total > 0 && (
              <ProgressBar value={occupied} max={total} label="Plazas ocupadas" showValue={false} valueLabel={`${occupied} de ${total}`} />
            )}
            {total > 0 && <p className="activity-detail__panel-meta">{occupied} de {total} plazas</p>}
            {isFull && !isEnrolled && <p className="activity-detail__panel-meta">Actividad completa — puedes solicitar entrar en lista de espera.</p>}
            {isEnrolled && (
              <p className="activity-detail__panel-meta">
                Ya estás apuntado{currentRegistration?.status ? ` — ${currentRegistration.status}` : ''}.
              </p>
            )}
            {!isEnrolled && !isFull && <p className="activity-detail__panel-meta">Plazas disponibles.</p>}
            {!isEnrolled && (
              <Button onClick={handleOpenModal} data-testid="open-registration-modal">
                Solicitar inscripción
              </Button>
            )}
            {submitError && (
              <p role="alert" className="activity-detail__panel-meta">
                {submitError.message || 'No se pudo completar la solicitud.'}
              </p>
            )}
            <HeartButton
              active={favoritedByMe}
              aria-label={favoritedByMe ? 'Quitar de favoritos' : 'Añadir a favoritos'}
              onClick={handleToggleFavorite}
              disabled={isFavPending}
              aria-busy={isFavPending || undefined}
            />
          </Card>
        </aside>
      </div>
      <RegistrationInfoModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmRegistration}
        isSubmitting={isSubmitting}
      />
    </section>
  );
}
