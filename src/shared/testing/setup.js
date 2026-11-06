import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// jsdom + matchers + auto-cleanup. This file is the single Vitest setup entry.
// All API mocks live in src/test/** and are outside the production bundle (vite build excludes src/test).
// No real network is used: tests stub axiosClient or api modules with vi.fn / ApiError.

// Node ≥ 22 expone un `localStorage` global experimental que, sin
// `--localstorage-file`, es un objeto vacío sin `getItem`/`clear`. Vitest lo
// deja por delante del de jsdom y todos los tests que tocan la sesión caían con
// «localStorage.clear is not a function». Si el que hay no es un Storage de
// verdad, se sustituye por uno en memoria con la misma API.
function createMemoryStorage() {
  const store = new Map();
  return {
    get length() { return store.size; },
    key: (index) => Array.from(store.keys())[index] ?? null,
    getItem: (key) => (store.has(String(key)) ? store.get(String(key)) : null),
    setItem: (key, value) => { store.set(String(key), String(value)); },
    removeItem: (key) => { store.delete(String(key)); },
    clear: () => { store.clear(); },
  };
}

for (const name of ['localStorage', 'sessionStorage']) {
  if (typeof globalThis[name]?.clear !== 'function') {
    const storage = createMemoryStorage();
    Object.defineProperty(globalThis, name, { value: storage, configurable: true, writable: true });
    if (typeof window !== 'undefined' && window !== globalThis) {
      Object.defineProperty(window, name, { value: storage, configurable: true, writable: true });
    }
  }
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Defensive: ensure no real fetch slips through in tests
if (!globalThis.fetch || globalThis.fetch.name !== 'mockConstructor') {
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('fetch is mocked in tests — use axiosClient mocks'))));
}
