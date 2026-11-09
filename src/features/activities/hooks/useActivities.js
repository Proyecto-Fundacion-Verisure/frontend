import { useCallback, useEffect, useState } from 'react';
import { getPublishedActivities } from '../api/activitiesApi';

export default function useActivities(params) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  // `params` es un objeto nuevo en cada render: la dependencia real es su
  // contenido serializado.
  const paramsKey = JSON.stringify(params);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getPublishedActivities(params);
      const data = response.data?.content ?? response.data;
      setActivities(Array.isArray(data) ? data : []);
      const total =
        response.headers?.['x-total-count'] ?? response.data?.totalElements ?? data.length;
      setTotalCount(Number(total) || 0);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ver `paramsKey`.
  }, [paramsKey]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return { activities, loading, error, totalCount, refetch: fetchActivities };
}
