# Testing — contrato backend v2

Este directorio contiene **mocks contractuales** que reproducen el backend v2 sin depender de red.

- **Entorno:** `jsdom` + `vitest` globals + `@testing-library/jest-dom` matchers + `afterEach(cleanup)` en `setup.js`.
- **Helpers:** `utils/renderWithProviders.jsx` expone `renderWithProviders(ui, {route, user, authValue})` (Router + `AuthContext`) y `renderWithRouter`.
- **Fixtures:** `fixtures/*` definen enums y DTOs idénticos a v2:
  - `Registration` / `RegistrationStatus` (`WAITLISTED, CONFIRMED, REJECTED, CANCELLED, PENDING_REPORT, CLOSED`) + `accepted:boolean`, `queuePosition?`
  - `MyRegistrationItem{registrationId, activity:{id,title,partner,startDate,endDate,hours}, status, queuePosition?, reportId?, reportStatus?}`
  - `CreateReportRequest{registrationId, actualHours, rating, comment?, evidenceConsent}` + parte `evidence` separada (multipart `request`/`evidence`, 10 MB)
  - `ReportSummary` vs `ReportDetailResponse` (pending es `Page<ReportSummary>`)
  - `ProposalStatus NEW/ACCEPTED/REJECTED` + `PROPOSAL_ALREADY_DECIDED 409`
  - `AuthResponse{accessToken, tokenType:'Bearer', expiresIn:7200, user:UserResponse}` / `UserResponse` (roles `ADMIN/EMPLOYEE/ORG`, `UserStatus`)
  - Subida portada `image` 5 MB (`415/413`), evidencia `request/evidence` 10 MB
  - `CancelRequest{reason?}` y `validatedHours` (camelCase)
- **Mocks:** `mocks/*` simulan `200/201/204, 400, 401, 403, 404, 409, 413, 415, 429, 500` y códigos de dominio `ALREADY_REGISTERED, REGISTRATION_NOT_CONFIRMED, REPORT_ALREADY_SUBMITTED, CIF_ALREADY_REGISTERED…`. El reenvío de `RETURNED` conserva el **mismo `reportId`**.
- **Fuera de producción y sin red:** todo bajo `src/test/**`, excluido de `vite build` y de `coverage`. Los tests hacen `vi.mock('./axiosClient' | '../../api/*')` con `ApiError`; `setup.js` hace `vi.stubGlobal('fetch', vi.fn())` defensivo. No prueban integración real.
- **Sin Enrollment:** ningún mock usa `Enrollment` ni `/api/enrollments`; rutas canónicas son `/api/registrations` y `PATCH /registrations/{id}/cancel`. Verificado por `grep -r enrollments` (debe ser vacío salvo `enrolledIds` local en `CatalogPage`).
- **Visibilidad detalle:** público `PUBLISHED/FULL/IN_PROGRESS/FINISHED → 200`, `DRAFT/CANCELLED → 404`; administrativo permite cualquier estado (`GET /admin/activities/{id}`).
- **Uso:** `import { makeReportSummary, makeMyRegistrationItem } from '../fixtures/reports'` etc., y `import { mockSubmitReport } from '../mocks/reports.mock'` en tests de contrato.
