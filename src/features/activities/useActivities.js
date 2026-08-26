import { useEffect, useState } from 'react';
import { getPublishedActivities } from '../../api/activitiesApi';

export default function useActivities(params) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => { getPublishedActivities(params).then(({ data }) => setActivities(data)).catch(setError).finally(() => setLoading(false)); }, []);
  return { activities, loading, error };
}
