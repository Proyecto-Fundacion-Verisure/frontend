import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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

const ALLOWED_LINES = new Set(LINE_OPTIONS.map((o) => o.value).filter(Boolean));
const ALLOWED_MODES = new Set(MODE_OPTIONS.map((o) => o.value).filter(Boolean));

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  const rawPage = Number(searchParams.get('page'));
  const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;
  const rawLine = searchParams.get('line') || '';
  const line = ALLOWED_LINES.has(rawLine) ? rawLine : '';
  const rawMode = searchParams.get('mode') || '';
  const mode = ALLOWED_MODES.has(rawMode) ? rawMode : '';
  const q = (searchParams.get('q') || '').trim();

  const updateParams = useCallback(
    (patch, { resetPage = true } = {}) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(patch).forEach(([key, value]) => {
          if (value) next.set(key, value);
          else next.delete(key);
        });
        if (resetPage && ('line' in patch || 'mode' in patch || 'q' in patch)) {
          next.delete('page');
        }
        if (next.get('page') === '1') next.delete('page');
        return next;
      });
    },
    [setSearchParams],
  );

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
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const params = { page, limit: LIMIT };
        if (line) params.line = line;
        if (mode) params.mode = mode;
        if (q) params.q = q;
        const response = await getPublishedActivities(params);
        if (cancelled) return;
        const data = response.data?.content ?? response.data;
        setActivities(Array.isArray(data) ? data : []);
        const total =
          response.headers?.['x-total-count'] ??
          response.data?.totalElements ??
          (Array.isArray(data) ? data.length : 0);
        setTotalCount(Number(total) || 0);
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, line, mode, q]);

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
        <Select label="Línea" value={line} onChange={(e) => updateParams({ line: e.target.value })}>
          {LINE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
        <Select label="Modalidad" value={mode} onChange={(e) => updateParams({ mode: e.target.value })}>
          {MODE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
        <Input label="Buscar" placeholder="Título, organización…" value={q} onChange={(e) => updateParams({ q: e.target.value })} />
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
              <Button
                size="small"
                disabled={page <= 1}
                onClick={() => updateParams({ page: String(page - 1) }, { resetPage: false })}
              >
                ← Anterior
              </Button>
              <Button
                size="small"
                disabled={page >= totalPages}
                onClick={() => updateParams({ page: String(page + 1) }, { resetPage: false })}
              >
                Siguiente →
              </Button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
