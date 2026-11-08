import { Spinner } from '../../../shared/ui';

export default function ActivityFormLoading() {
  return (
    <section
      className="activity-form-page activity-form-page--state"
      aria-label="Cargando actividad"
    >
      <Spinner label="Cargando actividad…" />
    </section>
  );
}
