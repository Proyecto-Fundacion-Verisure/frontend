# Integración del rol entidad, el alta de organización y el ciclo de la propuesta

> **Rama:** `integracion-rol-partner`, en el repositorio de **frontend**, siguiendo a
> `integracion-del-login-frontend-backend`, `integracion-mis-voluntariados-y-tablero-inscripciones`
> y `integracion-catalogo-de-actividades-y-favoritos`.
>
> Este documento vive en `docs/integracion-rol-entidad-plan.md` de los dos repositorios: se
> planificó desde el de backend y el trabajo cae en el de frontend.
>
> Después, los pasos se ejecutan **de uno en uno y con aprobación**: se propone el paso, se hace,
> se mira en el navegador y se pasa al siguiente.
>
> **Estado: hecho.** Los seis pasos están ejecutados y el ciclo completo se ha visto en el
> navegador, correos incluidos. El documento se ha reescrito para contar lo que se hizo, que no es
> exactamente lo que se planeó: las diferencias están marcadas como **«Cambio sobre el plan»**.

## Contexto

La demo cuenta hoy el recorrido de la empleada de punta a punta: catálogo, favoritos, solicitar
plaza, cola, tablero y «Mis voluntariados». Lo que no cuenta es **de dónde salen las actividades**,
porque aparecen sembradas. Todo lo que hay antes de que una actividad exista —la entidad que se da
de alta, la que la redacta, la Fundación que la aprueba— está en el frontend con datos inventados,
aunque el backend lleva semanas sirviéndolo.

Esta integración cierra ese tramo entero:

**la entidad se da de alta → redacta su actividad → la envía a revisión → la Fundación la aprueba o
la devuelve con un comentario → aparece en el catálogo → la empleada se apunta**

Y la otra vía de entrada, en paralelo: **la entidad propone una necesidad → la Fundación la acepta →
nace una actividad en borrador que la administradora completa y publica.**

Se puede hacer entero ahora porque en los últimos días han caído las tres piezas que faltaban:
`B2-13` (actividades de la entidad), `B2-15` (aprobar o devolver) y `fix/admin-activities-list`
(el listado de administración, mergeado en el PR #211). No pisa a nadie: BE1 está en `B1-06`, el
certificado, que no entra aquí.

## Qué hay de verdad en el backend hoy

Comprobado en `src/main/java/com/verisure/backend/controller/` sobre `dev`, no en la documentación.

| Endpoint | Estado |
|---|---|
| `POST /api/auth/register` · `RegisterPartnerRequest` | ✅ real |
| `GET` · `POST` · `PUT /api/org/activities` · `PATCH .../submit` | ✅ real, `partnerId` del token |
| `GET` · `POST /api/org/proposals` | ✅ real |
| `GET /api/admin/proposals` · `/{id}` · `accept` · `reject` | ✅ real |
| `GET /api/admin/activities` · `?status=` | ✅ real · **recién mergeado** |
| `GET /api/admin/activities/pending` · `PATCH .../approve` · `PATCH .../return` | ✅ real · `B2-15` |
| `POST` · `GET` · `PUT` · `cancel` · `publish` de `/api/admin/activities` | ✅ real · `B2-05` |
| `GET /api/auth/verify` · `POST /api/auth/resend-verification` | ❌ sin controlador · `B1-15`/`B1-16` |
| `GET`/`PATCH /api/admin/org-accounts/**` | ❌ sin controlador · BE1 |
| `POST /api/proposals` (formulario público de la landing) | ❌ sin controlador |
| `GET /api/org/dashboard` · `/api/dashboard/**` | ❌ sin empezar |

Las tres rutas sin controlador **están permitidas en la cadena de seguridad**, así que llamarlas hoy
devuelve **404, no 401 ni 403**: un error que parece de red y no de falta de implementación.

**Con el listado de administración dentro, el módulo de actividades ya no tiene ningún hueco**: las
seis llamadas de `activitiesApi.js` que hoy están mockeadas tienen backend real.

## Lo que se encuentra el frontend hoy

Todo comprobado leyendo el repositorio de frontend, sin modificar nada.

| Hallazgo | Dónde |
|---|---|
| **Media integración ya hecha sin querer**: `createOrgActivity`, `updateOrgActivity`, `submitOrgActivity`, `getOrgActivities`, `getPendingActivities`, `approveActivity`, `returnActivity`, `createActivity`, `updateActivity`, `publishActivity`, `getProposal`, `acceptProposal` y `rejectProposal` **no tienen rama de mock** y ya llaman al backend real | `orgApi.js:126-129`, `activitiesApi.js:301-318`, `proposalsApi.js:124-128` |
| …pero **los listados que llevan a ellas están mockeados**, así que el detalle se abre con ids que no existen → 404 | `AppRouter.jsx:72,98`, `proposalsApi.js:119` |
| **`getPendingActivities` no la llama nadie**: no hay ruta `/admin/activities/pending` ni pantalla que la use. Las acciones de revisión se pintan dentro de `/admin/activities` | `activitiesApi.js:313`, `AppRouter.jsx:72` |
| `returnActivity` ya manda **`{ note }`**, exactamente lo que espera `ReturnActivityRequest` | `activitiesApi.js:316-318` |
| El listado de la entidad usa `getPartnerActivities` (mock de `activitiesApi`), **no** `getOrgActivities` (real de `orgApi`): dos caminos para lo mismo | `AppRouter.jsx:7,98` vs `orgApi.js:126` |
| **La paginación no manda `size`**: el frontend calcula con `PAGE_SIZE = 10` pero pide solo `page`, y el backend sirve 20 por defecto | `ActivitiesListPage.jsx:14,75` |
| **El botón de cancelar se ofrece en `FINISHED` y `CANCELLED`**, y el backend los rechaza con 409 (`ACTIVITY_FINISHED` y `ACTIVITY_NOT_EDITABLE`) | `ActivitiesListPage.jsx:180-188` vs `ActivityServiceImpl.assertEditable` |
| Los siete valores del filtro de estado **coinciden uno a uno** con `ActivityStatus`: el filtro funciona tal cual | `ActivitiesListPage.jsx:16-25` |
| **El alta de organización no manda `consent`**, y el backend lo valida con `@AssertTrue` → 400 seguro | `OrgRegisterPage.jsx:90-97` vs `RegisterPartnerRequest` |
| El alta manda `name` y pinta los errores por campo en `organizationName`: los `fields` del backend **no encontrarán su input** | `OrgRegisterPage.jsx:26,91,103` |
| El modal de éxito ofrece **«reenviar correo»**, que llama a `POST /auth/resend-verification` · **404** | `OrgRegisterPage.jsx:118`, `orgApi.js:70` |
| La propuesta de la entidad manda `line`, `image`, `consent` y `status`; el backend espera `description`, `suggestedLine`, `estimatedVolunteers`, `scope` **y nada más** | `OrgProposalFormPage.jsx:102-128` vs `CreateOrgProposalRequest` |
| **La propuesta tiene botón de «guardar borrador»**, y en el backend nace `NEW` y no hay borradores | `OrgProposalFormPage.jsx:92-112` |
| `submitOrgProposal` llama a `PATCH /org/proposals/{id}/submit`, **que no existe** | `orgApi.js:186` |
| La bandeja de la entidad pinta `item.title` y estados `PENDING_APPROVAL`; el backend manda `description` y `NEW`·`ACCEPTED`·`REJECTED` | `OrgProposalsPage.jsx:49,54` vs `OrgProposalRow` |
| La bandeja del admin pinta `row.organizationName` y `row.line`; el backend manda `partnerName` y `suggestedLine` | `ProposalsInboxPage.jsx:104,111` vs `ProposalRow` |
| La bandeja del admin tiene **columna «Descripción»**, y `ProposalRow` **no la lleva** (solo el detalle) | `ProposalsInboxPage.jsx:115-119` |
| El detalle del admin pinta `proposal.cif`, **que no existe** en `ProposalDetailResponse` | `ProposalDetailPage.jsx:123` |
| La columna **«Favoritos»** llega en `ActivitySummary` (listado y cola) pero **no** en `OrgActivityRow`: a la entidad no se le sirve ese recuento, a propósito | `ActivitiesListPage.jsx:142` |
| En `PENDING_APPROVAL` el listado ofrece **aprobar y devolver sin mirar el rol**: una entidad vería botones de administración sobre sus propias actividades | `ActivitiesListPage.jsx:150-156` |

Y cuatro más que el plan no había visto y que aparecieron al ejecutarlo:

| Hallazgo | Dónde |
|---|---|
| **El formulario de actividad no hablaba el contrato**: mandaba `modality`, `maxParticipants` y timestamps ISO; `CreateActivityRequest` espera `mode`, `spots`, `location` y `LocalDate` (`YYYY-MM-DD`). También afectaba a la administradora: `POST /api/admin/activities` devolvía 400 por `mode` y `spots` nulos | `ActivityFormPage.jsx` (`buildPayload`) |
| **La entidad no podía editar**: no existe `GET /api/org/activities/{id}`, `OrgActivityRow` no lleva `description`, y el «Editar» del listado apuntaba a `/activities/{id}/edit`, ruta de ADMIN, y el formulario cargaba con `getAdminActivity` → 403 | `ActivitiesListPage.jsx:162-164`, `ActivityFormPage.jsx:139` |
| `CIF_ALREADY_REGISTERED` decía «Ya existe una entidad registrada con este CIF», que es justo lo que **no** significa: el backend lo lanza cuando **el correo** ya tiene cuenta en esa entidad | `domainMessages.js` vs `AuthServiceImpl:57-61` |
| El `Modal` rearmaba su efecto de foco con cada render porque dependía de `onClose` (una arrow inline en todas las pantallas): con cada tecla en el campo de «Devolver» el cursor saltaba a la × | `Modal.jsx` |

## Orden de los pasos

El 1 enciende la API real, así que a partir de ahí todo se ve en el navegador. Los pasos 2 y 3 son
el recorrido de la entidad; del 4 al 6, el de la Fundación. El 6 es el que cierra el ciclo y el que
se enseña en la demo.

**Esta integración no toca el repositorio de backend**: las enmiendas al contrato que necesitaba ya
se hicieron en `fix/admin-activities-list`.

## Paso 1 · Trocear el interruptor de mocks · `src/api/mocks.js`

`ORG` mezcla hoy cuatro cosas con backends distintos, y apagarlo entero mandaría
`/admin/org-accounts` y `/org/dashboard` contra endpoints que no existen. Igual que se hizo con
`CATALOG`, se separan las claves:

| Clave | Qué cubre | Estado |
|---|---|---|
| `ACTIVITY` | `/admin/activities`, su detalle, cancelar y publicar | **integrada** |
| `ORG_REGISTER` | `createOrganization` | **integrada** |
| `ORG_ACTIVITY` | listar, crear, editar y enviar a revisión las actividades de la entidad | **integrada** |
| `ORG_PROPOSAL` | listar y crear propuestas de la entidad | **integrada** |
| `PROPOSAL_INBOX` | bandeja y detalle del admin, aceptar y rechazar | **integrada** |
| `ORG` | `/admin/org-accounts` y `/org/dashboard` | sigue en mock |
| `PROPOSAL` | `createProposal`, el formulario público de la landing | sigue en mock |
| `CLOSURE` | certificado y cierre de actividad | sigue en mock · `B1-06` |
| `DASHBOARD` | KPIs y exportaciones | sigue en mock |

- `INTEGRATED` pasa a `new Set(['AUTH', 'REGISTRATION', 'CATALOG', 'ACTIVITY', 'ORG_REGISTER', 'ORG_ACTIVITY', 'ORG_PROPOSAL', 'PROPOSAL_INBOX'])`.
- `.env.development` y `.env.example`: las líneas nuevas a `false` y el comentario de cabecera al
  día, que hoy dice que el listado de administración y el rol entidad «no tienen backend todavía».
- **Cambio sobre el plan · los mocks no se borran, se quedan como escotilla**, igual que se hizo
  con `AUTH`, `REGISTRATION` y `CATALOG`: cada módulo integrado se remockea con su
  `VITE_USE_<MODULO>_MOCKS=true` para trabajar con el backend apagado. `MOCK_ACTIVITIES` además no
  podía borrarse: lo usa el mock del catálogo. Lo que sí se borró es lo que era un segundo camino
  hacia lo mismo: `getPartnerActivities` (el real es `orgApi.getOrgActivities`) y
  `submitOrgProposal` (el endpoint no existe). Los mocks de `orgApi.js` y `proposalsApi.js` se
  reescribieron con la forma real de `OrgActivityRow`, `OrgProposalRow` y `ProposalDetailResponse`.

## Paso 2 · El alta de organización · `POST /api/auth/register`

Lo que se enciende es el formulario y sus errores; lo que no puede encenderse es entrar después,
porque el usuario nace `PENDING_VERIFICATION` (`AuthServiceImpl:91`) y no existe ni la verificación
por correo ni la bandeja de cuentas. La pantalla de éxito tiene que decir eso y no prometer un
correo que nadie manda.

- **`OrgRegisterPage.jsx:90-97`** · añadir **`consent: values.consent`** al envío. Sin él, el
  `@AssertTrue` del backend devuelve 400 con `fields: { consent: [...] }` y el formulario parece
  roto sin motivo visible.
- **Los errores por campo** · el backend nombra `name`, el formulario `organizationName`. Se
  traduce al recibirlos, en el `catch` de `OrgRegisterPage.jsx:103-107`. El resto de nombres
  (`cif`, `contactName`, `email`, `phone`, `password`, `consent`) ya coinciden.
- **Los dos 409** · `CIF_ALREADY_REGISTERED` y `EMAIL_ALREADY_REGISTERED` son cosas distintas y hoy
  el formulario no distingue ninguna. Los dos están ya escritos en el contrato (§3 y §6.1, con la
  nota que explica la diferencia) y se añaden a `src/api/domainMessages.js`, que es donde viven los
  mensajes de dominio. **Un CIF que ya existe no es un error**: si el correo es nuevo, el registro
  se acepta y la cuenta se cuelga de la entidad que ya había.
- **Fuera el reenvío de correo** · `handleResendEmail`, `resendOrganizationRegistrationEmail` y el
  botón del modal. Llaman a un endpoint que devuelve 404 y prometen algo que no ocurre. Se sustituye
  por el texto de que la Fundación revisará la solicitud. Cuando `B1-15`/`B1-16` aterricen, vuelve.
- **`AccountStatusPage`** no se toca: cuelga de `/admin/org-accounts`, que sigue mockeado. Por eso
  `resendOrganizationRegistrationEmail` sigue en `orgApi.js`: solo sale de `OrgRegisterPage`.
- **El modal de éxito no nombra la entidad.** El 201 devuelve un `UserResponse` sin `partnerName`
  ni marca de si el CIF ya existía, así que con `G08123456` y un correo nuevo el frontend no puede
  decir «tu cuenta se ha vinculado a Cáritas Barcelona». El texto avisa de que, si la entidad ya
  estaba registrada, la cuenta queda con el nombre que ya tenía. Ver «Peticiones para el canal».

## Paso 3 · El panel de la entidad · sus propuestas

**Cambio sobre el plan · la entidad habla en lenguaje de propuestas.** Una entidad no publica
actividades: las **propone**, la Fundación las aprueba o las devuelve, y solo al aprobarlas pasan al
catálogo. Lo que rellena en `/org/activities` es, para ella, una propuesta de actividad. Así que su
menú es «Nueva propuesta» y «Mis propuestas», su listado se llama «Mis propuestas», el formulario
«Proponer una actividad de voluntariado», el botón «Enviar propuesta», y los estados se leen como
`DRAFT` «Borrador», `PENDING_APPROVAL` «Enviada», `PUBLISHED` «Aprobada». Para la administradora el
formulario no cambia de nombre. El menú de la entidad se queda con Dashboard, Nueva propuesta y Mis
propuestas: **«Cierres» sale**, porque los cierres son de la Fundación y de la plantilla.

- **`OrgActivitiesPage.jsx`** (nueva) · sustituye al uso de `ActivitiesListPage` para la entidad.
  Dos bloques: **Pendientes de aprobación** (`DRAFT` y `PENDING_APPROVAL`) y **Aprobadas** (el
  resto). Como `GET /api/org/activities` filtra por un solo `status`, la página trae todas las
  páginas (de 50) y reparte aquí; una entidad tiene pocas. Sin columna «Favoritos» (`OrgActivityRow`
  no la lleva), sin Aprobar/Devolver ni Cancelar (no hay endpoint en `/org`), con Editar y **«Enviar
  propuesta»** (`SubmitForReviewButton.jsx`, nuevo, con confirmación) en los borradores, y con
  `reviewNote` pintado como «Devuelta por la Fundación: …» bajo el título.
- **`ActivityFormPage.jsx`** · `buildPayload` habla ahora `CreateActivityRequest`: `mode`
  (`PRESENCIAL`/`ONLINE`/`MIXTO`, como el filtro del catálogo), `spots`, `location` (campo nuevo,
  opcional) y fechas `type="date"` que viajan como `YYYY-MM-DD`. Las reglas de fechas son las de
  `@ValidDateRange` (fin ≥ inicio, plazo ≤ inicio). Corrige también el formulario de la
  administradora.
- **Edición de la entidad** · ruta nueva `/org/activities/:activityId/edit`. Sin detalle en `/org`,
  el formulario se rellena con la fila que le pasa el listado por `state` del enlace «Editar»; si se
  entra por URL, busca el id en las páginas de `getOrgActivities`, y lo que no está ahí es 404 (una
  actividad de otra entidad nunca aparece: el backend filtra por el `partnerId` del token). Como
  `OrgActivityRow` no trae `description`, hay que reescribirla al editar, y el formulario lo avisa.
  Ver «Peticiones para el canal».
- `ACTIVITY_NOT_EDITABLE` (409) y `NOT_OWNER` (403) llegan ya traducidos por `ApiError` y se pintan
  como mensaje.

## Paso 4 · Las propuestas · la bandeja y el detalle del admin

**Cambio sobre el plan · las dos pantallas de la entidad salen del backoffice.** El backend tiene
dos caminos para que una entidad proponga: la actividad entera (`/org/activities`, paso 3) y la
propuesta de cuatro campos (`/org/proposals`), que al aceptarse deja a la Fundación un borrador a
medio rellenar. Para una entidad **con cuenta** el primero es el bueno, y tener los dos en su menú
confundía. `OrgProposalsPage` y `OrgProposalFormPage` se han borrado; `/org/proposals` y
`/org/proposals/new` redirigen a `/org/activities` y `/org/activities/new`. El camino de cuatro
campos queda para el formulario público de la landing (organizaciones sin cuenta), y por eso la
bandeja del admin sigue haciendo falta. `getOrgProposals` y `createOrgProposal` se quedan en
`orgApi.js`: el endpoint existe y está en el test de contrato.

- **`ProposalsInboxPage.jsx:104,111,145,152`** · `organizationName` → **`partnerName`** y
  `row.line` → **`row.suggestedLine`**. `partnerName` **es nulo** cuando la propuesta llegó por el
  formulario público: la fila se pinta igual, con «Sin entidad» en vez de un hueco.
- **Fuera la columna «Descripción»** de la bandeja · `ProposalRow` no la lleva y está en el detalle.
  En su lugar entra `estimatedVolunteers`, que sí viaja y es lo que decide si la propuesta interesa.
- **`ProposalDetailPage.jsx:103,111,119,123`** · `organizationName` → `partnerName`, `line` →
  `suggestedLine`, **fuera `cif`**. Entran `scope` y `consentAt`, que llegan y hoy no se pintan.
  Contacto nulo (propuesta pública) → «—».
- **Aceptar** · `AcceptProposalButton.jsx` navega con el id del 201 al formulario de la actividad
  nueva con `state.fromProposal`, y el formulario avisa de que lo que llega está **a medio rellenar
  a propósito**: descripción, línea y plazas vienen de la propuesta; título, fechas y horas son
  marcadores (§6.4 del contrato).
- **Rechazar** devuelve **204 sin cuerpo**: la lista se recarga, no se lee la respuesta. El 409
  `PROPOSAL_ALREADY_DECIDED` se pinta en la bandeja.
- **Ni aceptar ni rechazar mandan correo**: no hay aviso para propuestas en los trece de §5. Ver
  «Peticiones para el canal».

## Paso 5 · El listado de administración · `/admin/activities`

Es la pantalla que acaba de dejar de estar bloqueada. No hay ningún renombrado: `ActivitySummary`
trae exactamente lo que la tabla pinta.

- **El filtro de estado funciona tal cual**: los siete valores de `STATUS_OPTIONS` coinciden con
  `ActivityStatus`, y «Todos los estados» manda cadena vacía, que `pickParams` descarta y el backend
  interpreta como sin filtro.
- **`ActivitiesListPage.jsx:75`** · añadir **`size: PAGE_SIZE`** a los parámetros. Hoy pide solo
  `page` y el backend sirve 20 por defecto mientras la pantalla calcula con 10. Con doce actividades
  no se nota, pero es un descuadre que aparece en cuanto haya más.
- **`ActivitiesListPage.jsx:180-188`** · «Cancelar» solo en `DRAFT`, `PUBLISHED`, `FULL` e
  `IN_PROGRESS`. Antes salía también en `FINISHED` y `CANCELLED`, que el backend rechaza con 409
  (`ACTIVITY_FINISHED` y `ACTIVITY_NOT_EDITABLE`; los dos ya estaban en `domainMessages.js`).
- La columna «Favoritos» **se queda** aquí: `favoriteCount` llega de verdad, y el contrato explica
  por qué se sirve a administración y no al catálogo.

## Paso 6 · La cola de revisión de la Fundación · lo que cierra el ciclo

El frontend ya tiene escritas las tres llamadas y el componente; lo que falta es **dónde vive**.

- **Ruta nueva `/admin/activities/pending`** en `AppRouter.jsx`, en el tramo de `ADMIN`, junto a
  `/admin/activities/pending-closure`, que ya sigue ese patrón. Reutiliza `ActivitiesListPage` con
  `fetchData={getPendingActivities}`, título «Actividades pendientes de revisión», la columna de
  entidad y las acciones de revisión encendidas, y **sin** filtro de estado: todas están en
  `PENDING_APPROVAL`.
- **Sale de `/admin/activities`**, donde vive hoy. Son dos cosas distintas —un inventario y una
  cola—, con orden distinto (descendente frente a ascendente) y acciones distintas, y mezclarlas
  obliga a buscar la revisión con un filtro.
- **`PartnerActivityReviewActions`** ya manda `{ note }` y ya exige el comentario antes de llamar.
  El **400** del backend, si la nota llegara vacía, se pinta bajo el campo dentro del modal. El
  **409 `ACTIVITY_NOT_PENDING_APPROVAL`** (dos personas revisando lo mismo) no es un error que
  arreglar: cierra el modal, avisa «Otra persona ya había revisado esta propuesta» y recarga la
  lista. El código está en `domainMessages.js`.
- **En `/admin/activities`** una `PENDING_APPROVAL` ya no ofrece Aprobar/Devolver: solo un botón
  «Revisar» que lleva a la cola.
- **El enlace «Revisión de propuestas» en la navegación de administración**, en «Participación»,
  antes de «Cierres», con globo real (`totalElements` de la cola). De paso el globo de «Propuestas»
  pasa a ser real (`NEW` en la bandeja) en vez del `3` fijo de `useSidebarCounts.js`; solo «Cierres»
  sigue con cifra inventada, que es lo único sin backend.
- Aprobar y devolver **sacan la actividad de la cola** —a `PUBLISHED` y a `DRAFT`—, y la lista se
  recarga con `setReloadKey`, que la pantalla ya usa.

## Lo que no entra

- **El formulario público de propuestas de la landing** (`/proposal`): `POST /api/proposals` no
  tiene controlador. Sigue mockeado y se pide a BE2 por el canal.
- **La bandeja de cuentas de entidad** (`/admin/org-accounts`) y **`AccountStatusPage`**: no hay
  backend. Es de BE1.
- **El dashboard de la entidad y el de la Fundación**: sin backend.
- **El certificado y el ciclo de cierre**: `B1-06` está en curso. Va en su propia integración.
- **Pruebas nuevas.** Sí hay que dejar verde lo que ya existe: `contractApis.test.js`,
  `ActivityFormPage.test.jsx`, `ActivitiesListPage.test.jsx`, `proposalsApi.test.jsx` y los fixtures
  de propuestas y actividades usan los nombres viejos. Es actualizar fixtures, no escribir casos. La
  rama venía con fallos anteriores: lo exigible es que ese número no suba, comprobado con
  `git stash` contra la rama limpia.

## Verificación

Backend arrancado con la semilla y Mailpit en marcha. **Ojo con Mailpit**: `application.properties`
lleva `mail.smtp.auth=true` fijo, y sin `MAIL_USER`/`MAIL_PASSWORD` en el `.env` el backend intenta
autenticarse con usuario vacío, Mailpit no anuncia `AUTH` y el envío falla con `Authentication
failed` (solo se ve en el log del backend, `MailDispatcher` lo captura). Hay que arrancarlo con
`mailpit --smtp-auth-accept-any --smtp-auth-allow-insecure`, o el backend con
`SPRING_MAIL_PROPERTIES_MAIL_SMTP_AUTH=false`. Y el `.env` no puede llevar espacios al final de
`MAIL_HOST`: `spring-dotenv` no los recorta.

### El ciclo completo, de una tirada

Es el recorrido nuevo y el que conviene ensayar seguido, porque es el que se enseña.

| # | Con quién | Qué se hace | Qué debe verse |
|---|---|---|---|
| 1 | `marta.ribas@caritasbcn.org` | «Nueva propuesta» | Nace en `DRAFT` y aparece en «Mis propuestas», en Pendientes |
| 2 | la misma | «Enviar propuesta» | Pasa a «Enviada» · **dos correos en Mailpit**, uno por cada ADMIN (Carmen y Diego) |
| 3 | `carmen.ortega@fundacionverisure.org` | Menú «Revisión de propuestas» (con globo) | La propuesta está en la cola, con su entidad, sin selector de estado |
| 4 | la administradora | «Devolver» **sin comentario** | El cliente lo corta; forzándolo, **400** con mensaje legible |
| 5 | la administradora | «Devolver» con comentario | Vuelve a `DRAFT` · sale de la cola · **correo con el comentario dentro** |
| 6 | la entidad | «Mis propuestas» | Borrador otra vez, con «Devuelta por la Fundación: …»; al editar, el comentario arriba del formulario |
| 7 | la entidad | Corregir y «Enviar propuesta» | Otra vez en la cola |
| 8 | la administradora | «Aprobar» | Pasa a `PUBLISHED` · sale de la cola · **correo** · en «Mis propuestas» pasa a Aprobadas sin el comentario |
| 9 | `fernando.toro@verisure.es` | Abrir el catálogo | **La actividad nueva está ahí** y se puede solicitar plaza |

### El resto

| Comprobación | Qué debe verse |
|---|---|
| Alta de organización con datos nuevos | 201 y el modal de solicitud recibida · fila nueva en `partner` con estado `PENDING` |
| Alta con el CIF `G08123456` y un correo nuevo | Se crea la cuenta y **no** se duplica la entidad: reutiliza «Cáritas Barcelona» |
| Alta con `marta.ribas@caritasbcn.org` | **409** `EMAIL_ALREADY_REGISTERED`, sobre el campo de correo |
| Alta sin marcar el consentimiento | El formulario lo corta antes; forzando el envío, el 400 cae sobre la casilla |
| Entrar con la cuenta recién creada | **403 `ACCOUNT_NOT_VERIFIED`** · es el comportamiento correcto hoy y la pantalla lo explica |
| `/org/activities` («Mis propuestas») | Solo las de Cáritas Barcelona · **ninguna de otra entidad** · sin columna «Favoritos» · sin Aprobar/Devolver ni Cancelar · menú sin «Cierres» ni «Mis propuestas» de cuatro campos |
| Editar una `DRAFT` propia · una que ya no lo esté | La primera guarda (la descripción hay que reescribirla, y el formulario lo avisa); la segunda da **409 `ACTIVITY_NOT_EDITABLE`** con mensaje legible |
| Editar por URL una actividad de otra entidad | «No encontramos la actividad»: el listado de la entidad no la contiene |
| `/org/proposals` como entidad | Redirige a «Mis propuestas» |
| Formulario de admin `/activities/new` | `POST /api/admin/activities` **201** (antes 400 por `mode` y `spots`) |
| Aprobar dos veces (dos pestañas) | Aviso «Otra persona ya había revisado esta propuesta» y la lista se recarga |
| `/admin/activities` con una `PENDING_APPROVAL` | Solo «Revisar», que lleva a la cola |
| `/admin/activities` sin filtro | **12** actividades, `DRAFT` y `CANCELLED` incluidas, la de fecha más lejana primero |
| Filtro por cada uno de los siete estados | `PUBLISHED` devuelve 3, `PENDING_APPROVAL` 1, `CANCELLED` 1 · «Todos» vuelve a 12 |
| «Cancelar» en el listado | No aparece en `FINISHED`, `CANCELLED` ni `PENDING_APPROVAL`; en una publicada cancela y avisa a las inscritas |
| Paginación con el filtro puesto | Cambiar de estado vuelve a la página 1 y el recuento cuadra |
| Aprobar dos veces (dos pestañas) | **409 `ACTIVITY_NOT_PENDING_APPROVAL`** con mensaje, no error genérico |
| `/proposals` como administradora | Las propuestas sembradas, **incluida la que no tiene entidad** (`partnerName` nulo), sin huecos rotos |
| Abrir el detalle de una propuesta | Contacto, línea sugerida, personas beneficiarias y consentimiento · **sin CIF** |
| Aceptar una propuesta | **201** · lleva al formulario de la actividad nueva en `DRAFT`, precargada con descripción, línea y plazas, con el aviso de que el resto son marcadores · **sin correo**, es lo previsto |
| Aceptarla otra vez | **409 `PROPOSAL_ALREADY_DECIDED`** con mensaje |
| Entrar como entidad en `/activities` | **403** · el catálogo no es suyo, y la pantalla lo dice |
| Consola de red | Ninguna llamada a `/auth/resend-verification`, `/org/proposals` ni `/org/proposals/*/submit` |

## Peticiones para el canal

**Para BE2 · el formulario público de propuestas.** `POST /api/proposals` está abierto en
`SpringConfig:70` y sembrado en `ProposalSeeder`, pero no tiene controlador, así que la landing
recibe un 404. Es lo único que falta para que el ciclo de la propuesta esté entero por las dos vías.

**Para BE1 · el alta de entidad muere a medias.** El registro funciona, pero el usuario nace
`PENDING_VERIFICATION` y no hay ni `GET /api/auth/verify` ni `POST /api/auth/resend-verification`
(`B1-15`, `B1-16`) ni la bandeja `/api/admin/org-accounts`. Hasta que existan, **una entidad nueva
no puede entrar nunca**, y en la demo hay que usar una cuenta sembrada.

**Para BE3 · la entidad no puede recuperar su propia descripción.** No hay `GET /api/org/activities/{id}`
y `OrgActivityRow` no lleva `description`, así que al editar un borrador la entidad tiene que
reescribirla. Con un detalle en `/org` (la forma de `ActivityFormResponse` sin `partnerName`) o con
`description` en la fila, el formulario se rellenaría entero y sobraría el aviso que hoy lo explica.

**Para BE2 · aceptar o rechazar una propuesta no avisa a nadie.** `POST /api/admin/proposals/{id}/accept`
y `PATCH …/reject` no llaman a `NotificationService`, y en los trece avisos de §5 no hay ninguno de
propuesta. Para la landing pública es discutible (quien propone no tiene cuenta, pero sí dejó un
correo); si se quiere, son dos métodos más.

**Para BE1 · el 201 del alta no dice a qué entidad se ha colgado la cuenta.** Devuelve un
`UserResponse` (id, nombre, correo, rol) sin `partnerName` ni ninguna marca de si el CIF ya existía.
Con `G08123456` y un correo nuevo, el frontend no puede decir «tu cuenta se ha vinculado a Cáritas
Barcelona, que ya estaba registrada»: el modal se limita a avisar de que, si la entidad existía, la
cuenta queda con el nombre que ya tenía. Con `partnerName` y un `partnerAlreadyExisted` en la
respuesta, el modal lo diría con nombre y apellidos.

**Para el equipo · `evaluacion-integracion.md` se ha quedado atrás.** Daba por no empezados el rol
entidad, las propuestas y el cierre de actividad, y los tres están mergeados. Conviene rehacer el
recuento ahora que `B2-15` y el listado de administración han caído.
