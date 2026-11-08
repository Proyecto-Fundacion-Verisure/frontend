import { Spinner } from '../../shared/ui';

export default function RouteFallback() {
  return (
    <div className="app-layout__loading">
      <Spinner label="Cargando la página…" size="large" />
    </div>
  );
}
