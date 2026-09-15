import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getPublishedActivities } from '../../api/activitiesApi';
import { getMyRegistrations } from '../../api/registrationsApi';
import { useRegistrationsOptional } from '../registrations/RegistrationsContext';
import { useFavoritesOptional } from '../favorites/FavoritesContext';
import { Button, EmptyState, Input, Pagination, Select, Spinner } from '../../components/ui';
import ActivityCard from './ActivityCard';

const LIMIT = 12;

const LINE_OPTIONS = [
  { value: '', label: 'Todas las líneas' },
  { value: 'desoledad', label: 'Desoledad' },
  { value: 'educar', label: 'Educar para proteger' },
  { value: 'acoso', label: 'Protegidos ante el acoso' },
  { value: 'medio_ambiente', label: 'Medio ambiente' },
];

const MODE_OPTIONS = [
  { value: '', label: 'Todas las modalidades' },
  { value: 'PRESENCIAL', label: 'Presencial' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'MIXTO', label: 'Mixto' },
];

const ALLOWED_LINES = new Set(LINE_OPTIONS.map((o) => o.value).filter(Boolean));
const ALLOWED_MODES = new Set(MODE_OPTIONS.map((o) => o.value).filter(Boolean));
const normalizeDate = (value) => (
  /^\d{4}-\d{2}-\d{2}$/.test(value ?? '') && !Number.isNaN(new Date(`${value}T00:00:00`).getTime())
    ? value
    : ''
);

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favoriteError, setFavoriteError] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [localEnrolledIds, setLocalEnrolledIds] = useState(() => new Set());
  const registrationsCtx = useRegistrationsOptional();
  const favorites = useFavoritesOptional();
  const enrolledIds = registrationsCtx ? registrationsCtx.enrolledIds : localEnrolledIds;

  const rawPage = Number(searchParams.get('page'));
  const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;
  const rawLine = searchParams.get('line') || '';
  const line = ALLOWED_LINES.has(rawLine) ? rawLine : '';
  const rawMode = searchParams.get('mode') || '';
  const mode = ALLOWED_MODES.has(rawMode) ? rawMode : '';
  const from = normalizeDate(searchParams.get('from'));
  const to = normalizeDate(searchParams.get('to'));
  const updateParams = useCallback(
    (patch, { resetPage = true } = {}) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(patch).forEach(([key, value]) => {
          if (value) next.set(key, value);
          else next.delete(key);
        });
        if (resetPage && ['line', 'mode', 'from', 'to'].some((key) => key in patch)) {
          next.delete('page');
        }
        if (next.get('page') === '1') next.delete('page');
        return next;
      });
    },
    [setSearchParams],
  );

  const handlePageChange = useCallback(
    (newPage) => {
      updateParams({ page: String(newPage) }, { resetPage: false });
    },
    [updateParams],
  );

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: page - 1, size: LIMIT };
      if (line) params.line = line;
      if (mode) params.mode = mode;
      if (from) params.from = from;
      if (to) params.to = to;
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
  }, [page, line, mode, from, to]);

  useEffect(() => {
    if (registrationsCtx) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await getMyRegistrations();
        if (cancelled) return;
        const data = res.data?.content ?? res.data;
        const list = Array.isArray(data) ? data : [];
        const activeIds = list
          .filter((r) => r.status !== 'CANCELLED' && r.status !== 'CANCELADA')
          .map((r) => r.activityId ?? r.activity?.id)
          .filter(Boolean);
        setLocalEnrolledIds(new Set(activeIds));
      } catch {
        if (!cancelled) setLocalEnrolledIds(new Set());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [registrationsCtx]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const params = { page: page - 1, size: LIMIT };
        if (line) params.line = line;
        if (mode) params.mode = mode;
        if (from) params.from = from;
        if (to) params.to = to;
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
  }, [page, line, mode, from, to]);

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
        <Input
          type="date"
          label="Desde"
          value={from}
          onChange={(event) => updateParams({ from: event.target.value })}
        />
        <Input
          type="date"
          label="Hasta"
          value={to}
          min={from || undefined}
          onChange={(event) => updateParams({ to: event.target.value })}
        />
      </div>

      {favoriteError && <div className="catalog__error" role="alert">{favoriteError}</div>}

      {activities.length === 0 ? (
        <EmptyState title="No hay actividades" description="No se encontraron actividades con los filtros seleccionados." />
      ) : (
        <>
          <div className="catalog__grid">
            {activities.map((activity) => {
              const favoritedByMe = favorites?.getFavorite(
                activity.id,
                activity.favoritedByMe,
              ) ?? Boolean(activity.favoritedByMe);
              return (
                <ActivityCard
                  key={activity.id}
                  activity={{ ...activity, favoritedByMe }}
                  isEnrolled={enrolledIds.has(activity.id)}
                  linkTo={`/activities/${activity.id}`}
                  isFavoritePending={favorites?.isPending(activity.id) ?? false}
                  onToggleFavorite={favorites ? async () => {
                    setFavoriteError('');
                    try {
                      await favorites.toggleFavorite(activity.id, favoritedByMe);
                    } catch (requestError) {
                      setFavoriteError(
                        requestError?.message || 'No hemos podido actualizar tus favoritos.',
                      );
                    }
                  } : undefined}
                />
              );
            })}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            ariaLabel="Paginación de catálogo"
          />
        </>
      )}
    </section>
  );
}
