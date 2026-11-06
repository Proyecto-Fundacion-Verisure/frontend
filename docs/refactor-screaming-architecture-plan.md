# Plan · Refactor del frontend a Screaming Architecture

> **Estado:** en ejecución. Fases 0 (rama y plan), 1 (esqueleto `app/` + `shared/`), 2 (pilot
> `favorites`) y 3 (`auth` + routing base) completadas en `refactor/screaming-architecture` el
> 7 de noviembre de 2026.
> **Base:** rama `dev` del repositorio `frontend/`, 6 de noviembre de 2026.
> **Baseline verificado:** 56 archivos de test, 405 tests en verde, `vite build` correcto.
> **Complejidad global:** media-alta. **9-11 jornadas** para el núcleo y **12-14 jornadas**
> para el refactor completo con estilos y guardrails.
> **Recomendación:** migración incremental por fases y por PR. No hacer un "big bang".

---

## 1. Objetivo

Que la estructura de `src/` cuente **qué hace el negocio**, no con qué tecnología está hecho.
Al abrir el proyecto debe leerse:

```text
src/
├── app/          # composición: providers, router, layout, shell
├── features/     # actividades, inscripciones, propuestas, cierres...
└── shared/       # UI, API, hooks, utilidades y estilos reutilizables
```

Y al abrir una feature debe encontrarse todo lo suyo junto:

```text
features/registrations/
├── api/
├── components/
├── context/
├── hooks/
├── pages/
├── styles/
├── index.js      # API pública de la feature
└── routes.jsx    # rutas que le pertenecen (cuando aplique)
```

### Qué entra en el refactor

- Reubicar archivos por dominio y por responsabilidad.
- Mover cada API de dominio dentro de su feature.
- Mover contextos, hooks, componentes, páginas, estilos y tests de cada feature.
- Crear `app/` como composition root y `shared/` como kernel técnico.
- Invertir dependencias: el shell deja de conocer APIs de dominio; las features dejan de
  importar el shell.
- Definir una API pública por feature y reglas de dependencia verificables.

### Qué NO entra

- Reescribir lógica, componentes o tests.
- Cambiar el contrato de API, el backend o el comportamiento visible.
- Introducir TypeScript, Redux, Zustand, React Query, Tailwind o un framework de i18n.
- Rediseñar la UI o cambiar selectores/estilos visualmente.
- Arreglar de paso el código legado que incumple las reglas de `AGENTS.md`; eso se hace en
  cambios separados y con tests.

---

## 2. Diagnóstico

### 2.1 Lo que ya está bien

El proyecto no parte de cero:

- Ya existen **10 features** en `src/features/`: `activities`, `auth`, `dashboard`, `favorites`,
  `landing`, `not-found`, `orgs`, `proposals`, `registrations`, `reports`.
- La mayoría de los tests ya viven junto a su feature.
- Cada dominio ya tiene su módulo de API en `src/api/`.
- Hay un único cliente HTTP (`axiosClient`) y una única normalización de errores (`ApiError`).
- La separación `components/ui` vs `components/layout` ya distingue diseño compartido de shell.
- `vite build` y la suite están en verde, lo que permite refactorizar con red de seguridad.

### 2.2 Lo que no grita

| Situación actual | Por qué molesta |
| --- | --- |
| `src/api/*Api.js` global | Una persona nueva no ve qué API pertenece a qué dominio; todo parece infraestructura. |
| `src/components/ui` y `src/components/layout` globales | Mezcla design system con shell de aplicación. |
| `src/hooks`, `src/utils`, `src/constants`, `src/routes` globales | Capas técnicas por encima de los dominios; el negocio queda escondido. |
| `src/styles/pages` y `src/styles/components` globales | Los estilos de una feature no viven con la feature. |
| `src/test` central | Fixtures y mocks de dominios distintos en un mismo sitio. |
| `components/layout/Sidebar/useSidebarCounts.js` importa 5 APIs de dominio | El shell conoce y consulta todos los dominios. |
| `features/dashboard`, `features/proposals` y `features/reports` importan `components/layout/AdminSections` | Una feature depende del shell de la aplicación: dirección prohibida. |
| `features/orgs` importa 3 componentes de `features/dashboard` | Copia de dependencia entre dominios que debería ser `shared` o una API pública explícita. |
| `features/auth` y `features/not-found` importan `routes/routeAccess` | Una feature depende del router. |
| `AppRouter` conoce todas las páginas y una API | El composition root puede conocerlas, pero las rutas deberían ser de cada feature. |

### 2.3 Métricas del baseline

| Métrica | Valor |
| --- | ---: |
| Archivos JS/JSX en `src/` | 183 |
| Archivos dentro de `features/` | 86 |
| Features | 10 |
| Tests | 56 archivos / 405 tests |
| Archivos SCSS | 49 |
| Imports relativos analizados | 421 |
| Imports entre features (producción) | 13 |
| Imports entre features (solo tests) | 5 |
| Módulos de API de dominio | 8 |
| Módulos de API compartidos | 4 (`axiosClient`, `apiError`, `domainMessages`, `mocks`) |

### 2.4 Acoplamientos que hay que resolver

**Features que dependen de otras features (producción):**

- `activities` → `auth` (sesión), `favorites` (corazón), `registrations` (inscripción).
- `reports` → `registrations` (contexto de inscripciones).
- `orgs` → `activities` (`SubmitForReviewButton`) y `dashboard` (`BarChart`, `ChartTable`, `KpiRow`).
- `not-found` → `auth` (`useAuth`).

No hay ciclos de producción entre features, salvo el que crea el shell:

- `auth` → `routes/routeAccess` y `routes` → `auth`.
- `features` → `components/layout/AdminSections` y `routes` → `features`.

**Imports "hacia atrás" desde capas compartidas:**

- `components/layout/*` importa `features/auth`.
- `routes/*` importa todas las features (esto es esperable en el composition root, pero
  `routes/` no debería ser una capa compartida: debe ser `app/routing`).
- `components/layout/Sidebar/useSidebarCounts.js` importa 5 APIs de dominio.
- `test` importa fixtures de varios dominios.

**Dependencias de API cruzadas:**

- `api/orgApi.js` importa `api/authApi.js` para `registerPartner` y `resendVerification`.
- `api/orgApi.js` importa el mock `assets/mock/data/orgDashboard`.

**Estilos:**

- 16 archivos en `styles/pages` y 18 en `styles/components`, todos globales.
- `styles/components/_activity-card.scss` y `_heart-button.scss` son de dominio, no del
  design system.
- `styles/pages/_index.scss` importa todas las páginas en un orden que hoy funciona; mover
  archivos puede alterar la cascada.

---

## 3. Arquitectura objetivo

### 3.1 Árbol propuesto

```text
frontend/src/
├── main.jsx                         # arranque: monta <App />
├── app/
│   ├── App.jsx                      # BrowserRouter + providers + ErrorBoundary
│   ├── providers/
│   │   └── AppProviders.jsx         # AuthProvider, FavoritesProvider...
│   ├── routing/
│   │   ├── AppRouter.jsx            # compone rutas de features
│   │   ├── ProtectedRoute.jsx
│   │   └── RoleRoute.jsx
│   ├── layout/
│   │   ├── AppLayout/
│   │   ├── PublicLayout/
│   │   ├── Topbar/
│   │   ├── Sidebar/
│   │   ├── PublicHeader/
│   │   └── PublicFooter/
│   ├── errors/
│   │   └── ErrorFallback.jsx
│   ├── navigation/
│   │   ├── ActivitiesTabs.jsx
│   │   ├── RequestsTabs.jsx
│   │   ├── AttentionPanel.jsx       # recibe los contadores del shell
│   │   └── useSidebarCounts.js      # única pieza que consulta contadores de dominio
│   ├── dev/
│   │   └── UiShowcase.jsx           # solo en desarrollo
│   └── styles/
│       └── layout/                  # topbar, sidebar, layouts públicos
├── features/
│   ├── activities/
│   │   ├── api/activitiesApi.js
│   │   ├── components/
│   │   │   ├── ActivityCard.jsx
│   │   │   ├── CancelActivityButton.jsx
│   │   │   ├── PartnerActivityReviewActions.jsx
│   │   │   └── SubmitForReviewButton.jsx
│   │   ├── hooks/useActivities.js
│   │   ├── model/spots.js
│   │   ├── pages/
│   │   │   ├── ActivitiesListPage.jsx
│   │   │   ├── ActivityDetailPage.jsx
│   │   │   ├── ActivityFormPage.jsx
│   │   │   └── CatalogPage.jsx
│   │   ├── routes.jsx
│   │   ├── styles/
│   │   └── index.js
│   ├── auth/
│   │   ├── api/authApi.js
│   │   ├── context/AuthContext.jsx
│   │   ├── hooks/useAuth.js
│   │   ├── model/roleHomePaths.js
│   │   ├── components/LoginForm.jsx
│   │   ├── pages/LoginPage.jsx
│   │   ├── styles/login.scss
│   │   └── index.js
│   ├── dashboard/
│   │   ├── api/dashboardApi.js
│   │   ├── components/
│   │   │   ├── DashboardExports.jsx
│   │   │   ├── DashboardFilters.jsx
│   │   │   ├── DashboardRanking.jsx
│   │   │   ├── ExportMenu.jsx
│   │   │   └── MetricProgressList.jsx
│   │   ├── model/downloadFile.js
│   │   ├── pages/DashboardPage.jsx
│   │   ├── styles/dashboard.scss
│   │   └── index.js
│   ├── favorites/
│   │   ├── api/favoritesApi.js
│   │   ├── context/FavoritesContext.jsx
│   │   ├── components/HeartButton.jsx
│   │   ├── styles/heart-button.scss
│   │   └── index.js
│   ├── landing/
│   │   ├── assets/
│   │   ├── components/StatCounter.jsx
│   │   ├── pages/LandingPage.jsx
│   │   ├── styles/landing.scss
│   │   └── index.js
│   ├── not-found/
│   │   ├── pages/NotFoundPage.jsx
│   │   └── index.js
│   ├── orgs/
│   │   ├── api/orgApi.js
│   │   ├── components/
│   │   ├── mocks/orgDashboard.js
│   │   ├── model/orgDashboardDefinitions.js
│   │   ├── pages/
│   │   ├── styles/
│   │   └── index.js
│   ├── proposals/
│   │   ├── api/proposalsApi.js
│   │   ├── components/
│   │   ├── pages/
│   │   ├── styles/
│   │   └── index.js
│   ├── registrations/
│   │   ├── api/registrationsApi.js
│   │   ├── context/RegistrationsContext.jsx
│   │   ├── hooks/useRegistrations.js
│   │   ├── components/
│   │   ├── pages/
│   │   ├── styles/
│   │   └── index.js
│   └── reports/
│       ├── api/closuresApi.js
│       ├── components/
│       ├── pages/
│       ├── styles/
│       └── index.js
└── shared/
    ├── api/
    │   ├── axiosClient.js
    │   ├── apiError.js
    │   ├── domainMessages.js
    │   └── mocks.js
    ├── assets/images/              # logo y recursos de marca compartidos
    ├── charts/
    │   ├── BarChart.jsx
    │   ├── ChartTable.jsx
    │   └── KpiRow.jsx
    ├── domain/activityLines.js     # dato de negocio compartido entre features
    ├── hooks/
    │   ├── useFetch.js
    │   ├── useForm.js
    │   ├── useTheme.js
    │   └── useToast.js
    ├── lib/
    │   ├── dates.js
    │   └── formatNumber.js
    ├── styles/
    │   ├── abstracts/              # tokens, mixins, funciones
    │   ├── base/                   # reset, tipografía, accesibilidad
    │   └── ui/                     # estilos del design system
    ├── testing/
    │   ├── setup.js
    │   ├── renderWithProviders.jsx
    │   ├── testHelpers.js
    │   ├── fixtures/
    │   └── mocks/
    └── ui/
        ├── Badge/
        ├── Button/
        ├── Card/
        ├── EmptyState/
        ├── Input/
        ├── Modal/
        ├── Pagination/
        ├── Select/
        ├── Spinner/
        ├── Table/
        ├── Tabs/
        └── index.js
```

### 3.2 Reglas de dependencia

1. **`app/`** es el composition root. Puede importar `features/*` y `shared/*`.
2. **`features/<x>/`** puede importar `shared/*` y, de forma explícita, la **API pública** de
   otra feature (`features/<y>`), nunca sus archivos internos.
3. **`shared/`** no importa `features/*` ni `app/*`. Si necesita un dato de dominio, se lo
   pasan por props o se mueve el concepto a `shared/domain`.
4. **Ninguna feature importa `app/`**. Si necesita algo del shell, se invierte: el shell se
   lo pasa por props o el componente se mueve a `shared`.
5. **Sin ciclos entre features.** Si aparece uno, el concepto compartido se extrae a `shared/`
   o se resuelve con composición en `app/`.
6. **Una feature = una API pública** (`index.js`). Los imports profundos entre features están
   prohibidos.
7. **Cada feature es dueña de su HTTP**: su `api/` es el único sitio que conoce sus endpoints;
   `shared/api/axiosClient` solo transporta.
8. **El design system no conoce el dominio**: `shared/ui` no importa features.
9. **Los `routes.jsx` de una feature** solo declaran rutas y elementos; no importan `app/`.
   `app/routing` los envuelve en guards y layouts.

### 3.3 Decisiones de diseño

| Decisión | Recomendación | Motivo |
| --- | --- | --- |
| Nombre del contenedor | Mantener `features/` | Ya existe y expresa dominio. Renombrar a `domains/` es cosmético y añade ruido. |
| Auth | Feature `auth` con API pública estable | Es un dominio de soporte, no infraestructura pura. Muchas features consumen `useAuth`. |
| Favoritos y registros | Features propias; `activities` las consume por su API pública | Evita convertir `activities` en una mega-feature. |
| Gráficos | `shared/charts` | `orgs` y `dashboard` los comparten; no son de un dominio. |
| `activityLines` | `shared/domain` | Lo usan `activities`, `dashboard` y `reports`; es un catálogo compartido. |
| `HeartButton` | `features/favorites/components` | Tiene semántica de favoritos; hoy está mal ubicado en `ui`. |
| Estilos | Tokens/base/UI en `shared/styles`; páginas y componentes de dominio en su feature | Evita que un cambio de una página afecte a otra. |
| Alias de imports | Opcional, al final | `@/` reduce `../../../`, pero añade configuración y churn. No es necesario para el objetivo. |
| Lint de fronteras | Script propio sin dependencias | No hay ESLint hoy; no conviene introducir un stack de lint solo para esto. |

### 3.4 Mapa de movimiento

| Origen actual | Destino |
| --- | --- |
| `src/api/axiosClient.js`, `apiError.js`, `domainMessages.js`, `mocks.js` | `src/shared/api/` |
| `src/api/activitiesApi.js` | `src/features/activities/api/` |
| `src/api/authApi.js` | `src/features/auth/api/` |
| `src/api/closuresApi.js` | `src/features/reports/api/` |
| `src/api/dashboardApi.js` | `src/features/dashboard/api/` |
| `src/api/favoritesApi.js` | `src/features/favorites/api/` |
| `src/api/orgApi.js` | `src/features/orgs/api/` |
| `src/api/proposalsApi.js` | `src/features/proposals/api/` |
| `src/api/registrationsApi.js` | `src/features/registrations/api/` |
| `src/components/ui/*` | `src/shared/ui/*` (excepto `HeartButton` → `favorites` y `UiShowcase` → `app/dev`) |
| `src/components/layout/*` | `src/app/layout/*` |
| `src/components/ErrorBoundary/*` | `src/app/errors/ErrorFallback.jsx` |
| `src/routes/*` | `src/app/routing/*` |
| `src/hooks/*` | `src/shared/hooks/*` |
| `src/utils/dates.js` | `src/shared/lib/dates.js` |
| `src/constants/activityLines.js` | `src/shared/domain/activityLines.js` |
| `src/assets/images/*` | `src/shared/assets/images/` o `features/*/assets/` según uso |
| `src/assets/mock/data/orgDashboard.js` | `src/features/orgs/mocks/` |
| `src/styles/abstracts`, `base` | `src/shared/styles/` |
| `src/styles/components` (UI) | `src/shared/styles/ui/` (excepto `_activity-card`, `_heart-button` y `_showcase`) |
| `src/styles/layout` | `src/app/styles/layout/` |
| `src/styles/pages` | `features/*/styles/` |
| `src/test/setup.js`, `utils/`, `fixtures/`, `mocks/` | `src/shared/testing/` |
| `src/features/dashboard/{BarChart,ChartTable,KpiRow}.jsx` | `src/shared/charts/` |
| `src/components/layout/AdminSections` (`AttentionPanel`) | `src/app/navigation/AttentionPanel.jsx` |
| `src/components/layout/AdminSections` (`ActivitiesTabs`, `RequestsTabs`) | `src/app/navigation/` |
| `src/components/ui/UiShowcase` | `src/app/dev/UiShowcase.jsx` |
| `src/components/layout/Sidebar/useSidebarCounts.js` | `src/app/navigation/useSidebarCounts.js` |
| `src/routes/routeAccess.js` | `src/features/auth/model/roleHomePaths.js` |
| `src/components/ui/HeartButton` | `src/features/favorites/components/HeartButton.jsx` |

---

## 4. Estrategia de migración

### 4.1 Reglas del proceso

- Una rama: `refactor/screaming-architecture`, salida de `dev`.
- Un PR por fase. `dev` debe quedar desplegable después de cada PR.
- Usar `git mv` (o el "Move" del IDE) para conservar el historial.
- No dejar archivos "puente" reexportando indefinidamente. Si se usa uno para no romper una
  fase, se marca con fecha y se elimina en la fase siguiente.
- No mezclar este refactor con cambios de comportamiento, rediseños o features nuevas.
- No mover estilos en el mismo PR que lógica.
- Ejecutar después de cada fase:

```bash
cd frontend
npm run test:run
npm run build
```

- Smoke manual de las tres zonas: pública, `ADMIN`, `EMPLOYEE` y `PARTNER`.

### 4.2 Orden por dependencias

1. Primero `shared/` y `app/`, porque casi todas las features los usan.
2. Después las features "hoja" y las fundacionales: `favorites`, `auth`, `landing`, `not-found`.
3. Después las de lectura/escritura simple: `dashboard`, `proposals`.
4. Después las centrales: `registrations`, `reports`, `activities`.
5. Al final `orgs`, que depende de `activities` y de los gráficos compartidos.
6. El shell y las rutas se cierran cuando todas las features ya tienen su API pública.
7. Los estilos y el test kit se mueven al final, con chequeo visual.

---

## 5. Fases

### Fase 0 · Baseline y preparación · 0,5 jornada

**Tareas**

- Crear la rama y confirmar que `npm run smoke` está en verde.
- Guardar el baseline: 56 archivos de test, 405 tests, build correcto.
- Documentar este plan y el mapa de movimiento.
- Revisar que no haya cambios locales en `frontend/`.

**Salida**

- PR con el plan (o commit directo a la rama) y baseline registrado.

**Criterio de aceptación**

- `npm run test:run` y `npm run build` pasan antes de tocar código.

---

### Fase 1 · Esqueleto `app/` + `shared/` · 1 jornada

**Tareas**

- Crear `src/app/` y `src/shared/`.
- Mover `src/api/{axiosClient,apiError,domainMessages,mocks}.js` a `shared/api/`.
- Mover `src/hooks/*` a `shared/hooks/`.
- Mover `src/utils/dates.js` a `shared/lib/dates.js`.
- Mover `src/constants/activityLines.js` a `shared/domain/activityLines.js`.
- Mover `src/components/ui/*` a `shared/ui/*` y actualizar el barril. Dejar fuera
  `HeartButton` (va a `favorites`) y `UiShowcase` (va a `app/dev`).
- Mover `src/styles/abstracts` y `src/styles/base` a `shared/styles/`.
- Mover `src/test/setup.js`, `utils/` y helpers a `shared/testing/`; actualizar
  `vitest.config.js` (`setupFiles`) y los imports de los tests.
- Mover `axiosClient.test.js` y `domainMessages.test.js` a `shared/api/`. Repartir
  `contractApis.test.js` y `proposalsApi.test.js` con su feature o dejarlos en
  `shared/testing/` como test de contrato.
- Crear `src/app/App.jsx` con `BrowserRouter`, `AuthProvider` y `ErrorBoundary`; dejar
  `main.jsx` solo con el montaje y los imports globales.
- Actualizar imports en todas las features, rutas y tests.

**Salida**

- `src/hooks`, `src/utils`, `src/constants` y `src/components/ui` dejan de existir.
- `src/api` conserva solo los endpoints de dominio que se moverán en las fases 2-7.
- La app arranca y los tests pasan.

**Criterio de aceptación**

- `npm run smoke` en verde.
- `grep -R "components/ui" src` no devuelve imports fuera de `shared`.
- No hay imports de `shared` hacia `features`.

**Riesgo**

- Medio: es el PR con más imports mecánicos. Hacerlo con el IDE y revisar el diff completo.

---

### Fase 2 · Pilot: `favorites` · 0,5-1 jornada

**Tareas**

- Mover `api/favoritesApi.js` a `features/favorites/api/`.
- Mover `FavoritesContext.jsx` a `features/favorites/context/`.
- Mover `HeartButton` de `shared/ui` a `features/favorites/components/`.
- Mover `styles/components/_heart-button.scss` a `features/favorites/styles/`.
- Crear `features/favorites/index.js` con `FavoritesProvider`, `useFavorites`,
  `useFavoritesOptional` y `HeartButton`.
- Actualizar `activities` para importar desde `features/favorites` (API pública), no desde
  archivos internos.
- Mover los tests de favoritos y actualizar sus imports.

**Por qué este pilot**

- Es pequeño, pero toca API + contexto + componente de dominio + consumo desde otra feature.
- Valida el patrón de API pública y de imports cruzados antes de tocar las features grandes.

**Criterio de aceptación**

- `activities` no importa `features/favorites/.../FavoritesContext` por ruta profunda.
- El corazón del catálogo y de la ficha sigue funcionando.
- Tests y build en verde.

---

### Fase 3 · `auth` + base de routing · 1-1,5 jornadas

**Tareas**

- Mover `api/authApi.js` a `features/auth/api/`.
- Mover `AuthContext.jsx` a `features/auth/context/`, `useAuth.js` a `hooks/`.
- Mover `LoginForm` y `LoginPage` a `components/` y `pages/`.
- Mover `routes/routeAccess.js` a `features/auth/model/roleHomePaths.js`.
- Crear `features/auth/index.js` con `AuthProvider`, `useAuth`, `LoginPage` y
  `getRoleHomePath`.
- Actualizar `not-found`, `AppLayout`, `Topbar`, `RoleRoute`, `LoginForm` y los tests para
  consumir la API pública de `auth`.
- Mover `ProtectedRoute` y `RoleRoute` a `app/routing/`.
- Crear `features/auth/routes.jsx` con las rutas de login (si se adopta el patrón de rutas
  por feature).

**Criterio de aceptación**

- Ninguna feature importa `routes/`.
- `routes/` deja de existir o queda como fachada de `app/routing`.
- Login, logout, guardas y redirección por rol siguen funcionando.
- Tests de `RouteGuards`, `AuthContext` y `LoginForm` en verde.

---

### Fase 4 · Features hoja + `dashboard` + gráficos compartidos · 1,5 jornadas

**Tareas**

- Mover `landing` completa: `StatCounter`, `LandingPage`, assets y estilos.
- Mover `not-found` completa.
- Mover `dashboard`: API, componentes, `downloadFile`, página, estilos y tests.
- Mover `BarChart`, `ChartTable`, `KpiRow` y `formatDashboardNumber` a `shared/charts` y
  `shared/lib/formatNumber.js`. Así `orgs` deja de depender de `dashboard`.
- Mover `AttentionPanel` de `AdminSections` a `app/navigation/`. Para que `dashboard` no
  importe `app/`, el router le pasa el panel como prop/slot a `DashboardPage`.
- Actualizar `OrgDashboardPage` para importar los gráficos desde `shared/charts`.
- Crear `index.js` en cada feature.

**Criterio de aceptación**

- `orgs` no importa nada de `features/dashboard`.
- `dashboard` no importa `app/navigation` ni `app/layout`; `AttentionPanel` llega por props.
- Tests de `LandingPage`, `NotFoundPage`, `DashboardPage`, `OrgDashboardPage` y gráficos en
  verde.

---

### Fase 5 · `proposals` + `registrations` · 1,5-2 jornadas

**Tareas**

- Mover `proposals`: API, componentes, páginas, estilos y tests.
- Mover `registrations`: API, contexto, hook, componentes, páginas, estilos y tests.
- Mover `RequestsTabs` a `app/navigation/` y hacer que `ProposalsInboxPage` reciba las
  pestañas por props desde `AppRouter` (o que el router las componga), en lugar de importarlas
  del shell.
- Actualizar `activities` para consumir `RegisterButton` y `RegistrationsContext` a través de
  `features/registrations/index.js`.
- Crear `index.js` en ambas features.

**Criterio de aceptación**

- `proposals` y `registrations` no importan `app/`.
- `activities` no importa archivos internos de `registrations`.
- El flujo de inscripción, decisión, cancelación y listado sigue igual.
- Tests de `ProposalsInboxPage`, `ProposalForm`, `RegistrationsTablePage`,
  `RegistrationsSync` y `MyVolunteeringPage` en verde.

---

### Fase 6 · `reports` + `activities` · 2-2,5 jornadas

Es la fase más grande. Se recomienda dividirla en dos PR: primero `reports`, después
`activities`.

**Tareas**

- Mover `reports`: `closuresApi`, páginas, componentes, estilos y tests.
- Mover `activities`: API, componentes, hook, modelo (`spots`), páginas, estilos y tests.
- Mover `ActivitiesTabs` a `app/navigation/` y pasar las pestañas por props desde el router.
- Mover `PENDING_REVIEW_PATH` y la composición de rutas de actividades a
  `features/activities/routes.jsx`.
- Hacer que `activities` consuma `auth`, `favorites` y `registrations` solo por su API pública.
- Mover los estilos de páginas y de `ActivityCard` a `features/activities/styles/`.
- Crear `index.js` en ambas features.

**Criterio de aceptación**

- `reports` no importa `app/layout/AdminSections`.
- `activities` no importa archivos internos de otras features.
- Catálogo, ficha, alta/edición, cancelación, revisión y cierres siguen funcionando.
- Tests de actividades, cierres y certificados en verde.

---

### Fase 7 · `orgs` + limpieza del shell · 1 jornada

**Tareas**

- Mover `orgApi` a `features/orgs/api/` y el mock de dashboard a `features/orgs/mocks/`.
- Mover páginas, definiciones y estilos de `orgs`.
- Mantener `orgs -> activities` solo para `SubmitForReviewButton`, a través de la API pública
  de `activities`.
- Mantener `orgs -> auth` solo para `registerPartner` y `resendVerification`, documentado
  como dependencia permitida, o mover esas dos funciones a la API de `orgs` si el equipo
  prefiere que la entidad no dependa de `auth`.
- Mover `AppLayout`, `PublicLayout`, `Topbar`, `Sidebar`, `PublicHeader` y `PublicFooter` a
  `app/layout/`.
- Mover `useSidebarCounts` a `app/navigation/`; es la única pieza que puede consultar APIs de
  varios dominios.
- Actualizar `AppRouter` para componer rutas de features y eliminar los imports directos de
  páginas y APIs desde el router.
- Borrar `src/components`, `src/routes`, `src/api`, `src/hooks`, `src/utils` y
  `src/constants` cuando estén vacíos.

**Criterio de aceptación**

- `src/` solo contiene `app/`, `features/`, `shared/` y `main.jsx`.
- Ninguna feature importa `app/`.
- `shared/` no importa `features/`.
- El menú, los contadores, las pestañas y las guardas de rol siguen funcionando.
- Smoke manual de los cuatro perfiles.

---

### Fase 8 · Estilos, test kit y guardrails · 2-3 jornadas (completa)

**Tareas**

- Mover los SCSS de páginas a `features/*/styles/` y los de layout a `app/styles/layout/`.
  Reparto orientativo:
  - `_login` → `auth`; `_account-status`, `_org-register` → `orgs`.
  - `_activities-list`, `_activity-detail`, `_activity-form`, `_catalog`, `_activity-card` →
    `activities`.
  - `_dashboard` → `dashboard`; `_landing` → `landing`.
  - `_my-volunteering`, `_registrations-table` → `registrations`.
  - `_proposal`, `_proposals-inbox` → `proposals`.
  - `_certificate`, `_closure-form` → `reports`.
- Mantener en `shared/styles/` solo tokens, abstracts, base y estilos de `shared/ui`.
- Actualizar `main.scss` (o `app/styles/index.scss`) con el orden de imports:
  abstracts/base → shared/ui → app/layout → features.
- Cada hoja de feature debe `@use` los abstracts que necesite; no depender de que otra hoja
  los haya cargado antes.
- Mover fixtures y mocks de dominio a `features/*/test/` o dejarlos en `shared/testing/` si
  son contractuales y compartidos.
- Añadir `scripts/check-architecture.mjs`:
  - `shared` no importa `features` ni `app`.
  - `features/<x>` no importa `app`.
  - los imports entre features solo apuntan a `features/<y>` (no a rutas internas).
  - no hay ciclos entre features.
- Añadir `npm run arch:check` y ejecutarlo en `smoke`.
- Actualizar `AGENTS.md` con la nueva estructura y las reglas de frontera.

**Criterio de aceptación**

- `npm run smoke` incluye tests, build y comprobación de arquitectura.
- Chequeo visual a 390, 1280 y 1440 px de las pantallas principales.
- No hay cambios de selectores ni de tokens; solo movimiento de archivos.
- `AGENTS.md` refleja el árbol nuevo.

---

## 6. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
| --- | --- | --- | --- |
| Cascada Sass alterada | Media | Alto | Mover estilos al final; no cambiar selectores; revisar visualmente. |
| Ciclo de dependencias entre features | Media | Alto | API pública + `arch:check`; extraer a `shared` si aparece. |
| Orden de providers roto | Baja | Alto | `AppProviders` explícito y tests de contexto. |
| Rutas/guardas mal recompuestas | Media | Alto | Tests de `RouteGuards` y smoke de los 4 perfiles. |
| Imports profundos entre features | Alta durante la migración | Medio | Regla de API pública y script de fronteras desde la fase 1. |
| Conflictos de merge | Media-alta si hay varios devs | Medio | Un PR por feature, rama corta, rebase diario. |
| `useSidebarCounts` acoplado a 5 dominios | Alta | Medio | Moverlo a `app/navigation`; es composición, no shared. |
| `orgApi` depende de `authApi` | Baja | Bajo | Documentar la arista o mover las dos funciones a `orgs`. |
| Tests con imports rotos | Alta | Bajo | Mover tests con su feature; suite completa en cada PR. |
| Pérdida de historial Git | Baja | Bajo | `git mv`, no copiar/borrar. |
| Bundle size por barriles | Baja | Bajo | Evitar barriles gigantes; exportar lo necesario; comparar build. |
| Refactor eterno | Media | Alto | Fases cerradas, PRs pequeños, criterio de aceptación por fase. |

---

## 7. Complejidad

### 7.1 Por dimensión

| Dimensión | Nivel | Por qué |
| --- | --- | --- |
| Movimiento mecánico | Media | 183 archivos JS/JSX y 421 imports relativos; la mayoría son cambios de ruta. |
| Reasignación de dependencias | Media-alta | 13 aristas entre features, shell que consulta 5 dominios y features que importan el shell. |
| Estado global | Media | `AuthContext`, `FavoritesContext` y `RegistrationsContext`; hay que preservar el orden de providers. |
| Rutas y guardas | Media-alta | `AppRouter` centraliza páginas, roles, redirecciones y pestañas. |
| Estilos | Alta | 49 SCSS, orden de cascada y riesgo de regresión visual. |
| Tests | Media | 56 archivos / 405 tests; ya están cerca de las features, pero cambian imports. |
| Tooling | Baja-media | No hay lint; el script de fronteras es sencillo y sin dependencias. |
| **Global** | **Media-alta** | No es una reescritura, pero tampoco es un movimiento trivial: hay que invertir dependencias del shell y de las rutas. |

### 7.2 Esfuerzo estimado

Supuestos: una persona con contexto del proyecto, sin cambiar comportamiento, con la suite
en verde y sin features nuevas en paralelo.

| Escenario | Alcance | Esfuerzo | Calendario orientativo |
| --- | --- | --- | --- |
| **MVP núcleo** | `app/` + `shared/` + todas las features con API/contexto/componentes/páginas/rutas; sin mover estilos ni test kit | **9-11 jornadas** | ~2-2,5 semanas |
| **Completo** | MVP + estilos co-localizados + test kit + `arch:check` + docs | **12-14 jornadas** | ~3 semanas |
| **Solo estructura mínima** | `app/` + `shared/` + APIs dentro de features; sin tocar shell/rutas/estilos | **3-5 jornadas** | ~1 semana |
| **Big bang** | Todo en una rama y un PR | 2-4 jornadas | No recomendado: riesgo alto y revisión inviable |

Con dos personas en paralelo, el calendario puede bajar a **1,5-2 semanas**, pero solo si se
reparten features disjuntas y una sola persona toca `AppRouter`, `useSidebarCounts` y los
barriles compartidos. Si no, los conflictos se comen la ganancia.

Añadir un **20 % de buffer** si el equipo está en plena entrega o si hay que coordinar con
demo.

### 7.3 Recomendación

1. **Hacer el MVP núcleo primero.** Es el 80 % del beneficio: `src` pasa a gritar dominio y
   desaparecen las capas técnicas globales.
2. **Dejar estilos y test kit para el final.** Son los que más ruido visual y de diff generan
   y no son necesarios para validar la arquitectura.
3. **No introducir alias ni lint de fronteras al principio.** Primero mover, luego medir.
4. **No hacerlo antes de una demo o entrega.** Aunque el riesgo lógico es bajo, el diff es
   grande y la revisión lleva tiempo.
5. **Actualizar `AGENTS.md` al terminar.** Si no, el siguiente agente volverá a crear archivos
   en `src/api` o `src/components/ui`.

---

## 8. Checklist de aceptación final

- [ ] `src/` solo contiene `app/`, `features/`, `shared/` y `main.jsx`.
- [ ] Cada feature tiene `api/`, `components/`, `pages/` (cuando aplica), `styles/` e
      `index.js`.
- [ ] Cada feature es dueña de su HTTP; no hay llamadas Axios en componentes.
- [ ] `shared/` no importa `features/` ni `app/`.
- [ ] Ninguna feature importa `app/`.
- [ ] Los imports entre features pasan por su `index.js`.
- [ ] No hay ciclos entre features.
- [ ] `AppRouter` compone rutas de features; no importa APIs de dominio salvo composición
      justificada.
- [ ] `useSidebarCounts` vive en `app/navigation`.
- [ ] `HeartButton` vive en `favorites`; los gráficos compartidos en `shared/charts`.
- [ ] `activityLines` vive en `shared/domain` si lo consumen varias features.
- [ ] Los 405 tests siguen pasando.
- [ ] `npm run build` sigue generando el bundle sin errores.
- [ ] Smoke manual de pública, `ADMIN`, `EMPLOYEE` y `PARTNER`.
- [ ] Chequeo visual a 390, 1280 y 1440 px.
- [ ] `AGENTS.md` actualizado con la estructura y las reglas de frontera.

---

## 9. Decisiones que necesita confirmar el equipo

1. **¿MVP núcleo o refactor completo?** Recomendación: MVP primero, estilos después.
2. **¿Se mantiene `features/` o se renombra a `domains/`?** Recomendación: mantener.
3. **¿Se permite `orgs -> auth` para el alta de entidad?** Recomendación: sí, documentado, o
   mover esas dos llamadas a `orgApi`.
4. **¿Se permite `orgs -> activities` para `SubmitForReviewButton`?** Recomendación: sí, vía
   API pública; es una acción de negocio real.
5. **¿Se añade alias `@/`?** Recomendación: no en la primera iteración.
6. **¿Se añade un script de fronteras propio o `dependency-cruiser`?** Recomendación: script
   propio sin dependencias; migrar a `dependency-cruiser` solo si el equipo lo adopta.
7. **¿Se mueven los estilos en este refactor o en uno posterior?** Recomendación: posterior,
   con PR propio y chequeo visual.
