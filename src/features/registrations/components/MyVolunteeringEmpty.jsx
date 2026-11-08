import { Link } from 'react-router-dom';
import { EmptyState, PageHeader } from '../../../shared/ui';

export default function MyVolunteeringEmpty() {
  return (
    <section className="my-volunteering" aria-labelledby="my-volunteering-title">
      <PageHeader title="Mis voluntariados" titleId="my-volunteering-title" />
      <EmptyState
        title="No tienes inscripciones"
        description="Aún no te has inscrito en ninguna actividad."
        action={
          <Link to="/activities" className="button button--primary">
            Explorar actividades
          </Link>
        }
      />
    </section>
  );
}
