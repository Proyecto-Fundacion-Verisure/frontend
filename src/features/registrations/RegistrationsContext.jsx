import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getMyRegistrations } from '../../api/registrationsApi';

export const RegistrationsContext = createContext(null);

export function RegistrationsProvider({ children }) {
  const [registrations, setRegistrations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyRegistrations();
      const payload = res.data ?? res;
      let list = [];
      if (Array.isArray(payload)) {
        list = payload;
      } else if (payload && Array.isArray(payload.content)) {
        list = payload.content;
      } else if (payload && (Array.isArray(payload.active) || Array.isArray(payload.closed))) {
        list = [...(payload.active ?? []), ...(payload.closed ?? [])];
      } else if (payload && (Array.isArray(payload.activeRegistrations) || Array.isArray(payload.closedRegistrations))) {
        list = [...(payload.activeRegistrations ?? []), ...(payload.closedRegistrations ?? [])];
      } else if (payload && payload.data && (Array.isArray(payload.data.active) || Array.isArray(payload.data.closed))) {
        list = [...(payload.data.active ?? []), ...(payload.data.closed ?? [])];
      } else {
        const data = payload?.content ?? payload;
        list = Array.isArray(data) ? data : [];
      }
      setRegistrations(list);
    } catch (err) {
      setError(err);
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addRegistration = useCallback((registrationResponse) => {
    // Apply exactly the RegistrationResponse received with 201 — do not build ID or queue position locally
    if (!registrationResponse) return;
    setRegistrations((prev) => {
      const list = Array.isArray(prev) ? [...prev] : [];
      // Avoid duplicate by registrationId or activityId if already present
      const exists = list.some(
        (r) =>
          (r.registrationId && registrationResponse.registrationId && String(r.registrationId) === String(registrationResponse.registrationId)) ||
          (r.id && registrationResponse.registrationId && String(r.id) === String(registrationResponse.registrationId))
      );
      if (exists) return prev;
      return [...list, registrationResponse];
    });
  }, []);

  const enrolledIds = useMemo(() => {
    if (!Array.isArray(registrations)) return new Set();
    const ids = registrations
      .filter((r) => r.status !== 'CANCELLED' && r.status !== 'CANCELADA')
      .map((r) => r.activityId ?? r.activity?.id)
      .filter(Boolean);
    return new Set(ids);
  }, [registrations]);

  const getForActivity = useCallback(
    (activityId) => {
      if (!Array.isArray(registrations)) return null;
      const found = registrations.find((r) => {
        const rid = r.activityId ?? r.activity?.id;
        return String(rid) === String(activityId);
      });
      if (found && found.status !== 'CANCELLED' && found.status !== 'CANCELADA') return found;
      return null;
    },
    [registrations]
  );

  const value = useMemo(
    () => ({
      registrations,
      loading,
      error,
      enrolledIds,
      getForActivity,
      addRegistration,
      refresh,
    }),
    [registrations, loading, error, enrolledIds, getForActivity, addRegistration, refresh]
  );

  return <RegistrationsContext.Provider value={value}>{children}</RegistrationsContext.Provider>;
}

export function useRegistrations() {
  const ctx = useContext(RegistrationsContext);
  if (!ctx) throw new Error('useRegistrations must be used within RegistrationsProvider');
  return ctx;
}

export function useRegistrationsOptional() {
  return useContext(RegistrationsContext);
}
