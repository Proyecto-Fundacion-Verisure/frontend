import client from './axiosClient';
import { ApiError } from './apiError';

export const getProposals = (params) => client.get('/proposals', { params });
export const getProposal = (id) => client.get(`/proposals/${id}`);
export const acceptProposal = (id) => client.post(`/proposals/${id}/accept`);
export const rejectProposal = (id) => client.patch(`/proposals/${id}/reject`);

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
  import.meta.env.DEV ? mockCreateProposal(data) : client.post('/proposals', data);
