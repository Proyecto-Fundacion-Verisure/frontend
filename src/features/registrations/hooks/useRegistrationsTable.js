import { useState } from 'react';
import useRegistrations from './useRegistrations';
import {
  REGISTRATION_SECTIONS,
  getBoardTotals,
  getCountsSummary,
  getRegistrations,
  getSection,
  getSectionRows,
  getSectionTabs,
  groupRegistrationsBySection,
} from '../model/registrationsTable';

export default function useRegistrationsTable(activityId) {
  const [page, setPage] = useState(1);
  const [activeSectionKey, setActiveSectionKey] = useState(REGISTRATION_SECTIONS[0].key);
  const registrationsState = useRegistrations(activityId, page - 1);

  const registrations = getRegistrations(registrationsState.board);
  const grouped = groupRegistrationsBySection(registrations);
  const { totalElements, totalPages } = getBoardTotals(registrationsState.board, registrations);

  const retry = () => registrationsState.reload().catch(() => undefined);

  return {
    registrations,
    grouped,
    counts: registrationsState.counts,
    countsSummary: getCountsSummary(registrationsState.counts),
    loading: registrationsState.loading,
    error: registrationsState.error,
    decision: registrationsState.decision,
    acceptRegistration: registrationsState.acceptRegistration,
    rejectRegistration: registrationsState.rejectRegistration,
    cancelRegistration: registrationsState.cancelRegistration,
    retry,
    page,
    setPage,
    totalElements,
    totalPages,
    tabs: getSectionTabs(grouped),
    activeSection: getSection(activeSectionKey),
    activeSectionKey,
    setActiveSectionKey,
    activeRows: getSectionRows(grouped, activeSectionKey),
  };
}
