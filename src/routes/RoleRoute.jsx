import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { getRoleHomePath } from './routeAccess';

export default function RoleRoute({ roles = [] }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'PARTNER' && user.status !== 'ACTIVE') {
    return <Navigate to="/account-status" replace />;
  }

  return roles.includes(user.role)
    ? <Outlet />
    : <Navigate to={getRoleHomePath(user.role)} replace />;
}
