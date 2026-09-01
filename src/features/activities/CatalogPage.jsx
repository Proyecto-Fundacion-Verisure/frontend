import { useCallback, useEffect, useState } from 'react';
import { getPublishedActivities } from '../../api/activitiesApi';
import { Button, EmptyState, Input, Select, Spinner } from '../../components/ui';
import ActivityCard from './ActivityCard';

const LIMIT = 12;

const LINE_OPTIONS = [
  { value: '', label: 'Todas las líneas' },
  { value: 'desoledad', label: 'Desoledad' },
  { value: 'educar', label: 'Educar para proteger' },
  { value: 'acoso', label: 'Protegidos ante el acoso' },
  { value: 'voluntariado', label: 'Voluntariado' },
];

const MODE_OPTIONS = [
  { value: '', label: 'Todas las modalidades' },
  { value: 'PRESENCIAL', label: 'Presencial' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'MIXTO', label: 'Mixto' },
];

export default function CatalogPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [line, setLine] = useState('');
  const [mode, setMode] = useState('');
  const [q, setQ] = useState('');

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: LIMIT };
      if (line) params.line = line;
      if (mode) params.mode = mode;
      if (q) params.q = q;
      const response = await getPublishedActivities(params);
      const data = response.data?.content ?? response.data;
      setActivities(Array.isArray(data) ? data : []);
      const total =
        response.headers?.['x-total-count'] ??
        response.data?.totalElements ??
        (Array.isArray(data) ? data.length : 0);
      setTotalCount(Number(total) || 0);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [page, line, mode, q]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  useEffect(() => {
    setPage(1);
  }, [line, mode, q]);

  const totalPages = Math.max(1, Math.ceil(totalCount / LIMIT));

  if (loading) {
    return (
      <section className="catalog" aria-label="Cargando catálogo">
        <Spinner label="Cargando actividades…" />
      </section>
    );
  }

  if (error?.status === 403) {
    return (
      <section className="catalog">
        <div className="catalog__error" role="alert">
          No tienes permiso para ver el catálogo.
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="catalog">
        <div className="catalog__error" role="alert">
          {error.message || 'Ha ocurrido un error al cargar el catálogo.'}
        </div>
        <Button onClick={fetchActivities}>Reintentar</Button>
      </section>
    );
  }

  return (
    <section className="catalog" aria-labelledby="catalog-title">
      <div className="catalog__header">
        <h1 id="catalog-title" className="catalog__title">
          Catálogo de actividades
        </h1>
      </div>

      <div className="catalog__filters">
        <Select label="Línea" value={line} onChange={(e) => setLine(e.target.value)}>
          {LINE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
        <Select label="Modalidad" value={mode} onChange={(e) => setMode(e.target.value)}>
          {MODE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
        <Input label="Buscar" placeholder="Título, organización…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {activities.length === 0 ? (
        <EmptyState title="No hay actividades" description="No se encontraron actividades con los filtros seleccionados." />
      ) : (
        <>
          <div className="catalog__grid">
            {activities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>

          <div className="catalog__pagination">
            <span className="catalog__pagination-info">
              Página {page} de {totalPages}
            </span>
            <div>
              <Button size="small" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                ← Anterior
              </Button>
              <Button size="small" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Siguiente →
              </Button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
