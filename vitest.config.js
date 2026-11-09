import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/shared/testing/setup.js'],
    css: true,
    restoreMocks: true,
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      exclude: ['src/shared/testing/**', 'src/app/testing/**'],
      // Suelo un poco por debajo de la cobertura real para que el CI avise si
      // alguien baja la guardia, sin fallar por un archivo nuevo pequeño.
      thresholds: {
        lines: 85,
        functions: 82,
        branches: 75,
        statements: 83,
      },
    },
  },
});
