import { useEffect, useState } from 'react';
import {
  approveOrganization,
  getPendingOrganizations,
  rejectOrganization,
} from '../api/orgApi';
import {
  EMPTY_PENDING_ORGANIZATIONS,
  getPendingCountLabel,
  normalizePendingOrganizationsPage,
} from '../model/accountStatus';

const EMPTY_CONFIRMATION = Object.freeze({
  isOpen: false,
  organizationId: null,
  organizationName: '',
  action: null,
});

function removeOrganization(organizations, organizationId) {
  return organizations.filter((organization) => organization.id !== organizationId);
}

export default function usePendingOrganizations() {
  const [organizations, setOrganizations] = useState(EMPTY_PENDING_ORGANIZATIONS.organizations);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(EMPTY_PENDING_ORGANIZATIONS.totalPages);
  const [totalElements, setTotalElements] = useState(EMPTY_PENDING_ORGANIZATIONS.totalElements);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionPendingId, setActionPendingId] = useState(null);
  const [confirmation, setConfirmation] = useState(EMPTY_CONFIRMATION);

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    setError(null);

    getPendingOrganizations({ status: 'PENDING', page: page - 1 })
      .then((response) => {
        if (!isActive) return;

        const pageData = normalizePendingOrganizationsPage(response.data);
        setOrganizations(pageData.organizations);
        setTotalPages(pageData.totalPages);
        setTotalElements(pageData.totalElements);
      })
      .catch(() => {
        if (isActive) setError('No se pudieron cargar las entidades pendientes.');
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [page]);

  const openConfirmation = (organization, action) => setConfirmation({
    isOpen: true,
    organizationId: organization.id,
    organizationName: organization.organizationName,
    action,
  });

  const closeConfirmation = () => setConfirmation(EMPTY_CONFIRMATION);

  const confirmAction = async () => {
    const { organizationId, action } = confirmation;
    setActionPendingId(organizationId);

    try {
      const request = action === 'accept' ? approveOrganization : rejectOrganization;
      await request(organizationId);
      setOrganizations((current) => removeOrganization(current, organizationId));
      setTotalElements((current) => Math.max(current - 1, 0));
    } catch {
      setError('Ha ocurrido un error al procesar la solicitud.');
    } finally {
      setActionPendingId(null);
      closeConfirmation();
    }
  };

  return {
    organizations,
    page,
    totalPages,
    totalElements,
    countLabel: getPendingCountLabel(totalElements),
    isLoading,
    error,
    hasError: Boolean(error) && !isLoading,
    actionPendingId,
    confirmation,
    setPage,
    openConfirmation,
    closeConfirmation,
    confirmAction,
  };
}
