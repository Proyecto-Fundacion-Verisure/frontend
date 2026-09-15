import { useCallback, useEffect, useRef, useState } from 'react';
import {
  acceptRegistration as acceptRegistrationRequest,
  cancelRegistration as cancelRegistrationRequest,
  getActivityRegistrations,
  getRegistrationCounts,
  rejectRegistration as rejectRegistrationRequest,
} from '../../api/registrationsApi';

export default function useRegistrations(activityId, page = 0) {
  const pendingDecisions = useRef(new Set());
  const [board, setBoard] = useState(null);
  const [counts, setCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [decision, setDecision] = useState(null);

  const load = useCallback(async ({ background = false } = {}) => {
    if (background) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      // Los contadores son de toda la actividad y el tablero es de una página, así
      // que van en peticiones distintas. Un fallo suyo no puede tumbar el tablero:
      // sin cifras la pantalla se lee igual, sin filas no.
      const countsRequest = activityId
        ? getRegistrationCounts(activityId).catch(() => null)
        : Promise.resolve(null);
      const [{ data }, countsResult] = await Promise.all([
        getActivityRegistrations(activityId, { page }),
        countsRequest,
      ]);
      setBoard(data);
      setCounts(countsResult?.data ?? null);
      return data;
    } catch (requestError) {
      setError(requestError);
      throw requestError;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activityId, page]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  const decide = useCallback(async (registrationId, type, request) => {
    const key = String(registrationId);
    if (pendingDecisions.current.has(key)) return null;

    pendingDecisions.current.add(key);
    setDecision({ registrationId, type, status: 'loading', error: null });
    try {
      const { data } = await request(registrationId);
      setDecision({ registrationId, type, status: 'success', data, error: null });
      await load({ background: true });
      return data;
    } catch (requestError) {
      setDecision({ registrationId, type, status: 'error', error: requestError });
      throw requestError;
    } finally {
      pendingDecisions.current.delete(key);
    }
  }, [load]);

  const acceptRegistration = useCallback(
    (registrationId) => decide(registrationId, 'accept', acceptRegistrationRequest),
    [decide],
  );

  const rejectRegistration = useCallback(
    (registrationId) => decide(registrationId, 'reject', rejectRegistrationRequest),
    [decide],
  );

  const cancelRegistration = useCallback(
    (registrationId, reason) => decide(
      registrationId,
      'cancel',
      (id) => cancelRegistrationRequest(id, reason),
    ),
    [decide],
  );

  return {
    board,
    counts,
    loading,
    refreshing,
    error,
    decision,
    reload: load,
    acceptRegistration,
    rejectRegistration,
    cancelRegistration,
  };
}
