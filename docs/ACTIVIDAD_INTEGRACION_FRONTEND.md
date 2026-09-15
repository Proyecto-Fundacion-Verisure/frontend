# Actividad: corrección integral de la integración del frontend con el backend

## Datos de la actividad

| Campo | Valor |
| --- | --- |
| Fecha | 15/09/2026 |
| Repositorio | `frontend` |
| Rama | `fix/hide-confirmed-activity-detail` |
| Actividad GitHub | [#202](https://github.com/Proyecto-Fundacion-Verisure/frontend/issues/202) |
| Estado | Finalizada en frontend; pendiente de disponibilidad contractual en backend |
| Horas previstas | 16 h de trabajo manual |
| Horas utilizadas | 0 h 45 min de ejecución asistida, aproximadamente |

> Las horas utilizadas corresponden al tiempo técnico registrado durante esta sesión y no deben contabilizarse como dedicación humana del equipo. La previsión representa el esfuerzo manual equivalente para analizar, implementar, probar y documentar el mismo alcance.

## Objetivo

Dejar el frontend preparado para consumir el contrato real del backend, eliminar comportamientos híbridos entre datos simulados y API real, robustecer la sesión y adaptar la interfaz a respuestas parciales mientras el equipo de backend completa los endpoints todavía no disponibles.

## Alcance realizado

### Configuración e integración HTTP

- Se dejó la API real como comportamiento predeterminado en desarrollo.
- Se añadió `VITE_USE_MOCKS=true` como activación explícita y centralizada del modo demo.
- Se evitó mezclar, dentro de una misma sesión, operaciones simuladas con llamadas reales.
- Se excluyó el fallo de inicio de sesión del interceptor global de `401`, para que el formulario pueda mostrar el error correspondiente.
- Se normalizaron respuestas paginadas, listas y alias de campos recibidos desde el backend.

### Contratos de actividades

- Se transforman las solicitudes del formulario al contrato esperado: `mode`, `spots`, fechas locales y línea `medioambiente`.
- Se aceptan en las respuestas los alias `capacity/spots`, `organizationName/partnerName`, `image/imageUrl` y `mode/modality`.
- Se añadió la modalidad mixta y la ubicación al formulario.
- Se corrigió la validación para permitir actividades que empiezan y terminan el mismo día.
- Se separaron las rutas y llamadas de edición de actividades administrativas y de organizaciones colaboradoras.
- El catálogo simulado solo muestra estados públicos y no expone borradores ni actividades canceladas.
- La ocupación se oculta cuando el backend no entrega un contador fiable, evitando representar un cero falso.

### Autenticación y sesión

- La sesión guardada se valida mediante `/auth/me` antes de permitir el acceso a rutas protegidas.
- Se añadieron el estado de inicialización y la limpieza de sesión ante `401/403`.
- Se corrigió el control de cuentas colaboradoras cuando el backend no devuelve todavía el campo `status`.
- Se añadió la pantalla y la ruta de verificación de correo.
- El alta de organizaciones envía el consentimiento exigido por el contrato.
- El modo demo cubre inicio y cierre de sesión, usuario actual, registro, verificación y reenvío de correo.

### Favoritos e imágenes

- Se conectaron las acciones de añadir y quitar favoritos desde el catálogo y el detalle.
- Se añadió actualización optimista con recuperación ante error.
- Se corrigió la propagación del estado pendiente de favoritos.
- Las imágenes protegidas bajo `/uploads/` se solicitan con el token y se representan mediante una URL temporal segura.

### Inscripciones y cierres

- Se normaliza `id` como `registrationId` en todas las respuestas.
- Se admiten tanto listas directas como respuestas paginadas.
- Se evita mostrar una aceptación inexistente cuando el backend omite el campo `accepted`.
- Se corrigieron los datos temporales del modo demo y sus contadores de inscripciones.
- Las horas reales del cierre se validan como enteros, en consonancia con el contrato actual.
- El certificado tolera los alias disponibles y oculta los campos que el backend todavía no proporciona.

### Propuestas, organización y navegación

- Las propuestas de organización se guardan primero como borrador y después se envían mediante una operación separada.
- Se unificó el origen de las actividades de organización para evitar datos inconsistentes.
- Se corrigió la carga y el tratamiento de errores del panel de organización.
- Se eliminaron contadores estáticos del menú lateral.
- La bandeja de cuentas pendientes utiliza el total real de la respuesta paginada.
- Se eliminó el identificador de actividad fijo de la ruta de inscripciones administrativas.
- Se corrigió el contrato interno del componente de paginación.

### Mantenimiento y documentación

- Se corrigió el nombre de la imagen de la línea de acción medioambiental.
- Se migraron los usos obsoletos de Sass `map-get` a `map.get`.
- Se actualizaron README, guía de demo, contingencia y guion para explicar la integración real y el modo simulado.
- Se añadieron y ajustaron pruebas de normalizadores, sesión, errores de login, verificación de correo, consentimiento y permisos.

## Distribución estimada del esfuerzo

| Bloque | Horas previstas (manuales) | Horas utilizadas (sesión asistida) |
| --- | ---: | ---: |
| Auditoría de contratos y rutas | 3 h | 0 h 10 min |
| Adaptación de API, normalizadores y mocks | 4 h | 0 h 12 min |
| Autenticación, actividades, favoritos e imágenes | 4 h | 0 h 08 min |
| Inscripciones, cierres, propuestas y navegación | 3 h | 0 h 05 min |
| Integración con los cambios recientes de `dev`, pruebas, compilación y documentación | 2 h | 0 h 10 min |
| **Total** | **16 h** | **0 h 45 min** |

## Validación realizada

- `npm run test -- --run`: 51 archivos y 286 pruebas superadas.
- `npm run build`: compilación de producción finalizada correctamente.
- `git diff --check`: sin errores de espacios ni marcadores de conflicto.
- Revisión del repositorio backend en modo de solo lectura: sin modificaciones realizadas.

## Fuera de alcance

- No se modificó ningún archivo, rama, configuración, prueba ni contrato del repositorio backend.
- La implementación de endpoints ausentes y la ampliación de DTO pertenecen al equipo de backend.
