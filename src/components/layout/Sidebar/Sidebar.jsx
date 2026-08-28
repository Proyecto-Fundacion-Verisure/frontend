import { NavLink } from "react-router-dom";

export default function Sidebar({ sections = [], counts = {} }) {
  return (
    <aside className="sidebar">
      <nav className="sidebar__nav">
        {sections.map(({ section, items }) => (
          <div key={section} className="sidebar__section">
            <span className="sidebar__section-title">{section}</span>
            {items.map(({ path, label, icon: Icon, badgeKey, variant }) => {
              const badge = badgeKey ? counts[badgeKey] : null;

              return (
                <NavLink
                  key={path}
                  to={path}
                  className={({ isActive }) =>
                    [
                      "sidebar__link",
                      variant === "cta" && "sidebar__link--cta",
                      isActive && "sidebar__link--active",
                    ]
                      .filter(Boolean)
                      .join(" ")
                  }
                >
                  {Icon && <Icon size={18} aria-hidden="true" />}
                  <span className="sidebar__label">{label}</span>
                  {badge > 0 && <span className="sidebar__badge">{badge}</span>}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
