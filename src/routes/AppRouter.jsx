import { Outlet, Route, Routes } from 'react-router-dom';
import LandingPage from '../features/landing/LandingPage';
import LoginPage from '../features/auth/LoginPage';
import DashboardPage from '../features/dashboard/DashboardPage';
import CatalogPage from '../features/activities/CatalogPage';
import ActivitiesListPage from '../features/activities/ActivitiesListPage';
import UiShowcase from '../components/ui/UiShowcase/UiShowcase';
import PublicLayout from '../components/layout/PublicLayout/PublicLayout';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import ProposalForm from '../features/proposals/ProposalForm';
import OrgRegisterPage from '../features/orgs/OrgRegisterPage';
import OrgActivitiesPage from '../features/orgs/OrgActivitiesPage';
import ActivityFormPage from '../features/activities/ActivityFormPage';
import OrgImpactPage from '../features/orgs/OrgImpactPage';
import OrgProposalsPage from '../features/orgs/OrgProposalsPage';
import ProposalsInboxPage from '../features/proposals/ProposalsInboxPage';
import ProposalDetailPage from '../features/proposals/ProposalDetailPage';
import AccountStatusPage from '../features/orgs/AccountStatusPage';
import ActivityDetailPage from '../features/activities/ActivityDetailPage';
import NotFoundPage from '../features/not-found/NotFoundPage';
import AppLayout from '../components/layout/AppLayout/AppLayout';
import { RegistrationsProvider } from '../features/registrations/RegistrationsContext';
import CertificatePage from '../features/reports/CertificatePage';

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
        <Route element={<AppLayout />}>
          <Route element={<RoleRoute roles={['ADMIN']} />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/proposals" element={<ProposalsInboxPage />} />
            <Route path="/proposals/:proposalId" element={<ProposalDetailPage />} />
            <Route path="/activities/new" element={<ActivityFormPage />} />
            <Route path="/activities/:activityId/edit" element={<ActivityFormPage backPath="/admin/activities" />} />
            <Route path="/admin/activities" element={<ActivitiesListPage />} />
          </Route>
          <Route element={<RoleRoute roles={['EMPLOYEE']} />}>
            <Route path="/reports/:reportId/certificate" element={<CertificatePage />} />
            <Route
              element={
                <RegistrationsProvider>
                  <Outlet />
                </RegistrationsProvider>
              }
            >
              <Route path="/activities" element={<CatalogPage />} />
              <Route path="/activities/:activityId" element={<ActivityDetailPage />} />
            </Route>
          </Route>
          <Route element={<RoleRoute roles={['ORG']} />}>
            <Route path="/org/activities" element={<OrgActivitiesPage />} />
            <Route path="/org/activities/new" element={<ActivityFormPage backPath="/org/activities" />} />
            <Route path="/org/reports" element={<OrgImpactPage />} />
            <Route path="/org/proposals" element={<OrgProposalsPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<PublicLayout><NotFoundPage /></PublicLayout>} />
    </Routes>
  );
}
