// Proposal fixtures — backend v2 contract

export const ProposalStatus = {
  NEW: 'NEW',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
};

export function makeProposal(overrides = {}) {
  return {
    id: 1,
    organizationName: 'Fundación Solitaria',
    cif: 'G12345678',
    contactName: 'María García',
    email: 'maria@solitaria.org',
    phone: '600 111 222',
    line: 'desoledad',
    description: 'Acompañamiento semanal a personas mayores en situación de soledad no deseada.',
    estimatedVolunteers: 8,
    status: ProposalStatus.NEW,
    createdAt: '2026-08-20T10:00:00.000Z',
    ...overrides,
  };
}

export function makeCreateProposalRequest(overrides = {}) {
  return {
    organizationName: 'Fundación Solitaria',
    cif: 'G12345678',
    contactName: 'María García',
    email: 'maria@solitaria.org',
    phone: '600 111 222',
    estimatedVolunteers: '8',
    line: 'desoledad',
    description: 'Acompañamiento semanal a personas mayores en situación de soledad no deseada.',
    consent: true,
    ...overrides,
  };
}

export const MOCK_PROPOSALS_V2 = [
  makeProposal({ id: 1, status: ProposalStatus.NEW }),
  makeProposal({ id: 2, organizationName: 'Educamos Juntos', cif: 'B87654321', contactName: 'Carlos Ruiz', email: 'carlos@educamos.org', line: 'educar', status: ProposalStatus.NEW }),
  makeProposal({ id: 3, organizationName: 'Prevención Total', cif: 'F11223344', contactName: 'Ana Martín', email: 'ana@prevencion.org', line: 'acoso', status: ProposalStatus.ACCEPTED }),
  makeProposal({ id: 4, organizationName: 'Voluntarios Activos', cif: 'A55667788', contactName: 'Pedro López', email: 'pedro@voluntarios.org',     line: 'medio_ambiente', status: ProposalStatus.ACCEPTED }),
  makeProposal({ id: 5, organizationName: 'Ayuda Directa', cif: 'C99887766', contactName: 'Laura Sánchez', email: 'laura@ayudadirecta.org', status: ProposalStatus.REJECTED }),
];
