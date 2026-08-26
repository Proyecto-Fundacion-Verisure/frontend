import { Route, Routes } from 'react-router-dom';
import LandingPage from '../features/landing/LandingPage';
import LoginPage from '../features/auth/LoginPage';
import DashboardPage from '../features/dashboard/DashboardPage';
import CatalogPage from '../features/activities/CatalogPage';
import UiShowcase from '../components/ui/UiShowcase/UiShowcase';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      {import.meta.env.DEV && <Route path="/ui-kit" element={<UiShowcase />} />}
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute roles={['ADMIN']} />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
        <Route element={<RoleRoute roles={['EMPLOYEE']} />}>
          <Route path="/activities" element={<CatalogPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
