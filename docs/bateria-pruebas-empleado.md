# Batería de pruebas · Rol EMPLOYEE

Batería manual de extremo a extremo (frontend ↔ backend real) para el recorrido completo del usuario **empleado**: autenticación, catálogo, favoritos, inscripciones, cierres y certificado. Objetivo: detectar errores de integración antes de la demo.

---

## Precondiciones

| Requisito | Valor |
|---|---|
| Backend arriba | `backend` con PostgreSQL y `.env` (`DB_URL`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`) · `./mvnw spring-boot:run` |
| Seeders cargados | Usuarios de `UserSeeder`, actividades de `ActivitySeeder`, inscripciones de `RegistrationSeeder` |
| Frontend arriba | `npm run dev` en `http://localhost:5173` |
| Mocks | Integración real: `VITE_USE_MOCKS=false` (o las variables por módulo apagadas). Los módulos `AUTH`, `REGISTRATION` y `CATALOG` van al backend real sí o sí |
| Navegador | Chrome/Edge/Firefox, con **DevTools → Red abierta** para validar llamadas y códigos HTTP |
| Sesión limpia | `localStorage.clear()` antes de empezar, o cerrar sesión |

### Cuentas de prueba (semilla, contraseña `Verisure2026!`)

| Correo | Rol/estado | Resultado esperado |
|---|---|---|
| `ana.gil@verisure.es` | EMPLOYEE | entra en `/activities` |
| `carmen.ortega@fundacionverisure.org` | ADMIN | entra en `/dashboard` (para comparar permisos) |
| `marta.ribas@caritasbcn.org` | PARTNER · ACTIVE | entra en `/org/activities` (para contrastar el guardia) |

### Datos sembrados de referencia para `ana.gil@verisure.es`

| Actividad | Estado | Inscripción de Ana | Qué debe verse |
|---|---|---|---|
| «Acompañamiento a mayores» | FINISHED | `CLOSED`, con cierre | En cerradas · botón de certificado |
| «Alfabetización digital» | FINISHED | `PENDING_CLOSURE`, sin cierre | «Cerrar tu participación» |
| «Visitas a residencias» | PUBLICADA/completa | `CONFIRMED` | Botón de cancelar según fecha |
| «Limpieza de playas» | — | favorita | Corazón marcado en catálogo y ficha |
| «Charlas de prevención» | — | favorita | Corazón marcado |

> Los datos exactos pueden variar según el estado de la semilla. Si una actividad no cuadra, usar la consola del backend o el endpoint de listado para localizar los IDs reales.

---

## Módulo A · Autenticación

### A1 · Login correcto
- [x] Ir a `/login`.
- [x] Entrar con `ana.gil@verisure.es` / `Verisure2026!`.
- [x] **Esperado:** redirección a `/activities`. En Red: `POST /api/auth/login` → **200** con `accessToken` (no empieza por `mock-token-`), `tokenType: Bearer`, `expiresIn` ≈ 7200 y `user`.
- [x] En `localStorage` existen `accessToken` y `user`. En la siguiente petición autenticada la cabecera `Authorization: Bearer <token>` está presente.
- [x] Topbar muestra el nombre «Ana Gil» (o el del empleado) y la etiqueta de rol "Empleado".

### A2 · Credenciales incorrectas
- [x] En `/login`, contraseña incorrecta (`Verisure2025!`).
- [x] **Esperado:** error en el formulario «Credenciales no válidas», se queda en `/login`, **no** aparece el aviso de «sesión caducada».
- [x] Red: `POST /api/auth/login` → **401** con `ApiError`.

### A3 · Email inexistente
- [x] Email `nadie@verisure.es` con contraseña cualquiera.
- [x] **Esperado:** el mismo error genérico que A2 (el backend no distingue email desconocido de contraseña mala).

### A4 · Protección de rutas sin sesión
- [x] Sin loguear, escribir en la barra: `/activities`, `/my-activities`, `/closures/new`, `/closures/1/certificate`.
- [x] **Esperado:** en todos los casos redirección a `/login`, conservando la ruta de origen en el estado (para volver tras el login si la UI lo soporta).

### A5 · Logout
- [x] Con sesión, pulsar «Cerrar sesión» en el topbar.
- [x] **Esperado:** Red: `POST /api/auth/logout` → **204**. `localStorage` limpio. Vuelta a `/login`.
- [x] Pulsar «atrás» del navegador no vuelve a mostrar la pantalla protegida.

### A6 · Token expirado (401 en mitad de la sesión)
- [x] Con sesión activa, forzar la caducidad: pintar un token inválido en `localStorage.accessToken` (o esperar a las 2 h).
- [x] Navegar al catálogo.
- [x] **Esperado:** la app limpia la sesión y redirige a `/login` con el aviso «Tu sesión ha caducado».

### A7 · Gestionar caducidad de la sesión (cerrada)
- [x] Cerrar el navegador y reabrir en el mismo perfil.
- [x] Refrescar `/login`.
- [x] **Esperado:** pantalla de login normal; la sesión no persiste sin acción del usuario (salvo comportamiento de «recordarme» si está implementado).

---

## Módulo B · Navegación y permisos

### B1 · Contenido del sidebar para EMPLOYEE
- [x] Con sesión de empleado, revisar el menú lateral.
- [x] **Esperado:** única sección «Voluntariado» con **«Explorar»** (`/activities`) y **«Mis voluntariados»** (`/my-activities`). No aparecen secciones de administración ni de entidad.

### B2 · Guardias de rol — rutas de ADMIN
- [x] Logueado como empleado, escribir en la URL: `/dashboard`, `/proposals`, `/admin/activities`, `/admin/account-status`, `/admin/activities/pending-closure`.
- [x] **Esperado:** en todos los casos redirección a `/activities` (home del rol). La red **no** debe emitir ninguna petición a `/api/admin/**` ni `/api/dashboard/**`.

### B3 · Guardias de rol — rutas de PARTNER
- [x] Escribir: `/org/activities`, `/org/dashboard`, `/org/proposals`, `/org/reports`.
- [x] **Esperado:** redirección a `/activities`, sin llamadas a `/api/org/**`.

### B4 · Ruta de detalle compartida (ADMIN + EMPLOYEE)
- [x] `/activities/:activityId` de una actividad publicada.
- [x] **Esperado:** se abre la ficha. El panel de participación (inscribirse, corazón) aparece para EMPLOYEE; en la misma URL con sesión de ADMIN los controles de participación están ocultos.

### B5 · Ruta de cierre compartida (ADMIN + EMPLOYEE)
- [x] Con empleado, abrir `/closures/:closureId` de un cierre propio → se muestra el cierre.
- [ ] Con administradora (o con otra cuenta de empleado), abrir el mismo ID → **403** «no eres el propietario».

### B6 · 404
- [x] Escribir una ruta inexistente `/rutas-que-no-existe`.
- [x] **Esperado:** página 404 sin ruptura de layout.

---

## Módulo C · Catálogo de actividades (`/activities`)

### C1 · Carga inicial y visibilidad
- [x] Entrar en `/activities`.
- [x] **Esperado:** Red: `GET /api/activities` → **200**. Se listan **exclusivamente** actividades `PUBLISHED`, `FULL`, `IN_PROGRESS` o `FINISHED`. Ninguna `DRAFT`, `PENDING_APPROVAL` ni `CANCELLED`.
- [x] Cada tarjeta muestra título, línea de acción, modalidad, fecha, plazas ocupadas y corazón.

### C2 · Paginación
- [ ] Comprobar el número de tarjetas de la primera página y pasar a la segunda.
- [ ] **Esperado:** ninguna actividad repetida entre páginas. El contador total es consistente con el backend (`totalElements`).

### C3 · Filtro por línea de acción
- [x] Aplicar el filtro «Medio ambiente».
- [x] **Esperado:** solo actividades de esa línea; las etiquetas/imágenes cuadran. Red: `GET /api/activities?line=medioambiente`.
- [x] Probar las cuatro líneas, sueltas.

### C4 · Filtro por modalidad
- [x] Aplicar `PRESENCIAL`, `ONLINE` y `MIXTO`, sueltos.
- [x] **Esperado:** solo actividades de esa modalidad en cada caso. Red: `?mode=PRESENCIAL`.

### C5 · Filtro por rango de fechas
- [x] Rellenar `desde` y `hasta`, y solo `desde`.
- [x] **Esperado:** la lista filtra por `startDate`; si la semilla no tiene actividades en el rango, aparece el estado vacío con opción de reintentar.

### C6 · Filtros combinados
- [x] Línea + modalidad + rango de fechas a la vez.
- [x] **Esperado:** resultado de la intersección; una sola petición por cambio de filtro (sin duplicados).

### C7 · Limpiar filtros
- [ ] Pulsar el botón de limpiar/quitar filtros.
- [ ] **Esperado:** se restaura la lista completa, los selects vuelven a vacío y la URL limpia los parámetros.

### C8 · Estado de carga
- [ ] Con throttling en Red (Slow 3G), recargar el catálogo.
- [ ] **Esperado:** se muestra un indicador de carga; no se ve la lista «a medias».

### C9 · Error de red del catálogo
- [x] Con el backend apagado, entrar en `/activities` (con sesión ya abierta).
- [x] **Esperado:** mensaje de error amigable («No se pudo cargar» o similar) con botón de reintentar; **no** hay pantalla rota ni stack trace.

### C10 · Una sola petición por filtro
- [ ] En Red, filtrar y luego volver a filtrar.
- [ ] **Esperado:** exactamente 1 petición de catálogo por cada cambio de filtro.

---

## Módulo D · Ficha de actividad (`/activities/:id`)

### D1 · Contenido de la ficha
- [x] Abrir la ficha de una actividad `PUBLISHED`.
- [x] **Esperado:** descripción completa, entidad colaboradora, fechas de inicio/fin, deadline de inscripción, modalidad, hora, plazas, línea de acción con su imagen, barra de ocupación, corazón e información de inscripción.

### D2 · Ficha de una actividad no visible
- [x] Localizar el ID de una actividad `DRAFT` o `CANCELLED` (p.ej. vía consola/API administrativa).
- [x] Abrir `/activities/<ese-id>`.
- [x] **Esperado:** pantalla «Actividad no encontrada» (404), no un error feo. Red: `GET /api/activities/{id}` → **404**.

### D3 · Fecha límite (deadline)
- [x] En la semilla, el deadline de una actividad no publicada o pasada.
- [x] Ficha de una actividad cuyo `registrationDeadline` ya venció.
- [x] **Esperado:** botón de inscripción oculto o deshabilitado. El matiz del «día mismo del deadline» se valida con la prueba unitaria relevante; comportamiento visual consistente con el backend (`deadline` pasado → 400 `DEADLINE_PASSED`).

---

## Módulo E · Favoritos

### E1 · Marcar favorito desde la ficha
- [x] En la ficha de una actividad sin marcar, pulsar el corazón.
- [x] **Esperado:** Red: `POST /api/favorites` → **201**. El corazón se rellena al instante (pintado optimista). Volver al catálogo y recargar: sigue marcado.

### E2 · Marcar favorito desde el catálogo
- [x] Pulsar el corazón de una tarjeta en `/activities`.
- [x] **Esperado:** `POST /api/favorites` → **201** y el corazón se marca sin recargar.

### E3 · Desmarcar favorito
- [x] Pulsar el corazón ya marcado (desde ficha o tarjeta).
- [x] **Esperado:** Red: `DELETE /api/favorites/{activityId}` → **204**. El corazón vuelve al vacío. Recargar lo conserva desmarcado.

### E4 · Doble clic / doble petición
- [x] Pulsar el corazón varias veces rápidamente.
- [x] **Esperado:** la UI bloquea la segunda pulsación mientras la primera está en vuelo (sin doble request inconsistente). Un `409 ALREADY_FAVORITED` (si ocurre) se trata como éxito, no revierte el corazón.

### E5 · Fallo de red al marcar
- [ ] Con el backend apagado, pulsar el corazón.
- [ ] **Esperado:** el corazón revierte a su estado anterior (rollback del pintado optimista) y aparece un error, sin romper la pantalla.

### E6 · Persistencia al recargar
- [x] Tener 2–3 favoritos, recargar la página y volver a la ficha.
- [x] **Esperado:** los corazones siguen marcados (vienen de `favoritedByMe` de `GET /api/activities`).

---

## Módulo F · Inscripción (registrarse)

### F1 · Inscripción en actividad con plazas
- [x] Ficha de una actividad `PUBLISHED` con plazas libres → pulsar «Inscribirme».
- [x] **Esperado:** modal de confirmación. Confirmar → Red: `POST /api/registrations` → **201**.
- [x] El registro se crea en `WAITLISTED` (el backend confirma según plaza). El botón cambia de estado («Ya inscrito/a» o similar) y el detalle refleja la cola/confirmación.

### F2 · Inscripción en actividad completa (waitlist)
- [x] Ficha de una actividad `FULL` → inscribirse.
- [x] **Esperado:** `POST /api/registrations` → **201** con `WAITLISTED` y `queuePosition`; la UI lo indica claramente como «en cola de espera» con su posición.

### F3 · Inscripción duplicada
- [ ] Intentar inscribirse en una actividad donde ya hay inscripción.
- [ ] **Esperado:** Red: `POST /api/registrations` → **409** `ALREADY_REGISTERED`, con mensaje traducido en castellano. Sin doble registro en base.

### F4 · Inscripción con deadline pasado
- [x] Actividad con `registrationDeadline` anterior a hoy.
- [x] **Esperado:** el botón no está disponible; si se fuerza, Red: **400** `DEADLINE_PASSED` con mensaje amigable.

### F5 · Estado tras inscribirse en catálogo
- [x] Tras inscribirse, volver al catálogo y a la ficha.
- [x] **Esperado:** el detalle refleja la inscripción activa (nº de ocupadas sube si corresponde; los estados se repintan sin recarga manual).

---

## Módulo G · Mis voluntariados (`/my-activities`)

### G1 · Listado correcto
- [x] Entrar en `/my-activities` (y `/my-volunteering`, que es alias).
- [x] **Esperado:** Red: `GET /api/registrations/me` → **200**. Solo aparecen inscripciones del propio usuario.
- [x] Las pestañas **Activas** y **Cerradas** muestran los estados correctos según `registrationStatus`.

### G2 · Botones de la fila según contrato
- [x] Revisar cada fila contra la tabla de combinaciones `closureId` / `activityClosed`:

| `closureId` | `activityClosed` | Botón esperado |
|---|---|---|
| `null` | `false` | «Cerrar tu participación» |
| con valor | `false` | «Ver mi cierre» |
| con valor | `true` | «Descargar certificado» |

- [x] **Esperado:** cada fila pinta el botón que le corresponde; no hay botones huérfanos ni dobles.

### G3 · Cancelar inscripción confirmada
- [x] Cancelar una inscripción `CONFIRMED` cuya `startDate` es posterior a hoy.
- [x] **Esperado:** Red: `PATCH /api/registrations/{id}/cancel` → **200/204**. La fila desaparece de activas (status `CANCELLED`). Si había cola, la lista recarga y la primera persona en cola pasa a `CONFIRMED` (verificar, si procede, el correo «Ha quedado una plaza libre y es tuya»).

### G4 · Cancelar inscripción de actividad ya empezada
- [ ] Intentar cancelar una inscripción con `startDate <= hoy`.
- [ ] **Esperado:** Red: **400** `DEADLINE_PASSED` (o el código de negocio equivalente) y mensaje amigable; la fila no cambia.

### G5 · Cancelación con motivo
- [ ] Si el formulario lo permite, cancelar adjuntando un motivo.
- [ ] **Esperado:** el motivo viaja en el body de la PATCH (opcional) y la cancelación se completa.

### G6 · Recarga tras cancelar
- [ ] Tras una cancelación, verificar que la lista se actualiza sola (sin refresco manual) y que el contador de activas baja.

---

## Módulo H · Cierre de participación

### H1 · Formulario de nuevo cierre
- [x] Desde «Mis voluntariados», en una fila sin `closureId`, pulsar «Cerrar tu participación».
- [x] **Esperado:** navega a `/closures/new?registrationId=...` con el formulario precargado con la actividad.

### H2 · Envío completo (con evidencia)
- [x] Rellenar horas reales, valoración (1–5), comentario y adjuntar un PDF/JPG/PNG ≤ 10 MB. Marcar el consentimiento de evidencia.
- [ ] **Esperado:** Red: `POST /api/closures` con `Content-Type: multipart/form-data` → **201**. Mensaje de éxito y navegación a «Mis voluntariados», donde la fila pasa a mostrar «Ver mi cierre».

### H3 · Validaciones del formulario
- [ ] Enviar vacío / sin consentimiento.
- [ ] **Esperado:** el formulario marca los campos obligatorios y el consentimiento; no sale ninguna petición a la red.
- [ ] Adjuntar un `.exe` (o tipo no permitido) → error de tipo. Adjuntar > 10 MB → error de tamaño (respuesta `413` mapeada por el interceptor).

### H4 · Cierre sin evidencia
- [ ] Enviar solo con consentimiento marcado y campos mínimos, sin archivo.
- [ ] **Esperado:** `POST /api/closures` → **201**. `evidenceUrl` puede ser `null`; el resto de datos persiste.

### H5 · Ver mi cierre
- [ ] Con una fila con `closureId`, pulsar «Ver mi cierre».
- [ ] **Esperado:** Red: `GET /api/closures/{id}` → **200**. Se muestran horas, valoración, comentario y, si existe, la evidencia. Solo visible para quien es propietario (403 para otra cuenta).

### H6 · Corrección tras devolución (RETURNED)
- [ ] Con un cierre devuelto por la administración (anotación `RETURNED` en `GET /api/closures/{id}`), abrir la pantalla.
- [ ] **Esperado:** se muestra la nota del administrador; se puede editar y reenviar (`POST` de nuevo o actualización según flujo) y la fila vuelve al estado pendiente.

### H7 · Envío de cierre duplicado
- [ ] Enviar un cierre para un `registrationId` que ya tiene cierre.
- [ ] **Esperado:** código de conflicto del backend (`CLOSURE_ALREADY_CLOSED` u otro) traducido, sin corromper el cierre existente.

---

## Módulo I · Certificado

### I1 · Certificado de actividad cerrada
- [x] En una fila con `closureId` y `activityClosed = true`, pulsar «Descargar certificado».
- [x] **Esperado:** navega a `/closures/:closureId/certificate` → Red: `GET /api/closures/{id}/certificate` → **200**. Se muestra el certificado imprimible con los datos del empleado, actividad, entidad, horas y departamento. La impresión genera un PDF correcto.

### I2 · Certificado de actividad NO cerrada
- [ ] En una fila con `closureId` y `activityClosed = false`, forzar la ruta `/closures/:id/certificate`.
- [ ] **Esperado:** Red: **409** `ACTIVITY_NOT_CLOSED` con mensaje amigable («La actividad aún no está cerrada») y vuelta a la pantalla anterior o estado vacío.

### I3 · Certificado de un cierre ajeno
- [ ] Con la sesión de otra cuenta (e.g. `carmen.ortega@...`), abrir el certificado de un cierre del empleado.
- [ ] **Esperado:** 403 (propiedad verificada en backend), con pantalla de permiso denegado, no datos ajenos.

---

## Módulo J · Seguridad y manejo de errores

### J1 · Cabecera de autorización en todas las llamadas
- [ ] Con Red abierta, recorrer catálogo, ficha, favorito, inscripción, mis voluntariados, cierre y certificado.
- [ ] **Esperado:** toda petición autenticada lleva `Authorization: Bearer <token>`. Ninguna 401 inesperada entre pantallas.

### J2 · Token de otro rol
- [ ] En consola: `const u = JSON.parse(localStorage.getItem('user')); u.role = 'ADMIN'; localStorage.setItem('user', JSON.stringify(u)); location.reload();`
- [ ] **Esperado:** el guardia de ruta puede dejar pasar, pero las llamadas al backend con token EMPLOYEE devolverán **403** y la UI lo pinta sin romperse. Ejecutar `/admin/activities` en este estado. Cerrar sesión después para limpiar.

### J3 · Error 500 del backend
- [ ] (Opcional) Simular un fallo de servidor en un endpoint del empleado (p.ej. parando PostgreSQL a mitad de flujo).
- [ ] **Esperado:** mensaje genérico de error; la app no queda en blanco (ErrorBoundary captura cualquier error de render).

### J4 · ErrorBoundary global
- [ ] Forzar un error de render en una pantalla (puede bastar un dato `null` a la fuerza desde consola).
- [ ] **Esperado:** fallback de ErrorBoundary con opción de reintentar; no pantalla blanca.

---

## Módulo K · Responsividad y accesibilidad (smoke)

### K1 · Escritorio 1440 px y 1280 px
- [ ] Recorrer catálogo, ficha, mis voluntariados y formulario de cierre.
- [ ] **Esperado:** sin scroll horizontal accidental, tarjetas en rejilla correcta, botones visibles.

### K2 · Móvil 390 px
- [ ] Redimensionar DevTools a 390 px y recorrer las mismas pantallas.
- [ ] **Esperado:** sidebar colapsa en menú hamburguesa; los botones táctiles ≥ 44×44 px; los formularios de cierre y modales usables sin zoom.

### K3 · Recorrido con teclado
- [ ] Tabular por catálogo y ficha: foco visible, botones accesibles, corazón con etiqueta accesible («Añadir a favoritos»/«Quitar de favoritos»).

---

## Módulo L · Flujo integral (camino feliz, todo seguido)

Ejecutar en una sola sesión, sin recargar entre pasos:

- [ ] `L1` Login con `ana.gil@verisure.es`.
- [ ] `L2` Filtrar el catálogo por «Medio ambiente» y abrir «Limpieza de playas».
- [ ] `L3` Marcar favorito (si no está) y desmarcar y volver a marcar.
- [ ] `L4` Inscribirse en una actividad con plazas → ver waitlist/confirmación.
- [ ] `L5` Ver la inscripción en «Mis voluntariados».
- [ ] `L6` Eliminar un favorito y verificar en catálogo.
- [ ] `L7` Cerrar sesión y volver a entrar (sesión sigue funcionando, token válido).
- [ ] `L8` Abrir «Mis voluntariados» para un registro de la semilla con `PENDING_CLOSURE` → «Cerrar tu participación» → enviar cierre.
- [ ] `L9` Comprobar que el cierre aparece y que la fila ahora dice «Ver mi cierre».
- [ ] `L10` (requiere que la Fundación haya finalizado el cierre de una actividad) Descargar certificado de un registro `CLOSED`.

**Esperado final:** todo el recorrido funciona sin errores de consola, sin respuestas inesperadas (ni 500 ni 404 curiosos) y con mensajes coherentes en castellano.

---

## Registro de incidencias

| ID | Módulo | Pasos reproducidos | Esperado | Real | Severidad | Evidencia |
|---|---|---|---|---|---|---|
| (T-01) | C1 | ... | ... | ... | Alta/Media/Baja | captura/consola |
| ... | | | | | | |

---

## Notas sobre gaps conocidos (no bloquean el plan, pero condicionan resultados)

1. **`POST /api/proposals`** (formulario público) y **`GET /api/org/dashboard`**: no tienen controlador en el backend; si una prueba los toca, esperar 404.
2. **Evidencia de los cierres** (`B1-03`): se valida pero puede no persistirse (`evidenceUrl` siempre `null`); afecta a H2/H4.
3. **Sin refresh de token**: la caducidad a las 2 h es la única política de revocación. No probar flujos que duren más.
4. Las contraseñas de semilla (`Verisure2026!`) solo existen en perfiles de no-producción.

---

## Cierre de la batería

- [ ] Todas las casillas anteriores marcadas o justificadas en «Registro de incidencias».
- [ ] `npm run smoke` en verde en el frontend (tests + build) al terminar, para descartar regresión.
- [ ] Resumen: nº de pruebas ejecutadas, nº superadas, nº falladas y decisión (bloqueante / no bloqueante para demo).