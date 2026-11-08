import { Link, useSearchParams } from 'react-router-dom';
import { EmptyState, Spinner } from '../../../shared/ui';
import AccountStatusPanel from '../components/AccountStatusPanel';
import ResendVerificationForm from '../components/ResendVerificationForm';
import useEmailVerification from '../hooks/useEmailVerification';
import {
  ACCOUNT_STATUS_COPY,
  getAccountStatusView,
  getVerificationErrorMessage,
} from '../model/accountStatus';

// `/account-status`, pública y sin mirar la sesión. La bandeja de la
// administradora es otra ruta (`/admin/account-status`,
// `AdminAccountStatusPage`): compartir componente y decidir por la sesión
// llevaba a una entidad a la bandeja si en el navegador quedaba una sesión de
// admin.
export default function AccountStatusPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const pending = searchParams.get('pending');
  const { verifyState, verifyError } = useEmailVerification(token);
  const view = getAccountStatusView({ token, pending, verifyState, verifyError });

  const isVerifying = view === 'verifying';
  const isVerified = view === 'verified';
  const isVerificationError = view === 'verification-error';
  const isExpired = view === 'expired';
  const isPendingVerification = view === 'pending-verification';
  const isPendingApproval = view === 'pending-approval';
  const isGuest = view === 'guest';
  const verificationErrorMessage = getVerificationErrorMessage(verifyError);

  return (
    <>
      {isVerifying && <Spinner label="Verificando el correo…" />}

      {isVerified && (
        <AccountStatusPanel
          title={ACCOUNT_STATUS_COPY.verified.title}
          description={ACCOUNT_STATUS_COPY.verified.description}
          actions={
            <Link to="/login" className="button button--secondary button--medium">
              {ACCOUNT_STATUS_COPY.verified.loginLabel}
            </Link>
          }
        />
      )}

      {isExpired && (
        <AccountStatusPanel title={ACCOUNT_STATUS_COPY.verificationExpired.title}>
          <p role="alert">{verificationErrorMessage}</p>
          <ResendVerificationForm />
        </AccountStatusPanel>
      )}

      {isVerificationError && (
        <AccountStatusPanel title={ACCOUNT_STATUS_COPY.verificationError.title}>
          <p role="alert">{verificationErrorMessage}</p>
        </AccountStatusPanel>
      )}

      {isPendingVerification && (
        <AccountStatusPanel
          title={ACCOUNT_STATUS_COPY.pendingVerification.title}
          description={ACCOUNT_STATUS_COPY.pendingVerification.description}
        >
          <ResendVerificationForm />
        </AccountStatusPanel>
      )}

      {isPendingApproval && (
        <AccountStatusPanel
          title={ACCOUNT_STATUS_COPY.pendingApproval.title}
          description={ACCOUNT_STATUS_COPY.pendingApproval.description}
        />
      )}

      {isGuest && (
        <EmptyState
          title={ACCOUNT_STATUS_COPY.guest.title}
          titleAs="h1"
          description={ACCOUNT_STATUS_COPY.guest.description}
        />
      )}
    </>
  );
}
