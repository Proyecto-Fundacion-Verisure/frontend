import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { LandingPage } from '../../features/landing';
import { authRoutes } from '../../features/auth';
import { ActivitiesTabs } from '../navigation/ActivitiesTabs';
import RequestsTabs from '../navigation/RequestsTabs';
import UiShowcase from '../dev/UiShowcase';
import AttentionPanel from '../navigation/AttentionPanel';
import PublicLayout from '../layout/PublicLayout/PublicLayout';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import AppLayout from '../layout/AppLayout/AppLayout';
import { FavoritesProvider } from '../../features/favorites';
// El router pide la API y el provider por su módulo, no por el barril de la
// feature: así el barril —y con él sus páginas— solo entra con el `import()`
// diferido de cada ruta y no en el trozo de entrada.
import { getPendingActivities } from '../../features/activities/api';
import { PENDING_REVIEW_PATH } from '../../features/activities/routes';
import { RegistrationsProvider } from '../../features/registrations/context/RegistrationsContext';
import createLazyPage from './createLazyPage';

// La landing y el acceso se cargan de entrada: son la primera pantalla de casi
// todo el mundo. El resto —incluidas las páginas públicas secundarias y todo el
// backoffice— se reparte por feature y cada trozo se descarga al entrar en su
// ruta. El `Suspense` que los muestra vive en cada layout, no aquí, para que la
// cabecera, el menú y el pie sigan montados mientras llega la página.
const DashboardPage = createLazyPage(() => import('../../features/dashboard'), 'DashboardPage');

const ActivitiesListPage = createLazyPage(
  () => import('../../features/activities'),
  'ActivitiesListPage',
);
const ActivityDetailPage = createLazyPage(
  () => import('../../features/activities'),
  'ActivityDetailPage',
);
const ActivityFormPage = createLazyPage(
  () => import('../../features/activities'),
  'ActivityFormPage',
);
const CatalogPage = createLazyPage(() => import('../../features/activities'), 'CatalogPage');
const ProposalForm = createLazyPage(() => import('../../features/proposals'), 'ProposalForm');
const ProposalsInboxPage = createLazyPage(
  () => import('../../features/proposals'),
  'ProposalsInboxPage',
);
const ProposalDetailPage = createLazyPage(
  () => import('../../features/proposals'),
  'ProposalDetailPage',
);

const RegistrationsTablePage = createLazyPage(
  () => import('../../features/registrations'),
  'RegistrationsTablePage',
);
const MyVolunteeringPage = createLazyPage(
  () => import('../../features/registrations'),
  'MyVolunteeringPage',
);

const ActivityClosurePage = createLazyPage(
  () => import('../../features/reports'),
  'ActivityClosurePage',
);
const CertificatePage = createLazyPage(() => import('../../features/reports'), 'CertificatePage');
const ClosureFormPage = createLazyPage(() => import('../../features/reports'), 'ClosureFormPage');
const PendingClosurePage = createLazyPage(
  () => import('../../features/reports'),
  'PendingClosurePage',
);

const AccountStatusPage = createLazyPage(() => import('../../features/orgs'), 'AccountStatusPage');
const OrgRegisterPage = createLazyPage(() => import('../../features/orgs'), 'OrgRegisterPage');
const AdminAccountStatusPage = createLazyPage(
  () => import('../../features/orgs'),
  'AdminAccountStatusPage',
);
const OrgActivitiesPage = createLazyPage(() => import('../../features/orgs'), 'OrgActivitiesPage');
const OrgDashboardPage = createLazyPage(() => import('../../features/orgs'), 'OrgDashboardPage');
const OrgImpactPage = createLazyPage(() => import('../../features/orgs'), 'OrgImpactPage');

const NotFoundPage = createLazyPage(() => import('../../features/not-found'), 'NotFoundPage');

export default function AppRouter() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicLayout>
            <LandingPage />
          </PublicLayout>
        }
      />
      {authRoutes.map(({ path, element }) => (
        <Route key={path} path={path} element={element} />
      ))}
      <Route
        path="/proposal"
        element={
          <PublicLayout>
            <ProposalForm />
          </PublicLayout>
        }
      />
      <Route
        path="/new-proposal"
        element={
          <PublicLayout>
            <ProposalForm />
          </PublicLayout>
        }
      />
      <Route
        path="/register-organization"
        element={
          <PublicLayout>
            <OrgRegisterPage />
          </PublicLayout>
        }
      />
      {import.meta.env.DEV && <Route path="/ui-kit" element={<UiShowcase />} />}
      <Route path="/explore" element={<Navigate to="/activities" replace />} />
      <Route path="/inscriptions" element={<Navigate to="/admin/registrations" replace />} />
      <Route path="/closes" element={<Navigate to="/admin/activities/pending-closure" replace />} />
      <Route
        path="/account-status"
        element={
          <PublicLayout>
            <AccountStatusPage />
          </PublicLayout>
        }
      />
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
            <Route
              path="/dashboard"
              element={<DashboardPage attentionPanel={<AttentionPanel />} />}
            />
            <Route
              path="/proposals"
              element={<ProposalsInboxPage sectionTabs={<RequestsTabs />} />}
            />
            <Route path="/proposals/:proposalId" element={<ProposalDetailPage />} />
            <Route
              path="/activities/new"
              element={<ActivityFormPage backPath="/admin/activities" />}
            />
            <Route path="/admin/registrations" element={<RegistrationsTablePage />} />
            <Route
              path="/activities/:activityId/registrations"
              element={<RegistrationsTablePage />}
            />
            <Route
              path="/activities/:activityId/edit"
              element={<ActivityFormPage backPath="/admin/activities" />}
            />
            <Route
              path="/admin/activities"
              element={<ActivitiesListPage sectionTabs={<ActivitiesTabs />} />}
            />
            {/* La cola de revisión: lo que las entidades han propuesto y espera
                decisión. Es una cola, no un inventario: sin filtro de estado y
                en orden ascendente, lo que más lleva esperando primero. */}
            <Route
              path={PENDING_REVIEW_PATH}
              element={
                <ActivitiesListPage
                  fetchData={getPendingActivities}
                  title="Solicitudes"
                  itemLabel="actividad por aprobar"
                  itemsLabel="actividades por aprobar"
                  sectionTabs={<RequestsTabs />}
                  showCreateButton={false}
                  showStatusFilter={false}
                  showRegistrationsLink={false}
                  showFavoritesColumn={false}
                  showReviewActions={true}
                  emptyDescription="Ninguna entidad tiene propuestas esperando decisión."
                />
              }
            />
            <Route path="/admin/account-status" element={<AdminAccountStatusPage />} />
            <Route
              path="/admin/activities/pending-closure"
              element={<PendingClosurePage sectionTabs={<ActivitiesTabs />} />}
            />
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
            <Route
              path="/org/activities/new"
              element={<ActivityFormPage backPath="/org/activities" />}
            />
            <Route
              path="/org/activities/:activityId/edit"
              element={<ActivityFormPage backPath="/org/activities" />}
            />
            <Route path="/org/reports" element={<OrgImpactPage />} />
            {/* `/org/proposals` (la propuesta de cuatro campos que la Fundación
                completa) salió del backoffice de la entidad: con cuenta, la
                entidad propone la actividad entera en `/org/activities` y ese
                camino queda para el formulario público de la landing. */}
            <Route path="/org/proposals" element={<Navigate to="/org/activities" replace />} />
            <Route
              path="/org/proposals/new"
              element={<Navigate to="/org/activities/new" replace />}
            />
          </Route>
        </Route>
      </Route>
      <Route
        path="*"
        element={
          <PublicLayout>
            <NotFoundPage />
          </PublicLayout>
        }
      />
    </Routes>
  );
}
