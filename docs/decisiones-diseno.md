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
Estado: R1, R2, R3, R4, R5 y R6 HECHOS y mergeados; pendiente R8.
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

`OrnamentoTarjeta` se consume en R6 como fallback de retrato (§12): ya no está huérfano.

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

PR-R5 · Antetítulos de índice. HECHO.
Antetítulo sobre el `<h1>` en /poemas ("Antología") y /autores ("Las voces"), reutilizando
la clase `.rotulo` ya usada en los índices hermanos /tipos y /temas (Cinzel, `--fs-3xs`,
`--ls-widest`, `--oro-texto`, uppercase, margen `--space-2xs`) — el mismo patrón que
`.poema-antetitulo` de R4. No se introduce un cuarto estilo: `/poemas` y `/autores` comparten
el `header.title` (rótulo → h1 → subtítulo) de /tipos y /temas, así que se adopta su `.rotulo`
idéntico. Texto fuente en caja natural; la mayúscula la aplica el CSS (igual que "Repertorio
por forma"). Los índices no llevan BOM en `main` (verificado en tarball: ambos abren con LF).
Verificado: build verde, render Chromium de /poemas/ y /autores/ con el cintillo dorado.

PR-R6 · Ficha de autor. HECHO.
Tres cambios en `layouts/Autor.astro`:
(1) Retrato `<Image>` conservado (divergencia deliberada, §12) pero SIN borde: se retiró el
`border: var(--rule-hairline) solid var(--oro)` que llevaba `.autor-retrato img`, en
cumplimiento de la regla "cero marcos en cualquier imagen". El marco Art Déco que se ve en
algunos retratos es parte de la propia ilustración, no CSS.
(2) Fallback de ornamento para autores sin imagen: se renderiza `OrnamentoTarjeta` (antes
huérfano) dentro de `figure.autor-ornamento`. El placeholder conserva el doble borde dorado
(única excepción a "cero marcos": es placeholder, no imagen enmarcada). El contenedor padre
original (`.card-img.con-ornamento` de `PoemaCard`) fue eliminado en R1, así que el marco se
recrea aquí replicando el `.frame` canónico (1.5px oro + filete interno 6px en oro-suave),
dimensionado al hueco 3:2 que ocuparía el retrato.
(3) Rejilla de poemas del autor de 2-col a 3-col, adoptando el sistema R1 exacto de /poemas y
ListadoPoemasTaxonomia: `.lista` confinada a `--measure-grid` (760px), `grid-template-columns:
repeat(3, ...)`, `gap: 0`, borde hairline `border-top`+`border-left` en `var(--line)` (cada
PoemaCard dibuja su derecha/abajo), `.item:not([hidden]) { display: grid }` para estirar las
celdas visibles sin revelar los lotes ocultos de cargar-mas, y breakpoint único 680px (3→1).
Se eliminó el grid previo (2-col, `gap: var(--space-lg)`, breakpoint 720px). PoemaCard se usa
con `mostrarAutor={false}` (sin cambios). Verificado: build verde; render Chromium (HTTP) de
una ficha CON retrato (borde 0px, grid 3-col a 760px) y otra SIN retrato (fallback de
ornamento con doble marco); colapso a 1 columna confirmado a 640px.

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

\---

14. Plan estético aparte: separador único (PR-1, IMPLEMENTADO)

Decisión: unificar los tres separadores existentes (`hr.ornate`, `divisor-rombo`,
`divisor-footer`) en una sola clase `.divisor` en `tokens.css`. Diseño: dos líneas
hairline con degradado oro→transparente y un rombo sólido central en oro plano
(`--oro`, `#c8a86a`). Altura fija en `1px` (bug post-fusión corregido: `0.5px` vía
`--rule-hairline` redondeaba a cero en pantallas no-Retina). CSS-only,
`aria-hidden="true"`, margen único `var(--space-2xl) auto`.

Justificación: tres implementaciones visualmente equivalentes duplicaban la misma
intención (separador ornamental en oro) sin necesidad. Una sola clase reduce la
superficie de mantenimiento y garantiza consistencia entre la página de poema, la
ficha de autor y el footer.

Estado: fusionado en `main`.

\---

15. Plan estético aparte: esquema de cabecera rótulo/título/subtítulo (PR-2, IMPLEMENTADO)

Decisión: toda página de la colección `paginas` expone tres campos editables en
Decap — `rotulo` (antetítulo corto), `titulo`, `subtitulo` — renderizados de forma
condicional (`{pagina.data.rotulo && <p class="rotulo">...}`) para no romper el
build si faltan. Cero texto de cabecera hardcodeado en plantillas.

Excepción documentada — home: el `<h1>` de portada sigue siendo `SITE_TITLE` fijo;
la marca no depende de Decap. El campo `rotulo` alimenta el antetítulo visual ya
existente (`.antetitulo`, estilo propio del hero, distinto del `.rotulo` global de
listados). El campo `subtitulo` pasa de hacer de antetítulo (uso previo, no
coincidía con su propio nombre) a ser el subtítulo visible real bajo el `<h1>`. El
campo `titulo` sigue usándose solo en el `<title>` del navegador, sin cambio de rol.

Página nueva en `paginas`: `otras-lenguas` (antes hardcodeada por completo en
`nacionalidades/otras-lenguas.astro`, sin `.md` propio ni edición vía Decap). No
lleva `subtitulo`: su segunda línea es el conteo dinámico de poetas, no texto fijo.

Unificación adicional en la misma PR (mismos archivos, mismas líneas ya tocadas):
las clases `.rotulo` (5 bloques CSS duplicados idénticos o casi idénticos) y
`.subtitulo` (9 bloques CSS duplicados idénticos) pasan a `tokens.css` como clases
globales. Mismo criterio que `.divisor` en PR-1 (§14).

Estado: fusionado en `main`.


---

16. Plan estético aparte: alineación de tamaño de fuente en entradas vs poemas (PR-3, IMPLEMENTADO)

Decisión: --fs-md (18px fijo) se usa para dos propósitos distintos que no debían
tratarse igual: UI corta/metadatos (15 usos: bylines, tarjetas, footer, nav,
buscador — sin cambios) y prosa larga de lectura (4 usos: cuerpo de entradas,
bio de autor, paginas sobre/colaborar). Tocar --fs-md directamente habria roto
los 15 usos no relacionados.

Se crea un token nuevo, --fs-prosa: clamp(1.125rem, 1.025rem + 0.5vw, 1.3125rem)
(18-21px), y --lh-prosa: 1.8, aplicados en los 4 consumidores de prosa larga.
Deliberadamente distinto del clamp(20px, 3.4vw, 24px) / 1.85 que usan los poemas
(Poema.astro, Destacado.astro): la prosa de entradas y la voz curatorial no
debian igualarse al cuerpo del poema, solo acercarse.

Fuera de scope: el clamp de poemas sigue sin tokenizar (valor literal repetido
en 4 sitios); pendiente para una PR futura si se decide unificarlo tambien.

Estado: fusionado en main.

---

17. Plan estético aparte: unificar margin-bottom de .title h1 (sin gap h1->subtitulo)

Decision: .title h1 usaba dos valores de margin inconsistentes entre paginas:
margin: 0 0 var(--space-sm) en 8 paginas de indice/listado (siglos, autores,
poemas, entradas/cartas, entradas/index-bitacora, temas, nacionalidades, tipos)
vs margin: 0 en las 3 paginas de la coleccion paginas con prosa larga
(sobre, correspondencia, colaborar). Se unifica al segundo patron: margin: 0
en las 8 mayoritarias, eliminando el gap adicional entre el h1 y el subtitulo
en toda la web.

Estado: fusionado en main.

---

18. Plan estético aparte: tokenizar el tamaño de fuente y line-height del cuerpo de poemas (PR-4)

Decision: clamp(20px, 3.4vw, 24px) estaba repetido como valor literal en 4 sitios
(Poema.astro: .prose--verso y .prose:not(.prose--verso); Destacado.astro:
.destacado-versos y .destacado-resumen). Se tokeniza como --fs-poema en
tokens.css, junto a --fs-prosa. Se decide tokenizar tambien el line-height: 1.85
asociado (literal en Destacado.astro en 2 sitios; en Poema.astro solo aparecia
una vez, en la regla base .prose, heredada por las reglas hijas) como
--lh-poema, junto a --lh-prosa. No existia previamente ningun --fs-* o --lh-*
con estos valores exactos en tokens.css (el mas cercano era --lh-relaxed: 1.75,
distinto).

Este cambio es puramente de tokenizacion: no altera el valor visual resultante,
solo su representacion en el codigo. Queda cerrado el pendiente identificado en
PR-3 (§16).

Estado: fusionado en main.

---

19. Plan estético aparte: linea de navegacion simple, escala h1 Inicio, subtitulo Inicio, espacio separador->En Portada

Decision: cuatro ajustes puntuales de Inicio, sin tocar tokens ni clases globales.

(a) header::after (linea doble ornamental bajo la navegacion) se elimina de
Header.astro. Queda solo el border-bottom existente.

(b) .hero h1 pasa de --fs-4xl a --fs-3xl (un paso hacia abajo en la escala).

(c) .subtitulo es clase global (tokens.css), reutilizada en 9+ paginas de
listado. No se toca el token --fs-md. Se anade un override local en el
<style> scoped de index.astro (.subtitulo { font-size: 1.25rem }), que por
especificidad de Astro (data-astro-cid) solo afecta Inicio.

(d) El espacio entre el .divisor y "En Portada" (Destacado.astro, exclusivo
de Inicio) se acumulaba en tres puntos: margen inferior de .divisor (48px,
global), padding-bottom de .hero (48px) y el margen colapsado hero->Destacado
(48px). Se reduce solo el primero via override scoped (.hero .divisor,
margin-bottom: var(--space-lg), 24px), el cambio de menor riesgo por no tocar
mas de un punto de la cadena.

Estado: fusionado en main.

---

20. Plan estetico aparte: reducir espacio hero -> En Portada (segunda pasada)

Decision: tras la seccion 19, quedaban dos contribuyentes sin tocar en el
espacio hero->Destacado: el padding-bottom de .hero (48px, no colapsa con
nada al ser padding) y el margen colapsado hero.margin-bottom / 
destacado-seccion.margin-top (ambos 48px, colapsan al mayor de los dos,
no a la suma).

Se reduce .hero.padding-bottom a var(--space-lg) (24px) y su margin-bottom
a 0, dejando que el margin-top de .destacado-seccion (tambien reducido a
var(--space-lg), 24px) defina el espacio de transicion. El padding-top de
.hero (espacio sobre el antetitulo, tope de la seccion) no se toca.

Resultado: bloque divisor -> En Portada baja de ~120px a ~72px
(24px divisor + 24px padding-bottom hero + 24px margin-top destacado).

Estado: fusionado en main.

---

21. Renombrar slugs ilegibles heredados de Tumblr y renumerar serie «Amor de madre»

Decisión: 7 poemas conservaban el slug autogenerado por Tumblr al migrarse
sin título (sin-titulo-<id-numérico>), sin valor de lectura ni SEO. Se
renombran a slugs derivados de su título real (ej. sin-titulo-12046411380
-> pintame-angelitos-negros).

La serie «Amor de madre» (4 versiones de la misma balada catalana, por
distintos autores) tenía slugs desordenados frente a su numeración en el
título (amor-de-madre-i/-ii-1/-ii/sin-numero para I/II/III/IV respectivamente).
Se renumeran con dígitos arábigos (amor-de-madre-1..4) en vez de romanos:
un esquema en romanos generaría una cadena de colisión, ya que en Cloudflare
Pages una regla de _redirects se aplica siempre, incluso si existe un asset
real en esa misma ruta (a diferencia de Netlify). Usar el slug viejo de un
poema como slug nuevo de otro habría dejado esa ruta redirigida de forma
permanente, sin servir jamás el contenido real.

Se crea public/_redirects (301) por primera vez en el proyecto; no existía
ningún mecanismo de redirects previo. Se actualizan también los 4 enlaces
internos hardcodeados en entradas/el-largo-viaje-de-un-corazón.md que
apuntaban a los slugs viejos de la serie Amor de madre.

Estado: fusionado en main.

---

22. Eliminar lineas de rejilla en tarjetas de poemas/autores, en cuadros de siglos/nacionalidades/tipos/temas, y rediseno de la caja de invitacion a Spotify en Inicio

Decision: se elimina el sistema de reglas visuales (--line, hairline solid oro)
que dibujaba la cuadricula alrededor de PoemaCard.astro y AutorCard.astro
(border-right/bottom en cada celda, border-top/left en el contenedor), en los
cinco listados que lo consumen: ListadoPoemasTaxonomia.astro,
ListadoAutores.astro, poemas/index.astro, autores/index.astro, la seccion de
poemas del layout Autor.astro (poemas de un autor) y el grid de poemas
destacados en Inicio (ul.poemas). No se anade gap alguno: las celdas quedan
contiguas, separadas solo por su padding interno.

Mismo criterio en los cuadros de .item-link de siglos/index.astro y
nacionalidades/index.astro (border: rule-hairline solid oro, eliminado). En
tipos/index.astro y temas/index.astro las lineas de rejilla se generaban por
contraste de color (gap: 1px + background-color del contenedor asomando entre
celdas con background-color propio); se elimina el background-color y el
border del contenedor, dejando el gap de 1px intacto pero sin contraste
visible.

Ademas, se rediseña la caja de invitacion a Spotify en Inicio (.podcast):
se elimina el borde (1px solid oro-suave) y su transicion de border-color;
se elimina el glifo de flecha externa (podcast-ext, unicode ↗) del marcado y
su regla CSS; el layout pasa de fila (icono izquierda, texto izquierda) a
columna centrada, adoptando como base permanente el mismo layout que antes
solo aplicaba en el breakpoint movil (max-width 680px), que por tanto queda
sin overrides propios de .podcast en ese media query.

El token --line permanece vivo (unico consumidor restante: el separador de
lista en entradas/index.astro, un patron distinto de lista apilada, no de
cuadricula).

Estado: fusionado en main.

---

23. Cierre de Fase 2: reversion de «cero marcos» a passe-partout, y baja de PoemaCard

Este registro es append-only: no reescribe las entradas previas, las anota. Dos
hechos de la Fase 2 dejaron secciones anteriores desalineadas con el codigo; se
consignan aqui para que el log no se contradiga.

(a) Reversion de «cero marcos». La direccion austera de R1–R6 —celda de texto
sin imagen (R1), retrato de autor sin borde (R6), y la regla explicita «cero
marcos en cualquier imagen» (§9 R6, §12)— fue REVERTIDA por el trabajo editorial
posterior de la Fase 2 (paginas de lectura / anatomia de fila de bitacora). El
patron vigente ya no es «sin marco»: toda miniatura o imagen de fila va montada
en un passe-partout —fondo --mat + filete hairline --rule, sin radio, con la
imagen respirando dentro de un padding—, visible hoy en las filas de entrada de
/entradas/ (bitacora) y /entradas/cartas/. El fallback cuando no hay ilustracion
es la inicial del titulo dentro del mismo marco, no un ornamento. Los tokens
--mat y --rule son la superficie de este tratamiento. La regla «cero marcos»
queda ANULADA como principio general; sobrevive solo como nota historica de la
etapa R1–R6.

(b) Baja de PoemaCard. `PoemaCard.astro` fue ELIMINADO al unificar «un poema en
una lista» en el componente compartido `FilaPoema.astro` (rama
refactor/fila-poema-unificada, PR #348). Toda mencion a `PoemaCard` en este
registro —§9 (R1, R6), §10 y §22— es historica: describe el estado del codigo en
su momento, no el actual. Las vistas que consumian PoemaCard (Home, /poemas,
taxonomia, poemas de la ficha de autor) hoy renderizan filas via `FilaPoema`.
`AutorCard` y `OrnamentoTarjeta` siguen vivos (este ultimo como fallback de
retrato en la ficha de autor, §9 R6).

Estado: documentado; el codigo referido ya esta en main.

\---

24. Bloque didactico en las paginas de forma (/tipos/<slug>/)

Decision: anadir, encima de la lista de poemas de cada forma, un bloque en prosa que
explica la forma metrica y muestra un verso de ejemplo en dominio publico. Alcance:
solo /tipos/; render condicional (si existe la ficha, se muestra; si no, la pagina
queda identica a hoy).

Contenido — coleccion nueva `formas` (`src/content/formas/`, no enrutada, editable en
Decap con editorial_workflow). Un `.md` por slug de `tipo`: frontmatter con `descripcion`
(markdown inline via `marked.parseInline`, permite *cursiva* para titulos de obra),
`ejemplo_autor`, `ejemplo_obra` (opcional) y `metrica` (objeto opcional con `medida` y
`rima`, ambos opcionales); el cuerpo del `.md` es el verso de ejemplo (aprovecha
`remark-breaks`: salto de linea = verso). El slug del archivo debe pertenecer al enum
`tipo`: `src/utils/formas.ts` (`getForma()`) lo verifica en build y lanza si no, igual
contrato ruidoso que `getPagina()`. No se exige lo inverso: no toda forma necesita ficha.

Render (variante B) — el bloque va entre la regla ornamental y la grilla, via un `<slot
name="intro">` opcional anadido a `ListadoPoemasTaxonomia.astro`. Solo /tipos/ rellena el
slot; los otros ejes que comparten ese componente (temas, movimientos, motivos) quedan
identicos. El componente propio es `BloqueDidacticoForma.astro`: descripcion en prosa
(Cormorant 500, medida de lectura, `--text-soft`) y el ejemplo como especimen con filete
de acento (`border-left: 2px solid var(--accent)`, sin caja completa -> respeta el
principio de no encajonar), reutilizando el patron de cita de `Poema.astro`. Dentro:
micro-rotulo Cinzel "Ejemplo" en oro, verso con el tratamiento de verso de `Poema.astro`
(sangria francesa `2ch`, `--lh-poema`, `--verse`), linea metrica Cinzel micro que une
`medida` y `rima` con `·` solo si estan presentes (se omite entera en formas sin metro
fijo como verso-libre o prosa-poetica), y atribucion en cursiva `--text-muted`.

Dominio publico: regla editorial, no forzada por codigo en v1. El verso debe ser de un
autor en dominio publico; el criterio queda documentado en el help de los campos de Decap
(sin umbral numerico fijo) y aqui. Un check automatizado solo si se vuelve frecuente.

Ficha semilla: `formas/soneto.md` (Garcilaso de la Vega, Soneto XXIII, primer cuarteto;
dominio publico incuestionable).

Estado: implementado.

\---

25. Sistema tipografico de titulos: dos voces por rol semantico

Diagnostico: el `h1` de pagina se renderizaba de TRES formas sin regla, y por eso
el sitio se leia inconsistente: (A) Cinzel bold en versalitas — heredado de la base
en los titulos de indice (/poemas, /autores, /temas, /tipos, /siglos,
/nacionalidades); (B) Cormorant Garamond 500 en caja normal — titulo de poema
(Poema.astro), de entrada (entradas/[...slug].astro) y paginas editoriales de prosa
(sobre "Acerca de", correspondencia "Contacto", colaborar, buscar); (C) Cinzel
peso 500 en caja mixta — nombre de autor (Autor.astro `.autor-nombre`, AutorCard
`.card-nombre`) y el h2 "Obras" del autor. El (C) era el verdadero outlier: Cinzel
es una fuente titling de caja alta (sus "minusculas" son versalitas), asi que pedirle
caja mixta a peso 500 era un mal uso.

Decision: se formaliza un sistema de DOS voces asignadas por rol semantico, no por
pagina. La consistencia es por funcion (heuristica de Nielsen #4), no ad hoc.

* Voz de catalogo/estructura — Cinzel, VERSALITAS via `text-transform: uppercase`,
  tracking `--ls-wider` (o `--ls-wide` a escala menor). Solo cadenas cortas. Dos pesos
  por jerarquia: `--fw-bold` (700) para el masthead/H1 de pagina (titulos de indice:
  AUTORES, BITACORA...) y `--fw-semibold` (600) para instancias secundarias (nombre de
  autor, encabezados de seccion, nombre en tarjeta). Cubre: titulos de indice, NOMBRE
  DE AUTOR (se decide tratarlo como entidad de catalogo, no como obra: tradicion
  editorial de nombres en versalitas), rotulos/kickers, nav, footer, chips, encabezados
  de seccion.
* Voz literaria — Cormorant Garamond (`--font-body`) 500, caja normal. Cadenas largas,
  legibles. Cubre: titulo de OBRA que se lee (poema, entrada) y paginas editoriales
  en primera persona (Acerca de, Contacto, Colaborar, Buscar).

Base a11y (se conserva): las mayusculas SIEMPRE via CSS `text-transform`, nunca escritas
a mano, para que el accessible name que leen los lectores de pantalla quede en caja
natural. Las versalitas se reservan a cadenas cortas (evita la penalizacion de lectura
del all-caps en titulos largos): por eso los titulos de obra/prosa se quedan en Garamond
caja mixta.

Alcance del cambio: el 90% del sitio ya cumplia la regla una vez nombrada; solo se
corrigieron los TRES puntos del outlier (C):
* `layouts/Autor.astro` `.autor-nombre` (h1): 500/mixta -> `--fw-semibold` + uppercase +
  `--ls-wider`, tamano `--fs-2xl` (bajado un escalon desde `--fs-3xl`: en versalitas y a
  ese tamano el nombre largo formaba un bloque de 3 lineas demasiado pesado).
* `components/AutorCard.astro` `.card-nombre` (h3): 500/mixta -> `--fw-semibold` + uppercase +
  `--ls-wide` (tracking menor por escala `--fs-lg`).
* `layouts/Autor.astro` `.autor-poemas h2` ("N poemas en El Poemario"): 500 + `ls:0` +
  `text-transform:none` -> `--fw-semibold` + `--ls-wide`, caja normal, alineado con los
  demas encabezados de seccion (sobre/colaborar `.prose h2`).
* `pages/entradas/[...slug].astro` `.cabecera h1` (titulo de la PAGINA de entrada): se
  anadio `text-transform: none`. Bug preexistente: el h1 sobreescribia font-family (Garamond)
  y letter-spacing pero NO el `text-transform: uppercase` que hereda del h1 base, asi que el
  titulo de entrada salia en Garamond VERSALITAS, incoherente con el titulo de poema
  (`.poema-titulo`, que si lo anula). Ahora ambos titulos de obra son identicos: Garamond 500
  caja normal. Nota: la FILA de la bitacora (`FilaEntrada.astro` `.fila-titulo`) ya estaba
  bien (caja normal); la discrepancia vivia solo en la pagina de detalle.
Los indices (voz A) no se tocan. La voz B (obra: poema, entrada, editoriales) queda ahora
uniforme en Garamond caja normal; una entrada es OBRA que se lee, misma voz que el poema,
distinta del nombre de autor (entidad). No se pasa a Cinzel.

Verificado (Chromium sobre dev): nombre de autor largo con diacritico ("GUSTAVO ADOLFO
BECQUER") en Cinzel 600 versalitas `--fs-2xl` (~38px, 2 lineas); tarjeta de /autores en
Cinzel 600 versalitas coherente con el titulo "AUTORES" (700); h2 de obras en Cinzel 600
caja normal; titulo de poema ("A la muerte") y de entrada ("Confesiones nocturnas (I)")
ahora identicos en Cormorant Garamond 500 caja normal. Sin errores de consola.

Estado: implementado.

\---

26. Encabezados internos del cuerpo (h2-h6) en entradas y poemas: voz literaria

Contexto: dentro del cuerpo de una entrada o un poema, Decap permite insertar
encabezados h2-h6. Heredaban el h1-h6 base (Cinzel bold, `--ls-wide`), asi que
salian en VERSALITAS Cinzel bold, pesadas, interrumpiendo el rio de lectura en
Garamond. Ademas habia dos defectos concretos: (1) un h3 en italica dentro de una
cita (`> ### *La poesia y el sentimiento*`) forzaba `font-style: italic` sobre
Cinzel, que NO tiene italica cargada -> el navegador la sintetizaba (faux-italic
torcida); (2) `.prose h3` no tenia tamano propio y heredaba el `--fs-2xl` del
blockquote (~45px), quedando mas grande que el h2.

Decision (coherente con §25): los encabezados DENTRO del cuerpo de lectura son voz
LITERARIA -> Cormorant Garamond (`--font-body`), no Cinzel. La jerarquia se marca
por tamano -> italica -> color, no por cambio de fuente. Escala (h2-h6), identica en
`pages/entradas/[...slug].astro` y `layouts/Poema.astro`:

* h2 `--fs-xl`, semibold, recta, `--text`.
* h3 `--fs-lg`, semibold, recta, `--text`.
* h4 `--fs-md`, semibold, recta, `--text`.
* h5 `--fs-base`, semibold, ITALICA, `--text`.
* h6 `--fs-sm`, semibold, ITALICA, `--text-muted`.

Todos con `letter-spacing: 0` (anula el `--ls-wide` del h base) y `font-style:normal`
explicito en h2-h4 para no heredar la italica del blockquote; h5-h6 van en italica a
proposito. Como Cormorant SI tiene italica real (400/500/600-italic cargadas en
Base.astro), un encabezado enfatizado sale en italica autentica, sin faux-italic. Un
h1 en el cuerpo se evita por semantica (el h1 es el titulo de pagina); no se estiliza.
En `Poema.astro`, `.prose--verso` centra h2-h6 (antes solo h2-h4).

Justificacion: los subtitulos viven en la columna de lectura; mantenerlos en la misma
familia que el cuerpo (Garamond) los integra en vez de cortar la lectura con titling
caps. Reserva Cinzel para etiquetas cortas estructurales (§25).

Paginas editoriales (sobre.astro, colaborar.astro): sus `.prose h2` (y el h3 de
colaborar) tambien se migraron a Cormorant Garamond (font-family, `font-style:normal`,
`letter-spacing:0`), para uniformidad total de "encabezado en prosa" en todo el sitio.
Se conservan sus particularidades de pagina: el h2 sigue CENTRADO (parte del diseno
centrado de esas paginas) y colaborar mantiene su h3 a `--fs-md` (sub-rotulo de lista,
mas pequeno que el h3 `--fs-lg` de la escala de lectura de entradas/poemas). Con esto,
NINGUN encabezado de cuerpo queda en Cinzel: la voz A (Cinzel) es solo para etiquetas
cortas y titulos de indice.

Verificado (Chromium sobre dev): entrada por-que-debemos-leer-a-los-poetas con h2
(Cormorant 600, 30px), h3 en cita (Cormorant 600, 23px, italica REAL via `em`, antes
45px faux-italic Cinzel) y h3 normal; sonda h2-h6 con escala descendente correcta
(30/23/18/16/15px, h5-h6 italica, h6 en `--text-muted`); poema nocturno-a-rosario con
sus h2 de seccion (I-X) en Cormorant 600 centrados. Sin errores de consola.

Estado: implementado.

\---

27. Normalizacion de nombres de imagen: en la rama del PR, no en main

Regla de nombre: cada imagen se llama `<prefijo>-<slug>.<ext>`, donde el prefijo
marca el tipo de entrada a la que pertenece (`poema-`, `autor-`, `entrada-`) y el
slug es el de esa entrada. `.github/scripts/normalize-media.mjs` (comando local
`npm run normalize:media`) aplica la regla: renombra el fichero recien subido y
reescribe el campo `ilustracion` del frontmatter en el mismo paso. Es idempotente:
si el nombre ya cumple la regla, no toca nada.

Donde ocurre: la normalizacion corre EN LA RAMA DEL PR de Decap (`cms/...`), antes
del merge, NO sobre main. Asi main nunca ve el nombre sucio, el ruleset queda
intacto y Cloudflare Pages construye una sola vez, ya con el nombre bueno.

Por que no sobre main: main esta gobernada por un ruleset (PR obligatorio + 2
required status checks: `Build site` y `Ownership check`). Un `git push` directo a
main con el GITHUB_TOKEN por defecto es rechazado con GH013 ("Changes must be made
through a pull request"). El bot nunca logro empujar; ese era el fallo original.

Por que hace falta un PAT y no basta el GITHUB_TOKEN: los push hechos con el
GITHUB_TOKEN por defecto NO disparan workflows. Si el bot empujara a la rama del PR
con ese token, los 2 required checks quedarian en estado `expected` sobre el nuevo
HEAD SHA y el PR seria immergeable. Por eso el push del normalizador se hace con un
PAT: su push si dispara `validate-pr.yml` sobre el SHA nuevo, los checks corren y
el PR puede mergearse.

Secreto: `NORMALIZE_MEDIA_TOKEN`, PAT fine-grained con permiso Contents:
read/write sobre este repo. CADUCA: hay que rotarlo antes de su vencimiento; si
caduca, el workflow falla en el checkout y el normalizador deja de operar.

Hueco conocido y aceptado: los PRs abiertos desde un fork (colaboradores externos)
quedan fuera del normalizador. El PAT no puede empujar a la rama de un fork, asi
que el job se salta esos PRs (guarda `head.repo.full_name == github.repository`).
Sus imagenes, si las hubiera, se normalizan a mano con `npm run normalize:media`.

`npm run normalize:media` sigue disponible en local para arreglos manuales sobre
cualquier rama.

Estado: implementado.

\---

28. Rediseño inmersivo: hero a sangre con nav superpuesta (poema con imagen)

Decisión: en las páginas que tienen ilustración, la imagen deja de ir en
passe-partout enmarcado y pasa a ser un hero a sangre (740px en escritorio, 520px
en móvil) con el masthead flotando transparente encima y el título anclado abajo
sobre un degradado oscuro. Es la dirección «inmersiva» del handoff de rediseño
(archivo `El Poemario Paginas Inmersivo`, tratamiento 4a). Los poemas SIN
ilustración conservan el tratamiento sólido actual (nav con regla + cabecera
centrada, tratamiento 4b): cero cambios.

Alcance de este primer PR: solo el poema individual con imagen. La entrada de
bitácora con imagen y el Inicio (variante 3A) siguen el mismo patrón en PRs
posteriores, reutilizando la misma infraestructura.

Infraestructura reutilizable: `Base.astro` gana una prop `heroInmersivo` + un
`slot="hero"` que sangra full-bleed; `Header.astro` gana una variante `overlay`
(transparente, sin regla) con colores fijos claros centralizados en tokens nuevos
`--hero-*` (`--hero-title`, `--hero-ink`, `--hero-accent`, `--hero-rule`,
`--hero-surface`, `--hero-gradiente`). Estos tokens NO se redefinen en
`[data-theme='day']`: el hero va siempre oscuro con texto claro en ambos temas
(los «colores fijos» del handoff), garantizando contraste AA del título sobre
cualquier ilustración. El toggle día/noche sigue afectando al cuerpo bajo el hero.

Búsqueda: con hero, el título y el autor viven sobre la imagen, fuera del
`[data-pagefind-body]`. Se preservan como `<span hidden data-pagefind-meta>`
dentro del artículo (mismo patrón que las cartas de la bitácora, §R-cartas), de
modo que Pagefind sigue indexando título y autor.

Relación con decisiones previas: esto REVIERTE, para el caso «con imagen», la
§23 (Fase 2: passe-partout enmarcado para la ilustración del poema) y el
tratamiento de la ilustración descrito en el trabajo de la §6. El marco
passe-partout sigue vigente donde no hay hero inmersivo (miniaturas de autor,
destacado sin hero, etc.). El giro es deliberado y acordado con la dirección.

Estado: implementado (poema con imagen; entrada de bitácora con imagen). El hero
de la entrada va anclado a la IZQUIERDA (título max ~860px, meta «por {curador}»);
las cartas (`correspondencia`) NO van a modo inmersivo (conservan `CartaHeader`).
Pendiente: Inicio 3A.

