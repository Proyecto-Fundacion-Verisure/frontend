import { Suspense } from "react";
import { Link, Outlet } from "react-router-dom";
import Sidebar from "../Sidebar/Sidebar";
import Topbar from "../Topbar/Topbar";
import Logo from "../../../shared/assets/images/logo-fundacion-verisure.png"
import { getRoleHomePath, useAuth } from "../../../features/auth";
import { NAV_SECTIONS_BY_ROLE } from "../Sidebar/sidebarNavigation";
import { SidebarCountsContext, useSidebarCounts } from "../../navigation/useSidebarCounts";
import RouteFallback from "../../routing/RouteFallback";

export default function AppLayout() {
  const { user } = useAuth();
  const sections = NAV_SECTIONS_BY_ROLE[user?.role] ?? [];
  const counts = useSidebarCounts();

  return (
    <div className="app-layout">
      <a href="#main" className="skip-link">
        Saltar al contenido
      </a>
      <Topbar>
        {/* Dentro del backoffice el logo lleva al inicio del rol, no a la landing. */}
        <Link to={getRoleHomePath(user?.role)} className="topbar__brand">
          <img src={Logo} alt="Fundación Verisure" />
        </Link>
      </Topbar>
      <Sidebar sections={sections} counts={counts} />
      <main id="main" tabIndex={-1} className="app-layout__content">
        <SidebarCountsContext.Provider value={counts}>
          {/* Cada feature se carga en su propio trozo. El `Suspense` vive aquí
              dentro, no en el router: así el menú y la barra superior siguen
              montados mientras llega la página y no parpadea el shell. */}
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </SidebarCountsContext.Provider>
      </main>
    </div>
  );
}
