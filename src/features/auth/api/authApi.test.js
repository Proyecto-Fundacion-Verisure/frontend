import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getCurrentUser,
  logout,
  registerPartner,
  resendVerification,
  verifyEmail,
} from './authApi';

const { client } = vi.hoisted(() => ({
  client: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('../../../shared/api/axiosClient', () => ({ default: client }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('authentication API contract', () => {
  it('uses the public registration and verification endpoints', () => {
    const registration = { email: 'partner@example.org' };

    registerPartner(registration);
    verifyEmail('verification-token');
    resendVerification('partner@example.org');
    getCurrentUser();
    logout('access-token');

    expect(client.post).toHaveBeenNthCalledWith(1, '/auth/register', registration);
    expect(client.get).toHaveBeenNthCalledWith(1, '/auth/verify', {
      params: { token: 'verification-token' },
    });
    expect(client.post).toHaveBeenNthCalledWith(2, '/auth/resend-verification', {
      email: 'partner@example.org',
    });
    expect(client.get).toHaveBeenNthCalledWith(2, '/auth/me');
    expect(client.post).toHaveBeenNthCalledWith(3, '/auth/logout', undefined, {
      headers: { Authorization: 'Bearer access-token' },
    });
  });
});
