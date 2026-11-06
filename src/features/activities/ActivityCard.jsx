import { Link } from 'react-router-dom';
import { Building2, CalendarDays, MapPin } from 'lucide-react';
import { Badge, Card, ProgressBar } from '../../shared/ui';
import { HeartButton } from '../favorites';
import { getLineByValue } from '../../shared/domain/activityLines';
import { formatDateRange } from '../../shared/lib/dates';
import { LIFECYCLE_BADGES, formatSpots, isOpenForRegistration } from './spots';

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
  const lifecycleLabel = LIFECYCLE_BADGES[status] ?? null;
  const isOpen = !isFull && isOpenForRegistration(status);

  // El filtro del catálogo acota la fecha de inicio, así que sin verla aquí los
  // resultados cambian sin que nada lo explique.
  const dateRange = startDate || endDate ? formatDateRange(startDate, endDate) : null;

  const mainContent = (
    <>
      <div className="activity-card__media">
        {lineInfo ? (
          <div className="activity-card__image">
            <img src={lineInfo.image} alt="" />
          </div>
        ) : (
          <div className="activity-card__image" role="img" aria-label="Sin imagen disponible">
            Sin imagen
          </div>
        )}
        <div className="activity-card__status">
          {isOpen && (
            <Badge variant="success"><span className="badge__dot" aria-hidden="true" />Inscripción abierta</Badge>
          )}
          {lifecycleLabel && <Badge variant={status === 'IN_PROGRESS' ? 'info' : 'neutral'}>{lifecycleLabel}</Badge>}
          {isFull && <Badge variant="warning">Completa</Badge>}
          {isEnrolled && <Badge variant="success">Ya estás apuntado</Badge>}
        </div>
      </div>

      <div className="activity-card__body">
        <div className="activity-card__badges">
          {lineLabel && <Badge variant="info">{lineLabel}</Badge>}
          {mode && <Badge variant="neutral">{mode}</Badge>}
        </div>

        {title && <h2 className="activity-card__title">{title}</h2>}

        {description && <p className="activity-card__description">{description}</p>}

        <ul className="activity-card__facts">
          {dateRange && (
            <li className="activity-card__dates">
              <CalendarDays aria-hidden="true" size={16} />
              <span>
                <span className="sr-only">Fechas: </span>
                {dateRange}
                {hours ? ` · ${hours} h` : ''}
              </span>
            </li>
          )}
          {displayLocation && (
            <li aria-label={`Ubicación: ${displayLocation}`}>
              <MapPin aria-hidden="true" size={16} />
              <span>{displayLocation}</span>
            </li>
          )}
          {partnerName && (
            <li className="activity-card__organization">
              <Building2 aria-hidden="true" size={16} />
              <span>{partnerName}</span>
            </li>
          )}
        </ul>

        {total > 0 && (
          <div className="activity-card__spots">
            <ProgressBar
              value={occupied}
              max={total}
              label="Plazas ocupadas"
              showValue={false}
              valueLabel={`${occupied} de ${total}`}
            />
            <p>{formatSpots(occupied, total)}</p>
          </div>
        )}
      </div>
    </>
  );

  return (
    <Card className="activity-card activity-card--interactive">
      {linkTo ? (
        <Link to={linkTo} className="activity-card__link" aria-label={`Ver detalle de ${title}`}>
          {mainContent}
        </Link>
      ) : (
        mainContent
      )}

      {/* Fuera del enlace: un botón dentro de un enlace no es HTML válido. */}
      <HeartButton
        className="activity-card__favorite"
        active={Boolean(favoritedByMe)}
        aria-label={favoritedByMe ? 'Quitar de favoritos' : 'Añadir a favoritos'}
        onClick={onToggleFavorite}
        isLoading={isFavoritePending}
      />
    </Card>
  );
}
