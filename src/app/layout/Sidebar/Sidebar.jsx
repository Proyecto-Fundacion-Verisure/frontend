import { Link, matchPath, useLocation } from 'react-router-dom';

// Solo un enlace activo: la coincidencia exacta gana y, si no la hay, el primero
// que declare la ruta en `matches`. El prefijo de `NavLink` no sirve aquí:
// `/admin/activities/pending` es otra entrada, no una página de «Actividades».
function getActivePath(sections, pathname) {
  const items = sections.flatMap(({ items: sectionItems }) => sectionItems);
  const isAt = (pattern) => Boolean(matchPath({ path: pattern, end: true }, pathname));

  return (
    (items.find(({ path }) => isAt(path)) ?? items.find(({ matches = [] }) => matches.some(isAt)))
      ?.path ?? null
  );
}

export default function Sidebar({ sections = [], counts = {} }) {
  const { pathname } = useLocation();
  const activePath = getActivePath(sections, pathname);

  return (
    <aside className="sidebar">
      <nav className="sidebar__nav">
        {sections.map(({ section, items }) => (
          <div key={section} className="sidebar__section">
            <span className="sidebar__section-title">{section}</span>
            {items.map(({ path, label, icon: Icon, badgeKey }) => {
              const badge = badgeKey ? counts[badgeKey] : null;
              const isActive = path === activePath;

              return (
                <Link
                  key={path}
                  to={path}
                  className={`sidebar__link${isActive ? ' sidebar__link--active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {Icon && <Icon size={18} aria-hidden="true" />}
                  <span className="sidebar__label">{label}</span>
                  {badge > 0 && (
                    <span
                      className="sidebar__badge"
                      aria-label={`${badge} notificaciones pendientes para ${label}`}
                    >
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
