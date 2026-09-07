# Guion Defensa — Fundación Verisure (7 min) + 2 min ORG

**Equipo:** Elena (frontend), Fabileoruf (PO), +1 revisor  
**Timer:** Cronómetro visible + registrador (notas de tiempo real)  
**Entorno:** `npm ci` limpio, `public/demo-data.json`, `http://localhost:5173` (Chrome), backup `dist/` + `demo-data.json` en USB

| Bloque | Tiempo | Responsable | Contenido | Transición |
|--------|--------|-------------|-----------|------------|
| **0. Intro problema** | 0:00-1:00 | Fabileoruf | Voluntariado descoordinado, 2 roles insuficientes, 24 historias → 3 roles (público/empleado/ORG/admin), 14 pantallas | “Elena muestra la solución” |
| **1. Solución** | 1:00-2:30 | Elena | Arquitectura React 19 + Vite + Sass 7-1, `RegistrationsContext`/`FavoritesContext` (sincronía sin `favoriteCount`), `Modal` focus trap + `inert`, contraste AA `#E03A33`, 37 suites/233 tests | Click a `/` |
| **2. Demo general** | 2:30-4:30 | Elena | **Público:** `/` → `/proposal` (201) → `/register-organization` (201) <br> **Empleado:** `/activities` filtros+Heart → `/activities/1` sticky+`RegisterButton` WAITLISTED q3 → `/my-activities` active/closed, cola, `Enviar cierre` | `localStorage.clear()` previo |
| **3. Recorrido ORG 2 min** | 4:30-6:30 | Elena | **(Guion añadido #6)** <br> 0:00 Registro `org-demo@entidad.org` (`POST /organizations` 201 pending) <br> 0:20 Verificación (simulada `GET /verify?token` → `PENDING_APPROVAL`) <br> 0:35 ADMIN `admin@verisure.com` → `/admin/account-status` → Aprobar (2ª persona) <br> 0:55 ORG login `ong@fundacion.org` → `/org/activities` → `+ Nueva actividad` `DRAFT` (portada 5MB) <br> 1:20 ADMIN `/proposals` → Aceptar → `DRAFT` <br> 1:30 EMPLOYEE `/activities` ve `PUBLISHED` → Solicitar plaza → `WAITLISTED` <br> 1:45 EMPLOYEE `/my-activities` → `Enviar cierre` → `POST /reports` 201 <br> 1:55 ORG `/org/reports` ve horas agregadas (8h) | Cronómetro 2:00 |
| **4. Conclusiones** | 6:30-7:00 | Fabileoruf | Métricas: 22 pantallas, 37 suites, `DEMO.md` idempotente, `User_Flow_3roles.pdf` versionado; reparto real; próximos: Figma 3 roles final + 44 PNGs | “Preguntas” |

**Ensayos (2 veces) — ver `docs/ENSAYOS.md`:**

* **Ensayo 1 — 2026-09-06 18:00:** 7:42 (exceso +0:42), problema 1:15 (+15s), ORG 2:18 (+18s), registrador anota “acortar intro, acelerar verificación”. Ajuste: quitar slide CIF, pre-loguear ADMIN.
* **Ensayo 2 — 2026-09-06 19:30:** 7:03 (ok), ORG 2:01, transiciones limpias, `npm run smoke` 4.3s previo. Ajuste cronómetro: aviso a 6:30.

**Contingencia (ver `docs/CONTINGENCIA.md`):** Correo 24h no llega → `scripts/restore-demo.js` + `public/demo-data.json` + captura `AccountStatusPage`; Red cae → `isMockEnabled` DEV (mocks 300ms, sin `failRate`), `dist/` offline; Datos corruptos → `localStorage.clear(); location.reload()` o `npm run demo:reset` (idempotente).

**Reparto en demo:** Fabileoruf habla problema/conclusiones, Elena navega y explica decisiones técnicas (3 roles, `queuePosition` directo, `accepted`).

**Evidencia:** `prototipo/User_Flow...pdf`, `public/demo-data.json`, `npm run smoke` log, `docs/ENSAYOS.md` con tiempos firmados por revisor.
