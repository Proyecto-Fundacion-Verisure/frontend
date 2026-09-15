import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getActivityDetail } from '../../api/activitiesApi';
import { getMyRegistrations } from '../../api/registrationsApi';
import { useRegistrationsOptional } from '../registrations/RegistrationsContext';
import { useAuth } from '../auth/AuthContext';
import { useFavoritesOptional } from '../favorites/FavoritesContext';
import { AuthenticatedImage, Badge, Button, Card, EmptyState, HeartButton, ProgressBar, Spinner } from '../../components/ui';
import RegisterButton from '../registrations/RegisterButton';

const LINE_LABELS = {
  desoledad: 'Desoledad',
  educar: 'Educar para proteger',
  acoso: 'Protegidos ante el acoso',
  medio_ambiente: 'Medio ambiente',
};

export default function ActivityDetailPage() {
  const { activityId } = useParams();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favoriteError, setFavoriteError] = useState('');
  const [localRegistration, setLocalRegistration] = useState(null);
  const auth = useAuth();
  const canParticipate = !auth?.user || auth.user.role === 'EMPLOYEE';
  const registrationsCtx = useRegistrationsOptional();
  const favorites = useFavoritesOptional();
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

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  useEffect(() => {
    if (registrationsCtx || !canParticipate) return;
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
        // Only expose active registration; CANCELLED/CANCELADA treated as no registration
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
  }, [activityId, canParticipate, registrationsCtx]);

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

  const hasOccupancy = activity.registeredCount !== null
    && activity.registeredCount !== undefined
    && Number.isFinite(Number(activity.registeredCount));
  const occupied = hasOccupancy ? Number(activity.registeredCount) : 0;
  const total = Number(activity.capacity) || 0;
  const lineLabel = LINE_LABELS[activity.line] || activity.line;
  const displayLocation = activity.location || activity.address || activity.city || null;
  const isFull = activity.status === 'FULL'
    || activity.status === 'COMPLETA'
    || (total > 0 && hasOccupancy && occupied >= total);
  const favoritedByMe = favorites?.getFavorite(activity.id, activity.favoritedByMe)
    ?? Boolean(activity.favoritedByMe);
  const isFavoritePending = favorites?.isPending(activity.id) ?? false;
  const toggleFavorite = favorites ? async () => {
    setFavoriteError('');
    try {
      await favorites.toggleFavorite(activity.id, favoritedByMe);
    } catch (requestError) {
      setFavoriteError(requestError?.message || 'No hemos podido actualizar tus favoritos.');
    }
  } : undefined;
  const isEnrolled = Boolean(currentRegistration);

  return (
    <section className="activity-detail" aria-labelledby="activity-detail-title">
      <Link to="/activities" className="activity-detail__back">
        ← Volver al catálogo
      </Link>

      {favoriteError && <div className="catalog__error" role="alert">{favoriteError}</div>}

      <div className="activity-detail__layout">
        <div className="activity-detail__main">
          <div className="activity-detail__header">
            <h1 id="activity-detail-title" className="activity-detail__title">
              {activity.title}
            </h1>
            {canParticipate && (
              <HeartButton
                active={favoritedByMe}
                aria-label={favoritedByMe ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                onClick={toggleFavorite}
                isLoading={isFavoritePending}
              />
            )}
          </div>

          <Card className="activity-detail__card">
            {activity.image && (
              <AuthenticatedImage src={activity.image} alt={activity.title} className="activity-detail__image" />
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
            {total > 0 && hasOccupancy && (
              <ProgressBar value={occupied} max={total} label="Plazas ocupadas" showValue={false} valueLabel={`${occupied} de ${total}`} />
            )}
            {total > 0 && (
              <p className="activity-detail__meta">
                {hasOccupancy ? `${occupied} de ${total} plazas` : `${total} plazas disponibles en total`}
              </p>
            )}
          </Card>
        </div>

        {canParticipate && <aside className="activity-detail__side" aria-label="Panel de inscripción">
          <Card className="activity-detail__panel">
            <h2 className="activity-detail__panel-title">Inscripción</h2>
            {total > 0 && hasOccupancy && (
              <ProgressBar value={occupied} max={total} label="Plazas ocupadas" showValue={false} valueLabel={`${occupied} de ${total}`} />
            )}
            {total > 0 && (
              <p className="activity-detail__panel-meta">
                {hasOccupancy ? `${occupied} de ${total} plazas` : `${total} plazas en total`}
              </p>
            )}
            {isFull && !isEnrolled && <p className="activity-detail__panel-meta">Actividad completa — puedes solicitar entrar en lista de espera.</p>}
            {isEnrolled && (
              <p className="activity-detail__panel-meta">
                Ya estás apuntado
                {currentRegistration?.status === 'WAITLISTED'
                  ? ' — En lista de espera'
                  : currentRegistration?.status && currentRegistration.status !== 'CONFIRMED'
                    ? ` — ${currentRegistration.status}`
                    : ''}
                .
              </p>
            )}
            {isEnrolled && currentRegistration?.queuePosition != null && (
              <p className="activity-detail__panel-meta">Posición en cola: {currentRegistration.queuePosition}</p>
            )}
            {isEnrolled
              && currentRegistration?.status === 'WAITLISTED'
              && typeof currentRegistration.accepted === 'boolean' && (
              <p className="activity-detail__panel-meta" data-testid="accepted-status">
                {currentRegistration.accepted ? 'Aceptada' : 'Pendiente de revisión'}
              </p>
            )}
            {!isEnrolled && !isFull && <p className="activity-detail__panel-meta">Plazas disponibles.</p>}
            {!isEnrolled && <RegisterButton activity={activity} onSuccess={(data) => setLocalRegistration(data)} />}
            <HeartButton
              active={favoritedByMe}
              aria-label={favoritedByMe ? 'Quitar de favoritos' : 'Añadir a favoritos'}
              onClick={toggleFavorite}
              isLoading={isFavoritePending}
            />
          </Card>
        </aside>}
      </div>
    </section>
  );
}
