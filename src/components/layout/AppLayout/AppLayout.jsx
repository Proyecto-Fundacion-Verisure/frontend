import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import Topbar from '../Topbar/Topbar';
import { useAuth } from '../../../features/auth/AuthContext';
import { NAV_ITEMS_BY_ROLE } from '../Sidebar/sidebarNavigation';

export default function AppLayout() {
  const { user } = useAuth();
  const items = NAV_ITEMS_BY_ROLE[user?.role] ?? [];

  return (
    <div className="app-layout">
      <Topbar />
      <Sidebar items={items} />
      <main className="app-layout__content">
        <Outlet />
      </main>
    </div>
  );
}