# Plan · Integración real del login (frontend ↔ backend)

## Contexto

El login es lo único que está terminado en los dos lados, pero **nunca se han hablado entre ellos**. Hoy, al arrancar el frontend con `npm run dev`, `src/api/authApi.js` intercepta el login y devuelve un usuario falso identificado por el prefijo del correo, ignorando la contraseña. El backend, por su parte, sirve `POST /api/auth/login` desde el filtro `JWTAuthentication` y emite un JWT real de 2 horas.

El objetivo de esta tarea es cerrar ese circuito: que el formulario de login del frontend autentique contra el backend real, guarde el JWT que este emite, lo mande en `Authorization: Bearer` y muestre correctamente los cuatro desenlaces posibles (éxito, credenciales incorrectas y los tres estados de cuenta). El resto de pantallas siguen con datos simulados, porque sus endpoints todavía no existen.

Al comparar los dos lados aparecen **tres desajustes reales** que impiden que la integración funcione tal cual está. Este plan los arregla, todos en el frontend, sin tocar `docs/api-contract.md` ni código del backend.

## Punto de partida verificado

| | Backend | Frontend |
|---|---|---|
| Rama | `b3-05-...` (no se toca) | `dev`, limpia |
| Puerto | `8080`, sin `context-path` | Vite en `5173`, `strictPort` |
| Base URL | `http://localhost:8080/api/...` | `VITE_API_URL=http://localhost:8080/api` ✅ coincide |
| CORS | `CorsConfig.java`, origen `http://localhost:5173`, cabeceras `Authorization` y `Content-Type` | manda solo `Content-Type: application/json` ✅ compatible |
| Login | filtro `security/filter/JWTAuthentication.java` | `src/api/authApi.js` → **mockeado** ❌ |
| Respuesta | `AuthResponse { accessToken, tokenType, expiresIn, user }` | lee `accessToken` y `user` ✅ coincide |
| Errores | `ApiError { code, message, timestamp, path, fields }` | `normalizeApiError` lee `data.code`, `data.message`, `data.fields` ✅ coincide |

No hace falta proxy en `vite.config.js`: las llamadas van directas y CORS ya las permite.

## Los tres desajustes a corregir

### 1. El login está mockeado en desarrollo

`src/api/authApi.js:4-8` activa los mocks salvo que `VITE_USE_MOCKS` valga exactamente `'false'`, y `.env.development` no define esa variable.

### 2. Un 401 en el propio login expulsa la sesión

`src/api/axiosClient.js:38` llama a `clearSession({ notify: true })` ante **cualquier** 401. Con credenciales incorrectas eso dispara el evento `auth:unauthorized`, que `AuthContext.jsx:58-66` traduce en una navegación a `/login` con `state.sessionExpired`. Resultado: quien se equivoca de contraseña ve el aviso «Tu sesión ha caducado» **además** del error del formulario, y `LoginForm` pierde su estado en la navegación. El 401 del login no es una sesión caducada: es una respuesta esperada del formulario.

### 3. `RoleRoute` bloquea a toda entidad colaboradora

`src/routes/RoleRoute.jsx:9` redirige a `/account-status` si `user.role === 'PARTNER' && user.status !== 'ACTIVE'`. El `UserResponse` del backend **no tiene campo `status`** y el contrato tampoco lo define, así que con datos reales `status` es `undefined` y ninguna entidad podría entrar. El campo sobra: `CustomAuthenticationManager` ya rechaza en el login cualquier cuenta que no esté `ACTIVE`, con 403 y su código `ACCOUNT_*`. Quien tiene token está activo por construcción.

## Cambios

Todos en `/Users/andrea/Documents/Desarrollo/verisure/frontend`, en una **rama nueva a partir de `dev`**.

### 0. Preparar la rama y dejar el plan en el repositorio

Dos cosas, en comandos separados —no encadenados con `&&`— para que rechazar una no arrastre a la otra:

1. Copiar este plan a `/Users/andrea/Documents/Desarrollo/verisure/backend/docs/integracion-login-plan.md`, es decir, al `docs/` **de este repositorio**, junto a `be3-plan.md` y `api-contract.md`. Se queda **sin versionar**: no entra en ningún commit.
2. Crear la rama de trabajo en el frontend a partir de `dev`.

### 1. Interruptor propio para el mock de auth

`VITE_USE_MOCKS` no sirve para esto: la leen **dos** módulos, `authApi.js` y `proposalsApi.js`. Ponerla a `false` mandaría también las propuestas al backend real, y ahí no hay nada que las atienda — los únicos controladores son `AuthController`, `UserController` y `ActivityClosureController`, no existe `ProposalController`. Se romperían la bandeja de propuestas del ADMIN (`GET /api/admin/proposals` → 404) y el formulario público (`POST /api/proposals` → 404).

Así que el interruptor del login se separa. En `src/api/authApi.js:4-8`:

```js
const useDevelopmentMocks = () => (
  import.meta.env.DEV
  && import.meta.env.MODE !== 'test'
  && import.meta.env.VITE_USE_AUTH_MOCKS !== 'false'
);
```

Y en `.env.development`, `VITE_USE_AUTH_MOCKS=false`. `VITE_USE_MOCKS` se queda sin definir, así que las propuestas siguen mockeadas.

El mock de login **no se borra**: sigue disponible poniendo `VITE_USE_AUTH_MOCKS=true` en un `.env.local`, para quien necesite mover pantallas sin levantar el backend ni PostgreSQL.

Actualizar `.env.example` con las dos variables y un comentario de una línea que diga cuál apaga qué.

No rompe tests: `src/api/contractApis.test.js:84` hace `vi.stubEnv('VITE_USE_MOCKS', 'false')`, pero ese fichero no prueba `login`, y en modo test los mocks ya están apagados por la condición `MODE !== 'test'`.

### 2. `src/api/axiosClient.js` — no cerrar sesión por un 401 del login

Extraer el criterio a una función con nombre y usarla en el interceptor, en línea con la regla del proyecto de dar nombre a las condiciones:

```js
const LOGIN_PATH = '/auth/login';

function isSessionExpiry(error) {
  const isUnauthorized = error?.response?.status === 401;
  const isLoginAttempt = error?.config?.url?.endsWith(LOGIN_PATH);
  return isUnauthorized && !isLoginAttempt;
}
```

El interceptor pasa a `if (isSessionExpiry(error)) clearSession({ notify: true });`. El error se sigue normalizando y rechazando igual, así que `LoginForm` recibe su `ApiError` con `status: 401` y pinta «Credenciales no válidas» (que viene del `message` del backend, vía `getResponseMessage` en `src/api/apiError.js:27-33`).

### 3. `src/routes/RoleRoute.jsx` — tratar `status` ausente como activa

```js
const isBlockedPartner = user.role === 'PARTNER'
  && user.status !== undefined
  && user.status !== 'ACTIVE';
```

Mantiene verde el test existente de `RouteGuards.test.jsx` que pasa un partner `PENDING_APPROVAL` en fixture, y deja pasar al usuario real, que no trae el campo. Un comentario de una frase en castellano explicando el porqué no deducible: el backend nunca emite token a una cuenta no activa.

### 4. `src/api/authApi.js` — limpieza mínima

Los usuarios mock `ong` y `pendiente` llevan un campo `status` que el backend no devuelve. Se deja el mock como está (sigue sirviendo para `npm run dev` sin backend), pero se añade un comentario de una línea avisando de que `status` es exclusivo del mock. **No** se borra el mock ni el fichero huérfano `src/assets/mock/data/authApi.js`: queda fuera del alcance de esta tarea.

### 5. `README.md` — credenciales reales

La sección «Cuentas locales disponibles con mocks» solo lista los correos falsos. Añadir junto a ella un bloque con las cuentas de los seeders del backend, que son con las que se prueba la integración. Contraseña única: `Verisure2026!` (`seeder/UserSeeder.java:49`).

| Correo | Rol | Resultado esperado |
|---|---|---|
| `carmen.ortega@fundacionverisure.org` | ADMIN | entra en `/dashboard` |
| `ana.gil@verisure.es` | EMPLOYEE | entra en `/activities` |
| `marta.ribas@caritasbcn.org` | PARTNER | entra en `/org/activities` |
| `pau.estevez@caritasbcn.org` | PARTNER | 403 `ACCOUNT_NOT_VERIFIED` |
| `elena.vargas@aldeasinfantiles.org` | PARTNER | 403 `ACCOUNT_PENDING_APPROVAL` |
| `rosa.delgado@manosunidas.org` | PARTNER | 403 `ACCOUNT_REJECTED` |

### 6. Tests

Añadir a `src/api/axiosClient.test.js` un caso nuevo: **un 401 de `/auth/login` no dispara `auth:unauthorized` ni borra el `accessToken`**, complementando el que ya existe para el 401 de cualquier otra ruta.

Añadir `src/features/auth/LoginForm.test.jsx`, que hoy no existe, con tres casos contra `login` mockeado con `vi.fn()`: navega al home del rol tras un login correcto, pinta el mensaje del error 401 sin navegar, y pinta el mensaje traducido de un 403 `ACCOUNT_PENDING_APPROVAL` (`MENSAJES` de `src/api/domainMessages.js` ya lo tiene).

## Qué queda fuera, a propósito

- **No se toca el backend.** Ni `UserResponse`, ni `docs/api-contract.md`, ni `SpringConfig`.
- **No se unifica el criterio de mocks** del resto de módulos: sus endpoints aún no existen y dejarlos sin datos rompería pantallas que hoy se ven.
- **No se arregla `ProposalDetailPage`.** `getProposal`, `acceptProposal` y `rejectProposal` de `src/api/proposalsApi.js:126-130` nunca están mockeados, así que esa pantalla ya falla hoy en dev, antes y después de este cambio. Es un fallo real, pero de propuestas, no de login.
- **No se implementa `GET /auth/verify` ni `resend-verification`** en el frontend: el backend no los sirve todavía (devuelven 404), aunque estén en el contrato.
- **No se añade rehidratación con `GET /auth/me`** al arrancar la app. Sería una mejora razonable —hoy un token caducado no se detecta hasta la primera llamada—, pero el 401 ya está bien gestionado y esto pertenece a la integración de sesión, no a la del login.
- No se toca `rememberMe`, ni el `location.state.from`, ni la recuperación de contraseña.

## Verificación de extremo a extremo

1. **Backend arriba.** En `verisure/backend`, con PostgreSQL local y un `.env` que tenga `DB_URL`, `DB_USER`, `DB_PASSWORD` y `JWT_SECRET` (sin este último la aplicación no arranca a propósito): `./mvnw spring-boot:run`. Esperar `Started BackendApplication` y comprobar que los seeders han poblado usuarios.
2. **Comprobación sin navegador**, para separar un fallo de API de uno de CORS:
   ```bash
   curl -i -X POST http://localhost:8080/api/auth/login \
     -H 'Content-Type: application/json' \
     -d '{"email":"ana.gil@verisure.es","password":"Verisure2026!"}'
   ```
   Debe dar 200 con `accessToken`, `tokenType: "Bearer"`, `expiresIn: 7200` y el objeto `user`. Repetir con `rosa.delgado@manosunidas.org` y verificar 403 con `"code": "ACCOUNT_REJECTED"`.
3. **Frontend arriba.** En `verisure/frontend`: `npm run dev`. Tiene que servir en `http://localhost:5173` exactamente, porque es el único origen que acepta `CorsConfig`.
   Comprobar de paso que la **bandeja de propuestas del ADMIN sigue mostrando las cinco propuestas simuladas** y que el formulario público de propuesta se sigue enviando: es lo que confirma que solo hemos apagado el mock del login.
4. **Recorrido en el navegador**, con la pestaña de red abierta:
   - Entrar con la cuenta EMPLOYEE. Verificar en `Application → Local Storage` que hay un `accessToken` que **no** empieza por `mock-token-`, y que la petición ha salido a `localhost:8080` con respuesta 200.
   - Confirmar que la siguiente petición autenticada lleva la cabecera `Authorization: Bearer ...`.
   - Contraseña incorrecta: se queda en `/login`, sale el error del formulario y **no** aparece el aviso de sesión caducada.
   - Las tres cuentas de estado: cada una muestra su mensaje en castellano y ninguna entra.
   - Entrar con la cuenta PARTNER activa: llega a `/org/activities` y **no** rebota a `/account-status`.
   - Pulsar «Cerrar sesión»: 204 en la red, `localStorage` vacío y vuelta a `/login`.
5. **Suite completa**: `npm run smoke` (tests + build) en verde.

## Commits

Un commit en el frontend, mensaje en inglés de una sola línea, sin coautoría, y pidiendo permiso antes de hacerlo. Nada de `git push`.
