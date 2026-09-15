import { Link } from 'react-router-dom';
import { Badge, Card, HeartButton, ProgressBar } from '../../components/ui';
import { getLineByValue } from '../../constants/activityLines';
import { formatDateRange } from '../../utils/dates';

// `favoritedByMe` llega por propiedad y manda sobre el campo del `activity`: quien
// pinta la rejilla lo resuelve contra `FavoritesProvider`, que guarda lo que se
// acaba de pulsar y todavía no está en la respuesta del servidor. Sin proveedor
// —la tarjeta suelta en un test— se cae al campo del propio objeto.
export default function ActivityCard({
  activity,
  isEnrolled = false,
  linkTo,
  onToggleFavorite,
  isFavoritePending = false,
  favoritedByMe: favoritedByMeProp,
}) {
  if (!activity) return null;

  const {
    title,
    description,
    line,
    mode,
    spots,
    occupiedSpots,
    partnerName,
    location,
    address,
    city,
    startDate,
    endDate,
    hours,
    status,
  } = activity;
  const favoritedByMe = favoritedByMeProp ?? Boolean(activity.favoritedByMe);
  const displayLocation = location || address || city || null;

  // La portada es la imagen de la línea de acción, no un campo de la actividad:
  // `B2-03` decidió que no se suben ni se editan portadas, y el backend ya no
  // manda `imageUrl`. Si la línea no se reconoce queda el hueco, que es mejor que
  // un `<img>` roto.
  const lineInfo = getLineByValue(line);
  const lineLabel = lineInfo?.label ?? line;
  const occupied = Number(occupiedSpots) || 0;
  const total = Number(spots) || 0;
  const isFull =
    status === 'FULL' ||
    status === 'COMPLETA' ||
    status === 'COMPLETED' ||
    (total > 0 && occupied >= total);

  // El filtro del catálogo acota la fecha de inicio, así que sin verla aquí los
  // resultados cambian sin que nada lo explique.
  const dateRange = startDate || endDate ? formatDateRange(startDate, endDate) : null;

  const mainContent = (
    <>
      {lineInfo ? (
        <div className="activity-card__image">
          <img src={lineInfo.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

        {dateRange && (
          <p className="activity-card__dates">
            <span className="activity-card__dates-label">Fechas: </span>
            {dateRange}
            {hours ? ` · ${hours} h` : ''}
          </p>
        )}

        {description && <p className="activity-card__description">{description}</p>}

        {total > 0 && (
          <ProgressBar
            value={occupied}
            max={total}
            label="Plazas ocupadas"
            showValue={false}
            valueLabel={`${occupied} de ${total}`}
          />
        )}

        {(partnerName || displayLocation) && (
          <div className="activity-card__meta">
            {partnerName && <span className="activity-card__organization">{partnerName}</span>}
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
        <span className="activity-card__organization">{total > 0 ? `${occupied} de ${total} plazas` : ''}</span>
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
