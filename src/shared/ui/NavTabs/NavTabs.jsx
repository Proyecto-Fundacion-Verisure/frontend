import { Link, matchPath, useLocation } from 'react-router-dom';

// Pestañas que son rutas: se pueden enlazar y el botón Atrás funciona. Para las
// que solo cambian lo que se ve dentro de la misma página está `Tabs`.
export default function NavTabs({ items = [], label }) {
  const { pathname } = useLocation();

  return (
    <nav className="tabs__list" aria-label={label}>
      {items.map(({ to, label: itemLabel, count }) => {
        const isActive = Boolean(matchPath({ path: to, end: true }, pathname));
        return (
          <Link
            key={to}
            to={to}
            className={`tabs__tab${isActive ? ' tabs__tab--active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            {itemLabel}
            {count !== undefined && <span className="tabs__count">{count}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
