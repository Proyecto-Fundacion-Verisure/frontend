import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { requiresAccountStatus } from './routeAccess';

export default function ProtectedRoute() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requiresAccountStatus(user)) {
    return <Navigate to="/account-status" replace />;
  }

  return <Outlet />;
}
