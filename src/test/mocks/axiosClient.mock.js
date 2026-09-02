import { vi } from 'vitest';

// Shared mocked axios client — use in contract tests via vi.mock('./axiosClient')
// Example: vi.mock('./axiosClient', () => ({ default: client }))

export const client = {
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};

export function resetClientMocks() {
  Object.values(client).forEach((fn) => fn.mockReset());
}

export function mockResolved(data, { status = 200, headers = {} } = {}) {
  return Promise.resolve({ data, status, headers });
}

export function mockRejected(error) {
  return Promise.reject(error);
}
