import { Route, Routes } from 'react-router-dom';
import LandingPage from '../features/landing/LandingPage';
import LoginPage from '../features/auth/LoginPage';
import DashboardPage from '../features/dashboard/DashboardPage';
import CatalogPage from '../features/activities/CatalogPage';
import UiShowcase from '../components/ui/UiShowcase/UiShowcase';
import PublicLayout from '../components/layout/PublicLayout/PublicLayout';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import ProposalForm from '../features/proposals/ProposalForm';
import OrgRegisterPage from '../features/orgs/OrgRegisterPage';
import OrgActivitiesPage from '../features/orgs/OrgActivitiesPage';
import AccountStatusPage from '../features/orgs/AccountStatusPage';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<PublicLayout><LandingPage /></PublicLayout>} />
      <Route path="/login" element={<PublicLayout><LoginPage /></PublicLayout>} />
      <Route path="/proposal" element={<PublicLayout><ProposalForm /></PublicLayout>} />
      <Route path="/new-proposal" element={<PublicLayout><ProposalForm /></PublicLayout>} />
      <Route path="/register-organization" element={<PublicLayout><OrgRegisterPage /></PublicLayout>} />
      <Route path="/account-status" element={<PublicLayout><AccountStatusPage /></PublicLayout>} />
      {import.meta.env.DEV && <Route path="/ui-kit" element={<UiShowcase />} />}
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute roles={['ADMIN']} />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
        <Route element={<RoleRoute roles={['EMPLOYEE']} />}>
          <Route path="/activities" element={<CatalogPage />} />
        </Route>
        <Route element={<RoleRoute roles={['ORG']} />}>
          <Route path="/org/activities" element={<OrgActivitiesPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
