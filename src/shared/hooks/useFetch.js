import { useEffect, useState } from 'react';

export default function useFetch(request) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => { request().then(({ data: response }) => setData(response)).catch(setError).finally(() => setLoading(false)); }, [request]);
  return { data, loading, error };
}
