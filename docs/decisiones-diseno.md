El Poemario — Registro de decisiones de diseño

Documento interno de decisiones cerradas, con su justificación. No es un plan
abierto: es la fuente de verdad de por qué el sitio es como es. Cada entrada lleva
decisión, razón y estado.

Regla de mantenimiento (obligatoria): toda PR que cierre, cambie o invalide una
decisión actualiza este archivo en la misma PR. Un registro desactualizado miente;
aplica aquí la misma lección que con los títulos de commit.

Origen: sesión de auditoría de junio de 2026 sobre `main` (color, foco, pergamino),
ampliada por la sesión de diagnóstico de rediseño de junio de 2026, que contrastó
página por página la maqueta de rediseño contra el sitio vivo.

\---

1. Objetivo de diseño vigente: converger a las maquetas

Decisión: el sitio vivo debe converger hacia la maqueta de rediseño. El objetivo es
un sitio más minimalista y limpio, concentrado en el texto y más navegable en móvil.
Esto abarca estructura, layout, jerarquía tipográfica y espaciado — no solo color.

La maqueta es ahora la referencia de estructura/DOM, salvo en las divergencias
deliberadas documentadas en este registro (p. ej. §12: retratos en ficha de autor,
nav sin burger). El color ya está cerrado e implementado (§2–§4) y no forma parte
de este objetivo.

Nota histórica: una versión previa de este documento sostenía lo contrario —que el
sitio vivo ya superaba a la maqueta y que esta solo aportaba dirección visual. Esa
lectura queda ANULADA. El diagnóstico página por página mostró divergencias
estructurales reales que el rediseño debe cerrar (ver §10–§11).

\---

2. Nomenclatura de tokens (repo manda)

La maqueta usaba abreviaturas (`--oro-tx`, `--oro-sv`, `--muted`). El repo usa nombres
largos y es la fuente de verdad: `--oro`, `--oro-texto`, `--oro-suave`, `--text`,
`--text-soft`, `--text-muted`, `--verse`, `--link`, `--link-hover`, `--accent`. Cualquier
trabajo futuro usa los nombres del repo, no los de la maqueta.

Estado: vigente.

\---

3. Sistema de acento: Oro + Marfil + Verdís (IMPLEMENTADO)

Decisión: el sistema de acento es Oro + Marfil + Verdís. Se descartan Lapis y el
oro-como-accent que la maqueta ofrecía a modo de selector; el conmutador de acento de la
maqueta era ayuda de revisión, no UI de producción. El acento queda fijo en Verdís.

Verdís — valores (dependientes de tema):

* `--accent` noche (`:root`): `#66a08f` — 6.09:1 sobre `#161320`.
* `--accent` pergamino: `#356152` — 5.53:1 sobre `#efe3c8`.

Mapeo de `--accent` — un solo rol, scopeado al poema ("la otra voz"):

* `.prose :global(blockquote)` en `Poema.astro` — `border-left` en `var(--accent)`.
Marca la voz citada/secundaria, distinta del verso del poeta.
* Glifo lunar `◑` del conmutador pergamino — color `var(--accent)`. Única afordancia
interactiva del poema que no es un enlace.

No usa Verdís (se mantienen en oro): `divisor-rombo`, borde y rótulo de `nota-curador`,
`chips` de taxonomía, y todos los enlaces.

Justificación (a11y + UX): un acento solo se gana su sitio con un rol semántico
consistente; esparcirlo lo degrada a ruido. El oro es la identidad estructural
compartida entre páginas y no se fragmenta. El color no es el único portador de
significado (WCAG 1.4.1): el blockquote ya se distingue por sangrado e itálica.

Estado: implementado en `main` (PR-A). Confirmado en `src/styles/tokens.css`.

\---

4. Paleta pergamino corregida (contraste WCAG) (IMPLEMENTADO)

El modo pergamino tenía tres fallos de contraste y dos valores al límite. Como `--oro`
se usa como texto en `Poema.astro`, el umbral aplicable es 4.5:1. Correcciones (solo
afectan a `\\\\\\\[data-theme='pergamino']`, que solo se renderiza en el poema):

* `--oro`: `#8a6d34` (3.82 ✗) → `#6a5223` (5.80 ✓)
* `--text-muted`: `#6b5d44` (5.04) → `#615338` (5.88 ✓)
* `--oro-suave`: `#9c7d3e` (3.04 ⚠) → `#75592b` (5.12 ✓)
* `--oro-texto`: `#7a5f2c` (4.71) → `#5f4a1f` (6.63 ✓)
* `--link`: `#7a5f2c` (4.71) → `#5f4a1f` (6.63 ✓)
* `--link-hover`: `#5c4720` (6.94) sin cambio ✓

Ratios sobre el fondo pergamino `#efe3c8`. El modo noche pasa AA en todos sus pares y no
se toca. Jerarquía oro/enlace en pergamino: el oro estructural (5.80) recede tras el
texto de enlace (6.63), restaurando la intención original.

Estado: implementado en `main` (PR-A). Valores confirmados en `src/styles/tokens.css`.

\---

5. Foco visible (WCAG 2.4.7) (IMPLEMENTADO)

Decisión: indicador de foco de teclado real con `outline`, cubriendo enlaces, botones e
inputs (el `a:focus-visible` previo solo cambiaba color/subrayado).

Implementación: regla global
`a, button, input, \\\\\\\[tabindex] { :focus-visible { outline: 2px solid var(--oro-texto); outline-offset: 3px; } }`.
El `outline` usa la variable, así que se adapta a ambos temas. El tratamiento de color
del enlace se conserva (propiedades disjuntas).

Estado: implementado en `main` (PR-B). Confirmado en `src/styles/tokens.css`.

\---

6. Footer sin atribución del director

Decisión: el footer no lleva `· Una colección dirigida por don Alejandro de Morales y Loaiza`.
Se queda en `© {año} El Poemario`.

Estado: ya es así en `main` (cambio de código = no-op). El §1 del Documento de Diseño v1
("footer canónico" con atribución del director) queda ANULADO: esa cadena no se usa ni se
usará. El v1 vive fuera del repo; este registro es la fuente de verdad y prevalece.

\---

7. Navegación móvil: sin burger (REAFIRMADO)

Decisión: se conserva el nav que se reajusta (`flex-wrap` + reducción de gap). No se
adopta el menú hamburguesa que inventaba la maqueta. Reafirmado en la sesión de rediseño
de junio de 2026: aunque el objetivo general es converger a la maqueta, el burger es una
divergencia deliberada y no se implementa.

Justificación: el nav actual ya es accesible y sin JS (teclado y lectores, sin estado que
mantener). El burger esconde la navegación y añade superficie ARIA (focus-trap,
`aria-expanded`) que hay que implementar sin errores; para un sitio contemplativo de
navegación infrecuente rinde poco. Comprobado en móvil real: el reflow funciona con
comodidad. Si el nav crece, el punto medio preferido al burger es una fila con scroll
horizontal o "primarios + Más".

\---

8. Arquitectura de información: nav y páginas

Decisiones (sesión de rediseño, junio de 2026):

* El enlace "Correspondencia" del nav se renombra a "Contacto". La RUTA se mantiene en
`/correspondencia/` (no se renombra URL ni carpeta); solo cambia el texto del enlace en
`Header.astro`. Se ejecuta en PR-R8.
* `/sobre/` se conserva como página propia. "Acerca de" sigue enlazando a `/sobre/`; no se
absorbe en `/colaborar/` pese a que la maqueta así lo insinúa.

\---

9. Plan de rediseño (PRs)

Cada PR se ejecuta en su propia conversación, empezando por leer este archivo + tarball
fresco de `main`. Un PR = un scope. PR-A (color) y PR-B (foco) ya están en `main`; lo
pendiente es el rediseño estructural R1–R8 (no existe R7: era el burger, descartado §7).

Orden de ejecución: R1 → R2/R3 → R4 → R5 → R6 → R8.
Estado: R1, R2, R3 y R4 HECHOS y mergeados; pendientes R5 → R6 → R8.
Tarjetas de rejilla (PoemaCard/AutorCard): la meta se desalineaba por DOS causas.

(1) Dominante — `.card { height: 100% }` no resolvía contra la pista de la

rejilla: el contenido (\~246px) excedía la pista (\~197px) y cada tarjeta

desbordaba \~49px, pisando la fila siguiente (medido por render). RESUELTO en

PR-R1c: `.card` pasa a `height: auto` y cada `> li` de las seis rejillas (home,

/poemas, /autores, ListadoAutores, ListadoPoemasTaxonomia, otras-lenguas) usa

`display: grid` para estirar la tarjeta a la pista; en taxonomía el li lleva

`:not(\\\[hidden])` para no revelar las ocultas. (2) Secundaria — un pie de dos

líneas subía el autor anclado frente a vecinos de una línea. RESUELTO en PR-R1b:

el pie reserva dos líneas (`min-height: 2.6em`) y se bottom-alinea.

`OrnamentoTarjeta` sigue huérfano, reservado para el fallback de retrato en R6 (§12).

Rediseñar `PoemaCard` y `AutorCard`: de figura 3:2 + meta a celda de texto en rejilla
bordeada (título recortado a 2 líneas, autor en itálica, línea "Forma · Movimiento"
anclada al pie), sin imagen. Confinar la rejilla a la columna de lectura (\~760px) en vez
de `max-width:none`. Breakpoint único 680px (3→1). Es el PR raíz: se propaga a inicio,
/poemas, /autores, ficha de autor y taxonomía. Nota: el retrato del autor sobrevive solo
en la ficha (§12), no en las tarjetas del índice.

PR-R2 · Destacado text/verso. HECHO.
Variante de `Destacado` sin imagen, una sola columna centrada. Modo poema:
extracto de versos (campo `extracto` del singleton `destacado`, un verso por
línea, versos planos sin sangría). Modo entrada/autor: párrafo de prosa
(resumen / descripción) al mismo tamaño de lectura. Se eliminó la exigencia de
imagen del destacado en `index.astro` y de los hints de Decap. Solo afecta al
inicio.

PR-R3 · Inicio (resto). HECHO.

Tagline en cursiva bajo el `<h1>` del home, editable desde Decap: nuevo campo

`lema` en el singleton `paginas/home` (schema Zod + `config.yml`). Distinto de

`titulo` (sufijo del `<title>`/og) y de `subtitulo` (antetítulo sobre el `<h1>`).

Bloque "El Poemario en voz alta": tarjeta de enlace externo (no embed) al show de

Spotify, replicando la maqueta. La URL es identidad fija del sitio (como el footer),

en `consts.ts` como `SPOTIFY\_SHOW\_URL`, no campo de contenido: una URL de show que

casi nunca cambia no justifica superficie en Decap. `SpotifyEmbed` no se tocó (solo

soporta track/episode; un embed de show es pesado y rompe la home sobria).

Sección "Explorar" (I–IV) ELIMINADA junto con su CSS huérfano (`.seccion-explorar`,

`.eyebrow`, `ul.exploracion` y derivados, `.numeral`, `.titulo-explorar`,

`.descripcion-explorar`, media queries 900px/720px). El descubrimiento queda a cargo

del footer, que ofrece los cuatro grupos (Poemas/Autores/Buscar/Colaborar entre

ellos). El `data-buscador-trigger` que vivía en Explorar era secundario: el trigger

primario del buscador está en `Header.astro` (presente en todas las páginas), así que

el overlay sigue funcionando sin script huérfano. La media query 680px de `ul.poemas`

(de R1) se conserva.PR-R4 · Pagina de poema (estructura + tipografia). HECHO.
Antetítulo "POEMA" sobre el `<h1>` (clase `.poema-antetitulo`, replicando el patrón
`.rotulo`: Cinzel, `--fs-3xs`, `--ls-widest`, `--oro-texto`, no los valores literales de la
maqueta). Taxonomía inline centrada: se retiró la `<section><dl>` tabular con `.chip` y las
filas extra Autor/Traductor/Ayuda; queda un contenedor flex centrado con un grupo por eje
(rótulo Cinzel oro + valores enlazados `.taxo-valor`, separador `·` entre valores). Se
conservan los CUATRO ejes Tipo · Movimiento · Temas · Motivos: `motivos` es eje taxonómico
real (como `temas`), no una "fila extra"; el traductor sigue visible en la cabecera, no se
pierde. Nota de curador a filete: `.nota-curador` pasa de caja (`border` + `background`
+ padding completo) a `border-left: 2px solid var(--oro)` con texto a la izquierda; borde y
rótulo se mantienen en oro (§3, la nota no usa Verdís). Conmutador pergamino: SIN cambios —
ya estaba arriba a la derecha sobre la ilustración, igual que la maqueta, no había
reposición que hacer; el glifo `◑` se conserva (cumple su función; no se fuerza el `☾` de
la maqueta).
Tipografía alineada a la maqueta (token más cercano por valor renderizado, no px fijos):
submeta país·años y línea de traductor `--fs-sm`→`--fs-md` (18); texto de la nota
`--fs-base`→`--fs-md` (18; la maqueta pide 20, pero `--fs-lg` rinde ~24 en escritorio y
competiría con el verso, así que `--fs-md` es el más cercano sin sobrepasar); rótulo de
taxonomía `--fs-3xs`→`--fs-xs` (14). NO se tocan dos casi-coincidencias de 1px a propósito:
el antetítulo (12 vs 13) y la fecha (12 vs 11) usan los sistemas `.rotulo`/meta compartidos
con el resto del sitio; cambiarlos desincronizaría los antetítulos que R5 añadirá a los
índices. Verificado: build verde, render Chromium en noche y pergamino, tamaños computados
confirmados (submeta 18, nota 18, rótulo taxo 14). El resto de la página (ilustración a
sangre, verso centrado, paginador) ya estaba alineado.

PR-R5 · Antetítulos de índice.
Cintillo/antetítulo sobre el `<h1>` en /poemas ("ANTOLOGÍA") y /autores ("LAS VOCES").
La taxonomía ya lo tiene (`.rotulo`).

PR-R6 · Ficha de autor.
Mantener el retrato `<Image>` (divergencia deliberada, §12) con fallback de ornamento para
autores sin retrato; rejilla de poemas del autor de 2-col a 3-col, heredando la celda-texto
de R1.

PR-R8 · Menores.
Renombrar "Correspondencia" → "Contacto" en `Header.astro` (ruta intacta, §8); número "404"
display en la página de error; anatomía de fila en bitácora; tipografía de buscar. Limpiar
de paso el comentario obsoleto "Nav en Josefin Sans" en `Header.astro` (§13).

\---

10. Divergencias estructurales detectadas (diagnóstico de rediseño)

El diagnóstico página por página identificó un hallazgo dominante y transversal, más
divergencias locales:

Dominante (raíz de R1): la tarjeta. El sitio vivo usa tarjetas con imagen/ornamento 3:2
(`PoemaCard`, `AutorCard`); la maqueta usa celdas de texto en rejilla bordeada, sin imagen,
confinadas a la columna de lectura de 760px. Esto es lo que produce la sensación
"minimalista, concentrada en texto". Toca inicio, /poemas, /autores, ficha de autor y
taxonomía a la vez.

Breakpoints: el vivo usa un sistema variado (1000/720, 480/720, 640); la maqueta, un único
corte a 680px (3→1). Se adopta el corte único en R1.

Locales: ver el desglose por PR en §9 (destacado sin imagen, antetítulos de índice y de
poema, taxonomía inline del poema, nota de curador a filete, número 404, anatomía de fila
en bitácora).

\---

11. Mapa maqueta ↔ páginas vivas

La maqueta es un único archivo combinado con selector interno de 12 vistas (`data-screen`).
No hay archivos `\\\\\\\*\\\\\\\_dc.html` sueltos. Las vistas se identifican por su `<h1>`/rótulo, no por
nombre de archivo. Correspondencias:

* inicio → `pages/index.astro`
* poemas → `pages/poemas/index.astro`
* autores → `pages/autores/index.astro`
* autor → `layouts/Autor.astro`
* tema (taxonomía) → `components/ListadoPoemasTaxonomia.astro` + páginas de eje
* buscar → `pages/buscar/`
* bitacora → `pages/entradas/index.astro`
* entrada → `pages/entradas/\\\\\\\[...slug].astro`
* colaborar → `pages/colaborar.astro`
* contacto → `pages/correspondencia/index.astro`
* 404 → `pages/404.astro`
* poema → `layouts/Poema.astro`

Sin equivalencia: `/sobre/` (vivo) no tiene maqueta; "Acerca de" en la maqueta enlaza a
colaborar (resuelto en §8: /sobre se conserva). La maqueta no modela `/correspondencia/cartas`
ni los índices de taxonomía.

\---

12. Divergencias deliberadas de la maqueta

No todo converge a la maqueta. Excepciones decididas:

* Nav sin burger (§7).
* Retrato del autor en la ficha: la maqueta pone un ornamento hairline; se conserva el
retrato `<Image>` del sitio vivo, con fallback de ornamento cuando el autor no tiene
imagen (R6). En el índice /autores, en cambio, sí se adopta la celda-texto sin imagen (R1).
* Ruta `/correspondencia/` intacta pese a renombrar el enlace a "Contacto" (§8).
* `/sobre/` como página propia (§8).

\---

13. Notas menores
* `Header.astro` tiene un comentario obsoleto ("Nav en Josefin Sans"); Josefin Sans fue
descartada y la meta usa Cinzel. Limpiar en PR-R8 (cuando se toque el archivo para el
renombrado de "Contacto").

\---

Apéndice — método de verificación de contraste

Ratios calculados con la fórmula WCAG 2.x de luminancia relativa (linealización sRGB,
coeficientes 0.2126 / 0.7152 / 0.0722, `(L\\\\\\\_claro + 0.05) / (L\\\\\\\_oscuro + 0.05)`). Umbrales:
texto normal 4.5:1, texto grande 3:1, elementos no textuales (bordes, iconos) 3:1.

