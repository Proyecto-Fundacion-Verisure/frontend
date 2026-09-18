/**
 * Interruptor de los mocks de desarrollo que quedan.
 *
 * Toda la aplicación va contra el backend real salvo dos pantallas que aún no
 * tienen controlador: el dashboard de la entidad (`ORG`, `GET /org/dashboard`,
 * en `orgApi.js`) y el formulario público de propuestas de la landing
 * (`PROPOSAL`, `POST /api/proposals`, en `proposalsApi.js`). Los mocks de los
 * módulos integrados se retiraron: con el backend apagado esas pantallas
 * fallan, que es lo honesto.
 *
 *   VITE_USE_MOCKS=false             apaga los dos
 *   VITE_USE_ORG_MOCKS=false         apaga solo ese, dejando el otro
 *
 * La variable de módulo manda sobre la global.
 *
 * Dos reglas que no se negocian por configuración:
 *
 * - **En producción nunca hay mocks.** `import.meta.env.DEV` corta antes que
 *   cualquier variable.
 * - **En modo test tampoco, salvo que alguien lo pida por su nombre.** Los tests
 *   montan sus dobles con `vi.mock`, y un mock por debajo haría pasar pruebas que
 *   no prueban nada. La excepción es un test que prueba el mock en sí, como
 *   `proposalsApi.test.jsx`: ese lo enciende con `vi.stubEnv` de su módulo.
 */
export const isMockEnabled = (module) => {
  if (!import.meta.env.DEV) return false;

  const forModule = import.meta.env[`VITE_USE_${module}_MOCKS`];
  if (forModule !== undefined) return forModule !== 'false';

  if (import.meta.env.MODE === 'test') return false;

  return import.meta.env.VITE_USE_MOCKS !== 'false';
};

export default isMockEnabled;
