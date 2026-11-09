# 0001 · Organizar el frontend por dominio

**Estado:** aceptada · **Fecha:** noviembre de 2026

## Contexto

El frontend crecía por capas técnicas: `api/`, `components/`, `pages/`, `styles/`, `test/`. Para
cambiar una pantalla había que tocar cinco carpetas distintas y nada impedía que el código de dos
dominios se mezclara. Con nueve dominios y 471 tests, el coste de navegación era el problema, no
la falta de abstracción.

## Decisión

Organizar por dominio y dejar tres capas:

- `app/` — composition root: routing, providers, layout, navegación, estilos globales, arnés de test.
- `features/<dominio>/` — todo lo del dominio: API, componentes, hooks, modelo, páginas, estilos.
- `shared/` — lo que no sabe de ningún dominio: UI, gráficos, hooks, utilidades, tokens.

Las fronteras no se confían a la memoria: `scripts/check-architecture.mjs` falla el build si una
feature importa `app/`, si `shared` importa una feature o si hay ciclos entre features.

## Consecuencias

- Añadir una pantalla es crear una carpeta, no tocar cinco.
- Los límites están automatizados: el script rechazó un import entre features durante el
  desarrollo del panel de entidad, que era exactamente para lo que se escribió.
- Coste asumido: imports relativos más largos y más archivos `index.js` que mantener.

## Alternativas descartadas

- **Mantener capas técnicas con alias.** No resolvía el problema de cohesión.
- **Monorepo con paquetes por dominio.** Sobredimensionado para una aplicación de este tamaño.
