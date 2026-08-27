import { LogOut } from 'lucide-react';
import { useAuth } from '../../../features/auth/AuthContext';

export default function Topbar({ children }) {
  const { user, logout } = useAuth();

  return (
    <header className="topbar">
      <div className="topbar__content">{children}</div>
      {user && (
        <div className="topbar__user-menu" aria-label="Menú de usuario">
          <span className="topbar__user-name">{user.name ?? user.email}</span>
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
