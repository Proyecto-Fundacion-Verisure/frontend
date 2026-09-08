# Testing — contrato backend v2

Este directorio contiene **mocks contractuales** que reproducen el backend v2 sin depender de red.

- **Entorno:** `jsdom` + `vitest` globals + `@testing-library/jest-dom` matchers + `afterEach(cleanup)` en `setup.js`.
- **Helpers:** `utils/renderWithProviders.jsx` expone `renderWithProviders(ui, {route, user, authValue})` (Router + `AuthContext`) y `renderWithRouter`.
- **Fixtures:** `fixtures/*` definen enums y DTOs idénticos a v2:
  - `RegistrationStatus` (`WAITLISTED, CONFIRMED, REJECTED, CANCELLED, PENDING_CLOSURE, CLOSED`) + `accepted:boolean`, `queuePosition?`
  - `MyRegistrationItem{registrationId, activity, status, queuePosition?, closureId?, activityClosed}`
  - `CreateClosureRequest{registrationId, actualHours, rating, comment?, evidenceConsent}` + parte `evidence` separada (multipart `request`/`evidence`, 10 MB)
  - `ActivityClosureResponse` y `Page<ActivityClosureRow>` para el cierre administrativo
  - `ProposalStatus NEW/ACCEPTED/REJECTED` + `PROPOSAL_ALREADY_DECIDED 409`
  - `AuthResponse{accessToken, tokenType:'Bearer', expiresIn:7200, user:UserResponse}` / `UserResponse` (roles `ADMIN/EMPLOYEE/PARTNER`, `UserStatus`)
  - Subida portada `image` 5 MB (`415/413`), evidencia `request/evidence` 10 MB
  - `CancelRequest{reason?}` y `SaveActivityClosureRequest` en camelCase
- **Mocks:** `mocks/*` simulan respuestas y errores comunes, incluidos `ALREADY_REGISTERED`, `REGISTRATION_NOT_CONFIRMED`, `ACTIVITY_NOT_CLOSED`, `CLOSURE_ALREADY_CLOSED` y `CIF_ALREADY_REGISTERED`.
- **Fuera de producción y sin red:** todo bajo `src/test/**`, excluido de `vite build` y de `coverage`. Los tests hacen `vi.mock('./axiosClient' | '../../api/*')` con `ApiError`; `setup.js` hace `vi.stubGlobal('fetch', vi.fn())` defensivo. No prueban integración real.
- **Sin Enrollment:** ningún mock usa `Enrollment` ni `/api/enrollments`; rutas canónicas son `/api/registrations` y `PATCH /registrations/{id}/cancel`. Verificado por `grep -r enrollments` (debe ser vacío salvo `enrolledIds` local en `CatalogPage`).
- **Visibilidad detalle:** público `PUBLISHED/FULL/IN_PROGRESS/FINISHED → 200`, `DRAFT/CANCELLED → 404`; administrativo permite cualquier estado (`GET /admin/activities/{id}`).
- **Uso:** `import { makeClosureDetail, makeMyRegistrationItem } from './fixtures'` en tests de contrato.
