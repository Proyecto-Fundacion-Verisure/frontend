import { useCallback, useEffect, useState } from 'react';
import { cancelRegistration, getMyRegistrations } from '../api/registrationsApi';
import { splitRegistrations } from '../model/myVolunteering';

function readItems(response) {
  const payload = response?.data ?? response;
  return Array.isArray(payload) ? payload : [];
}

export default function useMyVolunteering() {
  const [active, setActive] = useState(null);
  const [history, setHistory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelError, setCancelError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getMyRegistrations();
      const { active: activeItems, history: historyItems } = splitRegistrations(
        readItems(response),
      );
      setActive(activeItems);
      setHistory(historyItems);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCancel = useCallback(
    async (registrationId) => {
      setCancelError(null);
      setCancellingId(registrationId);
      try {
        await cancelRegistration(registrationId);
        await fetchData();
      } catch (requestError) {
        // DEADLINE_PASSED (400) significa que el backend ya no deja cancelar: la
        // actividad empezó. Recargamos para que la fila deje de ofrecer el botón,
        // que es lo que la pantalla estaba enseñando de más.
        if (requestError?.code === 'DEADLINE_PASSED') {
          try {
            await fetchData();
          } catch {
            // La recarga es best-effort: el aviso de error ya se muestra igualmente.
          }
        }
        setCancelError(requestError.message || 'No se pudo cancelar la inscripción.');
      } finally {
        setCancellingId(null);
      }
    },
    [fetchData],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    activeList: Array.isArray(active) ? active : [],
    historyList: Array.isArray(history) ? history : [],
    isLoading,
    error,
    hasError: Boolean(error) && !isLoading,
    cancelError,
    cancellingId,
    retry: fetchData,
    cancel: handleCancel,
  };
}
