import { useCallback, useEffect, useRef, useState } from 'react';
import {
  acceptRegistration as acceptRegistrationRequest,
  cancelRegistration as cancelRegistrationRequest,
  getActivityRegistrations,
  rejectRegistration as rejectRegistrationRequest,
} from '../../api/registrationsApi';

export default function useRegistrations(activityId) {
  const pendingDecisions = useRef(new Set());
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [decision, setDecision] = useState(null);

  const load = useCallback(async ({ background = false } = {}) => {
    if (background) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const { data } = await getActivityRegistrations(activityId);
      setBoard(data);
      return data;
    } catch (requestError) {
      setError(requestError);
      throw requestError;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activityId]);

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
