# Evaluación · qué se puede integrar ya entre backend y frontend

14 de septiembre. Escrito desde BE3, comparando endpoint a endpoint los dos repositorios contra `docs/api-contract.md`.

**Resumen en tres líneas.** De los 53 endpoints del contrato, 23 tienen controlador, pero **solo 18 hacen algo de verdad**: cinco son esqueletos que responden vacío. Todo el módulo de participación —inscripciones, cola, favoritos y correos— está terminado, y con él se pueden encender ya dos pantallas del frontend. Lo que bloquea al resto del equipo es el catálogo, `GET /api/activities`, que es de BE2.

> **Corrección respecto a la primera versión de este documento.** La primera lectura contó endpoints por sus controladores y daba los dos cierres por completos. No lo están: al mirar los servicios aparecen `TODO B1-04` y `TODO B1-06`. Todo lo que sigue está comprobado contra el código de los servicios, no solo contra las anotaciones de ruta.

---

## 1 · Qué hay implementado, de verdad

### Funciona · 18 endpoints

| Área | Endpoints | Dueña |
|---|---|---|
| Autenticación | `login`, `logout`, `/auth/me`, `register` | BE1 |
| Actividades · administración | `POST /api/admin/activities`, `publish` | BE2 |
| Estados automáticos | `POST /api/admin/activities/refresh-status` | BE3 |
| Inscripciones | `POST /api/registrations`, `/registrations/me`, `/admin/registrations`, `/counts`, `accept`, `reject`, `cancel` | BE3 |
| Favoritos | `POST /api/favorites`, `DELETE /api/favorites/{activityId}` | BE3 |
| Cierre de participación | `POST /api/closures`, `GET /api/closures/{id}` | BE1 |

### Responde, pero vacío · 5 endpoints

| Endpoint | Qué hace hoy | Pendiente de |
|---|---|---|
| `GET /api/closures/{id}/certificate` | devuelve `null` · no comprueba ni propiedad ni que la actividad esté cerrada | `B1-06` |
| `GET /api/admin/activities/pending-closure` | página vacía | `B1-04` |
| `GET /api/admin/activities/{id}/closure` | `null` | `B1-04` |
| `PUT /api/admin/activities/{id}/closure` | `null` | `B1-04` |
| `PATCH /api/admin/activities/{id}/closure/finalize` | **solo llama a `closeAllForActivity`**, que es de BE3 · no cierra el `ActivityClosure` ni sella `closedAt`, y devuelve `null` | `B1-04` |

Ese último explica un comportamiento que despista al probar: `finalize` responde con cuerpo vacío y deja el `activity_closure` en `DRAFT`, **pero las inscripciones sí pasan a `CLOSED` y sale el correo del certificado**, porque esa parte es la firma cruzada que aporta BE3.

En `POST /api/closures` hay además un `TODO B1-03 · BE2`: la evidencia se valida —tipo, tamaño y consentimiento— pero **no se guarda**, así que `evidenceUrl` queda siempre a `null`.

### Sin empezar · 30 endpoints

| Área | Dueña |
|---|---|
| Catálogo · `GET /api/activities`, `GET /api/activities/{id}` | BE2 · `B2-07` |
| Actividades · listar, ver, editar, cancelar, aprobar, devolver, pendientes, imágenes | BE2 |
| Propuestas · públicas y bandeja de administración | BE2 · `B2-07` |
| Rol entidad · todo `/api/org/*` | BE2 |
| Verificación de correo · `verify`, `resend-verification` | BE1 · `B1-15`, `B1-16` |
| Cuentas de entidad · `/api/admin/org-accounts/*` | BE1 |
| Dashboard y exportaciones · `/api/dashboard/*` | BE1 |

---

## 2 · Los dos cierres no son lo mismo

Se confunden con facilidad porque en el frontend viven en la misma carpeta y en el mismo `closuresApi.js`, pero son dos flujos, dos roles y dos tareas distintas.

**Cierre de participación · lo rellena el empleado · `B1-03`**

| Endpoint | Pantalla |
|---|---|
| `POST /api/closures` | `ReportFormPage` |
| `GET /api/closures/{id}` | `ReportFormPage` |
| `GET /api/closures/{id}/certificate` | `CertificatePage` |

**Cierre de actividad · lo rellena la Fundación · `B1-04`**

| Endpoint | Pantalla |
|---|---|
| `GET /api/admin/activities/pending-closure` | `ReportsQueuePage` |
| `GET` y `PUT /api/admin/activities/{id}/closure` | `ActivityClosurePage` |
| `PATCH /api/admin/activities/{id}/closure/finalize` | `ActivityClosurePage` |

**Y están encadenados a propósito.** El certificado exige las dos cosas: que el empleado haya rellenado su cierre —sin él no existe `closureId`, así que no hay ni URL que pedir— y que la Fundación haya cerrado la actividad. Es lo que incentiva a completar los cierres, que son los que alimentan los dos dashboards. En «Mis voluntariados» esa doble condición ya está pintada tal cual manda el contrato:

| `closureId` | `activityClosed` | Botón |
|---|---|---|
| `null` | `false` | «Cerrar tu participación» |
| tiene valor | `false` | «Ver mi cierre» |
| tiene valor | `true` | «Descargar certificado» |

Lo que falta es que el backend **imponga** esa regla: hoy `getCertificate` devuelve `null` sin comprobar nada.

---

## 3 · Qué se puede desmockear hoy

En el frontend el login ya autentica de verdad. El interruptor de mocks vive en `src/api/mocks.js` y se apaga por configuración módulo a módulo: `VITE_USE_MOCKS=false` tumba todos, y `VITE_USE_<MODULO>_MOCKS` manda sobre esa global. Además, los módulos de la lista `INTEGRATED` —hoy `AUTH` y `REGISTRATION`— van al backend real aunque la global esté encendida, para que reescribir un `.env` no pueda remockear lo ya integrado.

| Pantalla | Endpoints | ¿Hoy? |
|---|---|---|
| **«Mis voluntariados»** · `MyVolunteeringPage` | `/registrations/me` · `cancel` | **sí** |
| **Tablero de inscripciones** · `RegistrationsTablePage` | `/admin/registrations` · `/counts` · `accept` · `reject` · `cancel` | **sí** · el filtro `activityId` es opcional |
| Cierre de participación · `ReportFormPage` | `POST /api/closures` | parcial · la evidencia no se guarda |
| Certificado · `CertificatePage` | `/closures/{id}/certificate` | **no** · `B1-06` |
| Cola de cierres y cierre de actividad · `ReportsQueuePage`, `ActivityClosurePage` | `/admin/activities/*/closure*` | **no** · `B1-04` |
| Catálogo, ficha, propuestas, dashboard, rol entidad | — | **no** |

Con las dos primeras se cuenta de punta a punta el momento central de la demo: alguien se queda en cola, la administradora da de baja a otra persona, la plaza asciende sola y salen los correos.

---

## 4 · «Mis voluntariados» · los cinco cambios en frontend

Es la primera pantalla a integrar: no depende del catálogo ni de nada de BE2. El criterio acordado es que **el frontend se adapta al backend**, porque el backend ya cumple el contrato.

**Lo que ya encaja y no hay que tocar:** `axiosClient` mete el `Authorization: Bearer` y normaliza los errores a `{ status, code, message, fieldErrors }`; la ruta y el método coinciden; y la forma de `MyRegistrationItem` coincide campo a campo, `closureId` y `activityClosed` incluidos.

### 4.1 · Apagar el mock · `src/api/registrationsApi.js`

Hace falta una variable de entorno como la que ya usa `authApi.js` —por ejemplo `VITE_USE_REGISTRATION_MOCKS`, a `false` en `.env.development`—. Mientras haya módulos sin backend, el interruptor tiene que ser **por módulo**, no uno global.

### 4.2 · El campo `accepted` · la única decisión de producto

`MyVolunteeringPage.jsx:28-29` pinta «Aceptada» o «Pendiente de revisión» para las `WAITLISTED` a partir de `item.accepted`. **El backend no devuelve ese campo** y el contrato no lo define, así que con datos reales será `undefined` y **todas dirán «Pendiente de revisión»**, incluidas las ya revisadas. No es un error visible: es información incorrecta que nadie notará.

Dos salidas:

- Quitar el texto del frontend.
- Añadir `accepted` a `MyRegistrationItem`, que es un DTO de BE3: un campo más en la consulta `findMine` y una enmienda al contrato, como la de `B3-17`.

La segunda conserva la distinción entre «en cola sin revisar» y «en cola ya aceptada», que es el concepto central del módulo y justo lo que quiere saber quien espera plaza.

### 4.3 · Campos que no existen · `MyVolunteeringPage.jsx:42-48`

El bloque que busca `item.canCancel`, `item.cancellable`, `item.allowedActions` e `item.actions` es código muerto: **ninguno de los cuatro existe** en el backend ni en el contrato. Cae en un `return true`, así que no rompe, pero hace creer que el backend manda permisos por fila.

### 4.4 · La regla del día de inicio se desvía un día

El frontend usa `startDate < new Date()`, así que **el mismo día de inicio ya oculta el botón**. El backend usa `LocalDate.now().isAfter(startDate)`: ese día **todavía se puede cancelar**. Hay que comparar solo fechas y con «estrictamente posterior», cuidando la zona horaria: `startDate` llega como `YYYY-MM-DD`.

### 4.5 · El comentario del 409 · `MyVolunteeringPage.jsx:171`

`DEADLINE_PASSED` es **400**, no 409. La condición acierta por la rama del `code`, pero el comentario induce a error.

### Cómo verificarlo

Entrando como **`ana.gil@verisure.es`**, que en la semilla tiene tres inscripciones y cubre casi todos los casos:

| Inscripción | Estado | Qué debe verse |
|---|---|---|
| «Acompañamiento a mayores» | `CLOSED`, con cierre | En cerradas · botón de certificado, que hoy responde vacío |
| «Alfabetización digital» | `PENDING_CLOSURE`, sin cierre | «Cerrar tu participación» |
| «Visitas a residencias» | `CONFIRMED` | Botón de cancelar según la fecha |

Y dos comprobaciones: cancelar una confirmada recarga la lista y manda el correo «Ha quedado una plaza libre y es tuya» a quien asciende; cancelar una ya empezada devuelve `DEADLINE_PASSED` y la pantalla lo enseña sin romperse.

---

## 5 · Desajustes que aparecerán en las siguientes pantallas

**Tablero de inscripciones.** El mock llama al campo **`name`**; el backend devuelve **`userName`**, que es lo que fija el contrato. El resto coincide.

**La tarjeta de actividad**, cuando BE2 entregue el catálogo:

| Mock de frontend | Backend · contrato |
|---|---|
| `capacity` | `spots` |
| `organizationName` | `partnerName` |
| `image` | `imageUrl` |
| `description` | no viaja en la tarjeta · sí en el detalle |
| `registeredCount` | previsto en `B2-07` como «plazas ocupadas», pero **sin nombre en el contrato** |
| `favoriteCount` | **no se sirve al empleado** |
| — | faltan `startDate`, `endDate`, `hours` |

`favoriteCount` no llega al catálogo a propósito: enseñar «3 me gusta» hace que una actividad parezca poco interesante y condiciona a quien la mira. El recuento existe solo para el dashboard y el listado de administración. En catálogo y ficha el corazón va marcado o sin marcar, con **`favoritedByMe`**.

**El certificado.** El mock espera `fullName`, `line`, `startDate`, `endDate`, `issuedAt` y `reference`; el backend declara `closureId`, `employeeName`, `activityTitle`, `partnerName`, `actualHours`, `activityEndDate`, `department` y `organization` —y hoy no devuelve ninguno, porque `B1-06` está sin hacer—. El contrato dejó `CertificateResponse` en `TODO C-03`, así que la forma no está escrita en ninguna parte: hay que fijarla antes de tocar el frontend.

---

## 6 · Peticiones para el canal

### Para BE2 · `B2-07`

> `GET /api/activities` y `GET /api/activities/{id}` son lo que más desbloquea ahora mismo: sin catálogo, frontend no puede encender ninguna pantalla de actividades. Están dentro de `B2-07`, junto con la bandeja de propuestas.
>
> Dos cosas al hacerlo:
>
> 1. `ActivityCardResponse` y `ActivityDetailResponse` necesitan el booleano **`favoritedByMe`** y **no** llevan `favoriteCount`. La consulta de apoyo, `FavoriteRepository.existsByActivityIdAndUserId`, ya existe; si queréis, esa parte la escribo yo y os la paso.
> 2. Las **plazas ocupadas** que la tarea menciona no tienen nombre en el contrato y el frontend las pinta como `registeredCount`. Hay que fijar el nombre y añadirlo a `api-contract.md`.

### Para BE1 · `B1-04`, `B1-06` y el contrato

> `B1-04` bloquea el ciclo de cierre entero: hoy `finalizeClosure` solo llama a `closeAllForActivity` y no cierra el `ActivityClosure`, la cola de cierres devuelve página vacía y `ActivityClosurePage` no se puede integrar.
>
> `B1-06` deja el certificado devolviendo `null`, sin comprobar propiedad ni que la actividad esté cerrada.
>
> Y como el contrato dejó `CertificateResponse` en `TODO C-03`, ¿podéis fijar la forma definitiva y escribirla? El frontend está pintando `issuedAt` y `reference`, que hoy no existen.

### Para BE2 · evidencia de los cierres

> En `POST /api/closures` la evidencia se valida pero no se guarda: falta el `FileStorageService` que menciona el `TODO B1-03 · BE2`. Mientras tanto `evidenceUrl` es siempre `null`, lo que afecta al recuento de evidencias de `B1-04` y al certificado.

---

## 7 · Recomendación

1. **Integrar «Mis voluntariados»**, que es de BE3 y está completa, con los cinco cambios de la sección 4.
2. Después, **el tablero de inscripciones**, que solo necesita el renombrado de `name` a `userName`.
3. **Ofrecer a BE2 ayuda con el catálogo**, hablándolo antes por el canal: es lo que desbloquea al resto del equipo y lleva dentro el `favoritedByMe` de BE3.
4. Testing y documentación de BE3 siguen aparcados hasta que el resto esté.
