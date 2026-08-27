import { NavLink } from 'react-router-dom';

export default function Sidebar({ items = [] }) {
  return (
    <aside className="sidebar">
      <nav className="sidebar__nav">
        {items.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
            }
          >
            {Icon && <Icon size={18} aria-hidden="true" />}
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
