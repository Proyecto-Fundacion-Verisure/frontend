import { isDevelopmentMockEnabled } from './mockConfig';

/** Compatibilidad para los módulos integrados en paralelo durante el Sprint 4. */
export const isMockEnabled = (module) => isDevelopmentMockEnabled(module);

export default isMockEnabled;
