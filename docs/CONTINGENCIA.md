# Contingencia — Fallo correo / red / datos durante la demostración

**Principio:** Demo 100% frontend con `VITE_USE_MOCKS=true` (mocks deterministas). No depende de backend real ni de red externa.

| Fallo | Síntoma | Contingencia inmediata (≤15s) | Evidencia |
|-------|---------|-------------------------------|-----------|
| **Correo de verificación no llega** (PARTNER) | `AccountStatusPage` sigue `PENDING_VERIFICATION` | 1. Mostrar `public/demo-data.json` con `org-1` pendiente <br>2. `localStorage.setItem('user', JSON.stringify({role:'PARTNER',status:'PENDING_APPROVAL'}))` simulado <br>3. Captura de `AccountStatusPage` | `orgApi.js`, `scripts/restore-demo.js` |
| **Red / API caída** (`VITE_API_URL` no responde) | `ApiError 401/500` en `CatalogPage` | 1. Reiniciar Vite con `VITE_USE_MOCKS=true npm run dev` <br>2. Fallback a `dist/` precompilado con mocks <br>3. Mostrar `docs/DEMO.md` | `axiosClient`, `dist/` |
| **Datos corruptos / cola desincronizada** | `queuePosition` NaN o lista vacía inesperada | 1. Consola: `localStorage.clear(); location.reload()` <br>2. Terminal: `npm run demo:reset` <br>3. `npm run smoke` | `scripts/restore-demo.js`, `RegistrationsContext` |
| **Fallo Heart / favorito** | `404/409` al alternar | Revierte optimista (`FavoritesContext` guarda `prev`), muestra `En lista de espera` sin `favoriteCount`, `aria-pressed` | `FavoriteHeart.test` 7 tests |
| **Plazo cerrado / DEADLINE_PASSED 409** | `RegisterButton` muestra `Plazo cerrado` | Ya contemplado: `RegisterButton` detecta `registrationDeadline` y `409 DEADLINE_PASSED` → oculta acción obsoleta tras `fetchData()` | `MyVolunteeringPage` 12 tests |

**Kit demo offline (USB):** `dist/`, `public/demo-data.json`, `prototipo/User_Flow_3roles_Evaluacion.pdf`, `docs/DEMO.md`, `frontend/README.md` impreso.

**Pre-demo check (2 min antes):**
```bash
npm ci && npm run demo:reset && npm run smoke
VITE_USE_MOCKS=true npm run dev
# Verificar 3 usuarios: admin@verisure.com / empleado@verisure.com / ong@fundacion.org
```

**Si todo falla:** Presentar `verisure-mockups-v3 2/*.html` (22 HTML estáticos) + `capturas/` 44 PNG como respaldo visual sin interacción.
