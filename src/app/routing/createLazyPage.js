import { lazy } from 'react';

// Los barriles de cada feature exportan páginas y API. `import()` diferido
// mantiene cada feature en su propio trozo, pero un barril solo se puede
// importar dinámicamente si la página también: de ahí este ayudante, que toma
// el export con nombre del barril y lo convierte en el default que espera
// `lazy`.
export default function createLazyPage(loader, exportName) {
  return lazy(() => loader().then((module) => ({ default: module[exportName] })));
}
