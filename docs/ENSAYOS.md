# Ensayos cronométricos — Defensa 7 min + 2 min PARTNER

**Cronómetro:** `time.is` + registrador manual (segunda persona). **Objetivo:** 7:00 total, PARTNER 2:00.

## Ensayo 1 — 2026-09-06 18:00 (sala 2, proyector 1440px)

| Bloque | Plan | Real | Desvío | Nota registrador |
|--------|------|------|--------|------------------|
| Intro problema | 1:00 | 1:15 | +0:15 | Fabileoruf se extiende en CIF, recortar |
| Solución | 1:30 | 1:35 | +0:05 | Bien, arquitectura clara |
| Demo general | 2:00 | 2:14 | +0:14 | Esperar carga catálogo, no click rápido |
| **PARTNER 2 min** | 2:00 | 2:18 | +0:18 | Verificación token lenta, pre-loguear ADMIN |
| Conclusiones | 0:30 | 0:20 | -0:10 | Apresurado |
| **Total** | **7:00** | **7:42** | **+0:42** | **Exceso, ajustar** |

**Ajustes:** Quitar slide detalle CIF, pre-hacer login ADMIN en pestaña 2, acelerar verificación con `localStorage` mock, aviso cronómetro a 6:30.

## Ensayo 2 — 2026-09-06 19:30 (misma sala, registrador: Elena)

| Bloque | Plan | Real | Desvío | Nota |
|--------|------|------|--------|------|
| Intro | 1:00 | 1:02 | +0:02 | Ok |
| Solución | 1:30 | 1:28 | -0:02 | Ok, mencionar `npm run smoke` 4.3s |
| Demo general | 2:00 | 2:02 | +0:02 | Heart Lucide fluido |
| **PARTNER 2 min** | 2:00 | 2:01 | +0:01 | Registro → `PENDING_APPROVAL` → ADMIN aprueba → PARTNER crea `DRAFT` → ADMIN publica → EMPLOYEE envía cierre → PARTNER ve 8h |
| Conclusiones | 0:30 | 0:30 | 0 | Cierre con `DEMO.md` idempotente |
| **Total** | **7:00** | **7:03** | **+0:03** | **Apto** |

**Evidencia:** Fotos cronómetro + notas registrador en `prototipo/ensayos/` (pendiente subir). Validación actual: 43 suites y 254 tests; `vite build` transforma 1972 módulos.

## Checklist pre-defensa

- [x] `npm ci` limpio, sin `.env.local` (solo `.env.example`)
- [x] `public/demo-data.json` + `dist/` en USB
- [x] 3 usuarios probados: `admin`, `empleado`, `ong`
- [x] `prototipo/User_Flow_3roles_Evaluacion.pdf` impreso
- [x] Contingencia `docs/CONTINGENCIA.md` a mano

**Firma revisor:** ______________________  Fecha: 2026-09-07
