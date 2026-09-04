import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyRegistrations } from '../../api/registrationsApi';
import { Badge, Button, Card, EmptyState, Spinner } from '../../components/ui';

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
  } catch {
    return String(value);
  }
}

function RegistrationCard({ item }) {
  const activity = item.activity ?? {};
  const title = activity.title ?? `Actividad ${activity.id ?? ''}`;
  const partner = activity.partner ?? activity.organizationName ?? '';
  const startDate = activity.startDate ?? activity.start ?? '';
  const endDate = activity.endDate ?? activity.end ?? '';
  const hours = activity.hours ?? activity.estimatedHours ?? null;

  const showQueue = item.queuePosition !== null && item.queuePosition !== undefined;
  const hasReport = Boolean(item.reportId);
  const isReturned = item.reportStatus === 'RETURNED';

  return (
    <Card className="my-volunteering__card" data-testid={`registration-${item.registrationId}`}>
      <div className="my-volunteering__card-header">
        <h3 className="my-volunteering__card-title">{title}</h3>
        <Badge variant="neutral">{item.status}</Badge>
      </div>
      {partner && <p className="my-volunteering__meta">Entidad: {partner}</p>}
      <p className="my-volunteering__meta">
        {formatDate(startDate)} — {formatDate(endDate)} {hours ? `· ${hours} h` : ''}
      </p>
      {showQueue && <p className="my-volunteering__queue">Posición en cola: {item.queuePosition}</p>}
      {!hasReport && (
        <Link
          to={`/reports/new?registrationId=${item.registrationId}`}
          className="button button--primary button--small"
          data-testid={`action-enviar-${item.registrationId}`}
        >
          Enviar cierre
        </Link>
      )}
      {hasReport && isReturned && (
        <Link
          to={`/reports/${item.reportId}`}
          className="button button--primary button--small"
          data-testid={`action-corregir-${item.registrationId}`}
        >
          Corregir y reenviar
        </Link>
      )}
      {hasReport && !isReturned && (
        <Link
          to={`/reports/${item.reportId}`}
          className="button button--secondary button--small"
          data-testid={`action-ver-${item.registrationId}`}
        >
          Ver cierre
        </Link>
      )}
    </Card>
  );
}

export default function MyVolunteeringPage() {
  const [active, setActive] = useState(null);
  const [closed, setClosed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyRegistrations();
      const payload = res.data ?? res;
      // MyRegistrationsResponse: { active: MyRegistrationItem[], closed: MyRegistrationItem[] }
      // Support variants: active/closed, activeRegistrations/closedRegistrations, or flat array
      if (payload && Array.isArray(payload.active) && Array.isArray(payload.closed)) {
        setActive(payload.active);
        setClosed(payload.closed);
      } else if (payload && Array.isArray(payload.activeRegistrations) && Array.isArray(payload.closedRegistrations)) {
        setActive(payload.activeRegistrations);
        setClosed(payload.closedRegistrations);
      } else if (payload && payload.data && (Array.isArray(payload.data.active) || Array.isArray(payload.data.closed))) {
        setActive(payload.data.active ?? []);
        setClosed(payload.data.closed ?? []);
      } else if (Array.isArray(payload)) {
        // Fallback for legacy mock flat array: treat as active, closed empty (do not reclassify by status)
        setActive(payload);
        setClosed([]);
      } else if (Array.isArray(payload?.content)) {
        setActive(payload.content);
        setClosed([]);
      } else if (payload && typeof payload === 'object') {
        // Try to detect active/closed inside data property (axios response already unwrapped)
        const maybeActive = payload.active ?? payload.actives ?? null;
        const maybeClosed = payload.closed ?? payload.closedRegistrations ?? null;
        if (Array.isArray(maybeActive) || Array.isArray(maybeClosed)) {
          setActive(maybeActive ?? []);
          setClosed(maybeClosed ?? []);
        } else {
          setActive([]);
          setClosed([]);
        }
      } else {
        setActive([]);
        setClosed([]);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <section className="my-volunteering" aria-label="Cargando inscripciones">
        <Spinner label="Cargando inscripciones…" />
      </section>
    );
  }

  if (error?.status === 401) {
    return (
      <section className="my-volunteering">
        <div className="my-volunteering__error" role="alert">
          Tu sesión ha expirado. Vuelve a iniciar sesión.
        </div>
        <Link to="/login" className="button button--primary">
          Iniciar sesión
        </Link>
      </section>
    );
  }

  if (error) {
    return (
      <section className="my-volunteering">
        <div className="my-volunteering__error" role="alert">
          {error.message || 'No se han podido cargar tus inscripciones.'}
        </div>
        <Button onClick={fetchData}>Reintentar</Button>
      </section>
    );
  }

  const activeList = Array.isArray(active) ? active : [];
  const closedList = Array.isArray(closed) ? closed : [];
  const bothEmpty = activeList.length === 0 && closedList.length === 0;

  if (bothEmpty) {
    return (
      <section className="my-volunteering" aria-labelledby="my-volunteering-title">
        <h1 id="my-volunteering-title" className="my-volunteering__title">
          Mi voluntariado
        </h1>
        <EmptyState title="No tienes inscripciones" description="Aún no te has inscrito en ninguna actividad." />
      </section>
    );
  }

  return (
    <section className="my-volunteering" aria-labelledby="my-volunteering-title">
      <h1 id="my-volunteering-title" className="my-volunteering__title">
        Mi voluntariado
      </h1>

      <section className="my-volunteering__block" aria-labelledby="active-title">
        <h2 id="active-title" className="my-volunteering__block-title">
          Activas
        </h2>
        {activeList.length === 0 ? (
          <EmptyState title="Sin inscripciones activas" description="No tienes inscripciones activas." />
        ) : (
          <div className="my-volunteering__grid">
            {activeList.map((item) => (
              <RegistrationCard key={item.registrationId} item={item} />
            ))}
          </div>
        )}
      </section>

      <section className="my-volunteering__block" aria-labelledby="closed-title">
        <h2 id="closed-title" className="my-volunteering__block-title">
          Cerradas
        </h2>
        {closedList.length === 0 ? (
          <EmptyState title="Sin inscripciones cerradas" description="No tienes inscripciones cerradas." />
        ) : (
          <div className="my-volunteering__grid">
            {closedList.map((item) => (
              <RegistrationCard key={item.registrationId} item={item} />
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
