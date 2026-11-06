import { beforeEach, describe, expect, it, vi } from 'vitest';
import client from '../shared/api/axiosClient';
import { createProposal } from './proposalsApi';

vi.mock('../shared/api/axiosClient', () => ({ default: { post: vi.fn(), get: vi.fn(), patch: vi.fn() } }));

const VALID_PROPOSAL = {
  organizationName: 'Fundación Ejemplo',
  cif: 'G12345678',
  contactName: 'María García',
  email: 'maria@ejemplo.org',
  phone: '600 123 456',
  estimatedVolunteers: 10,
  line: 'desoledad',
  description: 'Ayuda a personas mayores en situación de soledad no deseada.',
  consent: true,
};

beforeEach(() => {
  client.post.mockReset();
});

describe('createProposal', () => {
  it('sends the proposal to the public endpoint', async () => {
    client.post.mockResolvedValue({ status: 201, data: { id: 7, status: 'NEW' } });

    const response = await createProposal(VALID_PROPOSAL);

    expect(client.post).toHaveBeenCalledWith('/proposals', VALID_PROPOSAL);
    expect(response.data).toEqual({ id: 7, status: 'NEW' });
  });

  it('passes API errors through to the form', async () => {
    const error = { status: 400, fieldErrors: { cif: ['Introduce un CIF válido.'] } };
    client.post.mockRejectedValue(error);

    await expect(createProposal(VALID_PROPOSAL)).rejects.toBe(error);
  });

  it('never answers on its own, even in development', async () => {
    vi.stubEnv('VITE_USE_MOCKS', 'true');
    client.post.mockResolvedValue({ status: 201, data: { id: 1 } });

    await createProposal(VALID_PROPOSAL);

    expect(client.post).toHaveBeenCalledTimes(1);
    vi.unstubAllEnvs();
  });
});
