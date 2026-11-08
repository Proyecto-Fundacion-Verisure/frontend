import { Spinner } from '../../../shared/ui';

export default function MyVolunteeringLoading() {
  return (
    <section className="my-volunteering" aria-label="Cargando inscripciones">
      <Spinner label="Cargando inscripciones…" />
    </section>
  );
}
