import { useContext } from 'react';
import { NavTabs } from '../../shared/ui';
import { SidebarCountsContext } from '../../components/layout/Sidebar/useSidebarCounts';

export function ActivitiesTabs() {
  const counts = useContext(SidebarCountsContext);
  return (
    <NavTabs
      label="Secciones de actividades"
      items={[
        { to: '/admin/activities', label: 'Todas' },
        { to: '/admin/activities/pending-closure', label: 'Por cerrar', count: counts.closes },
      ]}
    />
  );
}
