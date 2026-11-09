# Imágenes · procedencia, licencia y huecos a sustituir

Las imágenes actuales de la landing y el login son generadas con IA y no encajan con el tono del
proyecto. Este documento fija **qué imagen va en cada hueco**, las medidas recomendadas y las
licencias aceptadas, para que sustituirlas no deje dudas sobre su origen.

## Reglas de casa

1. Solo se aceptan imágenes de **dominio público** o de bancos con licencia libre comercial:
   Pexels, Unsplash y Pixabay. Nada de Google Imágenes.
2. **Nunca** una foto de la Fundación sin permiso escrito: las fotos de su web tienen derechos de
   sus autores y de las personas retratadas.
3. El **logotipo** de Fundación Verisure no se sustituye por una imagen de banco: es una marca. Para
   el portafolio se usa el logotipo neutro del proyecto (o el texto «Voluntariado») hasta tener
   permiso.
4. Un atribución por imagen, aunque el banco no la exija: un portafolio que cita sus fuentes se lee
   mejor.
5. **Peso**: ninguna imagen por encima de 250 kB. Formato WebP o JPG, y el ancho máximo que se
   indica abajo.

## Huecos a cubrir

| Hueco                            | Archivo actual                                         | Peso hoy | Medida recomendada         | Qué debe mostrar                                                                                                                 |
| -------------------------------- | ------------------------------------------------------ | -------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Fondo del login                  | `src/shared/assets/images/login-background.png`        | 920 kB   | 1600 × 2000, WebP ≤ 200 kB | Personas voluntarias colaborando, encuadre vertical, tono cálido y **oscuro en el lado izquierdo** para que el formulario se lea |
| Imagen del hero / colaboración   | `src/features/landing/assets/landing-colaboration.png` | 148 kB   | 1200 × 900, WebP ≤ 200 kB  | Grupo de voluntariado al aire libre, diverso, con ropa neutra (sin logos de otras marcas)                                        |
| Retrato del pie                  | `src/shared/assets/images/footer-portrait.jpg`         | 14 kB    | 800 × 1000, JPG ≤ 120 kB   | Retrato cercano y natural de una persona voluntaria, mirando a cámara o en acción                                                |
| Línea · Desoledad                | `public/images/lines/desoledad.svg`                    | SVG      | SVG o 600 × 400            | Persona mayor acompañada, conversación, manos                                                                                    |
| Línea · Educar para proteger     | `public/images/lines/educar.svg`                       | SVG      | SVG o 600 × 400            | Aula, mentoría, niñas y niños estudiando                                                                                         |
| Línea · Protegidos ante el acoso | `public/images/lines/acoso.svg`                        | SVG      | SVG o 600 × 400            | Grupo de adolescentes juntos, ambiente seguro                                                                                    |
| Línea · Medio ambiente           | `public/images/lines/medioambiente.svg`                | SVG      | SVG o 600 × 400            | Recogida de residuos, plantación, naturaleza                                                                                     |

## Dónde buscar (búsquedas ya preparadas)

**Pexels** — licencia libre para uso comercial, atribución no obligatoria pero recomendable:

- Voluntariado en general: <https://www.pexels.com/search/volunteers/>
- Manos y colaboración: <https://www.pexels.com/search/volunteering%20hands/>
- Personas mayores: <https://www.pexels.com/search/elderly%20care/>
- Educación y mentoría: <https://www.pexels.com/search/teaching%20children/>
- Medio ambiente: <https://www.pexels.com/search/beach%20cleanup/>

**Unsplash** — misma idea, fotografía algo más editorial:

- <https://unsplash.com/s/photos/volunteering>
- <https://unsplash.com/s/photos/community-garden>
- <https://unsplash.com/s/photos/volunteer-portrait>

## Criterios de selección (para que no parezca un banco de imágenes)

- **Personas reales y diversas**, sin miradas de catálogo ni sonrisas forzadas.
- **Sin marcas visibles**: ni ropa con logos, ni carteles legibles de otras entidades.
- **Luz natural** y colores tierra o coral; el proyecto usa coral como acento, así que una foto
  dominada por azul eléctrico rompe la paleta.
- **Espacio negativo** en el lado donde va el texto (login) o el titular (hero).
- Preferir **acciones reconocibles** (recogiendo, acompañando, enseñando) a símbolos genéricos
  (manos en círculo, corazones).

## Atribuciones

Al sustituir cada archivo, añade su fila aquí. Formato: archivo, autor, banco, enlace a la foto y
licencia.

| Archivo                       | Autor                          | Banco    | Enlace      | Licencia                       |
| ----------------------------- | ------------------------------ | -------- | ----------- | ------------------------------ |
| `login-background.png`        | _pendiente_                    | Pexels   | _pendiente_ | Pexels License                 |
| `landing-colaboration.png`    | _pendiente_                    | Pexels   | _pendiente_ | Pexels License                 |
| `footer-portrait.jpg`         | _pendiente_                    | Unsplash | _pendiente_ | Unsplash License               |
| `lines/desoledad.svg`         | _pendiente_                    | —        | —           | —                              |
| `lines/educar.svg`            | _pendiente_                    | —        | —           | —                              |
| `lines/acoso.svg`             | _pendiente_                    | —        | —           | —                              |
| `lines/medioambiente.svg`     | _pendiente_                    | —        | —           | —                              |
| `logo-fundacion-verisure.png` | Marca de la Fundación Verisure | —        | —           | Uso académico; ver `NOTICE.md` |
