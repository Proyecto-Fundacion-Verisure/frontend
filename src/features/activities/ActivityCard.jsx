import { Link } from 'react-router-dom';
import { AuthenticatedImage, Badge, Card, HeartButton, ProgressBar } from '../../components/ui';

const LINE_LABELS = {
  desoledad: 'Desoledad',
  educar: 'Educar para proteger',
  acoso: 'Protegidos ante el acoso',
  medio_ambiente: 'Medio ambiente',
};

export default function ActivityCard({ activity, isEnrolled = false, linkTo, onToggleFavorite, isFavoritePending = false }) {
  if (!activity) return null;

  const {
    title,
    description,
    line,
    mode,
    capacity,
    registeredCount,
    organizationName,
    location,
    address,
    city,
    image,
    favoritedByMe,
    status,
  } = activity;
  const displayLocation = location || address || city || null;

  const lineLabel = LINE_LABELS[line] || line;
  const hasOccupancy = registeredCount !== null
    && registeredCount !== undefined
    && Number.isFinite(Number(registeredCount));
  const occupied = hasOccupancy ? Number(registeredCount) : 0;
  const total = Number(capacity) || 0;
  const isFull =
    status === 'FULL' ||
    status === 'COMPLETA' ||
    status === 'COMPLETED' ||
    (total > 0 && occupied >= total);

  const mainContent = (
    <>
      {image ? (
        <div className="activity-card__image">
          <AuthenticatedImage src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ) : (
        <div className="activity-card__image" role="img" aria-label="Sin imagen disponible">
          Sin imagen
        </div>
      )}

      <div className="activity-card__body">
        <div className="activity-card__badges">
          {lineLabel && <Badge variant="info">{lineLabel}</Badge>}
          {mode && <Badge variant="neutral">{mode}</Badge>}
          {isFull && <Badge variant="danger">Completa</Badge>}
          {isEnrolled && <Badge variant="success">Ya estás apuntado</Badge>}
        </div>

        {title && <h3 className="activity-card__title">{title}</h3>}
        {description && <p className="activity-card__description">{description}</p>}

        {total > 0 && hasOccupancy && (
          <ProgressBar
            value={occupied}
            max={total}
            label="Plazas ocupadas"
            showValue={false}
            valueLabel={`${occupied} de ${total}`}
          />
        )}

        {(organizationName || displayLocation) && (
          <div className="activity-card__meta">
            {organizationName && <span className="activity-card__organization">{organizationName}</span>}
            {displayLocation && (
              <span className="activity-card__location" aria-label={`Ubicación: ${displayLocation}`}>
                <span aria-hidden="true">📍</span> {displayLocation}
              </span>
            )}
          </div>
        )}
      </div>
    </>
  );

  return (
    <Card className="activity-card activity-card--interactive">
      {linkTo ? (
        <Link to={linkTo} style={{ textDecoration: 'none', color: 'inherit' }} aria-label={`Ver detalle de ${title}`}>
          {mainContent}
        </Link>
      ) : (
        mainContent
      )}

      <div className="activity-card__footer">
        <span className="activity-card__organization">
          {total > 0 ? hasOccupancy ? `${occupied} de ${total} plazas` : `${total} plazas` : ''}
        </span>
        <HeartButton
          active={Boolean(favoritedByMe)}
          aria-label={favoritedByMe ? 'Quitar de favoritos' : 'Añadir a favoritos'}
          onClick={onToggleFavorite}
          isLoading={isFavoritePending}
        />
      </div>
    </Card>
  );
}
