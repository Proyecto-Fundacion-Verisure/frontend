import { useEffect, useState } from 'react';
import { useAuth } from '../../../features/auth/AuthContext';
import { getPendingOrganizations } from '../../../api/orgApi';
import { getRegistrationCounts } from '../../../api/registrationsApi';
import { getPendingActivities } from '../../../api/activitiesApi';
import { getProposals } from '../../../api/proposalsApi';
import { getPendingActivityClosures } from '../../../api/closuresApi';
import { DEMO_ACTIVITY_ID } from '../../../constants/demoActivity';

// Todas las cifras vienen de sus endpoints; si uno falla, el globo se queda en
// 0 y el menú se pinta igual: una cifra de adorno no puede tumbar la
// navegación. Solo el rol ADMIN pinta globos.

// `totalElements` de la primera página con `size: 1`: el recuento sin traer filas.
const countOf = (request) => request
  .then((res) => Number(res.data?.totalElements ?? res.data?.length ?? 0) || 0);

export function useSidebarCounts() {
  const { user } = useAuth();
  const [pendingAccounts, setPendingAccounts] = useState(0);
  const [unreviewed, setUnreviewed] = useState(0);
  const [newProposals, setNewProposals] = useState(0);
  const [pendingReview, setPendingReview] = useState(0);
  const [closes, setCloses] = useState(0);

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    let cancelled = false;
    getPendingOrganizations()
      .then((res) => {
        if (!cancelled) setPendingAccounts(res.data.length);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user?.role]);

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    let cancelled = false;
    // Las sin revisar de la actividad a la que lleva el propio enlace del menú.
    // Si falla, el globo se queda en 0 y el menú se pinta igual: una cifra de
    // adorno no puede tumbar la navegación.
    getRegistrationCounts(DEMO_ACTIVITY_ID)
      .then((res) => {
        if (!cancelled) setUnreviewed(res.data.unreviewed ?? 0);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user?.role]);

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
  }, [user?.role]);

  return {
    pendingAccounts,
    inscriptions: unreviewed,
    proposals: newProposals,
    pendingReview,
    closes,
  };
}
