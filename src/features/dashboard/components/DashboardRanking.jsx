import { Card } from '../../../shared/ui';
import { formatDashboardNumber } from '../../../shared/lib/formatNumber';

export default function DashboardRanking({ items = [] }) {
  // El ranking se escala contra la actividad más votada, así que la barra más
  // larga siempre es la de arriba; el resto se compara con ella.
  const highestCount = Math.max(...items.map(({ favoriteCount }) => Number(favoriteCount) || 0), 0);

  return (
    <Card as="div" className="dashboard-ranking">
      <ol aria-label="Top 10 de actividades favoritas">
        {items.slice(0, 10).map((item, index) => {
          const count = Number(item.favoriteCount) || 0;
          const percentage = highestCount > 0 ? (count / highestCount) * 100 : 0;
          return (
            <li key={item.activityId ?? `${item.activityTitle}-${index}`}>
              <span className="dashboard-ranking__position" aria-label={`Posición ${index + 1}`}>
                {index + 1}
              </span>
              <div className="dashboard-ranking__activity">
                <div className="dashboard-ranking__heading">
                  <span>{item.activityTitle}</span>
                  <strong>
                    {formatDashboardNumber(count)} {count === 1 ? 'favorito' : 'favoritos'}
                  </strong>
                </div>
                <div
                  className="dashboard-ranking__track"
                  role="progressbar"
                  aria-label={`${item.activityTitle}: ${count} ${
                    count === 1 ? 'favorito' : 'favoritos'
                  }`}
                  aria-valuemin="0"
                  aria-valuemax={highestCount}
                  aria-valuenow={count}
                >
                  <span
                    className="dashboard-ranking__bar"
                    style={{ '--ranking-value': `${percentage}%` }}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
