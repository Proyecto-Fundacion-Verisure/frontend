import { Spinner } from '../../../shared/ui';

export default function RegistrationsLoading() {
  return (
    <section
      className="registrations-page registrations-page--state"
      aria-label="Cargando inscripciones"
    >
      <Spinner label="Cargando inscripciones…" />
    </section>
  );
}
