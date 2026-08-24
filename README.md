# Frontend Verisure

Aplicación web para gestionar el catálogo de actividades de voluntariado, las inscripciones, propuestas, reportes y el panel de seguimiento.

## Tecnologías

- React 19 y React Router
- Vite
- Sass (arquitectura 7-1 adaptada al proyecto)
- Axios para la comunicación con la API
- Vitest, React Testing Library y jsdom para pruebas

## Requisitos

- Node.js 20 o posterior
- npm 10 o posterior
- Una API disponible en la URL configurada en `VITE_API_URL`

## Primer arranque

```bash
npm install
cp .env.example .env.local
npm run dev
```

Vite se ejecuta en [http://localhost:5173](http://localhost:5173).

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Inicia Vite en modo desarrollo. |
| `npm run build` | Genera el bundle de producción. |
| `npm test` | Abre Vitest en modo interactivo. |
| `npm run test:run` | Ejecuta todas las pruebas una vez. |
| `npm run test:coverage` | Ejecuta las pruebas y genera cobertura. |

## Variables de entorno

Vite carga `.env.development` durante el desarrollo y `.env.test` al ejecutar Vitest. Las variables expuestas al navegador deben empezar por `VITE_`.

| Variable | Valor de desarrollo | Uso |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:8080/api` | URL base usada por Axios. |
| `VITE_APP_ORIGIN` | `http://localhost:5173` | Origen del cliente Vite. |

No se deben versionar secretos. Para cambios locales, crea `.env.local` a partir de `.env.example`; Git lo ignora automáticamente.

## CORS de la API

CORS se configura en el backend, no en React. La API debe permitir el origen de Vite durante el desarrollo:

```http
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

Si la autenticación utiliza cookies, añade `Access-Control-Allow-Credentials: true`; en ese escenario no se puede usar `Access-Control-Allow-Origin: *`.

## Organización del código

```text
src/
├── api/          # Cliente Axios y endpoints por dominio
├── components/
│   ├── ui/       # Componentes reutilizables (Button, Card, Modal, Table…)
│   └── layout/   # Topbar, Sidebar y layouts por tipo de usuario
├── features/     # Páginas, componentes y lógica agrupados por funcionalidad
├── hooks/        # Hooks transversales: useFetch, useForm y useToast
├── routes/       # Router y guards de autenticación/rol
├── styles/       # Sass: abstracts, base, components, layout y pages
├── test/         # Configuración de pruebas compartida
└── utils/        # Utilidades sin dependencia de React
```

Cada feature se organiza por dominio: `auth`, `landing`, `activities`, `enrollments`, `proposals`, `reports` y `dashboard`. Las peticiones HTTP se centralizan en `src/api`; el token se incorpora desde `localStorage` por el interceptor de Axios.

## Estilos

El punto de entrada es `src/styles/main.scss` y solo contiene directivas `@use`. Los estilos se separan en:

- `abstracts`: tokens de color, radios, sombras, breakpoints y mixins.
- `base`: reset, tipografía y utilidades de accesibilidad.
- `components`: estilos de componentes reutilizables.
- `layout`: estructura global, topbar, sidebar y grid.
- `pages`: reglas específicas de landing, dashboard y certificado.

El certificado incluye estilos de impresión en `_certificate.scss`.

### Sistema de componentes UI

Los componentes compartidos se exportan desde `src/components/ui/index.js`. Incluyen variantes, foco visible, estados `disabled`, `loading` y `error`, y atributos accesibles:

```jsx
import { Button, Input, ProgressBar } from './components/ui';

<Input label="Correo" error={errors.email} required />
<ProgressBar label="Plazas ocupadas" value={8} max={12} showValue />
<Button isLoading={isSubmitting}>Guardar</Button>
```

`UiShowcase` contiene ejemplos visuales reutilizables de Button, Input, Select, Textarea, Modal, Table, Badge, Card, ProgressBar, EmptyState y Spinner. Con `npm run dev`, está disponible en [http://localhost:5173/ui-kit](http://localhost:5173/ui-kit). La ruta solo existe en desarrollo y no se incluye en la navegación de producción.

Los valores de marca y los tokens semánticos viven en `src/styles/abstracts/_variables.scss`; los componentes no deben incorporar colores, espacios o breakpoints nuevos fuera de ese archivo.

## Pruebas

Vitest está configurado con `jsdom` y React Testing Library. El setup global incorpora los matchers de `@testing-library/jest-dom` y limpia el DOM después de cada prueba.

```bash
npm run test:run
npm run test:coverage
```

Coloca las pruebas junto al componente o módulo que validan, con el sufijo `*.test.jsx` o `*.test.js`.
