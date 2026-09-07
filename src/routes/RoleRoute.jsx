import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { getRoleHomePath } from './routeAccess';

export default function RoleRoute({ roles = [] }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  const normalizedRole = user.role === 'PARTNER' ? 'ORG' : user.role;
  const normalizedRoles = roles.map((r) => (r === 'PARTNER' ? 'ORG' : r));
  if ((user.role === 'ORG' || user.role === 'PARTNER') && user.status !== 'ACTIVE') {
    return <Navigate to="/account-status" replace />;
  }

  return normalizedRoles.includes(normalizedRole)
    ? <Outlet />
    : <Navigate to={getRoleHomePath(user.role)} replace />;
}
