# 0003 · Cargar cada feature bajo demanda

**Estado:** aceptada · **Fecha:** noviembre de 2026

## Contexto

El build de producción llegó a 502 kB en un solo archivo y Vite empezó a avisar del tamaño. El
frontend incluía el backoffice completo en la primera carga, aunque la mayoría de visitas empiezan
en la landing o en el login.

## Decisión

`React.lazy` por página con un ayudante propio (`createLazyPage`), y el `<Suspense>` dentro de
`AppLayout` y `PublicLayout` en lugar del router: así el menú, la cabecera y el pie siguen
montados mientras llega el trozo de la página.

La landing y el login se quedan estáticos: son la primera pantalla de casi todo el mundo y un
spinner ahí penaliza más que aprovecha.

## Consecuencias

- Bundle de entrada de 502 kB a 350 kB (112 kB gzip), aviso de Vite eliminado.
- El shell importa las API por `features/<x>/api`: importar el barril habría arrastrado las
  páginas y roto el reparto.
- Coste asumido: la primera navegación a cada sección descarga su trozo.

## Alternativas descartadas

- **Subir `chunkSizeWarningLimit`.** Habría escondido el síntoma sin mejorar la carga.
- **Solo separar vendors.** Mejora el caché, pero el backoffice seguiría descargándose entero.
