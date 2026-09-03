import { Link, Outlet } from "react-router-dom";
import Sidebar from "../Sidebar/Sidebar";
import Topbar from "../Topbar/Topbar";
import Logo from "../../../assets/images/logo-fundacion-verisure.png"
import { useAuth } from "../../../features/auth/AuthContext";
import { NAV_SECTIONS_BY_ROLE } from "../Sidebar/sidebarNavigation";
import { useSidebarCounts } from "../Sidebar/useSidebarCounts";

export default function AppLayout() {
  const { user } = useAuth();
  const sections = NAV_SECTIONS_BY_ROLE[user?.role] ?? [];
  const counts = useSidebarCounts();

  return (
    <div className="app-layout">
      <Topbar>
        <Link to="/" className="topbar__brand">
          <img src={Logo} alt="Fundación Verisure" />
        </Link>
      </Topbar>
      <Sidebar sections={sections} counts={counts} />
      <main className="app-layout__content">
        <Outlet />
      </main>
    </div>
  );
}
