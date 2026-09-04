import { useEffect, useState } from 'react';
import { Card, Button, Modal, Spinner, EmptyState } from '../../components/ui';
import {
  getPendingOrganizations,
  approveOrganization,
  rejectOrganization,
} from '../../api/orgApi';

export default function AccountStatusPage() {
  const [organizations, setOrganizations] = useState([]);
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
    getPendingOrganizations()
      .then((res) => {
        if (!cancelled) setOrganizations(res.data);
      })
      .catch(() => {
        if (!cancelled) setError('No se pudieron cargar las organizaciones pendientes.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

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
                <h2 className="account-status__org-name">{org.organizationName}</h2>
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
