import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { getRoleHomePath } from './routeAccess';

export default function RoleRoute({ roles = [] }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  // No hay que mirar el estado de la cuenta: el backend nunca emite token a una
  // entidad que no esté `ACTIVE`, así que tener sesión ya significa activa.

  return roles.includes(user.role)
    ? <Outlet />
    : <Navigate to={getRoleHomePath(user.role)} replace />;
}
