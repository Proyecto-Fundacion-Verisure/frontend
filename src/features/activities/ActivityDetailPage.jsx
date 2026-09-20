import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getActivityDetail } from '../../api/activitiesApi';
import { getMyRegistrations } from '../../api/registrationsApi';
import { useRegistrationsOptional } from '../registrations/RegistrationsContext';
import { useFavoritesOptional } from '../favorites/FavoritesContext';
import { useAuth } from '../auth/AuthContext';
import { Badge, Button, Card, EmptyState, HeartButton, ProgressBar, Spinner } from '../../components/ui';
import RegisterButton from '../registrations/RegisterButton';
import { getLineByValue } from '../../constants/activityLines';
import { formatDate, formatDateRange, isPastLocalDate } from '../../utils/dates';
import { LIFECYCLE_BADGES, formatSpots, isOpenForRegistration } from './spots';

export default function ActivityDetailPage() {
  const { activityId } = useParams();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [localRegistration, setLocalRegistration] = useState(null);
  const auth = useAuth();
  const canParticipate = !auth?.user || auth.user.role === 'EMPLOYEE';
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

  const occupied = Number(activity.occupiedSpots) || 0;
  const total = Number(activity.spots) || 0;
  // Igual que en la tarjeta: la portada sale de la línea de acción, que es lo que
  // decidió `B2-03`. El backend ya no manda `imageUrl`.
  const lineInfo = getLineByValue(activity.line);
  const lineLabel = lineInfo?.label ?? activity.line;
  const dateRange = activity.startDate || activity.endDate
    ? formatDateRange(activity.startDate, activity.endDate)
    : null;
  const displayLocation = activity.location || activity.address || activity.city || null;
  const isFull = activity.status === 'FULL' || activity.status === 'COMPLETA' || (total > 0 && occupied >= total);
  const lifecycleLabel = LIFECYCLE_BADGES[activity.status] ?? null;
  const spotsLabel = total > 0 ? formatSpots(occupied, total) : null;
  // Con la actividad en curso o terminada, o el plazo vencido, «Plazas
  // disponibles» junto a «Plazo cerrado» se contradice: las plazas sobran pero
  // ya no se pueden pedir.
  const registrationClosed = Boolean(lifecycleLabel) || isPastLocalDate(activity.registrationDeadline);
  const isOpen = !isFull && !registrationClosed && isOpenForRegistration(activity.status);
  const favoritedByMe = favoritesCtx
    ? favoritesCtx.getFavorite(activity.id, activity.favoritedByMe)
    : Boolean(activity.favoritedByMe);
  const isFavoritePending = favoritesCtx ? favoritesCtx.isPending(activity.id) : false;
  // Los dos corazones de la página —cabecera y panel— comparten este manejador y
  // el estado del contexto, así que pulsar uno mueve el otro. El fallo lo deshace
  // el proveedor; aquí solo se captura la promesa.
  const handleToggleFavorite = favoritesCtx
    ? () => favoritesCtx.toggleFavorite(activity.id, favoritedByMe).catch(() => {})
    : undefined;
  const isEnrolled = Boolean(currentRegistration);

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
            {canParticipate && (
              <HeartButton
                active={favoritedByMe}
                aria-label={favoritedByMe ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                onClick={handleToggleFavorite}
                isLoading={isFavoritePending}
              />
            )}
          </div>

          <Card className="activity-detail__card">
            {lineInfo && (
              <img src={lineInfo.image} alt={lineInfo.description} className="activity-detail__image" />
            )}
            <div className="activity-detail__badges">
              {lineLabel && <Badge variant="info">{lineLabel}</Badge>}
              {activity.mode && <Badge variant="neutral">{activity.mode}</Badge>}
              {isOpen && (
                <Badge variant="success"><span className="badge__dot" aria-hidden="true" />Inscripción abierta</Badge>
              )}
              {lifecycleLabel && <Badge variant="neutral">{lifecycleLabel}</Badge>}
              {isFull && <Badge variant="danger">Completa</Badge>}
              {isEnrolled && <Badge variant="success">Ya estás apuntado</Badge>}
              {displayLocation && (
                <Badge variant="neutral">
                  <span aria-label={`Ubicación: ${displayLocation}`}>📍 {displayLocation}</span>
                </Badge>
              )}
            </div>
            <p className="activity-detail__description">{activity.description}</p>
            {activity.partnerName && (
              <p className="activity-detail__meta">
                <strong>Organización:</strong> {activity.partnerName}
              </p>
            )}
            {dateRange && (
              <p className="activity-detail__meta">
                <strong>Fechas:</strong> {dateRange}
              </p>
            )}
            {activity.hours ? (
              <p className="activity-detail__meta">
                <strong>Dedicación:</strong> {activity.hours} h
              </p>
            ) : null}
            {activity.registrationDeadline && (
              <p className="activity-detail__meta">
                <strong>Plazo de inscripción:</strong> hasta el {formatDate(activity.registrationDeadline)}
              </p>
            )}
            {total > 0 && (
              <ProgressBar value={occupied} max={total} label="Plazas ocupadas" showValue={false} valueLabel={`${occupied} de ${total}`} />
            )}
            {spotsLabel && <p className="activity-detail__meta">{spotsLabel}</p>}
          </Card>
        </div>

        {canParticipate && <aside className="activity-detail__side" aria-label="Panel de inscripción">
          <Card className="activity-detail__panel">
            <h2 className="activity-detail__panel-title">Inscripción</h2>
            {total > 0 && (
              <ProgressBar value={occupied} max={total} label="Plazas ocupadas" showValue={false} valueLabel={`${occupied} de ${total}`} />
            )}
            {spotsLabel && <p className="activity-detail__panel-meta">{spotsLabel}</p>}
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
            {isEnrolled && currentRegistration?.status === 'WAITLISTED' && (
              <p className="activity-detail__panel-meta" data-testid="accepted-status">
                {currentRegistration.accepted ? 'Aceptada' : 'Pendiente de revisión'}
              </p>
            )}
            {!isEnrolled && !isFull && !registrationClosed && <p className="activity-detail__panel-meta">Plazas disponibles.</p>}
            {/* El plazo también aquí: es lo que decide si el botón de abajo sigue
                vivo, y sin la fecha «Plazo cerrado» parece un error. */}
            {activity.registrationDeadline && (
              <p className="activity-detail__panel-meta">
                Plazo de inscripción: hasta el {formatDate(activity.registrationDeadline)}
              </p>
            )}
            {!isEnrolled && <RegisterButton activity={activity} onSuccess={(data) => setLocalRegistration(data)} />}
            <HeartButton
              active={favoritedByMe}
              aria-label={favoritedByMe ? 'Quitar de favoritos' : 'Añadir a favoritos'}
              onClick={handleToggleFavorite}
              isLoading={isFavoritePending}
            />
          </Card>
        </aside>}
      </div>
    </section>
  );
}
