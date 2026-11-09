# Decisiones de arquitectura (ADR)

Cada archivo registra **una** decisión: qué se decidió, por qué y qué se acepta a cambio. Sirven
para que dentro de seis meses —o para quien revise el repositorio— no haya que reconstruir el
razonamiento leyendo el historial de Git.

| #                                         | Decisión                                                           | Estado   |
| ----------------------------------------- | ------------------------------------------------------------------ | -------- |
| [0001](0001-screaming-architecture.md)    | Organizar el frontend por dominio (`app/`, `features/`, `shared/`) | Aceptada |
| [0002](0002-sin-mocks-en-desarrollo.md)   | Eliminar los mocks de desarrollo                                   | Aceptada |
| [0003](0003-carga-diferida-por-rutas.md)  | Cargar cada feature bajo demanda                                   | Aceptada |
| [0004](0004-contrato-antes-que-codigo.md) | El contrato de API se escribe antes que el código                  | Aceptada |
| [0005](0005-un-return-por-componente.md)  | Un solo `return` por componente y lógica fuera del JSX             | Aceptada |

Una decisión se sustituye creando otro ADR que la reemplace; no se reescribe el anterior.
