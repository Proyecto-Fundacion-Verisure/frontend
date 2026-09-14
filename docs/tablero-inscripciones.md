# Tablero de inscripciones · las secciones y los contadores no casan

14 de septiembre. Escrito después de probar la pantalla contra el backend real, con la semilla cargada.

**Resumen en tres líneas.** Al aceptar la única inscripción sin revisar, la sección «Sin revisar» pareció **cambiar de nombre** a «Confirmadas»; no hubo tal cosa, es que cada sección se esconde al quedarse sin filas. Tirando de ese hilo aparece un desajuste mayor: la pantalla tiene **siete secciones** y la cabecera **tres contadores**, y no se pueden casar, porque los tres contadores no son tres grupos. La propuesta es reducir a **dos secciones de trabajo y un historial plegado**, pero la decisión es vuestra.

---

## 1 · Los tres contadores no son tres cajas

Es lo primero que hay que tener claro, porque descarta la solución que parece obvia.

La cabecera pinta `confirmed`, `waitlisted` y `unreviewed`, que llegan de `GET /api/admin/registrations/counts`. Esto es lo que cuenta cada uno, según la consulta del backend (`RegistrationRepository.java:116-124`):

| Contador | Qué cuenta |
|---|---|
| `confirmed` | las que están en `CONFIRMED` |
| `waitlisted` | **todas** las que están en `WAITLISTED`, revisadas o no |
| `unreviewed` | las de `WAITLISTED` **con `accepted = false`** |

**`unreviewed` está dentro de `waitlisted`, no al lado.** Una persona sin revisar se cuenta en los dos.

Por eso «pongamos una sección por contador» no funciona: las mismas filas saldrían en dos secciones y los números no sumarían el total de la actividad. Conviene decirlo antes de que alguien lo intente.

## 2 · Las siete secciones de hoy

`RegistrationsTablePage.jsx:8-16` declara siete: Sin revisar, Aceptadas en cola, Confirmadas, Pendientes de cierre, Cerradas, Rechazadas y Canceladas.

Las tres primeras tienen contador. Las cuatro últimas no tienen ninguno, y no están vacías en datos reales: la actividad 10 de la semilla ya arrastra una cancelación, y la 1 tiene tres cerradas.

A eso se suma que cada sección desaparece al quedarse sin filas (`RegistrationsTablePage.jsx:187`), así que **el tablero cambia de forma con cada decisión**. Es exactamente lo que se vio al aceptar: una sección se fue, otra ocupó su sitio, y desde fuera parecía la misma renombrándose.

## 3 · La propuesta

**En cola** y **Confirmadas** como tablero de trabajo, y las cuatro terminales agrupadas en un **Historial** plegado con su total.

```
Confirmadas 2 · En cola 3, de las que 2 sin revisar

En cola              3
  Elena Sanz       [Sin revisar]  [aceptar] [rechazar]
  Daniela Rueda    [Sin revisar]  [aceptar] [rechazar]
  Carlos Peña      [En cola]      [dar de baja]

Confirmadas          2
  Beatriz Nuño     [Confirmada]   [dar de baja]

▸ Historial (2)
```

Tres consecuencias que conviene mirar antes de decidir:

**La distinción entre «sin revisar» y «aceptada en cola» no se pierde, se mueve.** Baja del título de la sección a la etiqueta de cada fila, que ya existe en `STATUS_BADGES` (`RegistrationsTablePage.jsx:18-26`). Esa distinción es el concepto central del módulo —separa a quien espera una decisión de quien ya la tiene y espera plaza— y no puede desaparecer; lo que cambia es dónde se lee.

**Los botones pasan a decidirse por fila, no por sección.** Hoy el juego de columnas se elige mirando la sección (`RegistrationsTablePage.jsx:193-197`). Con «En cola» mezclando filas revisadas y sin revisar, la celda de acciones tiene que mirar `registration.accepted`: si es `false`, `RegistrationDecisionActions`; si es `true`, `CancelRegistrationAction`. Los dos componentes ya existen y no hay que tocarlos.

**La cabecera debería enunciar la relación en vez de alinear tres cifras sueltas.** Algo como «Confirmadas 2 · En cola 3, de las que 2 sin revisar», para que nadie intente sumarlas.

## 4 · Por qué un historial y no un filtro

Es la alternativa natural y no sale bien con el backend de hoy.

`GET /api/admin/registrations` acepta `status`, pero **solo un estado por petición** (`RegistrationController.java:81`). No hay forma de pedir «las vivas» en una llamada, así que mientras no se elija un filtro las terminales seguirían mezcladas con las demás — que es justo el problema que se quiere quitar. Agrupar en cliente no toca el backend ni abre otra ronda de contrato.

Dato suelto por si sirve más adelante: ese parámetro `status` **existe y nadie lo usa**. El hook `useRegistrations` nunca lo pasa al pedir el tablero. Está disponible el día que queráis un filtro de verdad.

## 5 · Lo que esta forma cuesta

Dos tablas leen mejor que siete, pero meten en la misma tabla dos situaciones que piden acciones distintas: una fila con «aceptar/rechazar» al lado de otra con «dar de baja». La etiqueta de estado lo sostiene, y por eso la propuesta insiste en ella.

Si al usarlo se ve que confunde, la salida es separar «Sin revisar» como tercera sección **siempre visible**. No es volver atrás: la clave del arreglo no es cuántas secciones hay, sino que dejen de aparecer y desaparecer.

## 6 · Qué habría que tocar

| Fichero | Qué |
|---|---|
| `src/features/registrations/RegistrationsTablePage.jsx` | `SECTIONS`, `getSectionKey`, la elección de columnas y la cabecera |
| `src/styles/pages/_registrations-table.scss` | el bloque plegable del historial |
| `src/features/registrations/RegistrationsTablePage.test.jsx` | sus casos afirman los títulos actuales, como `/confirmadas 1/i` y `/sin revisar 1/i` |

Sin cambios en `RegistrationDecisionActions.jsx` ni en `CancelRegistrationAction.jsx`.

**Y lo que más importa de todo esto:** que las secciones **dejen de esconderse al quedarse vacías**. Ese `return null` es el origen del renombrado aparente, y si se conserva, el problema sigue igual con dos secciones que con siete.

---

## En qué queda

Esto no es una preferencia de estilo: sale de probar la pantalla con datos reales y ver que se comporta de forma desconcertante al decidir una inscripción. La forma final la elegís vosotras. Lo único que pedimos que no se quede fuera es la corrección del punto 6 y que la diferencia entre «sin revisar» y «aceptada en cola» siga siendo legible en algún sitio.
