import { useEffect, useState } from 'react';
import { useAuth } from '../../../features/auth/AuthContext';
import { getPendingOrganizations } from '../../../api/orgApi';

const COUNTS_BY_ROLE = {
  ADMIN: { proposals: 3, inscriptions: 5, closes: 2 },
  ORG: { proposals: 1, closes: 4 },
  EMPLOYEE: { inscriptions: 2 },
};

export function useSidebarCounts() {
  const { user } = useAuth();
  const [pendingAccounts, setPendingAccounts] = useState(0);

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

  const staticCounts = COUNTS_BY_ROLE[user?.role] ?? {};
  return { ...staticCounts, pendingAccounts };
}