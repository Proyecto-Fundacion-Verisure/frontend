# 0004 · El contrato de API se escribe antes que el código

**Estado:** aceptada · **Fecha:** noviembre de 2026

## Contexto

Frontend y backend son repositorios independientes. Cada vez que una pantalla necesitaba un campo
que el endpoint no devolvía, la tentación era inventarlo en el frontend o cambiarlo de tapadillo en
el backend, y el resultado eran dos aplicaciones con ideas distintas del mismo dato.

## Decisión

`backend/docs/api-contract.md` es la única fuente de verdad. Un cambio de contrato sigue este
orden: documento → backend → frontend, en PR separados y en ese orden. Si un campo no está en el
contrato, no se inventa.

## Consecuencias

- El panel de entidad se implementó con el contrato escrito primero, y por eso `benefitedPeople`
  pudo definirse a partir de `Proposal.scope` en lugar de inventar una métrica.
- Las decisiones discutibles —qué cuenta como «hora» o «persona distinta»— quedan escritas y
  compartidas por los dos paneles.
- Coste asumido: cada cambio de API toca dos repositorios y dos PRs.

## Alternativas descartadas

- **Generar el contrato desde el código.** Habría descrito lo que hay, no lo que se acuerda.
