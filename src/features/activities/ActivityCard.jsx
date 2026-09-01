import { Badge, Card, HeartButton, ProgressBar } from '../../components/ui';

const LINE_LABELS = {
  desoledad: 'Desoledad',
  educar: 'Educar para proteger',
  acoso: 'Protegidos ante el acoso',
  voluntariado: 'Voluntariado',
};

export default function ActivityCard({ activity }) {
  if (!activity) return null;

  const {
    title,
    description,
    line,
    mode,
    capacity,
    registeredCount,
    organizationName,
    image,
    favoritedByMe,
  } = activity;

  const lineLabel = LINE_LABELS[line] || line;
  const occupied = Number(registeredCount) || 0;
  const total = Number(capacity) || 0;

  return (
    <Card className="activity-card activity-card--interactive">
      {image && (
        <div className="activity-card__image">
          <img
            src={image}
            alt={title || 'Actividad'}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}
      {!image && <div className="activity-card__image" aria-hidden="true">Sin imagen</div>}

      <div className="activity-card__body">
        {(lineLabel || mode) && (
          <div className="activity-card__badges">
            {lineLabel && <Badge variant="info">{lineLabel}</Badge>}
            {mode && <Badge variant="neutral">{mode}</Badge>}
          </div>
        )}

        {title && <h3 className="activity-card__title">{title}</h3>}
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

        {organizationName && (
          <div className="activity-card__meta">
            <span className="activity-card__organization">{organizationName}</span>
          </div>
        )}
      </div>

      <div className="activity-card__footer">
        <span className="activity-card__organization">{total > 0 ? `${occupied} de ${total} plazas` : ''}</span>
        <HeartButton active={Boolean(favoritedByMe)} aria-label={favoritedByMe ? 'Quitar de favoritos' : 'Añadir a favoritos'} />
      </div>
    </Card>
  );
}
