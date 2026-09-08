import { useEffect, useState } from 'react';
import { Card, Button, Modal, Pagination, Spinner, EmptyState } from '../../components/ui';
import {
  getPendingOrganizations,
  approveOrganization,
  rejectOrganization,
  resendOrganizationRegistrationEmail,
} from '../../api/orgApi';
import { useAuth } from '../auth/AuthContext';

const PARTNER_STATUS_COPY = {
  PENDING_VERIFICATION: {
    title: 'Verifica tu correo electrónico',
    description: 'Te hemos enviado un enlace para confirmar la dirección de correo de la entidad.',
  },
  PENDING_APPROVAL: {
    title: 'Cuenta pendiente de aprobación',
    description: 'La Fundación está revisando la solicitud de tu entidad.',
  },
  REJECTED: {
    title: 'Solicitud rechazada',
    description: 'Contacta con la Fundación si necesitas más información sobre la decisión.',
  },
};

function PartnerAccountStatus({ user }) {
  const [resendState, setResendState] = useState('idle');
  const copy = PARTNER_STATUS_COPY[user.status] ?? PARTNER_STATUS_COPY.PENDING_APPROVAL;

  const resend = async () => {
    setResendState('loading');
    try {
      await resendOrganizationRegistrationEmail(user.email);
      setResendState('success');
    } catch {
      setResendState('error');
    }
  };

  return (
    <section className="account-status" aria-labelledby="partner-account-status-title">
      <h1 id="partner-account-status-title" className="account-status__title">{copy.title}</h1>
      <p>{copy.description}</p>
      {user.status === 'PENDING_VERIFICATION' && (
        <Button
          onClick={resend}
          isLoading={resendState === 'loading'}
          loadingLabel="Reenviando…"
        >
          Reenviar correo de verificación
        </Button>
      )}
      {resendState === 'success' && <p role="status">Correo reenviado.</p>}
      {resendState === 'error' && <p role="alert">No hemos podido reenviar el correo.</p>}
    </section>
  );
}

export default function AccountStatusPage() {
  const auth = useAuth();
  if (auth?.user?.role === 'PARTNER') return <PartnerAccountStatus user={auth.user} />;
  if (!auth?.user) {
    return (
      <EmptyState
        title="Estado de la cuenta"
        description="Inicia sesión para consultar el estado de tu entidad."
      />
    );
  }
  return <AdminAccountStatusPage />;
}

function AdminAccountStatusPage() {
  const [organizations, setOrganizations] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
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
        {organizations.length} solicitud{organizations.length !== 1 && 'es'} pendiente{organizations.length !== 1 && 's'}
      </p>

      <div className="account-status__list">
        {organizations.map((org) => (
          <Card key={org.id} className="account-status__card">
            <div className="account-status__card-main">
              <div className="account-status__card-header">
                <h2 className="account-status__org-name">{org.organizationName ?? org.name}</h2>
                <span className="account-status__badge badge badge--warning">Pendiente</span>
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
                    {new Date(org.requestedAt).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="account-status__card-actions">
              <Button
                variant="primary"
                isLoading={actionPending === org.id}
                loadingLabel="Procesando"
                onClick={() => openConfirm(org.id, org.organizationName ?? org.name, 'accept')}
              >
                Aceptar
              </Button>
              <Button
                variant="danger"
                isLoading={actionPending === org.id}
                loadingLabel="Procesando"
                onClick={() => openConfirm(org.id, org.organizationName ?? org.name, 'reject')}
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
