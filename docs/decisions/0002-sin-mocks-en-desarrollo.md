# 0002 · Eliminar los mocks de desarrollo

**Estado:** aceptada · **Fecha:** noviembre de 2026

## Contexto

Durante la construcción por módulos, cada pantalla tenía su mock y un interruptor por variable de
entorno. Servía para avanzar mientras el backend no existía, pero llegó un punto en que una
pantalla "funcionaba" con datos que no venían de ninguna parte, y el aviso de datos ficticios
convivía con indicadores reales en el mismo producto.

## Decisión

Sin mocks en la aplicación. Los únicos dobles viven en `src/shared/testing/` y solo los usan los
tests con `vi.mock`. Si falta un endpoint, se escribe en el contrato y se implementa: el último
caso —`GET /api/org/dashboard`— se resolvió así, implementando el endpoint en el backend.

## Consecuencias

- Con el backend apagado la aplicación falla: es lo honesto y lo que se vería en producción.
- Ninguna cifra de la interfaz puede venir de datos inventados.
- Coste asumido: para ver una pantalla hay que levantar el backend y la base de datos.

## Alternativas descartadas

- **Mantener el mock del dashboard de entidad.** Daba una pantalla que parecía terminada y no lo
  estaba; ocultó durante semanas que faltaba un endpoint.
