import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// jsdom + matchers + auto-cleanup. This file is the single Vitest setup entry.
// All API mocks live in src/test/** and are outside the production bundle (vite build excludes src/test).
// No real network is used: tests stub axiosClient or api modules with vi.fn / ApiError.

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Defensive: ensure no real fetch slips through in tests
if (!globalThis.fetch || globalThis.fetch.name !== 'mockConstructor') {
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('fetch is mocked in tests — use axiosClient mocks'))));
}
