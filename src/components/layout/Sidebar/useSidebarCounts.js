import { useEffect, useState } from 'react';
import { useAuth } from '../../../features/auth/AuthContext';
import { getPendingOrganizations } from '../../../api/orgApi';

export function useSidebarCounts() {
  const { user } = useAuth();
  const [pendingAccounts, setPendingAccounts] = useState(0);

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    let cancelled = false;
    getPendingOrganizations()
      .then((res) => {
        if (!cancelled) {
          const content = res.data?.content ?? res.data;
          const count = res.data?.totalElements
            ?? (Array.isArray(content) ? content.length : 0);
          setPendingAccounts(Number(count) || 0);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user?.role]);

  return { pendingAccounts };
}
