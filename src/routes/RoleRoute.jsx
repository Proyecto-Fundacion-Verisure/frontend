import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { getRoleHomePath } from './routeAccess';

export default function RoleRoute({ roles = [] }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  // El backend no devuelve `status` y nunca emite token a una cuenta que no esté
  // activa, así que su ausencia significa activa; solo bloqueamos si viene y no lo es.
  if (user.role === 'PARTNER' && user.status !== undefined && user.status !== 'ACTIVE') {
    return <Navigate to="/account-status" replace />;
  }

  return roles.includes(user.role)
    ? <Outlet />
    : <Navigate to={getRoleHomePath(user.role)} replace />;
}
