# Demo — Datos definitivos y restauración idempotente

**Objetivo:** Recorrido estable público · empleado · administrador desde entorno limpio, sin secretos.

## Datos definitivos (versionados)

Fuente: `public/demo-data.json` (generado por `scripts/restore-demo.js`) y `src/api/*` mocks (`isMockEnabled = DEV && MODE !== 'test'`).

| Entidad | Datos | Notas |
|---------|-------|-------|
| **Actividades** | 4: PUBLISHED (1), FULL (2), IN_PROGRESS (3), FINISHED (4) | Capacidades 20/10/15/30, ocupadas 8/10/5/12, favoritos true/false, sin `favoriteCount` en vistas empleado |
| **Inscripciones (mis inscripciones)** | Lista plana: 101 WAITLISTED q3, 103 PENDING_CLOSURE con cierre enviado y 104 CLOSED | `queuePosition`, `closureId` y `activityClosed` vienen del backend |
| **Propuestas** | 1 NEW (Fundación Solitaria), 2 ACCEPTED | `POST /proposals` 201 NEW, `409 PROPOSAL_ALREADY_DECIDED` si no NEW |
| **Organizaciones** | 2 pendientes: Cruz Roja, Banc dels Aliments | `POST /auth/register` 201, `GET /admin/org-accounts?status=PENDING` |
| **Usuarios** | admin@verisure.com (ADMIN), empleado@verisure.com (EMPLOYEE), ong@fundacion.org (PARTNER ACTIVE) + pendiente | `AuthContext` mock por prefijo email |

Coherencia: actividades FULL siguen admitiendo cola (WAITLISTED), inscripciones usan `registrationId` y cierres usan `closureId`; `POST /closures` es multipart con `request` y `evidence` opcional.

## Procedimiento idempotente (restaurar demo)

**Opción A — Terminal (entorno limpio):**
```bash
git clone <repo> && cd frontend
npm ci                # sin secretos, usa .env.example
npm run demo:reset    # escribe public/demo-data.json
npm run test:run      # suite completa
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
npm run test:run
npm run build
```
Manual 3 min:
1. **Público:** `/` → `/proposal` (envío 201) → `/register-organization` (201 pending) → `/login`
2. **Empleado:** `/activities` → `/activities/1` → `/my-volunteering` → `/closures/new?registrationId=103` → `/closures/502` → `/closures/501/certificate`
3. **Admin:** `/dashboard` → `/proposals` → `/activities/:id/registrations` → `/admin/activities/pending-closure` → `/admin/account-status`

**Navegadores acordados:** Chrome 124+, Firefox 126+ a 1440px y 390px, zoom 200% sin scroll horizontal.

## Artefactos versionados

- `public/demo-data.json`
- `scripts/restore-demo.js`
- `docs/DEMO.md` (este)
- `prototipo/User_Flow_Verisure_3roles_Evaluacion.pdf`
- `frontend/README.md` § Demo

Sin secretos: `.env.example` comiteado, `.env.local` ignorado, `VITE_API_URL` por variable.
