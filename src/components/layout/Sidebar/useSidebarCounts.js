import { useAuth } from '../../../features/auth/AuthContext';

const COUNTS_BY_ROLE = {
  // TEMPORAL
  // Cuando exista el endpoint real:
  // ej. useQuery(['sidebar-counts'], fetchSidebarCounts) manteniendo
  //  la misma forma de objeto que se devuelve aquí
  ADMIN: { proposals: 3, inscriptions: 5, closes: 2 },
  ORGANIZATION: { proposals: 1, closes: 4 },
  EMPLOYEE: { inscriptions: 2 },
  // FIN TEMPORAL
};

export function useSidebarCounts() {
  const { user } = useAuth();
  return COUNTS_BY_ROLE[user?.role] ?? {};
}