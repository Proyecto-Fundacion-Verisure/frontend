import { useEffect, useState } from 'react';
import { getActivities } from '../../api/activitiesApi';

export default function useActivities(params) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => { getActivities(params).then(({ data }) => setActivities(data)).catch(setError).finally(() => setLoading(false)); }, []);
  return { activities, loading, error };
}
