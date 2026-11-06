import { createContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../../features/auth';
import { getPendingOrganizations } from '../../../api/orgApi';
import { getRegistrationCounts } from '../../../api/registrationsApi';
import { getPendingActivities } from '../../../api/activitiesApi';
import { getProposals } from '../../../api/proposalsApi';
import { getPendingActivityClosures } from '../../../api/closuresApi';

// Todas las cifras vienen de sus endpoints; si uno falla, el globo se queda en
// 0 y el menú se pinta igual: una cifra de adorno no puede tumbar la
// navegación. Solo el rol ADMIN pinta globos.

// `totalElements` de la primera página con `size: 1`: el recuento sin traer filas.
const countOf = (request) => request
  .then((res) => Number(res.data?.totalElements ?? res.data?.length ?? 0) || 0);

// Las mismas cifras para lo que no es el menú: pestañas y «Requiere tu atención».
// Un contexto propio y no el del `Outlet`: `RoleRoute` pinta otro por medio y lo corta.
export const SidebarCountsContext = createContext({});

export function useSidebarCounts() {
  const { user } = useAuth();
  // Se recarga al navegar: tras aprobar algo y volver, las cifras deben estar al día.
  const { pathname } = useLocation();
  const [pendingAccounts, setPendingAccounts] = useState(0);
  const [unreviewed, setUnreviewed] = useState(0);
  const [newProposals, setNewProposals] = useState(0);
  const [pendingReview, setPendingReview] = useState(0);
  const [closes, setCloses] = useState(0);

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    let cancelled = false;
    countOf(getPendingOrganizations({ page: 0, size: 1 }))
      .then((count) => { if (!cancelled) setPendingAccounts(count); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user?.role, pathname]);

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    let cancelled = false;
    // Las sin revisar de todas las actividades, que es lo que enseña el tablero
    // global al que lleva el enlace del menú. Si falla, el globo se queda en 0 y
    // el menú se pinta igual: una cifra de adorno no puede tumbar la navegación.
    getRegistrationCounts()
      .then((res) => {
        if (!cancelled) setUnreviewed(res.data.unreviewed ?? 0);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user?.role, pathname]);

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    let cancelled = false;
    countOf(getProposals({ status: 'NEW', page: 0, size: 1 }))
      .then((count) => { if (!cancelled) setNewProposals(count); })
      .catch(() => {});
    countOf(getPendingActivities({ page: 0, size: 1 }))
      .then((count) => { if (!cancelled) setPendingReview(count); })
      .catch(() => {});
    countOf(getPendingActivityClosures({ page: 0, size: 1 }))
      .then((count) => { if (!cancelled) setCloses(count); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user?.role, pathname]);

  return {
    pendingAccounts,
    inscriptions: unreviewed,
    proposals: newProposals,
    requests: pendingReview + newProposals,
    pendingReview,
    closes,
  };
}
