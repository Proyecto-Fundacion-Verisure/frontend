/**
 * Interruptor de mocks, en dos niveles.
 *
 * Mientras haya módulos sin backend, apagar los mocks tiene que poder hacerse
 * módulo a módulo: login, inscripciones, catálogo, actividades, alta de entidad,
 * actividades y propuestas de la entidad, bandeja de propuestas, cierres,
 * dashboard y cuentas de entidad ya están integrados, pero el dashboard de la
 * entidad y el formulario público de propuestas no tienen backend todavía y
 * necesitan seguir en falso.
 *
 * Las claves van por backend, no por fichero. `orgApi.js` reparte cinco:
 * `ORG_REGISTER` (alta), `ORG_ACTIVITY` (actividades de la entidad),
 * `ORG_PROPOSAL` (propuestas de la entidad), `ORG_ACCOUNT` (bandeja de cuentas
 * del admin y reenvío de verificación) y `ORG` (el dashboard de la entidad, que
 * sigue sin controlador). Y `proposalsApi.js` dos: `PROPOSAL_INBOX` (bandeja y
 * detalle del admin) y `PROPOSAL` (el formulario público de la landing,
 * `POST /api/proposals`, sin controlador). Con una sola clave, encender lo
 * integrado mandaría `/org/dashboard` y `/proposals` contra endpoints que no
 * existen y devuelven 404.
 *
 * `CLOSURE`, `DASHBOARD` y `ORG_ACCOUNT` ya no tienen mock: su clave está en
 * `INTEGRATED` para dejar constancia, pero encenderla no haría nada.
 *
 *   VITE_USE_MOCKS=false                 apaga todos los módulos
 *   VITE_USE_REGISTRATION_MOCKS=false    apaga solo ese, dejando el resto
 *
 * La variable de módulo manda sobre la global, así que también sirve para lo
 * contrario: dejar uno encendido con todo lo demás apagado.
 *
 * Tres reglas que no se negocian por configuración:
 *
 * - **En producción nunca hay mocks.** `import.meta.env.DEV` corta antes que
 *   cualquier variable.
 * - **En modo test tampoco, salvo que alguien lo pida por su nombre.** Los tests
 *   montan sus dobles con `vi.mock`, y un mock por debajo haría pasar pruebas que
 *   no prueban nada. La excepción es un test que prueba el mock en sí —los hay,
 *   como `proposalsApi.test.jsx`—: ese lo enciende con `vi.stubEnv` de su módulo,
 *   que es explícito y se lee en el propio fichero de test.
 * - **Un módulo ya integrado no vuelve al mock por la global.** Ver `INTEGRATED`.
 */

/**
 * Módulos que ya hablan con el backend de verdad.
 *
 * El estado de integración vive aquí, en el código, y no solo en un `.env`:
 * reescribir `.env.development` y olvidar una línea fue precisamente lo que
 * devolvió el login al mock, donde las cuentas reales de la semilla no existen
 * y todas respondían «Credenciales inválidas.». La global ya no puede
 * remockearlos; solo su propia variable de módulo, que sigue siendo la
 * escotilla para trabajar con el backend apagado.
 */
const INTEGRATED = new Set([
  'AUTH',
  'REGISTRATION',
  'CATALOG',
  'ACTIVITY',
  'ORG_REGISTER',
  'ORG_ACTIVITY',
  'ORG_PROPOSAL',
  'PROPOSAL_INBOX',
  'CLOSURE',
  'DASHBOARD',
  'ORG_ACCOUNT',
]);

export const isMockEnabled = (module) => {
  if (!import.meta.env.DEV) return false;

  const forModule = import.meta.env[`VITE_USE_${module}_MOCKS`];
  if (forModule !== undefined) return forModule !== 'false';

  if (import.meta.env.MODE === 'test') return false;

  if (INTEGRATED.has(module)) return false;

  return import.meta.env.VITE_USE_MOCKS !== 'false';
};

export default isMockEnabled;
