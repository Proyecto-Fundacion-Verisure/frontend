# Integración del catálogo, la ficha y los favoritos

> **Rama:** `integracion-catalogo-de-actividades-y-favoritos`, en el repositorio de **frontend**,
> siguiendo a `integracion-del-login-frontend-backend` y
> `integracion-mis-voluntariados-y-tablero-inscripciones`.
>
> **Al aprobar, lo único que se hace es copiar este documento** a
> `docs/integracion-catalogo-plan.md` del repositorio de frontend, donde ya viven
> `integracion-login-plan.md` y `tablero-inscripciones.md`. Nada de código todavía.
>
> Después, los pasos se ejecutan **de uno en uno y con aprobación**: se propone el paso, se
> hace, se mira en el navegador y se pasa al siguiente.

## Contexto

`B2-07` está mergeada: `GET /api/activities` y `GET /api/activities/{id}` sirven ya
`ActivityCardResponse` y `ActivityDetailResponse` con `occupiedSpots` y `favoritedByMe`.
Era justo lo que faltaba cuando ayer se integraron «Mis voluntariados» y el tablero de
inscripciones y el trabajo quedó a medias.

Encender el catálogo cierra tres cosas a la vez:

- La rejilla y la ficha dejan de pintar datos inventados.
- **Los favoritos (`B3-07`) se ven por primera vez.** El backend lleva semanas sirviéndolos
  y en el frontend el corazón no está conectado a nada.
- El recorrido de la demo queda entero: catálogo → ficha → apuntarse → cola → tablero →
  «Mis voluntariados».

No toca nada de `B2-03`, que es en lo que está BE2: son archivos distintos y repositorios
distintos.

## Lo que se encuentra el frontend hoy

Todo comprobado leyendo el repositorio de frontend, sin modificar nada.

| Hallazgo | Dónde |
|---|---|
| El interruptor de mocks ya es por módulo y las llamadas reales ya apuntan a la ruta y los parámetros correctos | `src/api/mocks.js`, `src/api/activitiesApi.js:254-263` |
| **El módulo `ACTIVITY` mezcla dos cosas**: el catálogo (ya real) y `/admin/activities`, `/org/activities` y `cancel` (de `B2-05` y `B2-13`, **sin backend**) | `src/api/activitiesApi.js:250-291` |
| **`FavoritesProvider` es código muerto**: nadie lo monta y nadie lo consume; los tres `HeartButton` no tienen `onClick` | `FavoritesContext.jsx`, `ActivityCard.jsx:99`, `ActivityDetailPage.jsx:132,196` |
| **La línea «medio ambiente» no cuadra**: el backend siembra `medioambiente`, el frontend fija `medio_ambiente` | `ActivitySeeder.java:113,119` vs `src/constants/activityLines.js:20` |
| `activityLines.js` apunta a `/images/04-medio_ambiente-linea-de-accion.png`, **que no existe** en `public/images` | `src/constants/activityLines.js:23` |
| El botón de apuntarse se esconde **un día antes de tiempo**: compara `new Date('YYYY-MM-DD') < new Date()`; el backend permite apuntarse el propio día del plazo (`LocalDate.now().isAfter(deadline)`) | `RegisterButton.jsx:16-21` vs `SpotServiceImpl.java:45` |
| El catálogo está restringido a `EMPLOYEE` en el router, pero el backend lo sirve también a `ADMIN`, que además sí puede abrir la ficha | `AppRouter.jsx:52,65,73` |

`ActivityCard` solo lo usa `CatalogPage`, así que renombrar sus campos no afecta a ninguna
pantalla de administración. `ActivitiesListPage` ya acepta los dos nombres con `??`.

## Orden de los pasos

Cada uno se aprueba por separado. El 1 es el único que toca el repositorio de backend; del 2
al 5 son frontend, y el 2 es el que enciende la API real, así que a partir de ahí todo se ve
en el navegador.

## Paso 1 · Enmienda al contrato · repositorio de backend

`docs/api-contract.md` **no fija en ninguna parte los valores de `line` ni de `mode`**, y de
ahí sale el desajuste de «medio ambiente». Se añade a §6.2, junto a los filtros:

- `line` ∈ `desoledad` · `educar` · `acoso` · `medioambiente` — en minúsculas y sin separador.
- `mode` ∈ `PRESENCIAL` · `ONLINE` · `MIXTO` — en mayúsculas.

**Gana `medioambiente`**, que es lo que hay sembrado en la base y en la columna `line` de las
doce actividades. El frontend se adapta, que es el criterio ya acordado en
`docs/evaluacion-integracion.md` §4. Se lleva al canal antes de tocar frontend.

## Paso 2 · Separar el interruptor del catálogo · `src/api/mocks.js`

El catálogo ya tiene backend; el listado de administración y el de la entidad, no. Apagar el
módulo `ACTIVITY` entero dejaría `/admin/activities` y `/org/activities` llamando a endpoints
que todavía no existen.

Se añade una clave propia, **`CATALOG`**, siguiendo el diseño que ya está escrito ahí:

- `getActivities` y `getActivityDetail` pasan a `isModuleMockEnabled('CATALOG')`.
- `getAdminActivities`, `getAdminActivity`, `getPartnerActivities` y `cancelActivity` siguen
  en `ACTIVITY`, mockeados.
- `INTEGRATED` pasa a `new Set(['AUTH', 'REGISTRATION', 'CATALOG'])`.
- `.env.development` y `.env.example`: `VITE_USE_CATALOG_MOCKS=false` y la lista de módulos
  del comentario.

En `activitiesApi.js` desaparecen `mockGetPublishedActivities` y `mockGetActivityDetail`, pero
**`MOCK_ACTIVITIES` se queda**: lo siguen usando los tres mocks de administración y entidad. Se
actualiza el comentario de cabecera, que hoy dice que `GET /api/activities` «no existe
todavía».

## Paso 3 · Los nombres de campo · tarjeta y ficha

Renombrado directo, sin `??` de compatibilidad: el mock del catálogo desaparece, así que no hay
dos formas conviviendo.

| Frontend hoy | Backend |
|---|---|
| `capacity` | `spots` |
| `registeredCount` | `occupiedSpots` |
| `organizationName` | `partnerName` |
| `image` | `imageUrl` |

- **`ActivityCard.jsx:14-32,42-44,73-75`** · la desestructuración, la imagen y el pie.
- **`ActivityDetailPage.jsx:111-114,140-141,155-158`** · lo mismo, más `description` y
  `registrationDeadline`, que ahora sí llegan de verdad en la ficha.
- **`LINE_LABELS`** en los dos archivos y **`LINE_OPTIONS`** en `CatalogPage.jsx:16`:
  `medio_ambiente` → `medioambiente`. Lo mismo en `src/constants/activityLines.js`, junto con
  la ruta de imagen rota.
- `favoriteCount` no llega ni debe llegar: el corazón va marcado o sin marcar.

> **Al día de hoy esto se quedó corto en dos cosas**, resueltas después con el merge de `B2-03`
> (ver «Adiós a la portada», más abajo): el renombrado alcanzaba solo al catálogo —quedaban
> propuestas, certificado, panel de entidad, formulario y datos de demo—, y el archivo de imagen
> acabó renombrado a `04-medioambiente-linea-de-accion.png` en vez de apuntar al nombre viejo.

`CatalogPage` ya manda `line`, `mode`, `from`, `to`, `page` y `size` con los nombres correctos y
lee `content` y `totalElements`, así que la paginación no se toca. Sí conviene quitar el
`fetchActivities` duplicado de `CatalogPage.jsx:77-99`, que declara la misma carga dos veces y
solo se usa en el botón «Reintentar».

## Paso 4 · Encender los favoritos

`FavoritesProvider` ya está escrito y hace lo correcto —pintado optimista, revierte si el
backend falla y no deja pulsar dos veces—. Solo hay que enchufarlo.

- **`AppRouter.jsx:68-72`** · envolver con `<FavoritesProvider>` el mismo tramo donde ya vive
  `RegistrationsProvider`, que es el que cubre `/activities`. La ficha
  (`/activities/:activityId`, línea 52) cuelga de `ADMIN`+`EMPLOYEE` y queda fuera de ese
  tramo: usa `useFavoritesOptional`, y sin proveedor el corazón simplemente no se pinta, igual
  que ya hace con las inscripciones.
- **`CatalogPage.jsx:229-236`** · pasar a cada `ActivityCard` el `onToggleFavorite`, el
  `favoritedByMe` resuelto con `getFavorite(activity.id, activity.favoritedByMe)` y el
  `isFavoritePending`. La tarjeta ya acepta las tres propiedades y no las recibe nunca.
- **`ActivityDetailPage.jsx:132-136,196-199`** · los dos `HeartButton` de la ficha comparten
  estado por el contexto, así que pulsar uno mueve el otro.
- El `POST /api/favorites` repetido devuelve **409 `ALREADY_FAVORITED`**: se trata como éxito,
  porque el corazón ya está donde el usuario quería.

## Paso 5 · El día del plazo · `RegisterButton.jsx:16-21`

Comparar solo fechas y con «estrictamente posterior», igual que ya hay que corregir en
«Mis voluntariados» (`docs/evaluacion-integracion.md` §4.4): construir la fecha local desde
`YYYY-MM-DD` y esconder el botón únicamente cuando **hoy es posterior** al plazo. Hoy el
frontend cierra la inscripción un día antes que el backend, y el único síntoma es un botón
que no está.

## Lo que no entra

- **`B2-05`, `B2-13` y el rol entidad**: sus listados siguen mockeados a propósito.
- **Abrir el catálogo a `ADMIN`** en el router: el backend lo permite y la ficha ya lo hace,
  pero es una decisión de producto. Se pregunta en el canal y se hace aparte.
- **Pruebas nuevas.** Sí hay que dejar verde lo que ya existe:
  `ActivityCard.test.jsx`, `CatalogPage.test.jsx`, `ActivityDetailPage.test.jsx`,
  `contractApis.test.js` y `src/test/fixtures/activities.js` usan los nombres viejos. Es
  actualizar fixtures, no escribir casos.
- Nada del repositorio de backend salvo la enmienda del paso 1.

## Verificación

Backend arrancado con la semilla y sesión de **`ana.gil@verisure.es`**.

| Comprobación | Qué debe verse |
|---|---|
| `/activities` | **9 tarjetas**, las visibles de las doce; ninguna `DRAFT`, `PENDING_APPROVAL` ni `CANCELLED` |
| Plazas | «Visitas a residencias» sale **2 de 2** y con la etiqueta «Completa» |
| Las `FINISHED` | «Acompañamiento a mayores» **3 de 8** y «Alfabetización digital» **2 de 6**. «Campaña contra el acoso escolar» sale **0 de 5** y es correcto: `RegistrationSeeder` no le siembra ninguna inscripción |
| Corazones | Con `ana.gil@verisure.es`, marcados **«Limpieza de playas» y «Charlas de prevención»**; pulsar uno lo cambia, recargar lo conserva |
| Fallo de red al pulsar | El corazón vuelve a su sitio solo |
| Pulsar dos veces seguidas | El 409 `ALREADY_FAVORITED` no revierte el corazón |
| Filtros | Línea, modalidad y las dos fechas, sueltos y combinados; **«Medio ambiente» devuelve dos** —«Limpieza de playas» y «Reparto del banco de alimentos»— donde hoy devolvería vacío. La tercera con esa línea, «Voluntariado ambiental», está en `PENDING_APPROVAL` y no se publica |
| Paginación | Con `size` pequeño, ninguna actividad repetida entre páginas |
| Ficha de una `PUBLISHED` | Descripción, entidad y plazas; el botón de apuntarse lleva a la cola |
| Ficha de una `DRAFT` | «Actividad no encontrada», no un error feo |
| Actividad cuyo plazo vence hoy | El botón **sigue visible** y apuntarse funciona. **No se puede probar con la semilla tal cual**: ningún plazo cae hoy, van a `today+7`, `+12`, `+21`, `+30`, `+40`, `+50` o al pasado. O se pone a mano `registration_deadline = CURRENT_DATE` en una publicada, o se da por bueno con `src/utils/dates.test.js`, que fija el reloj y cubre la víspera, el propio día y el siguiente |
| Sesión de entidad colaboradora | Ver «El catálogo y la entidad colaboradora», debajo: son **tres** comprobaciones y ninguna es «entra y sale un 403» |
| Consola de red | Una sola petición al catálogo por cambio de filtro |

Sobre las pruebas: **la rama ya venía roja**, con 18 fallos en `axiosClient.test.js`,
`AuthContext.test.jsx`, `OrgDashboardPage.test.jsx`, `ActivitiesListPage.test.jsx` y la
paginación de `CatalogPage.test.jsx`, todos anteriores a esta integración. Lo exigible aquí es
que ese número no suba, comprobado con `git stash` contra la rama limpia.

## Adiós a la portada · `B2-03`

Mergeada en backend después de escribir lo de arriba. `Activity` **pierde `imageUrl` por
completo** —entidad, DTO, proyección y consulta— y `ActivitySeeder` deja de asignar imagen. La
decisión: las portadas de actividad **no se suben ni se editan**; son la imagen de la línea de
acción, que resuelve el frontend. La subida que sí queda es la evidencia del cierre, por
`FileStorageService`.

- **`ActivityCard.jsx` y `ActivityDetailPage.jsx`** · la portada y la etiqueta salen de
  `getLineByValue(line)` (`src/constants/activityLines.js`), que ya usaban `ProposalForm`,
  `OrgProposalFormPage` y `DashboardFilters`. Desaparecen los `LINE_LABELS` duplicados. Si la
  línea no se reconoce queda el hueco «Sin imagen», mejor que un `<img>` roto.
- **`uploadActivityImage` fuera** de `activitiesApi.js`. Llamaba a
  `POST /admin/activity-images`, que **nunca existió en el backend** —comprobado con
  `git log --all -S`—: solo estaba especificado en `docs/api-contract.md`. Era un fallo
  alcanzable: `createActivity` no tiene rama de mock, así que crear una actividad adjuntando
  imagen reventaba con 404 y perdía el envío entero.
- **`ActivityFormPage.jsx`** · fuera el control de portada, el de URL para la entidad,
  `validateImage`, `ALLOWED_IMAGE_TYPES`, `MAX_IMAGE_SIZE`, el estado `imageFile` y
  `buildRequestPayload`, que ya no necesita ser asíncrona.
- **`medio_ambiente` → `medioambiente` en todo el repositorio**, no solo en el catálogo:
  propuestas (`ProposalsInboxPage`, `ProposalDetailPage`, `proposalsApi`, `fixtures/proposals`),
  `CertificatePage`, `ActivityFormPage`, `orgDashboard`, `public/demo-data.json` y
  `scripts/restore-demo.js`. El `ProposalSeeder` del backend también siembra `medioambiente`,
  así que esos módulos habrían fallado igual al integrarse.
- **La imagen se renombró** a `public/images/04-medioambiente-linea-de-accion.png`, siguiendo el
  patrón `0X-<línea>-linea-de-accion.png` de las otras tres.

Pendiente en el repositorio de backend, sin bloquear nada: el `TODO` de
`ParticipationClosureServiceImpl` sigue citando `POST /api/admin/activity-images` como patrón
para la evidencia; ahora el patrón es `FileStorageService`.

## El catálogo y la entidad colaboradora

La tabla decía antes «`/activities` no es suyo; si entra, 403 bien pintado». **Eso no ocurre**, y
quien lo intente se queda sin saber si ha probado algo: al entrar como entidad se aterriza ya en
`/org/activities`, así que escribir `/activities` y acabar en el mismo sitio es indistinguible de
que no pase nada.

Lo que hay de verdad son dos cosas ciertas que no son la misma:

- El backend **sí** reserva `GET /api/activities` a `EMPLOYEE` y `ADMIN`, y responde 403 a una
  entidad. Lo hace la cadena de seguridad, por eso `ActivityCatalogController` no lleva
  `@PreAuthorize`.
- El frontend **nunca llega a pedirlo**. `/activities` cuelga de
  `<RoleRoute roles={['EMPLOYEE']} />`, y `RoleRoute.jsx:17` no pinta ningún error: hace
  `<Navigate to={getRoleHomePath(user.role)} replace />`, que para `PARTNER` es
  `/org/activities`. Es la misma tabla `ROLE_HOME_PATHS` (`src/routes/routeAccess.js`) que usa
  `LoginForm.jsx:27` al entrar, de ahí que los dos caminos lleven al mismo destino.

Conclusión: el tramo `error?.status === 403` de `CatalogPage.jsx` es **inalcanzable en el
navegador** para una entidad. No sobra —cubre que el rol guardado en el cliente se desincronice
del token, por una sesión vieja o un rol cambiado en servidor—, pero se verifica aparte.

Contraseña de toda la semilla: `Verisure2026!`

**1 · La entidad no entra al catálogo.** Con sesión de `jorge.ibanez@cruzroja.org`, ir primero a
`/org/proposals` —para no partir del destino del rebote— y escribir `/activities`. Debe acabar en
`/org/activities`. Y en DevTools → Network, filtrando XHR, **no debe salir ninguna petición a
`/api/activities`**: el guardia corta antes de la red, y esa es la afirmación de verdad. El
`replace: true` hace además que «atrás» no devuelva a `/activities`.

**2 · El backend responde 403**, comprobado aparte:

```sh
TOKEN=$(curl -s -X POST localhost:8080/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"jorge.ibanez@cruzroja.org","password":"Verisure2026!"}' | jq -r .accessToken)
curl -s -o /dev/null -w '%{http_code}\n' localhost:8080/api/activities -H "Authorization: Bearer $TOKEN"
```

**3 · El 403 se pinta bien**, saltándose el guardia a propósito. Con sesión de entidad, en la
consola del navegador:

```js
const u = JSON.parse(localStorage.getItem('user')); u.role = 'EMPLOYEE';
localStorage.setItem('user', JSON.stringify(u)); location.href = '/activities';
```

El router deja pasar porque mira ese campo, la petición sale con el token de entidad, el backend
la rechaza y debe verse «No tienes permiso para ver el catálogo.». Cerrar sesión después para
limpiar.
