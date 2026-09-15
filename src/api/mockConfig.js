/**
 * Los mocks de navegador son siempre opt-in. De este modo una variable ausente
 * nunca oculta por accidente un fallo de integración con el backend.
 */
export function isDevelopmentMockEnabled() {
  return import.meta.env.DEV
    && import.meta.env.VITE_USE_MOCKS === 'true';
}
