import { Link } from 'react-router-dom';
import { Button, EmptyState, PageHeader } from '../../../shared/ui';
import MyVolunteeringCard from './MyVolunteeringCard';

export default function MyVolunteeringBlocks({
  activeList,
  historyList,
  cancelError,
  cancellingId,
  onCancel,
}) {
  const hasActive = activeList.length > 0;
  const hasHistory = historyList.length > 0;

  return (
    <section className="my-volunteering" aria-labelledby="my-volunteering-title">
      <PageHeader title="Mis voluntariados" titleId="my-volunteering-title" />

      {cancelError && (
        <div className="my-volunteering__error" role="alert">{cancelError}</div>
      )}

      <section className="my-volunteering__block" aria-labelledby="active-title">
        <div className="my-volunteering__block-header">
          <h2 id="active-title" className="my-volunteering__block-title">Activas</h2>
          <span className="my-volunteering__block-count" data-testid="active-count">
            {activeList.length}
          </span>
        </div>
        {hasActive ? (
          <div>
            {activeList.map((item) => (
              <MyVolunteeringCard
                key={item.registrationId}
                item={item}
                onCancel={onCancel}
                isCancelling={cancellingId === item.registrationId}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Sin inscripciones activas"
            description="No tienes inscripciones activas."
            action={(
              <Link to="/activities" className="button button--primary">
                Explorar actividades
              </Link>
            )}
          />
        )}
      </section>

      <section className="my-volunteering__block" aria-labelledby="history-title">
        <div className="my-volunteering__block-header">
          <h2 id="history-title" className="my-volunteering__block-title">Historial</h2>
          <span className="my-volunteering__block-count" data-testid="history-count">
            {historyList.length}
          </span>
        </div>
        {hasHistory ? (
          <div>
            {historyList.map((item) => (
              <MyVolunteeringCard key={item.registrationId} item={item} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Sin historial"
            description="Aquí verás las inscripciones cerradas, rechazadas o canceladas."
          />
        )}
      </section>
    </section>
  );
}
