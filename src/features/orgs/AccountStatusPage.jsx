import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, Button, Input, Modal, Pagination, Spinner, EmptyState } from '../../components/ui';
import { formatDateTime } from '../../utils/dates';
import {
  getPendingOrganizations,
  approveOrganization,
  rejectOrganization,
  resendOrganizationRegistrationEmail,
} from '../../api/orgApi';
import { verifyEmail } from '../../api/authApi';

// Reenvío del enlace de verificación. El backend responde 204 siempre, exista
// o no el correo: se confirma sin decir si la cuenta existe.
function ResendVerificationForm({ initialEmail = '' }) {
  const [email, setEmail] = useState(initialEmail);
  const [state, setState] = useState('idle');
  const [emailError, setEmailError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email.trim()) {
      setEmailError('Indica el correo con el que se registró la entidad.');
      return;
    }
    setEmailError('');
    setState('loading');
    try {
      await resendOrganizationRegistrationEmail(email.trim());
      setState('success');
    } catch {
      setState('error');
    }
  };

  return (
    <form className="account-status__resend" onSubmit={handleSubmit} noValidate>
      <Input
        id="resend-email"
        type="email"
        label="Correo de la entidad"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={emailError}
        required
      />
      <Button type="submit" isLoading={state === 'loading'} loadingLabel="Reenviando…">
        Reenviar enlace
      </Button>
      {state === 'success' && (
        <p role="status">Si el correo está pendiente de verificar, te hemos enviado un enlace nuevo.</p>
      )}
      {state === 'error' && <p role="alert">No hemos podido reenviar el enlace. Inténtalo de nuevo.</p>}
    </form>
  );
}

// `/account-status`, pública y sin mirar la sesión. Con `?token=` verifica el
// correo (es el enlace que manda el backend); con `?pending=` explica por qué
// el login ha dicho que no. La bandeja de la administradora es otra ruta
// (`/admin/account-status`, `AdminAccountStatusPage`): compartir componente y
// decidir por la sesión llevaba a una entidad a la bandeja si en el navegador
// quedaba una sesión de admin.
export default function AccountStatusPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const pending = searchParams.get('pending');
  const [verifyState, setVerifyState] = useState(token ? 'loading' : 'idle');
  const [verifyError, setVerifyError] = useState(null);
  // El token es de un solo uso: la segunda llamada devuelve 410 «ya utilizado».
  // `StrictMode` monta los efectos dos veces en desarrollo, así que la petición
  // se guarda por token y el segundo montaje reutiliza la misma promesa.
  const verification = useRef({ token: null, promise: null });

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    if (verification.current.token !== token) {
      verification.current = { token, promise: verifyEmail(token) };
    }
    verification.current.promise
      .then(() => { if (!cancelled) setVerifyState('success'); })
      .catch((error) => {
        if (cancelled) return;
        setVerifyError(error);
        setVerifyState('error');
      });
    return () => { cancelled = true; };
  }, [token]);

  if (token) {
    if (verifyState === 'loading') return <Spinner label="Verificando el correo…" />;
    if (verifyState === 'success') {
      return (
        <section className="account-status" aria-labelledby="account-status-title">
          <h1 id="account-status-title" className="account-status__title">Correo verificado</h1>
          <p>La Fundación revisará tu solicitud y te avisará por correo cuando esté aprobada.</p>
          <div className="account-status__actions">
            <Link to="/login" className="button button--secondary button--medium">Ir al inicio de sesión</Link>
          </div>
        </section>
      );
    }
    const expired = verifyError?.code === 'VERIFICATION_EXPIRED';
    return (
      <section className="account-status" aria-labelledby="account-status-title">
        <h1 id="account-status-title" className="account-status__title">
          {expired ? 'Este enlace ya se ha usado o ha caducado' : 'No hemos podido verificar el correo'}
        </h1>
        <p role="alert">{verifyError?.message || 'Inténtalo de nuevo más tarde.'}</p>
        {expired && <ResendVerificationForm />}
      </section>
    );
  }

  if (pending === 'verification') {
    return (
      <section className="account-status" aria-labelledby="account-status-title">
        <h1 id="account-status-title" className="account-status__title">Verifica tu correo electrónico</h1>
        <p>Te hemos enviado un enlace para confirmar la dirección de correo de la entidad. Si no lo encuentras, pide otro:</p>
        <ResendVerificationForm />
      </section>
    );
  }

  if (pending === 'approval') {
    return (
      <section className="account-status" aria-labelledby="account-status-title">
        <h1 id="account-status-title" className="account-status__title">Cuenta pendiente de aprobación</h1>
        <p>Tu correo ya está verificado. La Fundación está revisando la solicitud de tu entidad y te avisará por correo.</p>
      </section>
    );
  }

  return (
    <EmptyState
      title="Estado de la cuenta"
      description="Inicia sesión para consultar el estado de tu entidad."
    />
  );
}

export function AdminAccountStatusPage() {
  const [organizations, setOrganizations] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionPending, setActionPending] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    orgId: null,
    orgName: '',
    action: null,
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getPendingOrganizations({ status: 'PENDING', page: page - 1 })
      .then((res) => {
        const organizations = res.data?.content ?? res.data;
        if (!cancelled) {
          setOrganizations(Array.isArray(organizations) ? organizations : []);
          setTotalPages(Math.max(Number(res.data?.totalPages) || 1, 1));
          setTotalElements(Number(res.data?.totalElements) || 0);
        }
      })
      .catch(() => {
        if (!cancelled) setError('No se pudieron cargar las organizaciones pendientes.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [page]);

  const openConfirm = (orgId, orgName, action) => {
    setConfirmModal({ isOpen: true, orgId, orgName, action });
  };

  const closeConfirm = () => {
    setConfirmModal({ isOpen: false, orgId: null, orgName: '', action: null });
  };

  const handleConfirm = async () => {
    const { orgId, action } = confirmModal;
    setActionPending(orgId);
    try {
      if (action === 'accept') {
        await approveOrganization(orgId);
      } else {
        await rejectOrganization(orgId);
      }
      setOrganizations((prev) => prev.filter((org) => org.id !== orgId));
      setTotalElements((prev) => Math.max(prev - 1, 0));
    } catch {
      setError('Ha ocurrido un error al procesar la solicitud.');
    } finally {
      setActionPending(null);
      closeConfirm();
    }
  };

  if (loading) {
    return (
      <div className="account-status__center">
        <Spinner label="Cargando organizaciones pendientes" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState title="Error" description={error} />
    );
  }

  if (organizations.length === 0) {
    return (
      <EmptyState
        title="No hay cuentas pendientes"
        description="Todas las solicitudes de registro han sido revisadas."
      />
    );
  }

  return (
    <section className="account-status">
      <h1 className="account-status__title">Cuentas pendientes de revisión</h1>
      <p className="account-status__subtitle">
        {totalElements} solicitud{totalElements !== 1 && 'es'} pendiente{totalElements !== 1 && 's'}
      </p>

      <div className="account-status__list">
        {organizations.map((org) => (
          <Card key={org.id} className="account-status__card">
            <div className="account-status__card-main">
              <div className="account-status__card-header">
                <h2 className="account-status__org-name">{org.organizationName}</h2>
              </div>

              <div className="account-status__card-info">
                <div className="account-status__field">
                  <span className="account-status__label">CIF</span>
                  <span className="account-status__value">{org.cif}</span>
                </div>
                <div className="account-status__field">
                  <span className="account-status__label">Contacto</span>
                  <span className="account-status__value">{org.contactName}</span>
                </div>
                <div className="account-status__field">
                  <span className="account-status__label">Email</span>
                  <span className="account-status__value">{org.email}</span>
                </div>
                <div className="account-status__field">
                  <span className="account-status__label">Teléfono</span>
                  <span className="account-status__value">{org.phone}</span>
                </div>
                <div className="account-status__field">
                  <span className="account-status__label">Solicitado el</span>
                  <span className="account-status__value">
                    {formatDateTime(org.requestedAt, { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                {/* No se bloquea aprobar sin correo verificado; se avisa. */}
                <div className="account-status__field">
                  <span className="account-status__label">Correo</span>
                  <span className="account-status__value">
                    {org.emailVerified ? (
                      <span className="badge badge--success">Verificado</span>
                    ) : (
                      <span className="badge badge--warning">Sin verificar</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="account-status__card-actions">
              <Button
                variant="primary"
                isLoading={actionPending === org.id}
                loadingLabel="Procesando"
                onClick={() => openConfirm(org.id, org.organizationName, 'accept')}
              >
                Aceptar
              </Button>
              <Button
                variant="danger"
                isLoading={actionPending === org.id}
                loadingLabel="Procesando"
                onClick={() => openConfirm(org.id, org.organizationName, 'reject')}
              >
                Rechazar
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        ariaLabel="Paginación de cuentas pendientes"
      />

      <Modal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirm}
        title={confirmModal.action === 'accept' ? 'Aceptar organización' : 'Rechazar organización'}
        footer={
          <>
            <Button variant="ghost" onClick={closeConfirm}>
              Cancelar
            </Button>
            <Button
              variant={confirmModal.action === 'accept' ? 'primary' : 'danger'}
              onClick={handleConfirm}
            >
              {confirmModal.action === 'accept' ? 'Aceptar' : 'Rechazar'}
            </Button>
          </>
        }
      >
        <p>
          {confirmModal.action === 'accept'
            ? `¿Deseas aceptar la cuenta de "${confirmModal.orgName}"?`
            : `¿Deseas rechazar la cuenta de "${confirmModal.orgName}"?`}
        </p>
      </Modal>
    </section>
  );
}
