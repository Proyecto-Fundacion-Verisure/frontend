import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createProposal } from './proposalsApi';
import { ApiError } from './apiError';

// Estas pruebas van contra el mock de propuestas a propósito: es lo único que hay
// mientras BE2 no entregue el endpoint. En modo test los mocks están apagados por
// defecto, así que hay que encenderlo por su nombre.
beforeAll(() => vi.stubEnv('VITE_USE_PROPOSAL_MOCKS', 'true'));
afterAll(() => vi.unstubAllEnvs());

const VALID_PROPOSAL = {
  organizationName: 'Fundación Ejemplo',
  cif: 'G12345678',
  contactName: 'María García',
  email: 'maria@ejemplo.org',
  phone: '600 123 456',
  estimatedVolunteers: '10',
  line: 'desoledad',
  description: 'Ayuda a personas mayores en situación de soledad no deseada.',
  consent: true,
};

describe('createProposal mock', () => {
  it('returns 201 with status NEW for valid data', async () => {
    const response = await createProposal(VALID_PROPOSAL);

    expect(response.data.status).toBe('NEW');
    expect(response.data.id).toBeDefined();
    expect(response.data.organizationName).toBe('Fundación Ejemplo');
    expect(response.data.email).toBe('maria@ejemplo.org');
    expect(response.data.estimatedVolunteers).toBe(10);
    expect(response.data.createdAt).toBeDefined();
  });

  it('rejects with 400 and fieldErrors when consent is missing', async () => {
    const data = { ...VALID_PROPOSAL, consent: false };

    await expect(createProposal(data)).rejects.toMatchObject({
      name: 'ApiError',
      status: 400,
      fieldErrors: expect.objectContaining({
        consent: expect.any(String),
      }),
    });
  });

  it('rejects with 429 when email contains rate', async () => {
    const data = { ...VALID_PROPOSAL, email: 'rate@test.com' };

    await expect(createProposal(data)).rejects.toMatchObject({
      name: 'ApiError',
      status: 429,
    });
  });

  it('rejects with 500 when email contains error', async () => {
    const data = { ...VALID_PROPOSAL, email: 'error@test.com' };

    await expect(createProposal(data)).rejects.toMatchObject({
      name: 'ApiError',
      status: 500,
    });
  });
});
