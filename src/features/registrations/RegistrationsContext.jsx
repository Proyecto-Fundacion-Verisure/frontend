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
      setRegistrations(Array.isArray(payload) ? payload : []);
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
    // Ojo con los dos nombres: la lista viene de `/registrations/me`, cuyas filas
    // son MyRegistrationItem y llevan `registrationId`; lo que llega aquí es el
    // RegistrationResponse del 201, que llama `id` a lo mismo. El deduplicado
    // anterior solo miraba `registrationId` en el recién llegado, así que con
    // datos reales no descartaba nunca.
    const newId = registrationResponse.registrationId ?? registrationResponse.id;
    if (newId === undefined || newId === null) return;
    setRegistrations((prev) => {
      const list = Array.isArray(prev) ? [...prev] : [];
      const exists = list.some((r) => String(r.registrationId ?? r.id) === String(newId));
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
