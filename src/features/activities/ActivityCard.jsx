import Card from '../../components/ui/Card/Card';
import Badge from '../../components/ui/Badge/Badge';
import ProgressBar from '../../components/ui/ProgressBar/ProgressBar';
import HeartButton from '../../components/ui/HeartButton/HeartButton';

const LINE_LABELS = {
  desoledad: 'Desoledad',
  educar: 'Educar para proteger',
  acoso: 'Protegidos ante el acoso',
  voluntariado: 'Voluntariado',
};

const MODALITY_LABELS = {
  presencial: 'Presencial',
  online: 'Online',
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ActivityCard({ activity = {}, preview = false, favorited = false, onToggleFavorite }) {
  const {
    title = '',
    description = '',
    line = '',
    modality = '',
    date = '',
    totalSlots = 0,
    registeredSlots = 0,
    organization = '',
  } = activity;

  return (
    <Card className={`activity-card${preview ? ' activity-card--preview' : ''}`}>
      <div className="activity-card__image">
        {preview ? 'Vista previa' : 'Imagen de actividad'}
      </div>

      <div className="activity-card__body">
        <h3 className="activity-card__title">{title || 'Título de la actividad'}</h3>

        {description && (
          <p className="activity-card__description">{description}</p>
        )}

        <div className="activity-card__badges">
          {line && <Badge variant="primary">{LINE_LABELS[line] || line}</Badge>}
          {modality && <Badge variant="info">{MODALITY_LABELS[modality] || modality}</Badge>}
        </div>

        <div className="activity-card__meta">
          {date && (
            <span className="activity-card__meta-item">
              📅 {formatDate(date)}
            </span>
          )}
          {totalSlots > 0 && (
            <ProgressBar
              value={registeredSlots}
              max={totalSlots}
              showValue
              valueLabel={`${registeredSlots} de ${totalSlots}`}
            />
          )}
        </div>
      </div>

      <div className="activity-card__footer">
        <span className="activity-card__organization">
          {organization || 'Tu organización'}
        </span>
        {!preview && onToggleFavorite && (
          <HeartButton active={favorited} onClick={onToggleFavorite} />
        )}
      </div>
    </Card>
  );
}
