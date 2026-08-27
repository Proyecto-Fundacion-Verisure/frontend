import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { getRoleHomePath, requiresAccountStatus } from './routeAccess';

export default function RoleRoute({ roles = [] }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (requiresAccountStatus(user)) return <Navigate to="/account-status" replace />;

  return roles.includes(user.role)
    ? <Outlet />
    : <Navigate to={getRoleHomePath(user.role)} replace />;
}
