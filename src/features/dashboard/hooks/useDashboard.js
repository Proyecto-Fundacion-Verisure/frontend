import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getDashboard } from '../api/dashboardApi';
import {
  buildDashboardFilters,
  parseDashboardFilters,
  toDashboardSearchParams,
} from '../model/dashboardFilters';

export default function useDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [requestState, setRequestState] = useState({ status: 'loading', data: null, error: null });
  const [retryKey, setRetryKey] = useState(0);

  const { year, line, hasInvalidYear, hasInvalidLine } = parseDashboardFilters(searchParams);
  const filters = useMemo(() => buildDashboardFilters({ year, line }), [year, line]);

  // Un parámetro inválido no se envía al backend: se quita de la URL con
  // `replace` para no ensuciar el historial y la consulta va sin ese filtro.
  useEffect(() => {
    if (!hasInvalidYear && !hasInvalidLine) return;

    const normalized = new URLSearchParams(searchParams);
    if (hasInvalidYear) normalized.delete('year');
    if (hasInvalidLine) normalized.delete('line');
    setSearchParams(normalized, { replace: true });
  }, [hasInvalidYear, hasInvalidLine, searchParams, setSearchParams]);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    setRequestState((current) => ({ ...current, status: 'loading', error: null }));
    getDashboard(filters, { signal: controller.signal })
      .then((response) => {
        if (isActive) setRequestState({ status: 'success', data: response.data, error: null });
      })
      .catch((error) => {
        if (isActive && !error?.isCanceled) {
          setRequestState({ status: 'error', data: null, error });
        }
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [filters, retryKey]);

  const applyFilters = (nextFilters) => {
    const next = toDashboardSearchParams(nextFilters);
    if (next.toString() !== searchParams.toString()) setSearchParams(next);
  };

  const clearFilters = () => {
    if (searchParams.toString()) setSearchParams(new URLSearchParams());
  };

  const retry = () => setRetryKey((current) => current + 1);

  return { year, line, filters, requestState, applyFilters, clearFilters, retry };
}
