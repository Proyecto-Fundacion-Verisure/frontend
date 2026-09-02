import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { favoriteActivity, unfavoriteActivity } from '../../api/activitiesApi';

export const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const [overrides, setOverrides] = useState({}); // { [activityId]: boolean }
  const pendingRef = useRef(new Set());
  const [, forceUpdate] = useState(0);

  const getFavorite = useCallback(
    (activityId, fallback) => {
      const key = String(activityId);
      if (key in overrides) return overrides[key];
      return Boolean(fallback);
    },
    [overrides]
  );

  const isPending = useCallback((activityId) => pendingRef.current.has(String(activityId)), []);

  const toggleFavorite = useCallback(
    async (activityId, currentFavorited) => {
      const key = String(activityId);
      if (pendingRef.current.has(key)) return; // avoid duplicate requests
      const nextValue = !currentFavorited;
      // optimistic update: only favoritedByMe
      setOverrides((prev) => ({ ...prev, [key]: nextValue }));
      pendingRef.current.add(key);
      forceUpdate((x) => x + 1);
      try {
        if (nextValue) {
          await favoriteActivity(activityId);
        } else {
          await unfavoriteActivity(activityId);
        }
        // success: keep optimistic value; pending cleared below
      } catch (err) {
        // revert on 404/409 or any error
        setOverrides((prev) => ({ ...prev, [key]: currentFavorited }));
        throw err;
      } finally {
        pendingRef.current.delete(key);
        forceUpdate((x) => x + 1);
      }
    },
    []
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
