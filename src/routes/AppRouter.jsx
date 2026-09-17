import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import LandingPage from '../features/landing/LandingPage';
import LoginPage from '../features/auth/LoginPage';
import DashboardPage from '../features/dashboard/DashboardPage';
import CatalogPage from '../features/activities/CatalogPage';
import ActivitiesListPage, { PENDING_REVIEW_PATH } from '../features/activities/ActivitiesListPage';
import { getPendingActivities } from '../api/activitiesApi';
import UiShowcase from '../components/ui/UiShowcase/UiShowcase';
import PublicLayout from '../components/layout/PublicLayout/PublicLayout';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import ProposalForm from '../features/proposals/ProposalForm';
import OrgRegisterPage from '../features/orgs/OrgRegisterPage';
import ActivityFormPage from '../features/activities/ActivityFormPage';
import OrgImpactPage from '../features/orgs/OrgImpactPage';
import OrgDashboardPage from '../features/orgs/OrgDashboardPage';
import OrgActivitiesPage from '../features/orgs/OrgActivitiesPage';
import ProposalsInboxPage from '../features/proposals/ProposalsInboxPage';
import ProposalDetailPage from '../features/proposals/ProposalDetailPage';
import AccountStatusPage, { AdminAccountStatusPage } from '../features/orgs/AccountStatusPage';
import ActivityDetailPage from '../features/activities/ActivityDetailPage';
import MyVolunteeringPage from '../features/registrations/MyVolunteeringPage';
import NotFoundPage from '../features/not-found/NotFoundPage';
import AppLayout from '../components/layout/AppLayout/AppLayout';
import { RegistrationsProvider } from '../features/registrations/RegistrationsContext';
import { FavoritesProvider } from '../features/favorites/FavoritesContext';
import RegistrationsTablePage from '../features/registrations/RegistrationsTablePage';
import { DEMO_REGISTRATIONS_PATH } from '../constants/demoActivity';
import CertificatePage from '../features/reports/CertificatePage';
import PendingClosurePage from '../features/reports/PendingClosurePage';
import ClosureFormPage from '../features/reports/ClosureFormPage';
import ActivityClosurePage from '../features/reports/ActivityClosurePage';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<PublicLayout><LandingPage /></PublicLayout>} />
      <Route path="/login" element={<PublicLayout><LoginPage /></PublicLayout>} />
      <Route path="/proposal" element={<PublicLayout><ProposalForm /></PublicLayout>} />
      <Route path="/new-proposal" element={<PublicLayout><ProposalForm /></PublicLayout>} />
      <Route path="/register-organization" element={<PublicLayout><OrgRegisterPage /></PublicLayout>} />
      {import.meta.env.DEV && <Route path="/ui-kit" element={<UiShowcase />} />}
      <Route path="/explore" element={<Navigate to="/activities" replace />} />
      <Route path="/inscriptions" element={<Navigate to={DEMO_REGISTRATIONS_PATH} replace />} />
      <Route path="/closes" element={<Navigate to="/admin/activities/pending-closure" replace />} />
      <Route path="/account-status" element={<PublicLayout><AccountStatusPage /></PublicLayout>} />
      <Route element={<ProtectedRoute />}>
        {/* Un solo proveedor de favoritos por encima de `AppLayout`, que pinta el
            `Outlet`: así el corazón del catálogo (tramo EMPLOYEE) y los dos de la
            ficha (tramo ADMIN+EMPLOYEE) comparten estado, y navegar de uno a otro
            no pierde lo que se acaba de pulsar. No hace ninguna petición al
            montarse, así que sobrarle al rol entidad no cuesta nada. */}
        <Route
          element={
            <FavoritesProvider>
              <AppLayout />
            </FavoritesProvider>
          }
        >
          <Route element={<RoleRoute roles={['ADMIN', 'EMPLOYEE']} />}>
            <Route path="/closures/:closureId" element={<ClosureFormPage />} />
            <Route path="/activities/:activityId" element={<ActivityDetailPage />} />
          </Route>
          <Route element={<RoleRoute roles={['ADMIN']} />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/proposals" element={<ProposalsInboxPage />} />
            <Route path="/proposals/:proposalId" element={<ProposalDetailPage />} />
            <Route path="/activities/new" element={<ActivityFormPage />} />
            <Route path="/activities/:activityId/registrations" element={<RegistrationsTablePage />} />
            <Route path="/activities/:activityId/edit" element={<ActivityFormPage backPath="/admin/activities" />} />
            <Route path="/admin/activities" element={<ActivitiesListPage />} />
            {/* La cola de revisión: lo que las entidades han propuesto y espera
                decisión. Es una cola, no un inventario: sin filtro de estado y
                en orden ascendente, lo que más lleva esperando primero. */}
            <Route
              path={PENDING_REVIEW_PATH}
              element={(
                <ActivitiesListPage
                  fetchData={getPendingActivities}
                  title="Propuestas pendientes de revisión"
                  eyebrow="Administración"
                  showCreateButton={false}
                  showStatusFilter={false}
                  showRegistrationsLink={false}
                  showReviewActions={true}
                  emptyDescription="Ninguna entidad tiene propuestas esperando decisión."
                />
              )}
            />
            <Route path="/admin/account-status" element={<AdminAccountStatusPage />} />
            <Route path="/admin/activities/pending-closure" element={<PendingClosurePage />} />
            <Route path="/admin/activities/:activityId/closure" element={<ActivityClosurePage />} />
          </Route>
          <Route element={<RoleRoute roles={['EMPLOYEE']} />}>
            <Route path="/closures/:closureId/certificate" element={<CertificatePage />} />
            <Route
              element={
                <RegistrationsProvider>
                  <Outlet />
                </RegistrationsProvider>
              }
            >
              <Route path="/activities" element={<CatalogPage />} />
              <Route path="/my-activities" element={<MyVolunteeringPage />} />
              <Route path="/my-volunteering" element={<MyVolunteeringPage />} />
              <Route path="/closures/new" element={<ClosureFormPage />} />
            </Route>
          </Route>
          <Route element={<RoleRoute roles={['PARTNER']} />}>
            <Route path="/org/dashboard" element={<OrgDashboardPage />} />
            <Route path="/org/activities" element={<OrgActivitiesPage />} />
            <Route path="/org/activities/new" element={<ActivityFormPage backPath="/org/activities" />} />
            <Route path="/org/activities/:activityId/edit" element={<ActivityFormPage backPath="/org/activities" />} />
            <Route path="/org/reports" element={<OrgImpactPage />} />
            {/* `/org/proposals` (la propuesta de cuatro campos que la Fundación
                completa) salió del backoffice de la entidad: con cuenta, la
                entidad propone la actividad entera en `/org/activities` y ese
                camino queda para el formulario público de la landing. */}
            <Route path="/org/proposals" element={<Navigate to="/org/activities" replace />} />
            <Route path="/org/proposals/new" element={<Navigate to="/org/activities/new" replace />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<PublicLayout><NotFoundPage /></PublicLayout>} />
    </Routes>
  );
}
