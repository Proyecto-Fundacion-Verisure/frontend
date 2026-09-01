import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getActivityDetail } from '../../api/activitiesApi';
import { Badge, Button, Card, EmptyState, ProgressBar, Spinner } from '../../components/ui';

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

  if (loading) {
    return (
      <section className="catalog" aria-label="Cargando actividad">
        <Spinner label="Cargando actividad…" />
      </section>
    );
  }

  if (error?.status === 404) {
    return (
      <section className="catalog">
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
      <section className="catalog">
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

  return (
    <section className="catalog" aria-labelledby="activity-detail-title">
      <Link to="/activities" className="catalog__back">
        ← Volver al catálogo
      </Link>
      <div className="catalog__header">
        <h1 id="activity-detail-title" className="catalog__title">
          {activity.title}
        </h1>
        {isFull && <Badge variant="danger">Completa</Badge>}
      </div>

      <Card className="activity-detail__card">
        {activity.image && (
          <img src={activity.image} alt={activity.title} style={{ width: '100%', maxHeight: '20rem', objectFit: 'cover', borderRadius: '1rem' }} />
        )}
        <div style={{ padding: '1rem 0', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {lineLabel && <Badge variant="info">{lineLabel}</Badge>}
          {activity.mode && <Badge variant="neutral">{activity.mode}</Badge>}
          {displayLocation && (
            <Badge variant="neutral">
              <span aria-label={`Ubicación: ${displayLocation}`}>📍 {displayLocation}</span>
            </Badge>
          )}
        </div>
        <p>{activity.description}</p>
        {activity.organizationName && (
          <p>
            <strong>Organización:</strong> {activity.organizationName}
          </p>
        )}
        {total > 0 && (
          <ProgressBar value={occupied} max={total} label="Plazas ocupadas" showValue={false} valueLabel={`${occupied} de ${total}`} />
        )}
        {total > 0 && <p>{occupied} de {total} plazas</p>}
      </Card>
    </section>
  );
}
