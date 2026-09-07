# Frontend Verisure

Aplicación React para gestionar el voluntariado de Fundación Verisure: catálogo, inscripciones, propuestas, cierres, entidades colaboradoras y dashboard de impacto.

## Requisitos

- Node.js 20 o posterior.
- npm 10 o posterior.
- Backend disponible cuando se prueben flujos sin mocks.
- Navegador actualizado: Chrome, Firefox, Edge o Safari.

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
| `VITE_USE_MOCKS` | `true` | Activa en desarrollo los mocks locales disponibles de autenticación y propuestas. Usa `false` para integración real. |

Después de cambiar una variable hay que reiniciar Vite. `VITE_USE_MOCKS` nunca habilita mocks en producción.

## Comandos

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Inicia Vite en modo desarrollo. |
| `npm run build` | Genera el bundle optimizado en `dist/`. |
| `npm test` | Abre Vitest en modo interactivo. |
| `npm run test:run` | Ejecuta todas las pruebas una vez. |
| `npm run test:coverage` | Ejecuta las pruebas y genera el informe de cobertura. |

## Arquitectura

```text
src/
├── api/          # Cliente Axios, errores y endpoints por dominio
├── assets/       # Imágenes, iconos y datos mock usados en desarrollo
├── components/
│   ├── layout/   # Topbar, Sidebar y layouts
│   └── ui/       # Componentes compartidos y accesibles
├── constants/    # Valores compartidos, como líneas de acción
├── features/     # Pantallas y lógica agrupadas por funcionalidad
├── hooks/        # Hooks transversales
├── routes/       # Router, rutas protegidas y autorización por rol
├── styles/       # Sass 7-1: tokens, base, componentes, layout y páginas
└── test/         # Fixtures, mocks y utilidades exclusivas de pruebas
```

Las llamadas HTTP viven en `src/api`; una pantalla no debe llamar a Axios directamente. La lógica específica permanece dentro de su `feature` y los patrones reutilizables se llevan a `components/ui`.

### Convención de nombres

Los componentes reutilizables siguen la estructura `NombreCarpeta/NombreCarpeta.jsx`, por ejemplo `Button/Button.jsx`. No se crean archivos `index.jsx`. `index.js` se reserva para exportaciones agrupadas, como `components/ui/index.js`.

Los tests se colocan junto a la unidad probada y usan `*.test.jsx` o `*.test.js`.

## Rutas, autenticación y roles

`AuthContext` conserva `accessToken` y `user` en `localStorage`. El interceptor de Axios añade `Authorization: Bearer <token>`. Ante un `401`, limpia la sesión y devuelve a `/login`. `ProtectedRoute` exige sesión y `RoleRoute` restringe cada área.

| Área | Rutas principales | Rol |
| --- | --- | --- |
| Pública | `/`, `/login`, `/new-proposal`, `/register-organization` | Sin sesión |
| Fundación | `/dashboard`, `/admin/activities`, `/activities/new`, `/proposals` | `ADMIN` |
| Empleado | `/activities`, `/activities/:id`, `/my-volunteering`, `/reports/:id/certificate` | `EMPLOYEE` |
| Entidad | `/org/activities`, `/org/proposals`, `/org/reports` | `ORG` |

Las cuentas de entidad pueden estar en `PENDING_VERIFICATION`, `PENDING_APPROVAL`, `ACTIVE` o `REJECTED`. Una sesión `ORG` no activa se conserva para mostrar el estado de la cuenta; no se trata como una sesión anónima.

### Cuentas locales disponibles con mocks

El mock identifica el usuario por el comienzo del correo; la contraseña no se valida porque estos datos nunca salen del navegador.

| Correo | Rol/estado | Inicio |
| --- | --- | --- |
| `admin@verisure.com` | `ADMIN` | `/dashboard` |
| `empleado@verisure.com` | `EMPLOYEE` | `/activities` |
| `ong@fundacion.org` | `ORG · ACTIVE` | `/org/activities` |
| `pendiente@entidad.org` | `ORG · PENDING_APPROVAL` | Estado de cuenta |

## Contrato backend v2

Los JSON usan `camelCase`. La entidad se llama `Registration` y sus rutas parten de `/api/registrations`.

### Inscripciones

- `POST /api/registrations` crea una inscripción.
- `GET /api/registrations/me` devuelve las inscripciones de la persona autenticada.
- Las decisiones administrativas y la cancelación usan `PATCH`.
- La cancelación común es `PATCH /api/registrations/{id}/cancel`, con un motivo opcional.
- `accepted` es un booleano separado de `RegistrationStatus`. Una solicitud puede estar aceptada administrativamente y continuar en `WAITLISTED` si no hay plaza.
- `RegistrationStatus`: `WAITLISTED`, `CONFIRMED`, `REJECTED`, `CANCELLED`, `PENDING_REPORT` y `CLOSED`.

### Propuestas

`ProposalStatus` admite únicamente `NEW`, `ACCEPTED` y `REJECTED`. Crear una propuesta es público; listar, aceptar o rechazar requiere administración.

### Dashboard

`GET /api/dashboard` recibe solamente `year` y `line`. Esos mismos filtros se usan en las exportaciones:

- `/api/dashboard/export/participations.csv`: participaciones seudonimizadas, sin nombre ni correo.
- `/api/dashboard/export/partners.csv`: entidades, actividades y horas.
- `/api/dashboard/export/report.pdf`: indicadores y gráficos; el PDF es opcional para el MVP.

Las descargas se solicitan como `blob` y la interfaz libera cada `ObjectURL` después de iniciar la descarga.

### Errores

El interceptor transforma todas las respuestas fallidas en `ApiError`, con `status`, `code`, `fieldErrors`, `isNetworkError` e `isCanceled`. Los códigos de dominio se traducen en un único diccionario, `src/api/domainMessages.js`, para no duplicar mensajes en formularios y pantallas.

Los errores de validación por campo se muestran junto al control correspondiente. Los estados `401`, `403`, `404`, `409`, `413`, `415`, `429` y `500` tienen un comportamiento explícito y recuperable cuando corresponde.

## Mocks e integración real

Hay dos capas diferentes:

- Los mocks de desarrollo permiten recorrer el acceso y los flujos de propuestas disponibles sin levantar todo el backend. Se activan con `VITE_USE_MOCKS=true`.
- Los fixtures y mocks de `src/test/` se usan únicamente con Vitest; no forman parte del bundle de producción. Incluyen usuarios `ADMIN`, `EMPLOYEE` y `ORG`, estados de cuenta de entidad y respuestas de los principales dominios.
- La integración real se activa con `VITE_USE_MOCKS=false` y requiere que `VITE_API_URL` apunte al backend. Los flujos sin mock local, incluido el dashboard, siempre usan la API.

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
