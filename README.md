# Frontend Verisure

Aplicación React para gestionar el voluntariado de Fundación Verisure: catálogo, inscripciones, propuestas, cierres, entidades colaboradoras y dashboard de impacto.

## Requisitos

- Node.js 20 o posterior.
- npm 10 o posterior.
- Backend disponible cuando se prueben flujos sin mocks.
- Navegador actualizado: Chrome, Firefox, Edge o Safari.

## Dependencias

| Categoría | Paquete | Uso |
| --- | --- | --- |
| Dependencias | `react` / `react-dom` ^19.1 | UI y renderizado. |
| | `react-router-dom` ^7.5 | Enrutado, rutas protegidas y por rol. |
| | `axios` ^1.8 | Cliente HTTP con interceptores. |
| | `lucide-react` ^1.34 | Iconografía. |
| | `react-error-boundary` ^6.1 | Límite de errores global. |
| DevDependencies | `vite` ^6.3, `vitest` ^3.1 | Bundler y runner de pruebas. |
| | `@testing-library/*`, `jsdom`, `@vitest/coverage-v8` | Pruebas de componentes e informes de cobertura. |
| | `sass` ^1.86 | Compilación de los estilos Sass. |

## Instalación y primer arranque

```bash
git clone <url-del-repositorio>
cd frontend
npm ci
cp .env.example .env.local
npm run dev
```

La aplicación queda disponible en [http://localhost:5173](http://localhost:5173). `npm ci` instala exactamente las versiones registradas en `package-lock.json` y es el comando recomendado para un entorno limpio o CI.

## Variables de entorno

Las variables que Vite expone al navegador deben empezar por `VITE_`. `.env.local` está ignorado por Git y no debe contener secretos: cualquier valor incluido en el bundle frontend puede ser inspeccionado por una persona usuaria.

| Variable | Ejemplo | Uso |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:8080/api` | URL base de Axios. |
| `VITE_APP_ORIGIN` | `http://localhost:5173` | Origen local que debe admitir el CORS del backend. |
| `VITE_USE_MOCKS` | `false` | Usa `true` únicamente para la demo local. El valor predeterminado prueba la integración real. |
| `VITE_USE_<MODULO>_MOCKS` | sin definir | Permite activar explícitamente un único módulo aunque el modo demo global esté apagado. |

El interruptor vive en `src/api/mockConfig.js`. En producción nunca se habilitan mocks. En desarrollo, una variable ausente tampoco los activa: así un fallo de integración no queda oculto por accidente. Las variables por módulo (`AUTH`, `REGISTRATION`, `ACTIVITY`, `CLOSURE`, `PROPOSAL`, `ORG`, `DASHBOARD` y `FAVORITE`) son útiles para trabajar de forma aislada cuando un endpoint todavía no está disponible.

Después de cambiar una variable hay que reiniciar Vite. Los mocks nunca se habilitan en producción ni en los tests: el interruptor exige `import.meta.env.DEV` y descarta `MODE === 'test'`, donde cada test monta los suyos con `vi.mock`.

## Comandos

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Inicia Vite en modo desarrollo. |
| `npm run build` | Genera el bundle optimizado en `dist/`. |
| `npm test` | Abre Vitest en modo interactivo. |
| `npm run test:run` | Ejecuta todas las pruebas una vez. |
| `npm run test:coverage` | Ejecuta las pruebas y genera el informe de cobertura. |
| `npm run demo:reset` | Restaura los datos de demo de forma idempotente. |
| `npm run smoke` | Ejecuta `test:run` seguido de `build` como comprobación rápida. |

## Arquitectura

```text
src/
├── api/          # Cliente Axios, errores y endpoints por dominio
├── assets/       # Imágenes, iconos y datos mock usados en desarrollo
├── components/
│   ├── ErrorBoundary/  # Límite de errores global de la aplicación
│   ├── layout/   # AppLayout, PublicLayout, Topbar, Sidebar y footer
│   └── ui/       # Componentes compartidos y accesibles
├── constants/    # Valores compartidos, como líneas de acción
├── features/     # Pantallas y lógica agrupadas por funcionalidad
├── hooks/        # Hooks transversales
├── routes/       # Router, rutas protegidas y autorización por rol
├── styles/       # Sass 7-1: abstracts, base, componentes, layout y páginas
└── test/         # Fixtures, mocks y utilidades exclusivas de pruebas
```

Las llamadas HTTP viven en `src/api`; una pantalla no debe llamar a Axios directamente. La lógica específica permanece dentro de su `feature` y los patrones reutilizables se llevan a `components/ui`.

### Módulos de funcionalidad (`src/features`)

| Módulo | Responsabilidad |
| --- | --- |
| `activities` | Catálogo, listado, detalle, alta/edición y cancelación de actividades; acciones de revisión de entidad. |
| `auth` | Login, contexto de sesión y hook de autenticación. |
| `dashboard` | KPIs, gráficos, ranking, exportaciones y filtros del dashboard de impacto. |
| `favorites` | Contexto de actividades favoritas del catálogo. |
| `landing` | Página pública de inicio y contadores de impacto. |
| `not-found` | Página 404. |
| `orgs` | Alta de entidad, dashboard, propuestas e impacto de la entidad colaboradora; estado de cuenta. |
| `proposals` | Formulario, detalle, bandeja de entrada, aceptación y confirmación de propuestas. |
| `registrations` | Inscripciones: catálogo, voluntariado propio, tabla de gestión, cancelación y decisiones. |
| `reports` | Cierres (individual y global), certificados y formularios de reporte. |

## Demo — datos definitivos y restauración idempotente

Datos versionados en `public/demo-data.json` (4 actividades `PUBLISHED/FULL/IN_PROGRESS/FINISHED`, inscripciones `active` WAITLISTED q3/q1 + `closed` CLOSED, 2 propuestas NEW/ACCEPTED, 2 orgs pendientes) y `docs/DEMO.md`.

```bash
npm ci && npm run demo:reset && npm run smoke # = test:run + build
# o en navegador: localStorage.clear(); location.reload()
```

`scripts/restore-demo.js` es idempotente (N ejecuciones sin duplicar). Los mocks solo se activan de forma explícita con `VITE_USE_MOCKS=true` y no tienen fallos aleatorios. Ver `docs/DEMO.md` para la prueba de humo.

### Convención de nombres

Los componentes reutilizables siguen la estructura `NombreCarpeta/NombreCarpeta.jsx`, por ejemplo `Button/Button.jsx`. No se crean archivos `index.jsx`. `index.js` se reserva para exportaciones agrupadas, como `components/ui/index.js`.

Los tests se colocan junto a la unidad probada y usan `*.test.jsx` o `*.test.js`.

## Rutas, autenticación y roles

`AuthContext` conserva `accessToken` y `user` en `localStorage`. El interceptor de Axios añade `Authorization: Bearer <token>`. Ante un `401`, limpia la sesión y devuelve a `/login`. `ProtectedRoute` exige sesión y `RoleRoute` restringe cada área.

| Área | Rutas principales | Rol |
| --- | --- | --- |
| Pública | `/`, `/login`, `/new-proposal` o `/proposal`, `/register-organization`, `/account-status` | Sin sesión |
| Fundación | `/dashboard`, `/proposals`, `/activities/:id`, `/activities/:id/registrations`, `/activities/new`, `/activities/:id/edit`, `/admin/activities`, `/admin/activities/pending-closure`, `/admin/activities/:id/closure`, `/admin/account-status` | `ADMIN` |
| Empleado | `/activities`, `/activities/:id`, `/my-volunteering`, `/my-activities`, `/closures/new`, `/closures/:id`, `/closures/:id/certificate` | `EMPLOYEE` |
| Entidad | `/org/dashboard`, `/org/activities`, `/org/activities/new`, `/org/proposals`, `/org/proposals/new`, `/org/reports` | `PARTNER` |

Algunas rutas son compartidas: `/closures/:closureId` y `/activities/:activityId` están disponibles para `ADMIN` y `EMPLOYEE`. En desarrollo también existe `/ui-kit` para el muestrario de componentes, y hay redirecciones de compatibilidad: `/explore` → `/activities`, `/inscriptions` → `/activities/6/registrations` y `/closes` → `/admin/activities/pending-closure`.

Las cuentas de entidad pueden estar en `PENDING_VERIFICATION`, `PENDING_APPROVAL`, `ACTIVE` o `REJECTED`. En integración real el backend no emite JWT a una cuenta no activa; si `status` no está presente en el usuario autenticado, el frontend considera válida la sesión que el backend acaba de autorizar.

### Cuentas locales

El login ya autentica contra el backend real, así que **las cuentas que sirven son las de la semilla**, no las del mock. Todas comparten la contraseña `Verisure2026!`, que es un dato de demostración y no un secreto: existen solo fuera de producción, porque `UserSeeder` lleva `@Profile("!prod")`. El identificador es el correo completo.

| Correo | Rol/estado | Inicio |
| --- | --- | --- |
| `carmen.ortega@fundacionverisure.org` | `ADMIN` | `/dashboard` |
| `ana.gil@verisure.es` | `EMPLOYEE` | `/activities` |
| `marta.ribas@caritasbcn.org` | `PARTNER · ACTIVE` | `/org/activities` |
| `pau.estevez@caritasbcn.org` | `PARTNER · PENDING_VERIFICATION` | 403 `ACCOUNT_NOT_VERIFIED` |
| `elena.vargas@aldeasinfantiles.org` | `PARTNER · PENDING_APPROVAL` | 403 `ACCOUNT_PENDING_APPROVAL` |
| `rosa.delgado@manosunidas.org` | `PARTNER · REJECTED` | 403 `ACCOUNT_REJECTED` |

Hay ocho `EMPLOYEE` más en la semilla, con el patrón `nombre.apellido@verisure.es`.

#### Cuentas del mock de login

Solo aplican con el backend apagado, poniendo `VITE_USE_AUTH_MOCKS=true`. El mock identifica el usuario por el comienzo del correo y **no valida la contraseña**, porque estos datos nunca salen del navegador: `admin@verisure.com` (`ADMIN`), `empleado@verisure.com` (`EMPLOYEE`), `ong@fundacion.org` (`PARTNER · ACTIVE`) y `pendiente@entidad.org` (`PARTNER · PENDING_APPROVAL`).

## Contrato backend v2

Los JSON usan `camelCase`. La entidad se llama `Registration` y sus rutas parten de `/api/registrations`.

### Inscripciones

- `POST /api/registrations` crea una inscripción.
- `GET /api/registrations/me` devuelve `List<MyRegistrationItem>`.
- La lista usa `closureId` y `activityClosed` para mostrar el cierre o el certificado.
- Las decisiones administrativas y la cancelación usan `PATCH`.
- La cancelación común es `PATCH /api/registrations/{id}/cancel`, con un motivo opcional.
- `accepted` es un booleano separado de `RegistrationStatus`. Una solicitud puede estar aceptada administrativamente y continuar en `WAITLISTED` si no hay plaza.
- `RegistrationStatus`: `WAITLISTED`, `CONFIRMED`, `REJECTED`, `CANCELLED`, `PENDING_CLOSURE` y `CLOSED`.

### Cierres

El cierre individual se envía a `POST /api/closures` como multipart, con la parte JSON `request` y la evidencia opcional `evidence`. La Fundación gestiona el cierre global de la actividad en `/api/admin/activities/{id}/closure`.

### Propuestas

`ProposalStatus` admite únicamente `NEW`, `ACCEPTED` y `REJECTED`. Crear una propuesta es público; listar, aceptar o rechazar requiere administración.

### Dashboard

`GET /api/dashboard` recibe solamente `year` y `line`. Esos mismos filtros se usan en las exportaciones:

- `/api/dashboard/participations.csv`: participaciones seudonimizadas, sin nombre ni correo.
- `/api/dashboard/partners.csv`: entidades, actividades y horas.
- `/api/dashboard/report.pdf`: indicadores y gráficos.

Las descargas se solicitan como `blob` y la interfaz libera cada `ObjectURL` después de iniciar la descarga.

### Errores

El interceptor transforma todas las respuestas fallidas en `ApiError`, con `status`, `code`, `fieldErrors`, `isNetworkError` e `isCanceled`. Los códigos de dominio se traducen en un único diccionario, `src/api/domainMessages.js`, para no duplicar mensajes en formularios y pantallas.

Los errores de validación por campo se muestran junto al control correspondiente. Los estados `401`, `403`, `404`, `409`, `413`, `415`, `429` y `500` tienen un comportamiento explícito y recuperable cuando corresponde.

## Mocks e integración real

Hay dos capas diferentes:

- Los mocks de desarrollo permiten recorrer los flujos sin levantar el backend. Se activan de forma explícita con `VITE_USE_MOCKS=true`; también se puede activar un módulo concreto con `VITE_USE_<MODULO>_MOCKS=true`.
- Los fixtures y mocks de `src/test/` se usan únicamente con Vitest; no forman parte del bundle de producción. Incluyen usuarios `ADMIN`, `EMPLOYEE` y `PARTNER`, estados de cuenta de entidad y respuestas de los principales dominios.
- La integración real requiere que `VITE_API_URL` apunte al backend. Hoy están integrados el login y el módulo de inscripciones —«Mis voluntariados» y el tablero—; el resto sigue en mocks hasta que su backend exista.

No se deben añadir reglas de negocio a los mocks ni inferir campos que no estén en el contrato. Si el backend cambia, primero se actualizan el contrato y los fixtures, después la implementación.

## Comprobación visual y accesibilidad

Antes de entregar una pantalla se recorre con teclado y se comprueban foco visible, etiquetas, mensajes de error, estados de carga y vacío. Los anchos de referencia son:

- Escritorio: 1280 px y 1440 px.
- Adaptable: 390 px.

No debe aparecer desplazamiento horizontal accidental; los controles táctiles deben medir al menos 44 × 44 px y el texto debe poder leerse sin zoom.

## Tests, build y entrega

Antes de abrir un PR:

```bash
npm ci
npm run test:run
npm run build
git diff --check
```

Flujo recomendado:

1. Actualizar `dev` y crear una rama corta desde ella: `feature/<issue>-descripcion` o `fix/<issue>-descripcion`.
2. Mantener commits pequeños con mensajes que expliquen la intención.
3. Añadir pruebas del flujo principal y de al menos un estado límite o error.
4. Confirmar los anchos de escritorio y 390 px cuando afecte a interfaz.
5. Abrir un PR hacia `dev`, enlazar la issue y describir cómo se verificó.
6. No mezclar cambios ajenos a la tarea ni subir `.env.local`, tokens, datos personales o archivos generados.

El diseño funcional de referencia está en [Figma](https://www.figma.com/design/D3nU4lVWHOTVRtTNeMyjol/Fundacion-Verisure-Voluntariado?node-id=0-1&p=f).
