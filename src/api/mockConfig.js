/**
 * Los mocks de navegador son siempre opt-in. De este modo una variable ausente
 * nunca oculta por accidente un fallo de integración con el backend.
 */
export function isDevelopmentMockEnabled(module) {
  if (!import.meta.env.DEV) return false;

  if (module) {
    const moduleFlag = import.meta.env[`VITE_USE_${module}_MOCKS`];
    if (moduleFlag !== undefined) return moduleFlag === 'true';
  }

  if (import.meta.env.MODE === 'test') return false;
  return import.meta.env.VITE_USE_MOCKS === 'true';
}
