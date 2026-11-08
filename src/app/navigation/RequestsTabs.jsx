import { useContext } from 'react';
import { NavTabs } from '../../shared/ui';
import { SidebarCountsContext } from './useSidebarCounts';

export default function RequestsTabs() {
  const counts = useContext(SidebarCountsContext);
  return (
    <NavTabs
      label="Secciones de solicitudes"
      items={[
        {
          to: '/admin/activities/pending',
          label: 'Actividades de entidades',
          count: counts.pendingReview,
        },
        { to: '/proposals', label: 'Formulario público', count: counts.proposals },
      ]}
    />
  );
}
