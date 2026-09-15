import { useEffect, useState } from 'react';
import { useAuth } from '../../../features/auth/AuthContext';
import { getPendingOrganizations } from '../../../api/orgApi';
import { getRegistrationCounts } from '../../../api/registrationsApi';
import { DEMO_ACTIVITY_ID } from '../../../constants/demoActivity';

// Cifras que todavía no puede dar nadie: propuestas y cierres no tienen backend.
// `inscriptions` salía de aquí con un 5 fijo que no correspondía a nada, y ahora
// viene de `/admin/registrations/counts`. El rol EMPLOYEE no pinta ningún globo,
// así que su entrada tampoco llegaba a verse.
const COUNTS_BY_ROLE = {
  ADMIN: { proposals: 3, closes: 2 },
  PARTNER: { proposals: 1, closes: 4 },
};

export function useSidebarCounts() {
  const { user } = useAuth();
  const [pendingAccounts, setPendingAccounts] = useState(0);
  const [unreviewed, setUnreviewed] = useState(0);

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

  const staticCounts = COUNTS_BY_ROLE[user?.role] ?? {};
  return { ...staticCounts, pendingAccounts, inscriptions: unreviewed };
}
