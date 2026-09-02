import { LogOut } from 'lucide-react';
import { useAuth } from '../../../features/auth/AuthContext';

const ROLE_LABELS = {
  ADMIN: 'Administrador',
  EMPLOYEE: 'Empleado',
  ORG: 'Organización',
};

function getInitials(name) {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export default function Topbar({ children }) {
  const { user, logout } = useAuth();

  const displayName =
    user?.role === 'ORG' || user?.role === 'ORGANIZATION'
      ? (user?.organization ?? user?.name ?? user?.email ?? '')
      : (user?.name ?? user?.email ?? '');
  const roleLabel = ROLE_LABELS[user?.role] ?? user?.role;
  const initials = getInitials(displayName);

  return (
    <header className="topbar">
      <div className="topbar__content">{children}</div>
      {user && (
        <div className="topbar__user-menu" aria-label="Menú de usuario">
          <div className="topbar__user-avatar" aria-hidden="true">
            {initials}
          </div>
          <div className="topbar__user-info">
            <span className="topbar__user-name">{displayName}</span>
            <span className="topbar__user-role">{roleLabel}</span>
          </div>
          <button
            className="topbar__logout"
            type="button"
            aria-label="Cerrar sesión"
            onClick={() => logout?.()}
          >
            <LogOut aria-hidden="true" size={20} strokeWidth={2} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      )}
    </header>
  );
}