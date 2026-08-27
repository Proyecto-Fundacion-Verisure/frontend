import { Route, Routes } from 'react-router-dom';
import LandingPage from '../features/landing/LandingPage';
import LoginPage from '../features/auth/LoginPage';
import DashboardPage from '../features/dashboard/DashboardPage';
import CatalogPage from '../features/activities/CatalogPage';
import UiShowcase from '../components/ui/UiShowcase/UiShowcase';
import PublicLayout from '../components/layout/PublicLayout/PublicLayout';
import ProtectedRoute from './ProtectedRoute';
import ProposalForm from '../features/proposals/ProposalForm';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<PublicLayout><LandingPage /></PublicLayout>} />
      <Route path="/login" element={<PublicLayout><LoginPage /></PublicLayout>} />
      <Route path="/propuesta" element={<PublicLayout><ProposalForm /></PublicLayout>} />
      <Route path="/new-proposal" element={<PublicLayout><ProposalForm /></PublicLayout>} />
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
