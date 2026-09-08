# Guion Defensa — Fundación Verisure (7 min) + 2 min PARTNER

**Equipo:** Elena (frontend), Fabileoruf (PO), +1 revisor  
**Timer:** Cronómetro visible + registrador (notas de tiempo real)  
**Entorno:** `npm ci` limpio, `public/demo-data.json`, `http://localhost:5173` (Chrome), backup `dist/` + `demo-data.json` en USB

| Bloque | Tiempo | Responsable | Contenido | Transición |
|--------|--------|-------------|-----------|------------|
| **0. Intro problema** | 0:00-1:00 | Fabileoruf | Voluntariado descoordinado, 2 roles insuficientes, 24 historias → áreas pública, empleado, PARTNER y admin | “Elena muestra la solución” |
| **1. Solución** | 1:00-2:30 | Elena | Arquitectura React 19 + Vite + Sass 7-1, `RegistrationsContext`/`FavoritesContext`, `Modal` accesible y 43 suites/254 tests | Click a `/` |
| **2. Demo general** | 2:30-4:30 | Elena | **Público:** `/` → `/proposal` (201) → `/register-organization` (201) <br> **Empleado:** `/activities` filtros+Heart → `/activities/1` sticky+`RegisterButton` WAITLISTED q3 → `/my-activities` active/closed, cola, `Enviar cierre` | `localStorage.clear()` previo |
| **3. Recorrido PARTNER 2 min** | 4:30-6:30 | Elena | Registro `POST /auth/register` → verificación `GET /auth/verify?token=` → ADMIN aprueba en `/admin/account-status` → PARTNER crea `DRAFT` en `/org/activities` y envía a revisión → ADMIN aprueba → EMPLOYEE se inscreve y envía `POST /closures` → PARTNER consulta `/org/reports` | Cronómetro 2:00 |
| **4. Conclusiones** | 6:30-7:00 | Fabileoruf | Métricas: 22 pantallas, 43 suites, `DEMO.md` idempotente y flujo versionado | “Preguntas” |

**Ensayos (2 veces) — ver `docs/ENSAYOS.md`:**

* **Ensayo 1 — 2026-09-06 18:00:** 7:42 (exceso +0:42), bloque PARTNER 2:18. Ajuste: quitar slide CIF y preloguear ADMIN.
* **Ensayo 2 — 2026-09-06 19:30:** 7:03 (ok), bloque PARTNER 2:01, transiciones limpias.

**Contingencia (ver `docs/CONTINGENCIA.md`):** Correo 24h no llega → `scripts/restore-demo.js` + `public/demo-data.json` + captura `AccountStatusPage`; Red cae → `isMockEnabled` DEV (mocks 300ms, sin `failRate`), `dist/` offline; Datos corruptos → `localStorage.clear(); location.reload()` o `npm run demo:reset` (idempotente).

**Reparto en demo:** Fabileoruf habla problema/conclusiones, Elena navega y explica decisiones técnicas (3 roles, `queuePosition` directo, `accepted`).

**Evidencia:** `prototipo/User_Flow...pdf`, `public/demo-data.json`, `npm run smoke` log, `docs/ENSAYOS.md` con tiempos firmados por revisor.
