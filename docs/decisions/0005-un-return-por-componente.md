# 0005 · Un solo `return` por componente y lógica fuera del JSX

**Estado:** aceptada · **Fecha:** noviembre de 2026

## Contexto

Varias pantallas habían crecido hasta las 300-550 líneas: validación, llamadas a la API, estados de
carga y condicionales anidados dentro del JSX. `ActivityFormPage` llegó a 546 líneas con doce
`return` y ternarios dentro de ternarios. Funcionaba, pero era imposible revisarlo.

## Decisión

Cada feature separa tres piezas:

- `model/` — funciones puras: validación, payloads, textos, selección de vista.
- `hooks/` — estado y orquestación: carga, guardado, errores.
- componentes — solo pintan, con los flags calculados antes del `return`.

Un componente, un `return`. Nada de IIFE en el JSX (había uno en `RegistrationCard`).

## Consecuencias

- `ActivityFormPage` de 546 a 42 líneas; `DashboardPage` de 351 a 84; `MyVolunteeringPage` de 310 a
  36; `ProposalForm` de 342 a 24.
- La lógica pura se prueba sin montar React: 51 tests de modelo nuevos.
- Coste asumido: más archivos por feature, aunque cada uno hace una sola cosa.

## Alternativas descartadas

- **Aplicar solo la regla del `return` sin extraer el modelo.** Habría movido el problema de sitio.
