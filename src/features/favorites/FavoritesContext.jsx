import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { favoriteActivity, unfavoriteActivity } from '../../api/favoritesApi';

export const FavoritesContext = createContext(null);

const isAlreadyInDesiredState = (err, wanted) => (
  wanted ? err?.status === 409 : err?.status === 404
);

export function FavoritesProvider({ children }) {
  const [overrides, setOverrides] = useState({});

  // Quién tiene una petición en vuelo. Tiene que ser **estado**, no una `ref`:
  // el corazón se pinta desde el contexto, y tocar una `ref` no vuelve a
  // renderizar a quien lo consume. Con `ref` el spinner se quedaba encendido
  // para siempre al terminar bien —y `HeartButton` se deshabilita mientras
  // carga, así que el corazón quedaba muerto.
  //
  // La `ref` sigue aquí, en paralelo, solo para el cierre de reentrada: `useState`
  // no se aplica hasta el siguiente render, y dos clics seguidos entrarían los dos.
  const [pendingIds, setPendingIds] = useState(() => new Set());
  const pendingRef = useRef(pendingIds);

  const setPending = useCallback((key, isBusy) => {
    const next = new Set(pendingRef.current);
    if (isBusy) next.add(key);
    else next.delete(key);
    pendingRef.current = next;
    setPendingIds(next);
  }, []);

  const getFavorite = useCallback(
    (activityId, fallback) => {
      const key = String(activityId);
      if (key in overrides) return overrides[key];
      return Boolean(fallback);
    },
    [overrides]
  );

  const isPending = useCallback(
    (activityId) => pendingIds.has(String(activityId)),
    [pendingIds]
  );

  const toggleFavorite = useCallback(
    async (activityId, currentFavorited) => {
      const key = String(activityId);
      if (pendingRef.current.has(key)) return;
      const nextValue = !currentFavorited;
      setOverrides((prev) => ({ ...prev, [key]: nextValue }));
      setPending(key, true);
      try {
        if (nextValue) {
          await favoriteActivity(activityId);
        } else {
          await unfavoriteActivity(activityId);
        }
      } catch (err) {
        // El backend y el corazón ya coinciden: marcar algo que ya era favorito
        // devuelve 409 ALREADY_FAVORITED, y desmarcar algo que ya no lo era, 404.
        // En los dos casos el corazón está donde el usuario quería, así que
        // revertirlo sería devolverle un estado que no es el del servidor.
        if (isAlreadyInDesiredState(err, nextValue)) return;
        setOverrides((prev) => ({ ...prev, [key]: currentFavorited }));
        throw err;
      } finally {
        setPending(key, false);
      }
    },
    [setPending]
  );

  const setFavorite = useCallback((activityId, value) => {
    setOverrides((prev) => ({ ...prev, [String(activityId)]: Boolean(value) }));
  }, []);

  const value = useMemo(
    () => ({
      getFavorite,
      isPending,
      toggleFavorite,
      setFavorite,
      overrides,
    }),
    [getFavorite, isPending, toggleFavorite, setFavorite, overrides]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}

export function useFavoritesOptional() {
  return useContext(FavoritesContext);
}
