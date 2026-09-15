import client from './axiosClient';
import { ApiError } from './apiError';
import { isMockEnabled } from './mocks';

const useDevelopmentMocks = () => isMockEnabled('PROPOSAL');

const MOCK_PROPOSALS = [
  {
    id: 1,
    organizationName: 'Fundación Solitaria',
    cif: 'G12345678',
    contactName: 'María García',
    email: 'maria@solitaria.org',
    phone: '600 111 222',
    line: 'desoledad',
    description: 'Acompañamiento semanal a personas mayores en situación de soledad no deseada.',
    estimatedVolunteers: 8,
    status: 'NEW',
    createdAt: '2026-08-20T10:00:00.000Z',
  },
  {
    id: 2,
    organizationName: 'Educamos Juntos',
    cif: 'B87654321',
    contactName: 'Carlos Ruiz',
    email: 'carlos@educamos.org',
    phone: '600 333 444',
    line: 'educar',
    description: 'Talleres de refuerzo escolar para menores en riesgo de exclusión.',
    estimatedVolunteers: 12,
    status: 'NEW',
    createdAt: '2026-08-22T14:30:00.000Z',
  },
  {
    id: 3,
    organizationName: 'Prevención Total',
    cif: 'F11223344',
    contactName: 'Ana Martín',
    email: 'ana@prevencion.org',
    phone: '600 555 666',
    line: 'acoso',
    description: 'Campañas de sensibilización contra el acoso escolar en centros educativos.',
    estimatedVolunteers: 6,
    status: 'ACCEPTED',
    createdAt: '2026-08-10T09:15:00.000Z',
  },
  {
    id: 4,
    organizationName: 'Voluntarios Activos',
    cif: 'A55667788',
    contactName: 'Pedro López',
    email: 'pedro@voluntarios.org',
    phone: '600 777 888',
    line: 'medioambiente',
    description: 'Jornadas de voluntariado corporativo en entornos naturales.',
    estimatedVolunteers: 20,
    status: 'ACCEPTED',
    createdAt: '2026-08-05T11:00:00.000Z',
  },
  {
    id: 5,
    organizationName: 'Ayuda Directa',
    cif: 'C99887766',
    contactName: 'Laura Sánchez',
    email: 'laura@ayudadirecta.org',
    phone: '600 999 000',
    line: 'desoledad',
    description: 'Donación de alimentos a familias vulnerables.',
    estimatedVolunteers: 15,
    status: 'REJECTED',
    createdAt: '2026-08-01T16:45:00.000Z',
  },
];

function mockGetProposals(params = {}) {
  let results = [...MOCK_PROPOSALS];

  if (params.status) {
    results = results.filter((p) => p.status === params.status);
  }

  const page = Math.max(0, Number(params.page) || 0);
  const size = 10;
  const start = page * size;
  const content = results.slice(start, start + size);

  return Promise.resolve({
    data: {
      content,
      number: page,
      size,
      totalElements: results.length,
      totalPages: Math.ceil(results.length / size),
    },
  });
}

function mockRejectProposal(id) {
  const proposal = MOCK_PROPOSALS.find((p) => p.id === Number(id));
  if (proposal) proposal.status = 'REJECTED';
  return Promise.resolve({ data: { id: Number(id), status: 'REJECTED' } });
}

function mockAcceptProposal(id) {
  const proposal = MOCK_PROPOSALS.find((p) => p.id === Number(id));
  if (proposal) proposal.status = 'ACCEPTED';
  return Promise.resolve({
    data: { id: Number(id), activityId: 100 + Number(id), status: 'DRAFT' },
    status: 201,
  });
}

const pickAdminParams = (params = {}) => Object.fromEntries(
  Object.entries(params).filter(([key, value]) => (
    ['status', 'page'].includes(key) && value !== undefined && value !== null && value !== ''
  )),
);

export const getProposals = (params = {}) =>
  useDevelopmentMocks()
    ? mockGetProposals(params)
    : client.get('/admin/proposals', { params: pickAdminParams(params) });

export const getProposal = (id) => client.get(`/admin/proposals/${id}`);

export const acceptProposal = (id) => client.post(`/admin/proposals/${id}/accept`);

export const rejectProposal = (id) => client.patch(`/admin/proposals/${id}/reject`);

function validateProposal(data) {
  const fieldErrors = {};
  if (!data.organizationName?.trim()) fieldErrors.organizationName = 'Indica el nombre de la organización.';
  if (!data.cif?.trim()) fieldErrors.cif = 'Introduce un CIF válido.';
  if (!data.contactName?.trim()) fieldErrors.contactName = 'Indica una persona de contacto.';
  if (!/^\S+@\S+\.\S+$/.test(data.email?.trim())) fieldErrors.email = 'Introduce un correo válido.';
  if (!data.phone?.trim()) fieldErrors.phone = 'Indica un teléfono de contacto.';
  if (!data.description?.trim()) fieldErrors.description = 'Describe la necesidad.';
  if (!data.consent) fieldErrors.consent = 'Debes aceptar la política de privacidad.';
  return fieldErrors;
}

function mockCreateProposal(data) {
  const fieldErrors = validateProposal(data);
  if (Object.keys(fieldErrors).length) {
    return Promise.reject(new ApiError({
      message: 'La solicitud no es válida.',
      status: 400,
      fieldErrors,
    }));
  }

  const email = data.email?.toLowerCase() ?? '';

  if (email.includes('error')) {
    return Promise.reject(new ApiError({
      message: 'Ha ocurrido un error en el servidor. Inténtalo más tarde.',
      status: 500,
    }));
  }

  if (email.includes('rate') || email.includes('limit')) {
    return Promise.reject(new ApiError({
      message: 'Se han realizado demasiadas solicitudes. Inténtalo más tarde.',
      status: 429,
    }));
  }

  return Promise.resolve({
    data: {
      id: Math.floor(Math.random() * 10000) + 1,
      status: 'NEW',
      ...data,
      estimatedVolunteers: Number(data.estimatedVolunteers) || null,
      createdAt: new Date().toISOString(),
    },
  });
}

export const createProposal = (data) =>
  useDevelopmentMocks() ? mockCreateProposal(data) : client.post('/proposals', data);
