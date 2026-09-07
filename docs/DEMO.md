# Demo — Datos definitivos y restauración idempotente

**Objetivo:** Recorrido estable público · empleado · administrador desde entorno limpio, sin secretos.

## Datos definitivos (versionados)

Fuente: `public/demo-data.json` (generado por `scripts/restore-demo.js`) y `src/api/*` mocks (`isMockEnabled = DEV && MODE !== 'test'`).

| Entidad | Datos | Notas |
|---------|-------|-------|
| **Actividades** | 4: PUBLISHED (1), FULL (2), IN_PROGRESS (3), FINISHED (4) | Capacidades 20/10/15/30, ocupadas 8/10/5/12, favoritos true/false, sin `favoriteCount` en vistas empleado |
| **Inscripciones (mis inscripciones)** | `active`: 101 WAITLISTED q3 (no aceptada), 103 WAITLISTED q1 (aceptada, report RETURNED) <br> `closed`: 104 CLOSED VALIDATED | `queuePosition` directo de backend, `accepted` diferencia revisión |
| **Propuestas** | 1 NEW (Fundación Solitaria), 2 ACCEPTED | `POST /proposals` 201 NEW, `409 PROPOSAL_ALREADY_DECIDED` si no NEW |
| **Organizaciones** | 2 pendientes: Cruz Roja, Banc dels Aliments | `POST /organizations` 201 pending, `GET /organizations?status=pending` |
| **Usuarios** | admin@verisure.com (ADMIN), empleado@verisure.com (EMPLOYEE), ong@fundacion.org (ORG ACTIVE) + pendiente | `AuthContext` mock por prefijo email |

Coherencia: actividades FULL siguen admitiendo cola (WAITLISTED), inscripciones usan `registrationId` (no `id` local), reportes `POST /reports` 201 nuevo / 200 reenvío RETURNED mismo `reportId`.

## Procedimiento idempotente (restaurar demo)

**Opción A — Terminal (entorno limpio):**
```bash
git clone <repo> && cd frontend
npm ci                # sin secretos, usa .env.example
npm run demo:reset    # escribe public/demo-data.json
npm run test:run      # 36 suites / 228 tests
npm run build         # vite build
npm run dev -- --mode development # mocks activos
```

**Opción B — Navegador (sin backend):**
1. `localStorage.clear()` en DevTools
2. `location.reload()` — mocks se reinician a estado inicial (sin `failRate`, delays 300ms)
3. Login como `empleado@verisure.com` / `admin@verisure.com` / `ong@fundacion.org`

**Idempotencia:** `scripts/restore-demo.js` puede ejecutarse N veces; escribe mismo `demo-data.json` y no duplica en memoria (filtros por `registrationId`).

## Prueba de humo (después de cada corrección)

```bash
npm run test:run   # smoke: 36 suites
npm run build      # smoke: vite 1962 módulos
```
Manual 3 min:
1. **Público:** `/` → `/proposal` (envío 201) → `/register-organization` (201 pending) → `/login`
2. **Empleado:** `/activities` (filtros, paginación, favorito Heart) → `/activities/1` (sticky, solicitar, WAITLISTED q3) → `/my-activities` (bloques active/closed, cola, Aceptada/Pendiente, Cancelar con Modal, 409 → oculta) → `/reports/new?registrationId=101` → `/reports/101` (reenvío) → `/reports/101/certificate`
3. **Admin:** `/dashboard` → `/proposals` (Aceptar/Rechazar) → `/activities/:id/registrations` (Aceptar/Rechazar/Dar de baja, promoción) → `/reports/pending` → `/admin/account-status` (aprobar/rechazar org)

**Navegadores acordados:** Chrome 124+, Firefox 126+ a 1440px y 390px, zoom 200% sin scroll horizontal.

## Artefactos versionados

- `public/demo-data.json`
- `scripts/restore-demo.js`
- `docs/DEMO.md` (este)
- `prototipo/User_Flow_Verisure_3roles_Evaluacion.pdf`
- `frontend/README.md` § Demo

Sin secretos: `.env.example` comiteado, `.env.local` ignorado, `VITE_API_URL` por variable.
