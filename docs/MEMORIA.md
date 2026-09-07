# Memoria Final — Fundación Verisure Voluntariado

**Proyecto:** Plataforma de voluntariado corporativo — 3 roles (Público / Empleado / Organización / Admin)  
**Equipo:** FemCoders P9 — @elenaalmansacampos (Elena), @fabileoruf, resto equipo  
**Fecha:** 2026-09-07  
**Rama:** `dev` + `47-h14-myvolunteeringpage` / `45-h13-icono-heart` → `frontend:dev`  
**Entorno limpio:** `npm ci` + `.env.example` (sin secretos), `VITE_API_URL=http://localhost:8080/api`

---

## 1. Arquitectura

```
frontend/
├── src/api/              # axiosClient (interceptor 401 → auth:unauthorized), authApi, activitiesApi, registrationsApi, reportsApi, proposalsApi, orgApi, dashboardApi
├── src/components/ui/    # Button, Card, Modal (portal, focus trap, inert), Table, HeartButton (Lucide), EmptyState, Spinner, Badge...
├── src/components/layout/# AppLayout (Topbar+Sidebar+Outlet), PublicLayout, PublicHeader/Footer
├── src/features/
│   ├── landing/          # LandingPage (misión, cifras, CTA)
│   ├── auth/             # AuthContext (accessToken+user en localStorage), LoginPage
│   ├── activities/       # CatalogPage, ActivityDetailPage (sticky), ActivityCard, ActivityFormPage
│   ├── registrations/    # RegistrationsContext, MyVolunteeringPage, RegistrationsTablePage, RegisterButton, RegistrationInfoModal
│   ├── proposals/        # ProposalForm, ProposalsInboxPage, ProposalDetailPage
│   ├── reports/          # ReportsQueuePage, ReportFormPage, CertificatePage
│   ├── orgs/             # OrgRegisterPage, AccountStatusPage, OrgActivitiesPage, OrgProposalsPage, OrgImpactPage
│   ├── dashboard/        # DashboardPage
│   └── not-found/        # NotFoundPage
├── src/routes/           # AppRouter, ProtectedRoute, RoleRoute, routeAccess (ROLE_HOME_PATHS)
├── src/hooks/            # useForm, useFetch, useToast
├── src/styles/           # abstracts (tokens $color-coral #E03A33, $color-muted #4A5A6E), base, components, layout, pages
├── src/test/             # setup.js (jsdom, jest-dom, cleanup), fixtures/*, mocks/*, utils/renderWithProviders
└── public/               # demo-data.json, images
```

**Stack:** React 19.1, React Router 7.5, Vite 6.4, Sass 1.86 (7-1), Axios 1.8, Vitest 3.1 + Testing Library, Lucide React, react-error-boundary.

**Patrones:** Feature-based, `components/ui` reutilizable, `api/` centralizado con `ApiError{status,code,fieldErrors,isNetworkError}`, `AuthContext` + `auth:unauthorized` event, `RegistrationsContext`/`FavoritesContext` para sincronía tarjeta↔ficha sin recarga, `Modal` portal con `aria-modal` + `inert`.

---

## 2. Decisiones clave

| Decisión | Alternativa descartada | Motivo |
|----------|------------------------|--------|
| **Sass 7-1 + tokens** | CSS Modules / Tailwind | Consistencia con `abstracts/_variables.scss`, contraste AA (#E03A33 4.6:1, #4A5A6E) |
| **Heart Lucide `Heart` con `fill`** | `♥/♡` caracteres | Escalabilidad, `aria-pressed`, `isLoading` spinner, estados relleno/vacío verificables |
| **RegistrationsContext + FavoritesContext** | Prop drilling / Redux | Sincronía catálogo↔ficha sin recarga (H13, H15), evita `favoriteCount` global |
| **Modal portal + focus trap + inert** | `dialog` nativo | Control total `Escape`, `backdrop`, `focus-ring` navy, `prefers-reduced-motion` |
| **MSW descartado, `vi.mock` + fixtures** | MSW | Mocks contractuales fuera de prod (`src/test/**` excluido de build), sin red, deterministas |
| **Org mock `isMockEnabled=DEV&&!test` + delay 300ms** | `USE_MOCK_API=true` aleatorio | Demo estable (sin `failRate 0.1`), idempotente |
| **MyRegistrationsResponse `{active,closed}`** | Filtrado local por `status` | No reclasificar, confiar en backend, mostrar cola y `accepted` directo |

---

## 3. Modelo (backend v2)

**Roles:** `PÚBLICO` (no auth) → `EMPLOYEE` (`VERISURE_ES`, `ACTIVE`) → `ORG` (`PENDING_VERIFICATION → PENDING_APPROVAL → ACTIVE/REJECTED`) → `ADMIN`.

**Actividad:** `DRAFT → PENDING_APPROVAL → PUBLISHED` (public: `PUBLISHED/FULL/IN_PROGRESS/FINISHED` 200, `DRAFT/CANCELLED` 404). Campos: `registrationDeadline` (cierre), `capacity`/`registeredCount`, `favoritedByMe` (sin `favoriteCount`).

**Inscripción:** `WAITLISTED/CONFIRMED/REJECTED/CANCELLED/PENDING_REPORT/CLOSED` + `accepted:boolean` + `queuePosition?` (nunca `ACTIVITY_FULL`). `POST /registrations {activityId} → 201 WAITLISTED`, `PATCH /cancel` sin `reason` para propietaria, `DELETE` no usado.

**MyRegistrationItem:** `{registrationId, activity{id,title,partner,startDate,endDate,hours}, status, queuePosition?, reportId?, reportStatus?, canCancel?}` → `MyRegistrationsResponse`.

**Reporte:** `POST /reports` 201 nuevo / 200 reenvío `RETURNED` mismo `reportId` / 409 `REPORT_ALREADY_SUBMITTED`; `GET /reports/pending → Page<ReportSummary>` vs `GET /reports/:id → ReportDetailResponse`; `validatedHours`/`note`.

**Propuesta:** `NEW/ACCEPTED/REJECTED` + `409 PROPOSAL_ALREADY_DECIDED`; `CIF` validación + `429`.

---

## 4. Pruebas

**Vitest `jsdom` + Testing Library, 37 suites / 233 tests (2026-09-07):**

| Dominio | Pruebas destacadas |
|---------|-------------------|
| `CatalogPage` | filtros `line/mode/q` → URL, paginación `x-total-count`, `Ya estás apuntado`, sin `favoriteCount`, nested Link corregido |
| `ActivityDetailPage` | 404, recarga por `activityId`, sticky solo desktop, `favoritedByMe`, cola `WAITLISTED q3`, `accepted` |
| `MyVolunteeringPage` | `active/closed` sin filtros, `queuePosition` directo, `Aceptada/Pendiente`, `Enviar/Corregir`, cancel Modal, `DEADLINE_PASSED/ NOT_OWNER`, ocultación tras `startDate` |
| `RegisterButton` | `WAITLISTED` inicial, `FULL` admite cola, `ALREADY_REGISTERED/DEADLINE_PASSED` no cambia UI, anti-doble |
| `HeartButton` | Lucide relleno/vacío, `aria-pressed`, `isLoading` spinner, revierte 404/409, sin contador, persiste entre sesiones |
| `ProposalsInbox/RegistrationsTable` | `aria-label` por fila, `409 PROPOSAL_ALREADY_DECIDED` |
| `OrgRegister/AccountStatus` | `409 CIF_ALREADY_REGISTERED`, `410 VERIFICATION_EXPIRED`, `PENDING_*` |
| `contract.fixtures` | 23 tests enums `WAITLISTED/CONFIRMED...`, `REPORT_ALREADY_SUBMITTED`, mismo `reportId` |
| `smoke` | Landing → Catálogo → Ficha → Mis inscripciones → Dashboard (público/empleado/admin) |

**Cobertura:** `v8` excluye `src/test/**`; `npm run test:coverage` genera `coverage/`.

---

## 5. Evidencias versionadas

| Artefacto | Ruta | Verificación |
|-----------|------|--------------|
| Flujo 3 roles | `prototipo/User_Flow_Verisure_3roles_Evaluacion.pdf` + `frontend/docs/User_Flow_3roles_Evaluacion.pdf` | Reemplaza P9 (2 roles) |
| Fuente diagrama | `prototipo/User_Flow_Verisure_3roles.drawio` (pendiente Figma) | Versionado |
| Mockups | `verisure-mockups-v3 2/*.html` + `capturas/*` (44 PNG) | 7 ORG nuevas |
| Demo datos | `public/demo-data.json`, `scripts/restore-demo.js`, `docs/DEMO.md` | `npm run demo:reset` idempotente |
| Código 3 roles | `src/routes/*`, `features/orgs/*`, `api/orgApi.js` | 36 suites |
| Entorno limpio | `.env.example`, `.gitignore` (`.env.local` no versionado) | `npm ci && npm run smoke` |

`grep -R "entidad social" verisure-mockups-v3 2/*.html` → 0 en evaluable (solo copy público `LandingPage`).

---

## 6. Reparto real

| Integrante | Responsabilidad | Entregables |
|------------|-----------------|-------------|
| **Elena** | Frontend MVP, catálogo/ficha, inscripciones, cierres, ORG, accesibilidad FE1, demo | `Activity*`, `Registrations*`, `HeartButton`, `MyVolunteeringPage`, `DEMO.md`, `MEMORIA.md` |
| **Fabileoruf** | PO, 24 historias, backend v2 (#150 etc.), revisión docs | `project-items.json`, issues #41-#51, #74 |
| **Equipo** | QA, presentación, segunda revisión | `GUION.md`, ensayos cronométricos |

Todos los pasos producen `public/demo-data.json`, `docs/*.md`, `prototipo/*.pdf` y `npm run smoke` como evidencia verificable. Revisión por segunda persona requerida antes de merge a `dev`.
